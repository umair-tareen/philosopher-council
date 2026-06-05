import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(() => {
  process.env.DRY_RUN = '1';
  process.env.DATA_DIR = './.test-data';
  // must be set before the first import of config.js (module-cached)
  process.env.COUNCIL_MODELS = 'laotzu=ollama:llama3.1, kant=openai:gpt-4o';
});

describe('parseModelSpec', () => {
  it('parses provider:model specs', async () => {
    const { parseModelSpec } = await import('../src/providers/index.js');
    expect(parseModelSpec('anthropic:claude-sonnet-4-5')).toEqual({
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
    });
    expect(parseModelSpec('ollama:llama3.1')).toEqual({
      provider: 'ollama',
      model: 'llama3.1',
    });
    expect(parseModelSpec('gemini:gemini-2.0-flash')).toEqual({
      provider: 'gemini',
      model: 'gemini-2.0-flash',
    });
  });

  it('defaults bare model names to anthropic', async () => {
    const { parseModelSpec } = await import('../src/providers/index.js');
    expect(parseModelSpec('claude-sonnet-4-5')).toEqual({
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
    });
  });

  it('rejects unknown providers and empty specs', async () => {
    const { parseModelSpec } = await import('../src/providers/index.js');
    expect(() => parseModelSpec('grok:grok-3')).toThrow(/Unknown provider/);
    expect(() => parseModelSpec('ollama:')).toThrow(/no model name/);
    expect(() => parseModelSpec('')).toThrow(/Empty/);
  });
});

describe('per-seat model config', () => {
  it('parses COUNCIL_MODELS pairs', async () => {
    const { config } = await import('../src/config.js');
    expect(config.councilModels['laotzu']).toBe('ollama:llama3.1');
    expect(config.councilModels['kant']).toBe('openai:gpt-4o');
  });
});
