import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import { fetchAll } from '../fetchers/index.js';
import { loadTitleCorpus, noveltyFor, saveTitleCorpus } from '../filter/novelty.js';
import { rankByScore } from '../filter/score.js';
import { logger } from '../logger.js';
import { saveItem } from '../store/fs.js';
import { loadSeen, saveSeen } from '../store/seen.js';
import type { TrendItem } from '../types.js';

interface FetchOptions {
  offline?: boolean;
}

export async function runFetch(opts: FetchOptions = {}): Promise<TrendItem[]> {
  const items = opts.offline ? await loadFixtureItems() : await fetchAll();
  const tagged = items.filter((i) => i.tags.length > 0);

  // Novelty: compare each title against the recent corpus before ranking.
  const corpus = await loadTitleCorpus();
  for (const item of tagged) item.novelty = noveltyFor(item.title, corpus);

  const ranked = rankByScore(tagged);

  const seen = await loadSeen();
  const fresh = ranked.filter((i) => !seen.has(i.id));
  const limited = fresh.slice(0, config.maxItemsPerRun);

  for (const item of limited) {
    await saveItem(item);
    seen.add(item.id);
  }
  await saveSeen(seen);
  await saveTitleCorpus(corpus, limited);

  logger.info(
    {
      fetched: items.length,
      tagged: tagged.length,
      fresh: fresh.length,
      saved: limited.length,
    },
    'fetch complete',
  );
  return limited;
}

async function loadFixtureItems(): Promise<TrendItem[]> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const p = path.resolve(here, '..', 'mock', 'fixtures.json');
  const buf = await readFile(p, 'utf-8');
  const parsed = JSON.parse(buf) as { items: TrendItem[] };
  return parsed.items;
}
