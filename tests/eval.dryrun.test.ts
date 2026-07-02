import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(() => {
  process.env.DRY_RUN = '1';
  process.env.DATA_DIR = './.test-data';
});

describe('eval dry-run', () => {
  it('compares three strategies and produces a ranked report', async () => {
    const { runEval } = await import('../src/pipeline/eval.js');
    const report = await runEval({
      questions: ['Is synthetic training data a dead end?'],
    });
    expect(report.results).toHaveLength(1);
    const r = report.results[0]!;
    expect(r.answers.map((a) => a.strategy).sort()).toEqual(['council', 'debate', 'single']);
    // every strategy got a score and a rank from the blind judge
    for (const s of ['single', 'debate', 'council'] as const) {
      expect(r.meanScores[s]).toBeGreaterThanOrEqual(0);
      expect(r.meanScores[s]).toBeLessThanOrEqual(1);
      expect(r.ranks[s]).toBeGreaterThanOrEqual(1);
      expect(r.ranks[s]).toBeLessThanOrEqual(3);
    }
    // council strategy reports more calls than single
    const council = r.answers.find((a) => a.strategy === 'council')!;
    const single = r.answers.find((a) => a.strategy === 'single')!;
    expect(council.calls).toBeGreaterThan(single.calls);
    expect(report.file).toContain('evals');
  });

  it('runs the council strategy in vote mode', async () => {
    const { runEval } = await import('../src/pipeline/eval.js');
    const report = await runEval({
      questions: ['Is synthetic training data a dead end?'],
      debateMode: 'vote',
      concurrency: 1,
    });
    expect(report.results).toHaveLength(1);
    expect(report.file).toContain('evals');
    expect(Number.isFinite(report.overall.council)).toBe(true);
    expect(report.overall.council).toBeGreaterThanOrEqual(0);
    expect(report.overall.council).toBeLessThanOrEqual(1);
  });
});
