import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(() => {
  process.env.DRY_RUN = '1';
  process.env.DATA_DIR = './.test-data';
});

describe('ask dry-run', () => {
  it('answers a direct question with a quorum verdict and markdown transcript', async () => {
    const { runAsk } = await import('../src/pipeline/ask.js');
    const { verdict, markdown, file } = await runAsk({
      question: 'Is chain-of-thought prompting genuine reasoning or imitation?',
    });
    expect(verdict.opinions.length).toBe(4);
    expect(verdict.synthesis.unifyingReading.length).toBeGreaterThan(0);
    expect(['amplify', 'track', 'ignore']).toContain(verdict.finalRecommendation);
    expect(markdown).toContain('The council deliberates');
    expect(markdown).toContain("The council's answer");
    expect(verdict.answer?.length).toBeGreaterThan(50);
    expect(markdown).toContain('Ibn ʿArabī - synthesis');
    expect(markdown).toContain('Minority report');
    expect(verdict.minority.disagreement).toBeGreaterThanOrEqual(0);
    expect(verdict.minority.disagreement).toBeLessThanOrEqual(1);
    expect(verdict.minority.dissenter).toBeTruthy();
    expect(markdown).toContain('Final score:');
    expect(file).toContain('asks');
  });

  it('uses all 10 deliberators with fullCouncil', async () => {
    const { runAsk } = await import('../src/pipeline/ask.js');
    const { verdict } = await runAsk({
      question: 'Should agentic AI systems be allowed to spend money autonomously?',
      fullCouncil: true,
    });
    expect(verdict.opinions.length).toBe(10);
  });

  it('aborts the deliberation when the signal fires', async () => {
    const { runAsk } = await import('../src/pipeline/ask.js');
    const controller = new AbortController();
    controller.abort();
    await expect(
      runAsk({ question: 'Will this be cancelled?', signal: controller.signal }),
    ).rejects.toThrow(/aborted/);
  });

  it('frames questions as questions in the persona prompt', async () => {
    const { evaluateAs } = await import('../src/council/personas/_shared.js');
    const prompt = evaluateAs('Socrates', {
      id: 'q-1',
      source: 'question',
      title: 'What is a model?',
      url: 'n/a',
      publishedAt: '2026-06-04T00:00:00Z',
      fetchedAt: '2026-06-04T00:00:00Z',
      tags: [],
    });
    expect(prompt).toContain('asked a direct question');
    expect(prompt).toContain('Question: What is a model?');
    expect(prompt).not.toContain('trend item');
  });
});
