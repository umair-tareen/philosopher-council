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
    signal: req.signal,
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

  // A 200 with HTML/empty body (misconfigured local endpoint) makes res.json()
  // throw a cryptic "Unexpected token <" that burns all retries - surface it.
  const ctype = res.headers.get('content-type') ?? '';
  if (!ctype.includes('json')) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `${baseUrl} returned non-JSON (content-type: ${ctype || 'none'}): ${body.slice(0, 200)}`,
    );
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
  let sawData = false;

  const handleLine = (line: string): void => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) return;
    const payload = trimmed.slice(5).trim();
    if (payload === '[DONE]') return;
    sawData = true;
    try {
      const chunk = JSON.parse(payload) as StreamChunk;
      if (chunk.model) model = chunk.model;
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        text += delta;
        onToken(delta);
      }
    } catch {
      // partial/non-JSON data line; ignore
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) handleLine(line);
  }
  // Flush trailing multibyte bytes and process the final line for servers that
  // don't terminate the last chunk with a newline or an explicit [DONE].
  buffer += decoder.decode();
  if (buffer.trim()) handleLine(buffer);

  // A stream that delivered data lines but produced no text is a transport
  // failure masquerading as an empty answer - surface it so retries can fire.
  if (!text && !sawData) {
    throw new Error('streaming response contained no data events');
  }
  return { text, model };
}
