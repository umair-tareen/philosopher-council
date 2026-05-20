import { loadTodaysVerdicts, writeDigest } from '../store/fs.js';
import { logger } from '../logger.js';
import type { CouncilVerdict, TrendItem } from '../types.js';

export async function runDigest(): Promise<string> {
  const entries = await loadTodaysVerdicts();
  entries.sort((a, b) => b.verdict.finalScore - a.verdict.finalScore);

  const day = new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    `# Daily AI-Trends Digest — ${day}`,
    '',
    `Council mode mix: ${countModes(entries)}`,
    `Items reviewed: ${entries.length}`,
    '',
    '## Recommendations',
    '',
  ];

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
    .map((o) => `  - ${o.displayName} (${o.branch}, ${o.verdictScore.toFixed(2)}): ${o.oneLiner}`)
    .join('\n');
  return [
    `- **[${score}] ${item.title}** — _${item.source}${item.subSource ? ` · ${item.subSource}` : ''}_`,
    `  - ${item.url}`,
    `  - Tags: ${tags}`,
    `  - Council (${v.mode}):`,
    opinions,
    `  - Synthesis (Ibn ʿArabī, ${v.synthesis.unifiedScore.toFixed(2)}): ${v.synthesis.unifyingReading}`,
    `  - Mystical caution: ${v.synthesis.mysticalCaution}`,
    `  - Ralph loop:`,
    ralphSummary,
    '',
  ].join('\n');
}
