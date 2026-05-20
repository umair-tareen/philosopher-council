import type { Recommendation, TrendItem } from '../types.js';
import { complete, extractJson } from './client.js';

const SYSTEM = `Rate this AI trend on three axes in [0, 1]: novelty, soundness, alignment. JSON only:
{ "novelty": number, "soundness": number, "alignment": number, "oneLiner": string }
No prose. No analysis. One line of judgment.`;

export interface CavemanVerdict {
  itemId: string;
  novelty: number;
  soundness: number;
  alignment: number;
  oneLiner: string;
  score: number;
  recommendation: Recommendation;
}

export async function caveman(item: TrendItem): Promise<CavemanVerdict> {
  const { text } = await complete({
    system: SYSTEM,
    user: `${item.title}\n${item.summary ?? ''}`,
    maxTokens: 200,
  });
  const raw = extractJson<{
    novelty?: number;
    soundness?: number;
    alignment?: number;
    oneLiner?: string;
  }>(text);
  const novelty = clamp01(Number(raw.novelty ?? 0.5));
  const soundness = clamp01(Number(raw.soundness ?? 0.5));
  const alignment = clamp01(Number(raw.alignment ?? 0.5));
  const score = (novelty + soundness + alignment) / 3;
  return {
    itemId: item.id,
    novelty,
    soundness,
    alignment,
    oneLiner: (raw.oneLiner ?? '').slice(0, 140),
    score,
    recommendation: score >= 0.7 ? 'amplify' : score >= 0.45 ? 'track' : 'ignore',
  };
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}
