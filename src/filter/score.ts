import type { TrendItem } from '../types.js';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function heuristicScore(item: TrendItem, now = Date.now()): number {
  const ageMs = Math.max(0, now - Date.parse(item.publishedAt));
  const recency = Math.exp(-ageMs / (3 * DAY_MS));
  const tagBoost = Math.min(1, item.tags.length / 3);
  const rawNorm = item.rawScore ? Math.log10(1 + item.rawScore) / 4 : 0;
  return 0.5 * recency + 0.3 * tagBoost + 0.2 * rawNorm;
}

export function rankByScore(items: TrendItem[]): TrendItem[] {
  const now = Date.now();
  return [...items].sort((a, b) => heuristicScore(b, now) - heuristicScore(a, now));
}
