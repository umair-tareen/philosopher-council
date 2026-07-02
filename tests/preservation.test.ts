import { describe, expect, it } from 'vitest';
import { measurePreservation, SURVIVAL_THRESHOLD } from '../src/council/preservation.js';
import { jaccard, tokenize } from '../src/filter/novelty.js';
import type { IbnArabiSynthesis, MinorityReport, PhilosopherOpinion } from '../src/types.js';

function opinion(overrides: Partial<PhilosopherOpinion>): PhilosopherOpinion {
  return {
    philosopher: 'socrates',
    displayName: 'Socrates',
    branch: 'epistemology',
    virtueScores: { wisdom: 0.5, courage: 0.5, justice: 0.5, temperance: 0.5 },
    verdictScore: 0.5,
    oneLiner: '',
    reasoning: '',
    concerns: [],
    citations: [],
    ...overrides,
  };
}

const emptySynthesis: IbnArabiSynthesis = {
  unifyingReading: '',
  hiddenContinuity: '',
  mysticalCaution: '',
  unifiedScore: 0.5,
};

const noDissentMinority: MinorityReport = { disagreement: 0, contestedVirtues: [] };

describe('measurePreservation', () => {
  it('flips survived exactly at SURVIVAL_THRESHOLD (known jaccard just above and just below)', () => {
    // union=5, overlap=1 -> jaccard = 0.2 == threshold (survives, >= is inclusive)
    const unitAbove = 'aaa bbb';
    const sentenceAbove = 'aaa ccc ddd eee';
    const jaccardAbove = jaccard(tokenize(unitAbove), tokenize(sentenceAbove));
    expect(jaccardAbove).toBeCloseTo(0.2, 10);
    expect(jaccardAbove).toBeGreaterThanOrEqual(SURVIVAL_THRESHOLD);

    // union=6, overlap=1 -> jaccard = 1/6 < threshold (does not survive)
    const unitBelow = 'fff ggg';
    const sentenceBelow = 'fff hhh iii jjj kkk';
    const jaccardBelow = jaccard(tokenize(unitBelow), tokenize(sentenceBelow));
    expect(jaccardBelow).toBeCloseTo(1 / 6, 10);
    expect(jaccardBelow).toBeLessThan(SURVIVAL_THRESHOLD);

    const opinions = [
      opinion({ oneLiner: 'Unrelated opinion text one', concerns: [unitAbove] }),
      opinion({ oneLiner: unitBelow, concerns: [] }),
    ];
    const synthesis: IbnArabiSynthesis = {
      ...emptySynthesis,
      unifyingReading: `${sentenceAbove}. ${sentenceBelow}.`,
    };

    const report = measurePreservation(opinions, synthesis, undefined, noDissentMinority);

    const detailAbove = report.details.find((d) => d.unit === unitAbove);
    const detailBelow = report.details.find((d) => d.unit === unitBelow);
    expect(detailAbove?.survived).toBe(true);
    expect(detailAbove?.bestOverlap).toBeCloseTo(jaccardAbove, 10);
    expect(detailBelow?.survived).toBe(false);
    expect(detailBelow?.bestOverlap).toBeCloseTo(jaccardBelow, 10);
  });

  it('marks a concern echoed verbatim in the synthesis as survived', () => {
    const echoed = 'Echoes precisely into the unifying reading';
    const opinions = [opinion({ oneLiner: '', concerns: [echoed] })];
    const synthesis: IbnArabiSynthesis = {
      ...emptySynthesis,
      unifyingReading: `${echoed}.`,
    };
    const report = measurePreservation(opinions, synthesis, undefined, noDissentMinority);
    expect(report.total).toBe(1);
    expect(report.surviving).toBe(1);
    expect(report.conceptSurvival).toBe(1);
    expect(report.details[0]?.survived).toBe(true);
  });

  it('marks a nonsense concern absent from the corpus as not survived', () => {
    const nonsense = 'zxq flurble quantum';
    const opinions = [opinion({ oneLiner: '', concerns: [nonsense] })];
    const synthesis: IbnArabiSynthesis = {
      ...emptySynthesis,
      unifyingReading: 'A completely different sentence about something else entirely.',
    };
    const report = measurePreservation(opinions, synthesis, undefined, noDissentMinority);
    expect(report.total).toBe(1);
    expect(report.surviving).toBe(0);
    expect(report.conceptSurvival).toBe(0);
    expect(report.details[0]?.survived).toBe(false);
  });

  it('handles zero atomic units without throwing', () => {
    const opinions = [opinion({ oneLiner: '   ', concerns: ['', '  '] })];
    const report = measurePreservation(opinions, emptySynthesis, undefined, noDissentMinority);
    expect(report.total).toBe(0);
    expect(report.surviving).toBe(0);
    expect(report.conceptSurvival).toBe(0);
    expect(report.details).toEqual([]);
  });

  it('computes a high dissentEngagement when the answer engages the dissent', () => {
    const opinions = [opinion({ oneLiner: 'Some opinion', concerns: [] })];
    const dissentSentence = 'The proposal ignores critical safety guardrails entirely';
    const minority: MinorityReport = {
      disagreement: 0.6,
      contestedVirtues: [],
      dissenter: {
        philosopher: 'kant',
        displayName: 'Kant',
        verdictScore: 0.2,
        delta: -0.4,
        oneLiner: 'Safety first above all',
        reasoning: `${dissentSentence}.`,
      },
    };
    const answer = `${dissentSentence}, and this dissent must be engaged directly.`;
    const report = measurePreservation(opinions, emptySynthesis, answer, minority);
    expect(report.dissentEngagement).toBeDefined();
    expect(report.dissentEngagement as number).toBeGreaterThan(0.5);
  });

  it('computes a low dissentEngagement when the answer ignores the dissent', () => {
    const opinions = [opinion({ oneLiner: 'Some opinion', concerns: [] })];
    const minority: MinorityReport = {
      disagreement: 0.6,
      contestedVirtues: [],
      dissenter: {
        philosopher: 'kant',
        displayName: 'Kant',
        verdictScore: 0.2,
        delta: -0.4,
        oneLiner: 'Safety first above all',
        reasoning: 'The proposal ignores critical safety guardrails entirely.',
      },
    };
    const answer = 'This response has nothing whatsoever to do with any of that.';
    const report = measurePreservation(opinions, emptySynthesis, answer, minority);
    expect(report.dissentEngagement).toBeDefined();
    expect(report.dissentEngagement as number).toBeLessThan(SURVIVAL_THRESHOLD);
  });

  it('omits dissentEngagement entirely when there is no dissenter', () => {
    const opinions = [opinion({ oneLiner: 'Some opinion', concerns: [] })];
    const report = measurePreservation(
      opinions,
      emptySynthesis,
      'Any answer text.',
      noDissentMinority,
    );
    expect(report.dissentEngagement).toBeUndefined();
    expect('dissentEngagement' in report).toBe(false);
  });

  it('falls back to the synthesis corpus for dissentEngagement when answer is undefined', () => {
    const opinions = [opinion({ oneLiner: 'Some opinion', concerns: [] })];
    const dissentSentence = 'The mechanism is unproven at scale';
    const minority: MinorityReport = {
      disagreement: 0.6,
      contestedVirtues: [],
      dissenter: {
        philosopher: 'kant',
        displayName: 'Kant',
        verdictScore: 0.2,
        delta: -0.4,
        oneLiner: 'Unproven at scale',
        reasoning: `${dissentSentence}.`,
      },
    };
    const synthesis: IbnArabiSynthesis = {
      ...emptySynthesis,
      unifyingReading: `${dissentSentence}.`,
    };
    const report = measurePreservation(opinions, synthesis, undefined, minority);
    expect(report.dissentEngagement).toBeDefined();
    expect(report.dissentEngagement as number).toBeGreaterThan(0.5);
  });

  it('scores dissent engagement against the ANSWER only - a synthesis that engages the dissent cannot mask an answer that buries it', () => {
    // Refuter finding M3: with a non-empty answer, the dissent target must be
    // the answer alone. Here the synthesis quotes the dissent verbatim while
    // the answer ignores it - engagement must stay low.
    const dissentClaim = 'centralized control invites systemic fragility everywhere';
    const minority: MinorityReport = {
      disagreement: 0.4,
      contestedVirtues: [],
      dissenter: {
        philosopher: 'laotzu',
        displayName: 'Lao Tzu',
        verdictScore: 0.3,
        delta: -0.3,
        oneLiner: dissentClaim,
        reasoning: dissentClaim,
      },
    };
    const synthesis: IbnArabiSynthesis = {
      ...emptySynthesis,
      unifyingReading: `The strongest dissent held that ${dissentClaim}.`,
    };
    const answer =
      'Proceed with the migration. The benefits are clear and the timeline is short.';

    const report = measurePreservation([], synthesis, answer, minority);
    expect(report.dissentEngagement).toBeDefined();
    expect(report.dissentEngagement as number).toBeLessThan(SURVIVAL_THRESHOLD);

    // Same inputs but no answer -> falls back to the synthesis corpus, where
    // the dissent IS engaged - engagement must now be high.
    const fallback = measurePreservation([], synthesis, undefined, minority);
    expect(fallback.dissentEngagement as number).toBeGreaterThan(0.5);
  });

  it('counts a stopword-only unit in the denominator with overlap 0 (never dropped, never NaN)', () => {
    // Refuter finding M4: a non-empty unit that tokenizes to an empty set must
    // still be measured - silently dropping it would inflate conceptSurvival.
    const opinions = [
      opinion({ oneLiner: 'so it is', concerns: ['aaa bbb'] }), // 'so it is' tokenizes to nothing
    ];
    const synthesis: IbnArabiSynthesis = {
      ...emptySynthesis,
      unifyingReading: 'aaa bbb.',
    };
    expect(tokenize('so it is').size).toBe(0);

    const report = measurePreservation(opinions, synthesis, undefined, noDissentMinority);
    expect(report.total).toBe(2);
    expect(report.surviving).toBe(1);
    expect(report.conceptSurvival).toBeCloseTo(0.5, 10);
    const stopwordDetail = report.details.find((d) => d.unit === 'so it is');
    expect(stopwordDetail?.survived).toBe(false);
    expect(Number.isFinite(stopwordDetail?.bestOverlap)).toBe(true);
    expect(stopwordDetail?.bestOverlap).toBe(0);
  });
});
