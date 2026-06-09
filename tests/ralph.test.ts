import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IbnArabiSynthesis, PhilosopherOpinion, TrendItem } from '../src/types.js';

vi.mock('../src/council/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/council/client.js')>();
  return { ...actual, complete: vi.fn() };
});

import { complete } from '../src/council/client.js';
import { ralphLoop } from '../src/council/ralph.js';

const completeMock = complete as Mock;

const item: TrendItem = {
  id: 'ralph-test',
  source: 'arxiv',
  title: 'Self-critique loops on small models',
  url: 'https://example/ralph',
  publishedAt: '2026-06-09T00:00:00Z',
  fetchedAt: '2026-06-09T01:00:00Z',
  summary: 'A short summary.',
  tags: [],
};

const opinions: PhilosopherOpinion[] = [
  {
    philosopher: 'socrates',
    displayName: 'Socrates',
    branch: 'epistemology',
    virtueScores: { wisdom: 0.6, courage: 0.5, justice: 0.6, temperance: 0.55 },
    verdictScore: 0.56,
    oneLiner: 'The central term is undefined.',
    reasoning: 'Probing reveals ambiguity.',
    concerns: [],
    citations: [],
  },
];

const synthesis: IbnArabiSynthesis = {
  unifyingReading: 'A single reading.',
  hiddenContinuity: '',
  mysticalCaution: '',
  unifiedScore: 0.6,
};

function critiqueResponse(fields: Record<string, unknown>): { text: string; model: string } {
  return { text: JSON.stringify(fields), model: 'mock' };
}

beforeEach(() => {
  completeMock.mockReset();
});

describe('ralphLoop', () => {
  it('stops after one iteration when stopConfidence clears the floor', async () => {
    completeMock.mockResolvedValueOnce(
      critiqueResponse({
        weaknesses: ['w1'],
        refinedVerdict: 'Holds, with caveats.',
        refinedScore: 0.55,
        stopConfidence: 0.9,
      }),
    );
    const out = await ralphLoop(item, opinions, synthesis, 0.6);
    expect(out.length).toBe(1);
    expect(out[0]?.refinedScore).toBe(0.55);
    expect(completeMock).toHaveBeenCalledTimes(1);
  });

  it('runs to the iteration cap when confidence stays low', async () => {
    completeMock.mockResolvedValue(
      critiqueResponse({
        weaknesses: ['w1', 'w2'],
        refinedVerdict: 'Still uncertain.',
        refinedScore: 0.5,
        stopConfidence: 0.2,
      }),
    );
    const out = await ralphLoop(item, opinions, synthesis, 0.6);
    expect(out.length).toBe(2); // MAX_ITERATIONS
    expect(completeMock).toHaveBeenCalledTimes(2);
  });

  it('clamps the refined score and trims weaknesses to three', async () => {
    completeMock.mockResolvedValueOnce(
      critiqueResponse({
        weaknesses: ['a', 'b', 'c', 'd', 'e'],
        refinedVerdict: 'Overclaimed.',
        refinedScore: 1.8,
        stopConfidence: 1,
      }),
    );
    const out = await ralphLoop(item, opinions, synthesis, 0.6);
    expect(out[0]?.refinedScore).toBe(1);
    expect(out[0]?.weaknesses.length).toBe(3);
  });

  it('returns what it has when an iteration fails, instead of throwing', async () => {
    completeMock.mockRejectedValueOnce(new Error('provider down'));
    const out = await ralphLoop(item, opinions, synthesis, 0.6);
    expect(out).toEqual([]);
  });
});
