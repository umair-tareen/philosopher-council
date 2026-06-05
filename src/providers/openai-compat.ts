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
  onToken?: (token: string) => void,
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
      stream: !!onToken,
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

  if (onToken && res.body) {
    return readSseStream(res.body, req.model, onToken);
  }

  const data = (await res.json()) as ChatCompletionResponse;
  if (data.error?.message) throw new Error(data.error.message);
  const text = data.choices?.[0]?.message?.content ?? '';
  return { text, model: data.model ?? req.model };
}

interface StreamChunk {
  model?: string;
  choices?: Array<{ delta?: { content?: string } }>;
}

async function readSseStream(
  body: ReadableStream<Uint8Array>,
  fallbackModel: string,
  onToken: (token: string) => void,
): Promise<ProviderResult> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  let model = fallbackModel;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') continue;
      try {
        const chunk = JSON.parse(payload) as StreamChunk;
        if (chunk.model) model = chunk.model;
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
          text += delta;
          onToken(delta);
        }
      } catch {
        // partial line; ignore
      }
    }
  }
  return { text, model };
}
