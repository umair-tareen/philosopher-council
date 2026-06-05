import { beforeAll, describe, expect, it } from 'vitest';
import type { IbnArabiSynthesis, PhilosopherOpinion } from '../src/types.js';

beforeAll(() => {
  process.env.DRY_RUN = '1';
  process.env.DATA_DIR = './.test-data';
});

function opinion(
  id: PhilosopherOpinion['philosopher'],
  score: number,
  virtues?: Partial<PhilosopherOpinion['virtueScores']>,
): PhilosopherOpinion {
  return {
    philosopher: id,
    displayName: id,
    branch: 'ethics',
    virtueScores: {
      wisdom: score,
      courage: score,
      justice: score,
      temperance: score,
      ...virtues,
    },
    verdictScore: score,
    oneLiner: `one-liner from ${id}`,
    reasoning: `reasoning from ${id}`,
    concerns: [],
    citations: [],
  };
}

const synthesis = (unifiedScore: number): IbnArabiSynthesis => ({
  unifyingReading: 'u',
  hiddenContinuity: 'h',
  mysticalCaution: 'c',
  unifiedScore,
});

describe('buildMinorityReport', () => {
  it('finds the dissenter furthest from the synthesis', async () => {
    const { buildMinorityReport } = await import('../src/council/council.js');
    const m = buildMinorityReport(
      [opinion('kant', 0.69), opinion('aristotle', 0.62), opinion('laotzu', 0.35)],
      synthesis(0.61),
    );
    expect(m.dissenter?.philosopher).toBe('laotzu');
    expect(m.dissenter?.delta).toBeCloseTo(-0.26, 2);
    expect(m.disagreement).toBeGreaterThan(0.3);
  });

  it('reports low disagreement for an aligned council', async () => {
    const { buildMinorityReport } = await import('../src/council/council.js');
    const m = buildMinorityReport(
      [opinion('kant', 0.6), opinion('aristotle', 0.61), opinion('plato', 0.59)],
      synthesis(0.6),
    );
    expect(m.disagreement).toBeLessThan(0.1);
    expect(m.contestedVirtues).toHaveLength(0);
  });

  it('flags contested virtues when one axis splits', async () => {
    const { buildMinorityReport } = await import('../src/council/council.js');
    const m = buildMinorityReport(
      [
        opinion('kant', 0.6, { temperance: 0.9 }),
        opinion('laotzu', 0.6, { temperance: 0.2 }),
      ],
      synthesis(0.6),
    );
    expect(m.contestedVirtues).toContain('temperance');
  });
});
