import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import type { ProviderRequest, ProviderResult } from './index.js';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    if (!config.anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is required (or set DRY_RUN=1).');
    }
    client = new Anthropic({ apiKey: config.anthropicApiKey });
  }
  return client;
}

export async function anthropicComplete(req: ProviderRequest): Promise<ProviderResult> {
  const res = await getClient().messages.create({
    model: req.model,
    max_tokens: req.maxTokens,
    system: req.system,
    messages: [{ role: 'user', content: req.user }],
  });
  const block = res.content[0];
  const text = block && block.type === 'text' ? block.text : '';
  return { text, model: `anthropic:${res.model}` };
}
