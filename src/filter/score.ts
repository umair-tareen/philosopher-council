import { config } from '../config.js';
import type { TrendItem } from '../types.js';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function heuristicScore(item: TrendItem, now = Date.now()): number {
  // A missing/malformed date yields NaN from Date.parse, which would poison
  // both this score and the sort comparator that ranks on it. Treat unknown
  // dates as "just now" (recency 1) rather than letting NaN propagate.
  const published = Date.parse(item.publishedAt);
  const ageMs = Number.isFinite(published) ? Math.max(0, now - published) : 0;
  const recency = Math.exp(-ageMs / (3 * DAY_MS));
  const tagBoost = Math.min(1, item.tags.length / 3);
  // Clamp to >= 0: downvoted Reddit items have negative scores, and
  // log10(1 + negative) is -Infinity/NaN, which corrupts the whole sort.
  const safeScore = Math.max(0, item.rawScore ?? 0);
  const rawNorm = Math.log10(1 + safeScore) / 4;
  return 0.5 * recency + 0.3 * tagBoost + 0.2 * rawNorm;
}

/**
 * Final ranking score: heuristic base, scaled by per-source weight
 * (SOURCE_WEIGHTS env) and novelty (0.75x for a near-duplicate title,
 * 1.25x for something never seen).
 */
export function rankingScore(item: TrendItem, now = Date.now()): number {
  const base = heuristicScore(item, now);
  const weight = config.sourceWeights[item.source] ?? 1;
  const noveltyFactor = 0.75 + 0.5 * (item.novelty ?? 0.5);
  return base * weight * noveltyFactor;
}

export function rankByScore(items: TrendItem[]): TrendItem[] {
  const now = Date.now();
  return [...items].sort((a, b) => rankingScore(b, now) - rankingScore(a, now));
}
