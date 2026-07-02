import { jaccard, tokenize } from '../filter/novelty.js';
import type { IbnArabiSynthesis, MinorityReport, PhilosopherOpinion } from '../types.js';

/**
 * Same value the precedent store uses for MIN_SIMILARITY - a deliberate
 * symmetry: what counts as "the same idea" doesn't change across the codebase.
 */
export const SURVIVAL_THRESHOLD = 0.2;

export interface PreservationReport {
  /** 0..1 - fraction of atomic units that survived. */
  conceptSurvival: number;
  /** Count survived. */
  surviving: number;
  /** Count of units measured. */
  total: number;
  /** 0..1 - present only when a dissenter exists. */
  dissentEngagement?: number;
  details: Array<{
    philosopher: string;
    unit: string;
    survived: boolean;
    bestOverlap: number;
  }>;
}

function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]\n?|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Max jaccard similarity between a unit's tokens and any of the given token sets. */
function bestOverlap(unitTokens: Set<string>, targetTokenSets: Set<string>[]): number {
  let max = 0;
  for (const tokens of targetTokenSets) {
    const sim = jaccard(unitTokens, tokens);
    if (sim > max) max = sim;
  }
  return max;
}

/**
 * Mechanical (token-overlap) measure of which seat concerns survived into the
 * synthesis/answer, and whether the dissent was engaged. Lexical proxy, zero
 * LLM calls, fully deterministic.
 */
export function measurePreservation(
  opinions: PhilosopherOpinion[],
  synthesis: IbnArabiSynthesis,
  answer: string | undefined,
  minority: MinorityReport,
): PreservationReport {
  // Join with newlines, not spaces: splitSentences treats \n as a boundary, so
  // a field lacking terminal punctuation can't merge into the next field's
  // first sentence and dilute its overlap scores.
  const corpusText = [
    synthesis.unifyingReading,
    synthesis.hiddenContinuity,
    synthesis.mysticalCaution,
    answer ?? '',
  ].join('\n');
  const corpusSentences = splitSentences(corpusText);
  const corpusTokenSets = corpusSentences.map((s) => tokenize(s));

  const details: PreservationReport['details'] = [];
  for (const o of opinions) {
    const units = [o.oneLiner, ...o.concerns].filter((u) => u.trim().length > 0);
    for (const unit of units) {
      const overlap = bestOverlap(tokenize(unit), corpusTokenSets);
      details.push({
        philosopher: o.philosopher,
        unit,
        survived: overlap >= SURVIVAL_THRESHOLD,
        bestOverlap: overlap,
      });
    }
  }

  const total = details.length;
  const surviving = details.filter((d) => d.survived).length;
  const conceptSurvival = total === 0 ? 0 : surviving / total;

  let dissentEngagement: number | undefined;
  if (minority.dissenter) {
    const dissenterUnits = [
      minority.dissenter.oneLiner,
      ...splitSentences(minority.dissenter.reasoning),
    ].filter((u) => u.trim().length > 0);
    const useAnswer = !!answer && answer.trim().length > 0;
    const targetSentences = useAnswer ? splitSentences(answer) : corpusSentences;
    const targetTokenSets = useAnswer
      ? targetSentences.map((s) => tokenize(s))
      : corpusTokenSets;

    let max = 0;
    for (const unit of dissenterUnits) {
      const overlap = bestOverlap(tokenize(unit), targetTokenSets);
      if (overlap > max) max = overlap;
    }
    dissentEngagement = max;
  }

  return {
    conceptSurvival,
    surviving,
    total,
    ...(dissentEngagement !== undefined ? { dissentEngagement } : {}),
    details,
  };
}
