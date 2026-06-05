import { config } from '../config.js';
import { logger } from '../logger.js';

/**
 * The clerk briefs the bench: an optional pre-deliberation web search so the
 * council can reason about events newer than its training data. Enabled when
 * TAVILY_API_KEY is set; silently skipped otherwise.
 */

interface TavilyResult {
  title?: string;
  url?: string;
  content?: string;
}

interface TavilyResponse {
  answer?: string;
  results?: TavilyResult[];
}

export async function clerkBrief(
  question: string,
  signal?: AbortSignal,
): Promise<string | null> {
  if (!config.tavilyApiKey) return null;
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        api_key: config.tavilyApiKey,
        query: question,
        max_results: 5,
        include_answer: true,
        search_depth: 'basic',
      }),
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, 'clerk search failed; deliberating without brief');
      return null;
    }
    const data = (await res.json()) as TavilyResponse;
    const parts: string[] = [];
    if (data.answer) parts.push(data.answer.trim());
    for (const r of (data.results ?? []).slice(0, 3)) {
      if (!r.content) continue;
      parts.push(`- ${r.title ?? 'source'}: ${r.content.slice(0, 240)} (${r.url ?? ''})`);
    }
    if (!parts.length) return null;
    return `Clerk's brief (web research as of ${new Date().toISOString().slice(0, 10)}; treat as context, verify load-bearing claims):\n${parts.join('\n')}`;
  } catch (err) {
    if (signal?.aborted) throw err;
    logger.warn({ err: String(err) }, 'clerk search errored; deliberating without brief');
    return null;
  }
}
