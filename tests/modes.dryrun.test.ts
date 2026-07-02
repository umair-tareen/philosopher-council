import { beforeAll, describe, expect, it } from 'vitest';
import type { TrendItem } from '../src/types.js';

beforeAll(() => {
  process.env.DRY_RUN = '1';
  process.env.DATA_DIR = './.test-data';
});

const item = (id: string): TrendItem => ({
  id,
  source: 'question',
  title: 'Is scaling all you need?',
  url: 'n/a',
  publishedAt: '2026-06-05T00:00:00Z',
  fetchedAt: '2026-06-05T00:00:00Z',
  tags: [],
});

describe('debate modes', () => {
  it('socratic mode seats Socrates and records the format', async () => {
    const { runCouncil } = await import('../src/council/council.js');
    const verdict = await runCouncil(item('mode-1'), 'quorum', {}, 'socratic');
    expect(verdict.debateMode).toBe('socratic');
    expect(verdict.opinions.map((o) => o.philosopher)).toContain('socrates');
    expect(verdict.opinions).toHaveLength(4);
  });

  it('oxford mode convenes its fixed bench', async () => {
    const { runCouncil } = await import('../src/council/council.js');
    const verdict = await runCouncil(item('mode-2'), 'quorum', {}, 'oxford');
    expect(verdict.debateMode).toBe('oxford');
    expect(verdict.opinions.map((o) => o.philosopher).sort()).toEqual(
      ['alghazali', 'aristotle', 'kant', 'laotzu'].sort(),
    );
  });

  it('vote mode convenes a quorum of 4 seats and reports vote governance', async () => {
    const { runCouncil } = await import('../src/council/council.js');
    const verdict = await runCouncil(item('mode-4'), 'quorum', {}, 'vote');
    expect(verdict.debateMode).toBe('vote');
    expect(verdict.governance).toBe('vote');
    expect(verdict.opinions).toHaveLength(4);
  });

  it('default deliberation is unchanged', async () => {
    const { runCouncil } = await import('../src/council/council.js');
    const verdict = await runCouncil(item('mode-3'), 'quorum');
    expect(verdict.debateMode).toBe('deliberation');
  });

  it('Method Advisor returns a valid mode', async () => {
    const { adviseMode } = await import('../src/council/modes.js');
    const advice = await adviseMode('What do we mean by intelligence, really?');
    expect(['deliberation', 'socratic', 'oxford', 'delphi']).toContain(advice.mode);
    expect(advice.reason.length).toBeGreaterThan(0);
  });
});
