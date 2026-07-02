import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(() => {
  process.env.DRY_RUN = '1';
  process.env.DATA_DIR = './.test-data';
});

describe('council dry-run', () => {
  it('produces a verdict with synthesis in quorum mode', async () => {
    const { runCouncil } = await import('../src/council/council.js');
    const item = {
      id: 'test-1',
      source: 'reddit' as const,
      title: 'Ralph loop on 7B',
      url: 'https://example/test',
      publishedAt: '2026-05-20T00:00:00Z',
      fetchedAt: '2026-05-20T01:00:00Z',
      summary: 'A short summary about Ralph loop and self-improvement.',
      tags: ['ralph-loop'],
    };
    const verdict = await runCouncil(item, 'quorum');
    expect(verdict.opinions.length).toBe(4);
    for (const o of verdict.opinions) {
      expect(o.virtueScores.wisdom).toBeGreaterThanOrEqual(0);
      expect(o.virtueScores.wisdom).toBeLessThanOrEqual(1);
      expect(o.virtueScores.courage).toBeGreaterThanOrEqual(0);
      expect(o.virtueScores.justice).toBeGreaterThanOrEqual(0);
      expect(o.virtueScores.temperance).toBeGreaterThanOrEqual(0);
    }
    expect(verdict.synthesis.unifyingReading.length).toBeGreaterThan(0);
    expect(verdict.synthesis.unifiedScore).toBeGreaterThanOrEqual(0);
    expect(verdict.synthesis.unifiedScore).toBeLessThanOrEqual(1);
    expect(['amplify', 'track', 'ignore']).toContain(verdict.finalRecommendation);

    expect(verdict.preservation).toBeDefined();
    expect(verdict.preservation?.conceptSurvival).toBeGreaterThanOrEqual(0);
    expect(verdict.preservation?.conceptSurvival).toBeLessThanOrEqual(1);
    expect(verdict.preservation?.total).toBeGreaterThan(0);
  });

  it('produces 10 opinions in full-council mode', async () => {
    const { runCouncil } = await import('../src/council/council.js');
    const item = {
      id: 'test-2',
      source: 'arxiv' as const,
      title: 'Minimal prompt templates',
      url: 'https://example/test2',
      publishedAt: '2026-05-20T00:00:00Z',
      fetchedAt: '2026-05-20T01:00:00Z',
      summary: 'Minimal prompts recover most of the gain.',
      tags: ['karpathy'],
    };
    const verdict = await runCouncil(item, 'full');
    expect(verdict.opinions.length).toBe(10);
    expect(verdict.synthesis).toBeTruthy();
  });
});
