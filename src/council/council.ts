import type {
  CouncilMode,
  CouncilVerdict,
  IbnArabiSynthesis,
  PhilosopherId,
  PhilosopherOpinion,
  Recommendation,
  TrendItem,
  Virtue,
} from '../types.js';
import { complete, extractJson } from './client.js';
import { socrates } from './personas/socrates.js';
import { plato } from './personas/plato.js';
import { aristotle } from './personas/aristotle.js';
import { confucius } from './personas/confucius.js';
import { laotzu } from './personas/laotzu.js';
import { avicenna } from './personas/avicenna.js';
import { alghazali } from './personas/alghazali.js';
import { ibnrushd } from './personas/ibnrushd.js';
import { descartes } from './personas/descartes.js';
import { kant } from './personas/kant.js';
import { ibnarabi } from './personas/ibnarabi.js';
import { ALL_DELIBERATORS, PHILOSOPHERS } from './registry.js';
import { selectQuorum, type QuorumSeat } from './quorum.js';
import type { Branch } from '../types.js';
import { ralphLoop } from './ralph.js';
import { logger } from '../logger.js';

type PersonaModule = {
  system: string;
  user: (item: TrendItem) => string;
};

const PERSONAS: Record<Exclude<PhilosopherId, 'ibnarabi'>, PersonaModule> = {
  socrates,
  plato,
  aristotle,
  confucius,
  laotzu,
  avicenna,
  alghazali,
  ibnrushd,
  descartes,
  kant,
};

interface RawOpinion {
  virtueScores: Record<Virtue, number>;
  oneLiner: string;
  reasoning: string;
  concerns: string[];
  citations: string[];
}

async function callPhilosopher(
  id: Exclude<PhilosopherId, 'ibnarabi'>,
  branch: Branch,
  item: TrendItem,
): Promise<PhilosopherOpinion> {
  const persona = PERSONAS[id];
  const meta = PHILOSOPHERS[id];
  const { text } = await complete({
    system: persona.system,
    user: persona.user(item),
    maxTokens: 700,
  });
  const raw = extractJson<RawOpinion>(text);
  const virtueScores = clampVirtues(raw.virtueScores);
  const verdictScore =
    (virtueScores.wisdom +
      virtueScores.courage +
      virtueScores.justice +
      virtueScores.temperance) /
    4;
  return {
    philosopher: id,
    displayName: meta.displayName,
    branch,
    virtueScores,
    verdictScore,
    oneLiner: (raw.oneLiner ?? '').slice(0, 140),
    reasoning: raw.reasoning ?? '',
    concerns: Array.isArray(raw.concerns) ? raw.concerns.slice(0, 4) : [],
    citations: Array.isArray(raw.citations) ? raw.citations.slice(0, 4) : [],
  };
}

async function callSynthesizer(
  item: TrendItem,
  opinions: PhilosopherOpinion[],
): Promise<IbnArabiSynthesis> {
  const { text } = await complete({
    system: ibnarabi.system,
    user: ibnarabi.user(item, opinions),
    maxTokens: 800,
  });
  const raw = extractJson<IbnArabiSynthesis>(text);
  return {
    unifyingReading: raw.unifyingReading ?? '',
    hiddenContinuity: raw.hiddenContinuity ?? '',
    mysticalCaution: raw.mysticalCaution ?? '',
    unifiedScore: clamp01(Number(raw.unifiedScore ?? 0.5)),
  };
}

export async function runCouncil(
  item: TrendItem,
  mode: CouncilMode,
): Promise<CouncilVerdict> {
  const seats: QuorumSeat[] =
    mode === 'full'
      ? ALL_DELIBERATORS.map((id) => ({
          id: id as Exclude<PhilosopherId, 'ibnarabi'>,
          branch: PHILOSOPHERS[id].primaryBranch,
        }))
      : selectQuorum(item.id);

  logger.info(
    { item: item.id, mode, seats: seats.map((s) => `${s.id}:${s.branch}`) },
    'council convene',
  );

  const opinions: PhilosopherOpinion[] = [];
  for (const seat of seats) {
    try {
      opinions.push(await callPhilosopher(seat.id, seat.branch, item));
    } catch (err) {
      logger.warn({ seat, err: String(err) }, 'philosopher call failed; skipping');
    }
  }

  const synthesis = await callSynthesizer(item, opinions);

  const aggregateScore =
    opinions.length === 0
      ? synthesis.unifiedScore
      : opinions.reduce((s, o) => s + o.verdictScore, 0) / opinions.length;

  const consensus = buildConsensus(opinions, synthesis);

  const ralph = await ralphLoop(item, opinions, synthesis, aggregateScore);
  const finalScore = ralph.length
    ? (ralph[ralph.length - 1]?.refinedScore ?? aggregateScore)
    : aggregateScore;

  return {
    itemId: item.id,
    mode,
    opinions,
    synthesis,
    aggregateScore,
    consensus,
    ralph,
    finalScore,
    finalRecommendation: recommend(finalScore),
    model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5',
    generatedAt: new Date().toISOString(),
  };
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

function clampVirtues(v: Partial<Record<Virtue, number>>): Record<Virtue, number> {
  return {
    wisdom: clamp01(Number(v.wisdom ?? 0.5)),
    courage: clamp01(Number(v.courage ?? 0.5)),
    justice: clamp01(Number(v.justice ?? 0.5)),
    temperance: clamp01(Number(v.temperance ?? 0.5)),
  };
}

function buildConsensus(
  opinions: PhilosopherOpinion[],
  synthesis: IbnArabiSynthesis,
): string {
  const lines = opinions
    .map((o) => `- ${o.displayName}: ${o.oneLiner}`)
    .join('\n');
  return `${lines}\n\nSynthesis (Ibn ʿArabī): ${synthesis.unifyingReading}`;
}

function recommend(score: number): Recommendation {
  if (score >= 0.7) return 'amplify';
  if (score >= 0.45) return 'track';
  return 'ignore';
}
