import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(() => {
  process.env.DRY_RUN = '1';
  process.env.DRY_RUN_STREAM_MS = '5';
  process.env.DATA_DIR = './.test-data';
});

describe('dry-run paced streaming', () => {
  it('paces finer chunks when DRY_RUN_STREAM_MS is set, and reassembles the full text', async () => {
    const { complete } = await import('../src/council/client.js');
    const chunks: string[] = [];
    const started = Date.now();
    const { text, model } = await complete({
      system: 'You are Socrates',
      user: 'q',
      onToken: (t) => chunks.push(t),
    });
    expect(model).toBe('mock-anthropic');
    expect(chunks.join('')).toBe(text);
    // Instant mode emits 5 coarse chunks; paced mode must be much finer.
    expect(chunks.length).toBeGreaterThan(20);
    expect(Date.now() - started).toBeGreaterThanOrEqual(100);
  });
});
