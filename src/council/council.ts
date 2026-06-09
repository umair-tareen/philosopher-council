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
import { rawOpinionSchema, rawSynthesisSchema } from './schemas.js';
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
import { DEBATE_MODES, type DebateModeId } from './modes.js';
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

async function callPhilosopher(
  id: Exclude<PhilosopherId, 'ibnarabi'>,
  branch: Branch,
  item: TrendItem,
  onToken?: (token: string) => void,
  modeInstruction?: string,
  signal?: AbortSignal,
): Promise<PhilosopherOpinion> {
  const persona = PERSONAS[id];
  const meta = PHILOSOPHERS[id];
  const user = modeInstruction
    ? `${persona.user(item)}\n\n${modeInstruction}`
    : persona.user(item);
  const { text, model } = await complete({
    system: persona.system,
    user,
    maxTokens: 700,
    model: config.councilModels[id],
    onToken,
    signal,
  });
  const raw = rawOpinionSchema.parse(extractJson<unknown>(text));
  const { virtueScores } = raw;
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
    oneLiner: raw.oneLiner,
    reasoning: raw.reasoning,
    concerns: raw.concerns,
    citations: raw.citations,
    model,
  };
}

async function callSynthesizer(
  item: TrendItem,
  opinions: PhilosopherOpinion[],
  signal?: AbortSignal,
): Promise<IbnArabiSynthesis> {
  const { text } = await complete({
    system: ibnarabi.system,
    user: ibnarabi.user(item, opinions),
    maxTokens: 800,
    model: config.councilModels['ibnarabi'],
    signal,
  });
  return rawSynthesisSchema.parse(extractJson<unknown>(text));
}

export interface CouncilHooks {
  onSeats?: (seats: Array<{ id: PhilosopherId; branch: Branch }>) => void;
  /** Raw text deltas from a deliberator while their opinion streams in. */
  onToken?: (philosopher: PhilosopherId, token: string) => void;
  /** A seat's call failed - the UI should clear its pending state. */
  onSeatFailed?: (philosopher: PhilosopherId, error: string) => void;
  onOpinion?: (opinion: PhilosopherOpinion) => void;
  onSynthesis?: (synthesis: IbnArabiSynthesis) => void;
  /** Raw text deltas from the spokesperson while the answer streams in. */
  onAnswerToken?: (token: string) => void;
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
  onToken?: (token: string) => void,
  signal?: AbortSignal,
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
    onToken,
    signal,
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
  debateModeId: DebateModeId = 'deliberation',
  signal?: AbortSignal,
): Promise<CouncilVerdict> {
  const debateMode = DEBATE_MODES[debateModeId] ?? DEBATE_MODES.deliberation;
  const seats: QuorumSeat[] = debateMode.seats
    ? debateMode.seats.map((id) => ({
        id,
        branch: PHILOSOPHERS[id].primaryBranch,
      }))
    : mode === 'full'
      ? ALL_DELIBERATORS.map((id) => ({
          id: id as Exclude<PhilosopherId, 'ibnarabi'>,
          branch: PHILOSOPHERS[id].primaryBranch,
        }))
      : selectQuorum(item.id);

  logger.info(
    {
      item: item.id,
      mode,
      debateMode: debateMode.id,
      seats: seats.map((s) => `${s.id}:${s.branch}`),
    },
    'council convene',
  );
  hooks.onSeats?.(seats);

  // Seats deliberate concurrently (independent opinions by design - they never
  // see each other's output). Results keep seat order; events fire on completion.
  const results: Array<PhilosopherOpinion | null> = new Array(seats.length).fill(null);
  let nextSeat = 0;
  async function deliberate(): Promise<void> {
    for (;;) {
      if (signal?.aborted) return;
      const i = nextSeat++;
      if (i >= seats.length) return;
      const seat = seats[i] as QuorumSeat;
      try {
        const onToken = hooks.onToken
          ? (t: string) => hooks.onToken?.(seat.id, t)
          : undefined;
        const opinion = await callPhilosopher(
          seat.id,
          seat.branch,
          item,
          onToken,
          debateMode.instruction?.(i),
          signal,
        );
        results[i] = opinion;
        hooks.onOpinion?.(opinion);
      } catch (err) {
        logger.warn({ seat, err: String(err) }, 'philosopher call failed; skipping');
        if (!signal?.aborted) hooks.onSeatFailed?.(seat.id, String(err));
      }
    }
  }
  const workers = Math.min(config.councilConcurrency, seats.length);
  await Promise.all(Array.from({ length: workers }, () => deliberate()));
  const opinions = results.filter((o): o is PhilosopherOpinion => o !== null);

  if (signal?.aborted) throw new Error('aborted: client disconnected');
  // Every deliberator failed - there is nothing to synthesize. Fail loudly
  // rather than feeding an empty council into the synthesizer (and persisting
  // a hollow verdict that would taint precedent retrieval).
  if (opinions.length === 0) {
    throw new Error('all deliberators failed; no opinions to synthesize');
  }

  // The synthesizer is a model call like any other - a malformed response or
  // a provider hiccup must not abort the whole run with a raw stack trace.
  let synthesis: IbnArabiSynthesis;
  try {
    synthesis = await callSynthesizer(item, opinions, signal);
  } catch (err) {
    if (signal?.aborted) throw err;
    logger.warn({ err: String(err) }, 'synthesizer failed; using a neutral synthesis');
    const mean = opinions.reduce((s, o) => s + o.verdictScore, 0) / opinions.length;
    synthesis = {
      unifyingReading:
        'The synthesizer was unavailable; this reading is the mean of the deliberators.',
      hiddenContinuity: '',
      mysticalCaution: 'Synthesis stage failed - treat the unified score as a simple average.',
      unifiedScore: mean,
    };
  }
  hooks.onSynthesis?.(synthesis);

  const aggregateScore =
    opinions.length === 0
      ? synthesis.unifiedScore
      : opinions.reduce((s, o) => s + o.verdictScore, 0) / opinions.length;

  const consensus = buildConsensus(opinions, synthesis);

  const ralph = await ralphLoop(item, opinions, synthesis, aggregateScore, signal);
  const finalScore = ralph.length
    ? (ralph[ralph.length - 1]?.refinedScore ?? aggregateScore)
    : aggregateScore;

  const minority = buildMinorityReport(opinions, synthesis);

  // Direct questions deserve a direct answer, not just an evaluation.
  let answer: string | undefined;
  if (item.source === 'question') {
    try {
      answer = await callSpokesperson(
        item,
        opinions,
        synthesis,
        minority,
        hooks.onAnswerToken,
        signal,
      );
      hooks.onAnswer?.(answer);
    } catch (err) {
      logger.warn({ err: String(err) }, 'spokesperson call failed; omitting answer');
    }
  }

  return {
    itemId: item.id,
    mode,
    debateMode: debateMode.id,
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
