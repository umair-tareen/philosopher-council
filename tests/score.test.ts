import { describe, expect, it } from 'vitest';
import { heuristicScore, rankByScore } from '../src/filter/score.js';
import type { TrendItem } from '../src/types.js';

function item(partial: Partial<TrendItem>): TrendItem {
  return {
    id: 'x',
    source: 'hn',
    title: 't',
    url: 'u',
    publishedAt: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    tags: [],
    ...partial,
  };
}

describe('heuristicScore date robustness', () => {
  it('returns a finite score for a missing/garbage publishedAt instead of NaN', () => {
    expect(Number.isFinite(heuristicScore(item({ publishedAt: 'not a date' })))).toBe(true);
    expect(Number.isFinite(heuristicScore(item({ publishedAt: '' })))).toBe(true);
    // @ts-expect-error - exercising the runtime guard against a malformed field
    expect(Number.isFinite(heuristicScore(item({ publishedAt: undefined })))).toBe(true);
  });

  it('does not let a NaN-dated item poison the sort order', () => {
    const good = item({ id: 'good', publishedAt: new Date().toISOString(), rawScore: 100 });
    const bad = item({ id: 'bad', publishedAt: 'garbage', rawScore: 0 });
    const ranked = rankByScore([bad, good]);
    // A NaN comparator would leave order unstable/undefined; the good item must rank first.
    expect(ranked[0]?.id).toBe('good');
    expect(ranked.map((r) => r.id).sort()).toEqual(['bad', 'good']);
  });
});
