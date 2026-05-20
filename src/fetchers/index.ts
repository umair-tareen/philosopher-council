import { config } from '../config.js';
import { logger } from '../logger.js';
import type { TrendItem } from '../types.js';
import { fetchArxiv } from './arxiv.js';
import { fetchHN } from './hn.js';
import { fetchReddit } from './reddit.js';

export async function fetchAll(): Promise<TrendItem[]> {
  const tasks: Promise<TrendItem[]>[] = [
    ...config.redditSubs.map((s) => fetchReddit(s)),
    fetchHN(),
    fetchArxiv('cs.AI'),
    fetchArxiv('cs.LG'),
  ];
  const results = await Promise.allSettled(tasks);
  const items: TrendItem[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') items.push(...r.value);
    else logger.warn({ reason: String(r.reason) }, 'fetcher failed');
  }
  return dedupe(items);
}

export function dedupe(items: TrendItem[]): TrendItem[] {
  const seen = new Set<string>();
  const out: TrendItem[] = [];
  for (const it of items) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  return out;
}
