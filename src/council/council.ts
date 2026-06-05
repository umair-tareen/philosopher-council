import type {
  CouncilMode,
  CouncilVerdict,
  IbnArabiSynthesis,
  MinorityReport,
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
import { config } from '../config.js';
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
  const { text, model } = await complete({
    system: persona.system,
    user: persona.user(item),
    maxTokens: 700,
    model: config.councilModels[id],
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
    model,
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
    model: config.councilModels['ibnarabi'],
  });
  const raw = extractJson<IbnArabiSynthesis>(text);
  return {
    unifyingReading: raw.unifyingReading ?? '',
    hiddenContinuity: raw.hiddenContinuity ?? '',
    mysticalCaution: raw.mysticalCaution ?? '',
    unifiedScore: clamp01(Number(raw.unifiedScore ?? 0.5)),
  };
}

export interface CouncilHooks {
  onSeats?: (seats: Array<{ id: PhilosopherId; branch: Branch }>) => void;
  onOpinion?: (opinion: PhilosopherOpinion) => void;
  onSynthesis?: (synthesis: IbnArabiSynthesis) => void;
  onAnswer?: (answer: string) => void;
}

const SPOKESPERSON_SYSTEM = `You are the council's spokesperson. The deliberation is over; your job is to ANSWER THE QUESTION DIRECTLY, in plain language, on the strength of what the council found.

Rules:
- Open with your position in the first sentence. No throat-clearing, no describing the deliberation.
- 200-300 words: the position, the strongest reasons for it (drawn from the deliberators), the strongest dissent and why it does not carry the day (or how it qualifies the answer), and what evidence would change the verdict.
- You will be told who dissented hardest. You MUST engage that dissent on its merits - never bury or dismiss it.
- Speak about the subject of the question, never about "the council", "the philosophers", or the deliberation process.
- Plain text. No JSON, no headers.`;

/** Convert the deliberation into a direct first-order answer to the question. */
async function callSpokesperson(
  item: TrendItem,
  opinions: PhilosopherOpinion[],
  synthesis: IbnArabiSynthesis,
  minority: MinorityReport,
): Promise<string> {
  const opinionsText = opinions
    .map(
      (o) =>
        `- ${o.displayName} (${o.verdictScore.toFixed(2)}): ${o.oneLiner} | ${o.reasoning}`,
    )
    .join('\n');
  const dissentText = minority.dissenter
    ? `Strongest dissent (you must engage it): ${minority.dissenter.displayName} scored ${minority.dissenter.verdictScore.toFixed(2)} (${minority.dissenter.delta > 0 ? 'above' : 'below'} the synthesis): "${minority.dissenter.oneLiner}" - ${minority.dissenter.reasoning}`
    : '';
  const { text } = await complete({
    system: SPOKESPERSON_SYSTEM,
    user: [
      `Question: ${item.title}`,
      item.summary ? `Context: ${item.summary}` : '',
      '',
      'Deliberation notes:',
      opinionsText,
      '',
      `Synthesis: ${synthesis.unifyingReading}`,
      `Noted blind spot: ${synthesis.mysticalCaution}`,
      dissentText,
    ]
      .filter(Boolean)
      .join('\n'),
    maxTokens: 600,
    model: config.councilModels['spokesperson'],
  });
  return text.trim();
}

const VIRTUES: Virtue[] = ['wisdom', 'courage', 'justice', 'temperance'];

/**
 * Disagreement is the signal synthesis tends to destroy - keep it first-class.
 * Returns dispersion metrics and the opinion furthest from the unified reading.
 */
export function buildMinorityReport(
  opinions: PhilosopherOpinion[],
  synthesis: IbnArabiSynthesis,
): MinorityReport {
  if (opinions.length < 2) {
    return { disagreement: 0, contestedVirtues: [] };
  }
  const scores = opinions.map((o) => o.verdictScore);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const stddev = Math.sqrt(
    scores.reduce((s, v) => s + (v - mean) ** 2, 0) / scores.length,
  );
  // Verdict scores live in a practical band of ~0.5; 4x stddev maps a
  // strongly split council (e.g. 0.35 vs 0.69) to ~0.5+ disagreement.
  const disagreement = Math.min(1, stddev * 4);

  const contestedVirtues = VIRTUES.filter((v) => {
    const vals = opinions.map((o) => o.virtueScores[v]);
    const m = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sd = Math.sqrt(vals.reduce((s, x) => s + (x - m) ** 2, 0) / vals.length);
    return sd >= 0.08;
  });

  let dissenter: MinorityReport['dissenter'];
  let maxDist = 0;
  for (const o of opinions) {
    const dist = Math.abs(o.verdictScore - synthesis.unifiedScore);
    if (dist > maxDist) {
      maxDist = dist;
      dissenter = {
        philosopher: o.philosopher,
        displayName: o.displayName,
        verdictScore: o.verdictScore,
        delta: o.verdictScore - synthesis.unifiedScore,
        oneLiner: o.oneLiner,
        reasoning: o.reasoning,
      };
    }
  }

  return { disagreement, contestedVirtues, dissenter };
}

export async function runCouncil(
  item: TrendItem,
  mode: CouncilMode,
  hooks: CouncilHooks = {},
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
  hooks.onSeats?.(seats);

  const opinions: PhilosopherOpinion[] = [];
  for (const seat of seats) {
    try {
      const opinion = await callPhilosopher(seat.id, seat.branch, item);
      opinions.push(opinion);
      hooks.onOpinion?.(opinion);
    } catch (err) {
      logger.warn({ seat, err: String(err) }, 'philosopher call failed; skipping');
    }
  }

  const synthesis = await callSynthesizer(item, opinions);
  hooks.onSynthesis?.(synthesis);

  const aggregateScore =
    opinions.length === 0
      ? synthesis.unifiedScore
      : opinions.reduce((s, o) => s + o.verdictScore, 0) / opinions.length;

  const consensus = buildConsensus(opinions, synthesis);

  const ralph = await ralphLoop(item, opinions, synthesis, aggregateScore);
  const finalScore = ralph.length
    ? (ralph[ralph.length - 1]?.refinedScore ?? aggregateScore)
    : aggregateScore;

  const minority = buildMinorityReport(opinions, synthesis);

  // Direct questions deserve a direct answer, not just an evaluation.
  let answer: string | undefined;
  if (item.source === 'question') {
    try {
      answer = await callSpokesperson(item, opinions, synthesis, minority);
      hooks.onAnswer?.(answer);
    } catch (err) {
      logger.warn({ err: String(err) }, 'spokesperson call failed; omitting answer');
    }
  }

  return {
    itemId: item.id,
    mode,
    opinions,
    synthesis,
    aggregateScore,
    consensus,
    ralph,
    answer,
    minority,
    finalScore,
    finalRecommendation: recommend(finalScore),
    model: config.defaultModel,
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
