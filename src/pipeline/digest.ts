import { complete } from '../council/client.js';
import { logger } from '../logger.js';
import { loadTodaysVerdicts, writeDigest } from '../store/fs.js';
import type { CouncilVerdict, TrendItem } from '../types.js';

type Entry = { item: TrendItem; verdict: CouncilVerdict };

export async function runDigest(): Promise<string> {
  const entries = await loadTodaysVerdicts();
  entries.sort((a, b) => b.verdict.finalScore - a.verdict.finalScore);

  const day = new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    `# Daily AI-Trends Digest - ${day}`,
    '',
    `Council mode mix: ${countModes(entries)}`,
    `Items reviewed: ${entries.length}`,
    '',
  ];

  const whyNow = await buildWhyNow(entries);
  if (whyNow) {
    lines.push('## Why now', '', whyNow, '');
  }

  const clusters = clusterByTags(entries);
  if (clusters.length > 1) {
    lines.push('## Clusters', '');
    for (const c of clusters) {
      lines.push(
        `- **${c.signature}** (${c.entries.length}): ${c.entries.map((e) => e.item.title).join(' · ')}`,
      );
    }
    lines.push('');
  }

  lines.push('## Recommendations', '');

  const buckets: Record<'amplify' | 'track' | 'ignore', typeof entries> = {
    amplify: [],
    track: [],
    ignore: [],
  };
  for (const e of entries) buckets[e.verdict.finalRecommendation].push(e);

  for (const key of ['amplify', 'track', 'ignore'] as const) {
    lines.push(`### ${key.toUpperCase()} (${buckets[key].length})`, '');
    for (const e of buckets[key]) lines.push(renderEntry(e.item, e.verdict));
    lines.push('');
  }

  const md = lines.join('\n');
  const file = await writeDigest(md);
  logger.info({ file }, 'digest written');
  return file;
}

interface Cluster {
  signature: string;
  entries: Entry[];
}

/** Group entries that share at least one tag (union-find over tag overlap). */
export function clusterByTags(entries: Entry[]): Cluster[] {
  const parent = entries.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i] as number] as number;
      i = parent[i] as number;
    }
    return i;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const tagsI = entries[i]?.item.tags ?? [];
      const tagsJ = new Set(entries[j]?.item.tags ?? []);
      if (tagsI.some((t) => tagsJ.has(t))) union(i, j);
    }
  }
  const groups = new Map<number, Entry[]>();
  entries.forEach((e, i) => {
    const root = find(i);
    const list = groups.get(root) ?? [];
    list.push(e);
    groups.set(root, list);
  });
  return [...groups.values()]
    .map((group) => {
      const tagCounts = new Map<string, number>();
      for (const e of group)
        for (const t of e.item.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
      const signature =
        [...tagCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([t]) => t)
          .join(' + ') || 'untagged';
      return { signature, entries: group };
    })
    .sort((a, b) => b.entries.length - a.entries.length);
}

/** One LLM call: why does today's batch matter right now? */
async function buildWhyNow(entries: Entry[]): Promise<string | null> {
  if (entries.length === 0) return null;
  try {
    const summary = entries
      .slice(0, 12)
      .map(
        (e) =>
          `- [${e.verdict.finalScore.toFixed(2)}/${e.verdict.finalRecommendation}] ${e.item.title} (novelty ${e.item.novelty?.toFixed(2) ?? 'n/a'})`,
      )
      .join('\n');
    const { text } = await complete({
      system:
        'You write the "why now" paragraph of a daily AI-research digest. Given today\'s council-scored items, explain in 3-5 sentences what connects them and why this batch matters this week specifically. Be concrete; no hype. Plain text, no JSON.',
      user: summary,
      maxTokens: 400,
    });
    return text.trim() || null;
  } catch (err) {
    logger.warn({ err: String(err) }, 'why-now generation failed; omitting section');
    return null;
  }
}

function countModes(entries: Array<{ verdict: CouncilVerdict }>): string {
  let q = 0;
  let f = 0;
  for (const e of entries) {
    if (e.verdict.mode === 'quorum') q++;
    else f++;
  }
  return `quorum=${q}, full=${f}`;
}

function renderEntry(item: TrendItem, v: CouncilVerdict): string {
  const score = v.finalScore.toFixed(2);
  const tags = item.tags.join(', ') || '—';
  const ralphSummary =
    v.ralph.length === 0
      ? '_no critique needed_'
      : v.ralph
          .map(
            (c) =>
              `  - iter ${c.iteration} (score → ${c.refinedScore.toFixed(2)}): ${c.weaknesses.join(' · ')}`,
          )
          .join('\n');
  const opinions = v.opinions
    .map(
      (o) => `  - ${o.displayName} (${o.branch}, ${o.verdictScore.toFixed(2)}): ${o.oneLiner}`,
    )
    .join('\n');
  return [
    `- **[${score}] ${item.title}** - _${item.source}${item.subSource ? ` · ${item.subSource}` : ''}_`,
    `  - ${item.url}`,
    `  - Tags: ${tags}${item.novelty !== undefined ? ` · novelty ${item.novelty.toFixed(2)}` : ''}`,
    `  - Council (${v.mode}):`,
    opinions,
    `  - Synthesis (Ibn ʿArabī, ${v.synthesis.unifiedScore.toFixed(2)}): ${v.synthesis.unifyingReading}`,
    v.minority?.dissenter
      ? `  - Dissent (disagreement ${v.minority.disagreement.toFixed(2)}): ${v.minority.dissenter.displayName} - ${v.minority.dissenter.oneLiner}`
      : `  - Dissent: none recorded`,
    `  - Mystical caution: ${v.synthesis.mysticalCaution}`,
    `  - Ralph loop:`,
    ralphSummary,
    '',
  ].join('\n');
}
