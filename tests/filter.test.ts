import { describe, expect, it } from 'vitest';
import { matchKeywords } from '../src/filter/keywords.js';
import { heuristicScore } from '../src/filter/score.js';
import type { TrendItem } from '../src/types.js';

describe('matchKeywords', () => {
  it('detects Karpathy-style tags', () => {
    const tags = matchKeywords(
      'Trying Karpathy Ralph loop on a 7B model — vibe coding the agent loop',
    );
    expect(tags).toEqual(
      expect.arrayContaining(['ralph-loop', 'karpathy', 'vibe-coding', 'agent-loop']),
    );
  });

  it('returns empty for unrelated text', () => {
    expect(matchKeywords('a post about cats')).toEqual([]);
  });

  it('does not double-count overlapping keywords', () => {
    const tags = matchKeywords('Ralph loop ralph-loop ralph loop');
    expect(tags.filter((t) => t === 'ralph-loop')).toHaveLength(1);
  });
});

describe('heuristicScore', () => {
  it('decays with age', () => {
    const now = Date.parse('2026-05-20T12:00:00Z');
    const fresh: TrendItem = {
      id: 'a',
      source: 'reddit',
      title: 't',
      url: 'u',
      publishedAt: '2026-05-20T11:00:00Z',
      fetchedAt: '2026-05-20T12:00:00Z',
      tags: ['ralph-loop'],
      rawScore: 100,
    };
    const stale: TrendItem = { ...fresh, id: 'b', publishedAt: '2026-04-01T00:00:00Z' };
    expect(heuristicScore(fresh, now)).toBeGreaterThan(heuristicScore(stale, now));
  });
});
