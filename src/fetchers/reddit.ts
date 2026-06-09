import { matchKeywords } from '../filter/keywords.js';
import { logger } from '../logger.js';
import type { TrendItem } from '../types.js';
import { hashId } from './index.js';

const UA = 'stoic-ai-council/0.1';

interface RedditChild {
  data: {
    id: string;
    title: string;
    selftext?: string;
    url: string;
    permalink: string;
    author: string;
    created_utc: number;
    score: number;
    subreddit: string;
  };
}

interface RedditListing {
  data: { children: RedditChild[] };
}

export async function fetchReddit(subreddit: string): Promise<TrendItem[]> {
  const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=50`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) {
    logger.warn({ subreddit, status: res.status }, 'reddit fetch failed');
    return [];
  }
  const body = (await res.json()) as RedditListing;
  const children = body?.data?.children;
  if (!Array.isArray(children)) {
    logger.warn({ subreddit }, 'reddit response had no children array; skipping');
    return [];
  }
  const now = new Date().toISOString();
  return children.map((c): TrendItem => {
    const text = `${c.data.title}\n${c.data.selftext ?? ''}`;
    const canonical = `https://www.reddit.com${c.data.permalink}`;
    return {
      id: hashId('reddit', canonical),
      source: 'reddit',
      subSource: `r/${c.data.subreddit}`,
      title: c.data.title,
      url: canonical,
      author: c.data.author,
      publishedAt: new Date(c.data.created_utc * 1000).toISOString(),
      fetchedAt: now,
      summary: (c.data.selftext ?? '').slice(0, 1200),
      rawScore: c.data.score,
      tags: matchKeywords(text),
    };
  });
}
