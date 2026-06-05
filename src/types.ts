export type Source = 'reddit' | 'hn' | 'arxiv' | 'question';

export type Virtue = 'wisdom' | 'courage' | 'justice' | 'temperance';

export type Branch =
  | 'epistemology'
  | 'metaphysics'
  | 'ethics'
  | 'logic'
  | 'synthesis';

export type PhilosopherId =
  | 'socrates'
  | 'plato'
  | 'aristotle'
  | 'confucius'
  | 'laotzu'
  | 'avicenna'
  | 'alghazali'
  | 'ibnrushd'
  | 'descartes'
  | 'kant'
  | 'ibnarabi';

export type CouncilMode = 'quorum' | 'full';

export type Recommendation = 'amplify' | 'track' | 'ignore';

export interface TrendItem {
  id: string;
  source: Source;
  subSource?: string;
  title: string;
  url: string;
  author?: string;
  publishedAt: string;
  fetchedAt: string;
  summary?: string;
  rawScore?: number;
  tags: string[];
  /** 1 = nothing like it seen recently, 0 = near-duplicate of a past title. */
  novelty?: number;
}

export interface PhilosopherOpinion {
  philosopher: PhilosopherId;
  displayName: string;
  branch: Branch;
  virtueScores: Record<Virtue, number>;
  verdictScore: number;
  oneLiner: string;
  reasoning: string;
  concerns: string[];
  citations: string[];
  /** The "provider:model" that produced this opinion. */
  model?: string;
}

export interface IbnArabiSynthesis {
  unifyingReading: string;
  hiddenContinuity: string;
  mysticalCaution: string;
  unifiedScore: number;
}

export interface MinorityReport {
  /** 0..1 - normalized dispersion of verdict scores across the deliberators. */
  disagreement: number;
  /** Virtue axes where the council split hardest. */
  contestedVirtues: Virtue[];
  /** The opinion furthest from the synthesizer's unified reading. */
  dissenter?: {
    philosopher: PhilosopherId;
    displayName: string;
    verdictScore: number;
    /** Signed distance from the synthesis unifiedScore. */
    delta: number;
    oneLiner: string;
    reasoning: string;
  };
}

export interface RalphCritique {
  iteration: number;
  weaknesses: string[];
  refinedVerdict: string;
  refinedScore: number;
}

export interface CouncilVerdict {
  itemId: string;
  mode: CouncilMode;
  opinions: PhilosopherOpinion[];
  synthesis: IbnArabiSynthesis;
  aggregateScore: number;
  consensus: string;
  ralph: RalphCritique[];
  /** Direct first-order answer (spokesperson stage; present for question items). */
  answer?: string;
  /** Where the council split: disagreement metrics and the strongest dissent. */
  minority: MinorityReport;
  finalScore: number;
  finalRecommendation: Recommendation;
  model: string;
  generatedAt: string;
}

export interface DigestEntry {
  item: TrendItem;
  verdict: CouncilVerdict;
}
