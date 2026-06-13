import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import type { ProviderRequest, ProviderResult } from './index.js';

/** Join every text block - reading only content[0] drops text that follows a
 *  leading thinking/tool block and yields empty output. */
function joinText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

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

export async function anthropicComplete(
  req: ProviderRequest,
  onToken?: (token: string) => void,
): Promise<ProviderResult> {
  if (onToken) {
    const stream = getClient().messages.stream(
      {
        model: req.model,
        max_tokens: req.maxTokens,
        system: req.system,
        messages: [{ role: 'user', content: req.user }],
      },
      { signal: req.signal },
    );
    stream.on('text', (delta) => onToken(delta));
    const final = await stream.finalMessage();
    return { text: joinText(final.content), model: `anthropic:${final.model}` };
  }
  const res = await getClient().messages.create(
    {
      model: req.model,
      max_tokens: req.maxTokens,
      system: req.system,
      messages: [{ role: 'user', content: req.user }],
    },
    { signal: req.signal },
  );
  return { text: joinText(res.content), model: `anthropic:${res.model}` };
}
