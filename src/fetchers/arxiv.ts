import { createHash } from 'node:crypto';
import { XMLParser } from 'fast-xml-parser';
import { matchKeywords } from '../filter/keywords.js';
import { logger } from '../logger.js';
import type { TrendItem } from '../types.js';

interface RssItem {
  title?: string;
  link?: string;
  description?: string;
  'dc:creator'?: string;
  pubDate?: string;
}

interface RssFeed {
  rss?: { channel?: { item?: RssItem | RssItem[] } };
}

const parser = new XMLParser({ ignoreAttributes: false });

export async function fetchArxiv(category: string): Promise<TrendItem[]> {
  const url = `http://export.arxiv.org/rss/${category}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      logger.warn({ category, status: res.status }, 'arxiv fetch failed');
      return [];
    }
    const xml = await res.text();
    const parsed = parser.parse(xml) as RssFeed;
    const channel = parsed.rss?.channel;
    const raw = channel?.item;
    const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const now = new Date().toISOString();
    return items.map((it): TrendItem => {
      const title = (it.title ?? '').trim();
      const link = it.link ?? '';
      const desc = (it.description ?? '').replace(/<[^>]+>/g, '').trim();
      return {
        id: hashId('arxiv', link),
        source: 'arxiv',
        subSource: category,
        title,
        url: link,
        author: it['dc:creator'],
        publishedAt: it.pubDate ? new Date(it.pubDate).toISOString() : now,
        fetchedAt: now,
        summary: desc.slice(0, 1200),
        tags: matchKeywords(`${title}\n${desc}`),
      };
    });
  } catch (err) {
    logger.warn({ category, err: String(err) }, 'arxiv fetch error');
    return [];
  }
}

function hashId(source: string, url: string): string {
  return createHash('sha1').update(`${source}:${url}`).digest('hex').slice(0, 16);
}
