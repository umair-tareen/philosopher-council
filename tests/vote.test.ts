import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(() => {
  process.env.DRY_RUN = '1';
  process.env.DATA_DIR = './.test-data';
});

describe('median', () => {
  it('returns the middle value for an odd-length array', async () => {
    const { median } = await import('../src/council/council.js');
    expect(median([0.3, 0.9, 0.5])).toBe(0.5);
  });

  it('averages the two middle values for an even-length array', async () => {
    const { median } = await import('../src/council/council.js');
    expect(median([0.2, 0.8, 0.4, 0.6])).toBe(0.5);
  });

  it('returns the value itself for a single-element array', async () => {
    const { median } = await import('../src/council/council.js');
    expect(median([0.42])).toBe(0.42);
  });

  it('returns 0 for an empty array', async () => {
    const { median } = await import('../src/council/council.js');
    expect(median([])).toBe(0);
  });
});

describe('pluralityRecommendation', () => {
  it('picks the clear plurality', async () => {
    const { pluralityRecommendation } = await import('../src/council/council.js');
    const result = pluralityRecommendation(['amplify', 'amplify', 'track', 'ignore'], 'track');
    expect(result).toBe('amplify');
  });

  it('falls back to the tie-break on a two-way tie', async () => {
    const { pluralityRecommendation } = await import('../src/council/council.js');
    const result = pluralityRecommendation(
      ['amplify', 'amplify', 'ignore', 'ignore'],
      'track',
    );
    expect(result).toBe('track');
  });

  it('returns the unanimous recommendation', async () => {
    const { pluralityRecommendation } = await import('../src/council/council.js');
    const result = pluralityRecommendation(['track', 'track', 'track'], 'amplify');
    expect(result).toBe('track');
  });
});

describe('voteOutcome', () => {
  it('uses plurality even when it diverges from recommend(median) - the wiring the mocks cannot exercise', async () => {
    // Refuter mutation D: replacing the plurality call with recommend(median)
    // survived the dry-run suite because mock ballots are unanimously 'track'.
    // These ballots diverge: recs = [amplify, amplify, track, ignore] ->
    // plurality 'amplify', while recommend(median 0.585) = 'track'.
    const { voteOutcome, recommend, median } = await import('../src/council/council.js');
    const scores = [0.72, 0.71, 0.46, 0.44];
    const opinions = scores.map((verdictScore, i) => ({
      philosopher: 'socrates' as const,
      displayName: `Seat ${i}`,
      branch: 'epistemology' as const,
      virtueScores: {
        wisdom: verdictScore,
        courage: verdictScore,
        justice: verdictScore,
        temperance: verdictScore,
      },
      verdictScore,
      oneLiner: '',
      reasoning: '',
      concerns: [],
      citations: [],
    }));

    const { finalScore, finalRecommendation } = voteOutcome(opinions);
    expect(finalScore).toBeCloseTo(0.585, 10);
    expect(recommend(median(scores))).toBe('track'); // the mutation's answer
    expect(finalRecommendation).toBe('amplify'); // the correct plurality answer
  });
});

describe('vote governance integration', () => {
  it('runCouncil with debateModeId "vote" derives the verdict mechanically', async () => {
    const { runCouncil, median, pluralityRecommendation, recommend } = await import(
      '../src/council/council.js'
    );
    const item = {
      id: 'vote-test-1',
      source: 'question' as const,
      title: 'Should agentic AI systems be allowed to spend money autonomously?',
      url: 'n/a',
      publishedAt: '2026-07-02T00:00:00Z',
      fetchedAt: '2026-07-02T00:00:00Z',
      tags: [],
    };
    const verdict = await runCouncil(item, 'quorum', {}, 'vote');

    expect(verdict.governance).toBe('vote');
    expect(verdict.ralph.length).toBe(0);

    const scores = verdict.opinions.map((o) => o.verdictScore);
    const expectedMedian = median(scores);
    expect(verdict.finalScore).toBe(expectedMedian);

    const recs = verdict.opinions.map((o) => recommend(o.verdictScore));
    const expectedRecommendation = pluralityRecommendation(recs, recommend(expectedMedian));
    expect(verdict.finalRecommendation).toBe(expectedRecommendation);
  });

  it('falls back to deliberation for prototype-chain mode names like "toString"', async () => {
    // Refuter finding: `'toString' in DEBATE_MODES` is true via the prototype
    // chain and DEBATE_MODES['constructor'] is truthy - lookups must use
    // Object.hasOwn or a hostile mode string silently runs half-configured.
    const { runCouncil } = await import('../src/council/council.js');
    const item = {
      id: 'vote-test-proto',
      source: 'question' as const,
      title: 'Does a hostile mode string fall back safely?',
      url: 'n/a',
      publishedAt: '2026-07-02T00:00:00Z',
      fetchedAt: '2026-07-02T01:00:00Z',
      tags: [],
    };
    const verdict = await runCouncil(item, 'quorum', {}, 'toString' as never);
    expect(verdict.debateMode).toBe('deliberation');
    expect(verdict.governance).toBe('synthesis');
  });
});
