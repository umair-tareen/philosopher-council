import { describe, expect, it } from 'vitest';
import { dedupe } from '../src/fetchers/index.js';
import type { TrendItem } from '../src/types.js';

describe('dedupe', () => {
  it('removes duplicate ids and preserves first occurrence', () => {
    const a: TrendItem = {
      id: 'x',
      source: 'reddit',
      title: 'first',
      url: 'u',
      publishedAt: '2026-05-20T00:00:00Z',
      fetchedAt: '2026-05-20T01:00:00Z',
      tags: [],
    };
    const b: TrendItem = { ...a, title: 'second' };
    const c: TrendItem = { ...a, id: 'y', title: 'third' };
    const out = dedupe([a, b, c]);
    expect(out).toHaveLength(2);
    expect(out[0]?.title).toBe('first');
    expect(out[1]?.title).toBe('third');
  });
});
