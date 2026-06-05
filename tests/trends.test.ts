import { beforeAll, describe, expect, it } from 'vitest';
import type { CouncilVerdict, TrendItem } from '../src/types.js';

beforeAll(() => {
  process.env.DRY_RUN = '1';
  process.env.DATA_DIR = './.test-data';
});

function item(overrides: Partial<TrendItem>): TrendItem {
  return {
    id: 'x',
    source: 'reddit',
    title: 't',
    url: 'u',
    publishedAt: '2026-06-01T00:00:00Z',
    fetchedAt: '2026-06-01T00:00:00Z',
    tags: [],
    ...overrides,
  };
}

describe('novelty', () => {
  it('scores unseen titles as novel and repeats as stale', async () => {
    const { noveltyFor, tokenize } = await import('../src/filter/novelty.js');
    const corpus = [[...tokenize('Ralph loop self-critique on a 7B model')]];
    expect(noveltyFor('Ralph loop self-critique on a 7B model', corpus)).toBeLessThan(0.1);
    expect(noveltyFor('Mixture-of-experts routing for tabular data', corpus)).toBeGreaterThan(0.9);
  });
});

describe('ranking with weights and novelty', () => {
  it('prefers novel items over near-duplicates, all else equal', async () => {
    const { rankingScore } = await import('../src/filter/score.js');
    const now = Date.parse('2026-06-02T00:00:00Z');
    const fresh = item({ id: 'a', novelty: 1, tags: ['ralph-loop'] });
    const dupe = item({ id: 'b', novelty: 0, tags: ['ralph-loop'] });
    expect(rankingScore(fresh, now)).toBeGreaterThan(rankingScore(dupe, now));
  });

  it('applies per-source weights from config', async () => {
    const { config } = await import('../src/config.js');
    expect(config.sourceWeights['arxiv']).toBeGreaterThan(0);
  });

  it('stays finite for downvoted (negative rawScore) items', async () => {
    const { rankingScore } = await import('../src/filter/score.js');
    const now = Date.parse('2026-06-02T00:00:00Z');
    for (const rawScore of [-1, -5, 0, undefined]) {
      const s = rankingScore(item({ id: 'd', rawScore, tags: ['ralph-loop'] }), now);
      expect(Number.isFinite(s)).toBe(true);
    }
  });
});

describe('clusterByTags', () => {
  it('groups entries sharing a tag and isolates the rest', async () => {
    const { clusterByTags } = await import('../src/pipeline/digest.js');
    const verdict = {} as CouncilVerdict;
    const entries = [
      { item: item({ id: '1', title: 'A', tags: ['ralph-loop', 'karpathy'] }), verdict },
      { item: item({ id: '2', title: 'B', tags: ['karpathy'] }), verdict },
      { item: item({ id: '3', title: 'C', tags: ['world-model'] }), verdict },
    ];
    const clusters = clusterByTags(entries);
    expect(clusters).toHaveLength(2);
    expect(clusters[0]!.entries).toHaveLength(2);
    expect(clusters[0]!.signature).toContain('karpathy');
  });
});
