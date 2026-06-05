import type { ProviderRequest, ProviderResult } from './index.js';

interface ChatCompletionResponse {
  model?: string;
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

/**
 * Driver for any OpenAI-compatible chat-completions endpoint.
 * Covers OpenAI itself, Google Gemini's OpenAI-compat layer, and
 * local Ollama (which serves /v1/chat/completions natively).
 */
export async function openAiCompatComplete(
  baseUrl: string,
  apiKey: string,
  req: ProviderRequest,
): Promise<ProviderResult> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: req.model,
      max_tokens: req.maxTokens,
      messages: [
        { role: 'system', content: req.system },
        { role: 'user', content: req.user },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${baseUrl} returned ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as ChatCompletionResponse;
  if (data.error?.message) throw new Error(data.error.message);
  const text = data.choices?.[0]?.message?.content ?? '';
  return { text, model: data.model ?? req.model };
}
