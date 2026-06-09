import { afterEach, describe, expect, it, vi } from 'vitest';
import { openAiCompatComplete } from '../src/providers/openai-compat.js';

function streamResponse(chunks: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      for (const c of chunks) controller.enqueue(enc.encode(c));
      controller.close();
    },
  });
  return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } });
}

const req = { system: 's', user: 'u', maxTokens: 100, model: 'test-model' };

afterEach(() => vi.restoreAllMocks());

describe('openAiCompatComplete streaming', () => {
  it('assembles deltas split across chunk boundaries', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      streamResponse([
        'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"lo"}}]}\n', // boundary mid-event
        '\ndata: {"choices":[{"delta":{"content":" world"}}]}\n\n',
        'data: [DONE]\n\n',
      ]),
    );
    const tokens: string[] = [];
    const res = await openAiCompatComplete('http://x/v1', 'k', req, (t) => tokens.push(t));
    expect(res.text).toBe('Hello world');
    expect(tokens.join('')).toBe('Hello world');
  });

  it('recovers the final delta when the server omits a trailing newline and [DONE]', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      streamResponse([
        'data: {"choices":[{"delta":{"content":"only"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" once"}}]}', // no trailing newline, no [DONE]
      ]),
    );
    const res = await openAiCompatComplete('http://x/v1', 'k', req, () => {});
    expect(res.text).toBe('only once');
  });

  it('throws on a stream that delivered no data events', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(streamResponse([': keepalive\n\n']));
    await expect(openAiCompatComplete('http://x/v1', 'k', req, () => {})).rejects.toThrow(
      /no data events/,
    );
  });

  it('rejects a non-JSON 200 body on the non-streaming path', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<html>oops</html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    );
    await expect(openAiCompatComplete('http://x/v1', 'k', req)).rejects.toThrow(/non-JSON/);
  });
});
