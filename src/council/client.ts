import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { mockComplete } from '../mock/anthropic.js';

export interface CouncilCall {
  system: string;
  user: string;
  maxTokens?: number;
  cacheKey?: string;
}

export interface CouncilCallResult {
  text: string;
  model: string;
}

let realClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!realClient) {
    if (!config.anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is required (or set DRY_RUN=1).');
    }
    realClient = new Anthropic({ apiKey: config.anthropicApiKey });
  }
  return realClient;
}

export async function complete(call: CouncilCall): Promise<CouncilCallResult> {
  if (config.dryRun) {
    const text = mockComplete(call);
    return { text, model: 'mock-anthropic' };
  }
  const client = getClient();
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await client.messages.create({
        model: config.anthropicModel,
        max_tokens: call.maxTokens ?? 1024,
        system: call.system,
        messages: [{ role: 'user', content: call.user }],
      });
      const block = res.content[0];
      const text = block && block.type === 'text' ? block.text : '';
      return { text, model: res.model };
    } catch (err) {
      lastErr = err;
      const delay = 500 * 2 ** attempt;
      logger.warn({ attempt, err: String(err) }, 'anthropic call failed, retrying');
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr ?? new Error('anthropic call failed');
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
