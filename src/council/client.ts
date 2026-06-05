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
  cacheKey?: string;
}

export interface CouncilCallResult {
  text: string;
  model: string;
}

export async function complete(call: CouncilCall): Promise<CouncilCallResult> {
  if (config.dryRun) {
    const text = mockComplete(call);
    return { text, model: 'mock-anthropic' };
  }
  const spec = parseModelSpec(call.model ?? config.defaultModel);
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await completeWith(spec, {
        system: call.system,
        user: call.user,
        maxTokens: call.maxTokens ?? 1024,
      });
    } catch (err) {
      lastErr = err;
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
