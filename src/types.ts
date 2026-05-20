export type Source = 'reddit' | 'hn' | 'arxiv';

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
}

export interface IbnArabiSynthesis {
  unifyingReading: string;
  hiddenContinuity: string;
  mysticalCaution: string;
  unifiedScore: number;
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
  finalScore: number;
  finalRecommendation: Recommendation;
  model: string;
  generatedAt: string;
}

export interface DigestEntry {
  item: TrendItem;
  verdict: CouncilVerdict;
}
