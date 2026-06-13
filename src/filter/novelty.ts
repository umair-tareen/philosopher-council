import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { writeFileAtomic } from '../store/atomic.js';
import type { TrendItem } from '../types.js';

const TITLES_PATH = () => path.join(config.dataDir, '.titles.json');
const MAX_CORPUS = 500;

const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'of',
  'for',
  'on',
  'in',
  'to',
  'with',
  'and',
  'or',
  'is',
  'are',
  'was',
  'be',
  'has',
  'have',
  'how',
  'why',
  'what',
  'via',
  'from',
  'by',
  'at',
  'its',
  'this',
  'that',
  'new',
  'using',
]);

export function tokenize(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/[\s-]+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t)),
  );
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

/**
 * Novelty in [0, 1]: 1 = nothing like it in the recent corpus,
 * 0 = a near-duplicate title has been seen before.
 */
export function noveltyFor(title: string, corpus: string[][]): number {
  const tokens = tokenize(title);
  let maxSim = 0;
  for (const past of corpus) {
    const sim = jaccard(tokens, new Set(past));
    if (sim > maxSim) maxSim = sim;
  }
  return 1 - maxSim;
}

export async function loadTitleCorpus(): Promise<string[][]> {
  const p = TITLES_PATH();
  if (!existsSync(p)) return [];
  try {
    return JSON.parse(await readFile(p, 'utf-8')) as string[][];
  } catch {
    return [];
  }
}

export async function saveTitleCorpus(
  corpus: string[][],
  newItems: TrendItem[],
): Promise<void> {
  const merged = [...corpus, ...newItems.map((i) => [...tokenize(i.title)])].slice(
    -MAX_CORPUS,
  );
  await writeFileAtomic(TITLES_PATH(), JSON.stringify(merged));
}
