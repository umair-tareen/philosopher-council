import { createHash } from 'node:crypto';
import { KARPATHY_KEYWORDS, matchKeywords } from '../filter/keywords.js';
import { logger } from '../logger.js';
import type { TrendItem } from '../types.js';

interface AlgoliaHit {
  objectID: string;
  title?: string;
  story_title?: string;
  url?: string;
  story_url?: string;
  author: string;
  created_at: string;
  points?: number;
  story_text?: string;
}

interface AlgoliaResponse {
  hits: AlgoliaHit[];
}

export async function fetchHN(): Promise<TrendItem[]> {
  const queries = KARPATHY_KEYWORDS.map((k) => k.tag.replace(/-/g, ' '));
  const now = new Date().toISOString();
  const all: TrendItem[] = [];
  for (const q of queries) {
    const url = `https://hn.algolia.com/api/v1/search_by_date?tags=story&query=${encodeURIComponent(q)}&hitsPerPage=20`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        logger.warn({ q, status: res.status }, 'hn fetch failed');
        continue;
      }
      const body = (await res.json()) as AlgoliaResponse;
      for (const hit of body.hits) {
        const title = hit.title ?? hit.story_title ?? '';
        const link = hit.url ?? hit.story_url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`;
        const text = `${title}\n${hit.story_text ?? ''}`;
        all.push({
          id: hashId('hn', link),
          source: 'hn',
          title,
          url: link,
          author: hit.author,
          publishedAt: hit.created_at,
          fetchedAt: now,
          summary: (hit.story_text ?? '').slice(0, 1200),
          rawScore: hit.points,
          tags: matchKeywords(text),
        });
      }
    } catch (err) {
      logger.warn({ q, err: String(err) }, 'hn fetch error');
    }
  }
  return all;
}

function hashId(source: string, url: string): string {
  return createHash('sha1').update(`${source}:${url}`).digest('hex').slice(0, 16);
}
