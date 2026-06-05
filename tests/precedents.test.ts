import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(() => {
  process.env.DRY_RUN = '1';
  process.env.DATA_DIR = './.test-data';
});

describe('council precedents', () => {
  it('saves a record per ask and retrieves it for similar questions', async () => {
    const { runAsk } = await import('../src/pipeline/ask.js');
    const { findPrecedents } = await import('../src/store/precedents.js');

    const first = await runAsk({
      question: 'Are evaluation benchmarks for language models trustworthy?',
    });
    expect(first.file).toContain('asks');

    const precedents = await findPrecedents(
      'Can we trust language model evaluation benchmarks at all?',
    );
    expect(precedents.length).toBeGreaterThan(0);
    expect(precedents[0]!.question).toContain('benchmarks');
    expect(precedents[0]!.similarity).toBeGreaterThan(0.2);
    expect(precedents[0]!.excerpt.length).toBeGreaterThan(20);
  });

  it('injects precedent context into a follow-up deliberation', async () => {
    const { runAsk } = await import('../src/pipeline/ask.js');
    let firedPrecedents = 0;
    const second = await runAsk({
      question: 'Are evaluation benchmarks for language models really trustworthy?',
      onPrecedents: (p) => {
        firedPrecedents = p.length;
      },
    });
    expect(firedPrecedents).toBeGreaterThan(0);
    expect(second.precedents.length).toBeGreaterThan(0);
    expect(second.markdown).toContain('Precedents consulted');
  });

  it('ignores unrelated questions', async () => {
    const { findPrecedents } = await import('../src/store/precedents.js');
    const precedents = await findPrecedents('What is the best recipe for sourdough bread?');
    expect(precedents).toHaveLength(0);
  });
});
