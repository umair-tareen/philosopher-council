import type {
  IbnArabiSynthesis,
  PhilosopherOpinion,
  RalphCritique,
  TrendItem,
} from '../types.js';
import { complete, extractJson } from './client.js';
import { renderItem } from './personas/_shared.js';
import { config } from '../config.js';
import { logger } from '../logger.js';

const MAX_ITERATIONS = 2;
const CONFIDENCE_FLOOR = 0.6;

const SYSTEM = `You are the Ralph-loop critic. You read the council's prior verdict on an AI-research trend item and look for the three weakest claims in it. For each weakness, you either strengthen it with evidence the council should have cited (referencing canon/*) or downgrade the score accordingly.

You MUST respond with a single JSON object and nothing else:
{
  "weaknesses": string[],         // up to 3 short bullets describing weak claims
  "refinedVerdict": string,       // 2-4 sentences summarising the revised reading
  "refinedScore": number,         // 0..1, the corrected aggregate
  "stopConfidence": number        // 0..1: how confident you are that no further iteration is needed
}
If stopConfidence >= ${CONFIDENCE_FLOOR}, the next loop will stop. Be honest.`;

export async function ralphLoop(
  item: TrendItem,
  opinions: PhilosopherOpinion[],
  synthesis: IbnArabiSynthesis,
  initialScore: number,
  signal?: AbortSignal,
): Promise<RalphCritique[]> {
  const out: RalphCritique[] = [];
  let prevScore = initialScore;
  let prevVerdict = synthesis.unifyingReading;

  for (let i = 1; i <= MAX_ITERATIONS; i++) {
    try {
      const { text } = await complete({
        system: SYSTEM,
        user: buildUser(item, opinions, prevVerdict, prevScore),
        maxTokens: 700,
        model: config.councilModels['ralph'],
        signal,
      });
      const raw = extractJson<{
        weaknesses?: string[];
        refinedVerdict?: string;
        refinedScore?: number;
        stopConfidence?: number;
      }>(text);
      const critique: RalphCritique = {
        iteration: i,
        weaknesses: Array.isArray(raw.weaknesses) ? raw.weaknesses.slice(0, 3) : [],
        refinedVerdict: raw.refinedVerdict ?? prevVerdict,
        refinedScore: clamp01(Number(raw.refinedScore ?? prevScore)),
      };
      out.push(critique);
      prevScore = critique.refinedScore;
      prevVerdict = critique.refinedVerdict;
      const stop = clamp01(Number(raw.stopConfidence ?? 0));
      if (stop >= CONFIDENCE_FLOOR) break;
    } catch (err) {
      logger.warn({ err: String(err) }, 'ralph iteration failed');
      break;
    }
  }
  return out;
}

function buildUser(
  item: TrendItem,
  opinions: PhilosopherOpinion[],
  verdict: string,
  score: number,
): string {
  const opinionsText = opinions
    .map((o) => `- ${o.displayName} (${o.verdictScore.toFixed(2)}): ${o.oneLiner}`)
    .join('\n');
  return [
    'Item:',
    renderItem(item),
    '',
    'Opinions summary:',
    opinionsText,
    '',
    `Prior verdict: ${verdict}`,
    `Prior aggregate score: ${score.toFixed(2)}`,
    '',
    'Identify the three weakest claims. Strengthen with canon/* citations or downgrade the score.',
  ].join('\n');
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}
