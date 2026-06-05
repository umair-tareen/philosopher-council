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
  cacheKey?: string;
}

export interface CouncilCallResult {
  text: string;
  model: string;
}

export async function complete(call: CouncilCall): Promise<CouncilCallResult> {
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
        },
        onToken,
      );
    } catch (err) {
      lastErr = err;
      // Never retry after tokens reached the consumer - it would double-emit.
      if (emitted) break;
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

export function extractJson<T>(text: string): T {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : text;
  const trimmed = (candidate ?? '').trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('No JSON object found in model output');
  }
  return JSON.parse(trimmed.slice(start, end + 1)) as T;
}
