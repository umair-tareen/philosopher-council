import { config } from '../config.js';
import { logger } from '../logger.js';
import { mockComplete } from '../mock/anthropic.js';
import { completeWith, parseModelSpec } from '../providers/index.js';

export interface CouncilCall {
  system: string;
  user: string;
  maxTokens?: number;
  /** Model spec "provider:model" (e.g. "ollama:llama3.1"). Defaults to config.defaultModel. */
  model?: string;
  /** Receive text deltas as they stream. The full text is still returned. */
  onToken?: (token: string) => void;
  /** Abort in-flight provider calls (e.g. when an SSE client disconnects). */
  signal?: AbortSignal;
  cacheKey?: string;
}

export interface CouncilCallResult {
  text: string;
  model: string;
}

export async function complete(call: CouncilCall): Promise<CouncilCallResult> {
  if (call.signal?.aborted) throw new Error('aborted: client disconnected');
  if (config.dryRun) {
    const text = mockComplete(call);
    if (call.onToken) {
      // Simulate streaming so the UI path is exercised offline.
      const step = Math.max(1, Math.ceil(text.length / 5));
      for (let i = 0; i < text.length; i += step) call.onToken(text.slice(i, i + step));
    }
    return { text, model: 'mock-anthropic' };
  }
  const spec = parseModelSpec(call.model ?? config.defaultModel);
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    let emitted = false;
    try {
      const onToken = call.onToken
        ? (t: string) => {
            emitted = true;
            call.onToken?.(t);
          }
        : undefined;
      return await completeWith(
        spec,
        {
          system: call.system,
          user: call.user,
          maxTokens: call.maxTokens ?? 1024,
          signal: call.signal,
        },
        onToken,
      );
    } catch (err) {
      lastErr = err;
      // Never retry after an abort or after tokens reached the consumer.
      if (call.signal?.aborted || emitted) break;
      const delay = 500 * 2 ** attempt;
      logger.warn(
        { attempt, provider: spec.provider, model: spec.model, err: String(err) },
        'provider call failed, retrying',
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr ?? new Error('provider call failed');
}

/** Thrown when model output contains no parseable JSON object. */
export class JsonExtractionError extends Error {
  constructor(snippet: string) {
    super(`No parseable JSON object in model output: ${snippet.slice(0, 160)}`);
    this.name = 'JsonExtractionError';
  }
}

/**
 * Pull a JSON object out of model output. Prefer a ```json fence; otherwise
 * scan from the first '{' to its matching brace (depth-tracked, string-aware)
 * so trailing prose or a second object can't poison the parse.
 */
export function extractJson<T>(text: string): T {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fence ? fence[1] : text) ?? '';
  const start = candidate.indexOf('{');
  if (start === -1) throw new JsonExtractionError(candidate);

  let depth = 0;
  let inStr = false;
  let escaped = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(candidate.slice(start, i + 1)) as T;
        } catch {
          throw new JsonExtractionError(candidate.slice(start, i + 1));
        }
      }
    }
  }
  // Unbalanced - fall back to the greedy span as a last resort.
  const end = candidate.lastIndexOf('}');
  if (end > start) {
    try {
      return JSON.parse(candidate.slice(start, end + 1)) as T;
    } catch {
      /* fallthrough */
    }
  }
  throw new JsonExtractionError(candidate);
}
