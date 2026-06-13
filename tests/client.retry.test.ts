import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// Exercise the real retry/abort logic (DRY_RUN short-circuits it, so force it off)
// by mocking the provider layer that complete() calls under the hood.
beforeAll(() => {
  process.env.DRY_RUN = '0';
  process.env.ANTHROPIC_API_KEY = 'test-key';
});

const completeWith = vi.fn();
vi.mock('../src/providers/index.js', async (orig) => {
  const actual = (await orig()) as object;
  return { ...actual, completeWith: (...args: unknown[]) => completeWith(...args) };
});

afterEach(() => completeWith.mockReset());

const call = { system: 's', user: 'u' };

describe('complete() retry + abort', () => {
  it('retries up to 3 attempts on failure then succeeds', async () => {
    const { complete } = await import('../src/council/client.js');
    completeWith
      .mockRejectedValueOnce(new Error('boom1'))
      .mockRejectedValueOnce(new Error('boom2'))
      .mockResolvedValueOnce({ text: 'ok', model: 'm' });
    const res = await complete(call);
    expect(res.text).toBe('ok');
    expect(completeWith).toHaveBeenCalledTimes(3);
  });

  it('does NOT retry once tokens have streamed (would double-emit)', async () => {
    const { complete } = await import('../src/council/client.js');
    completeWith.mockImplementation((_spec, _req, onToken?: (t: string) => void) => {
      onToken?.('partial');
      return Promise.reject(new Error('mid-stream failure'));
    });
    await expect(complete({ ...call, onToken: () => {} })).rejects.toThrow(/mid-stream/);
    expect(completeWith).toHaveBeenCalledTimes(1);
  });

  it('throws immediately when pre-aborted, without calling the provider', async () => {
    const { complete } = await import('../src/council/client.js');
    const controller = new AbortController();
    controller.abort();
    await expect(complete({ ...call, signal: controller.signal })).rejects.toThrow(/aborted/);
    expect(completeWith).not.toHaveBeenCalled();
  });

  it('gives up after 3 failed attempts and throws the last error', async () => {
    const { complete } = await import('../src/council/client.js');
    completeWith.mockRejectedValue(new Error('always fails'));
    await expect(complete(call)).rejects.toThrow(/always fails/);
    expect(completeWith).toHaveBeenCalledTimes(3);
  });

  it('does NOT retry a non-retryable 4xx (bad model id, auth, not found)', async () => {
    const { complete } = await import('../src/council/client.js');
    const err = Object.assign(new Error('not found'), { status: 404 });
    completeWith.mockRejectedValue(err);
    await expect(complete(call)).rejects.toThrow(/not found/);
    expect(completeWith).toHaveBeenCalledTimes(1);
  });

  it('still retries a 429 rate-limit', async () => {
    const { complete } = await import('../src/council/client.js');
    completeWith
      .mockRejectedValueOnce(Object.assign(new Error('slow down'), { status: 429 }))
      .mockResolvedValueOnce({ text: 'ok', model: 'm' });
    const res = await complete(call);
    expect(res.text).toBe('ok');
    expect(completeWith).toHaveBeenCalledTimes(2);
  });
});
