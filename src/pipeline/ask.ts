import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { runCouncil, type CouncilHooks } from '../council/council.js';
import type { DebateModeId } from '../council/modes.js';
import { logger } from '../logger.js';
import { slugify } from '../store/fs.js';
import type { CouncilMode, CouncilVerdict, TrendItem } from '../types.js';

export interface AskOptions {
  question: string;
  context?: string;
  fullCouncil?: boolean;
  /** Named debate format; defaults to open deliberation. */
  debateMode?: DebateModeId;
  /** Optional live-progress hooks (used by the council chamber UI). */
  hooks?: CouncilHooks;
  /** Aborts the deliberation (e.g. when the requesting client disconnects). */
  signal?: AbortSignal;
}

export interface AskResult {
  verdict: CouncilVerdict;
  markdown: string;
  file: string;
}

export async function runAsk(opts: AskOptions): Promise<AskResult> {
  const now = new Date().toISOString();
  const id = createHash('sha1').update(opts.question).digest('hex').slice(0, 10);
  const item: TrendItem = {
    id,
    source: 'question',
    title: opts.question,
    url: 'n/a',
    publishedAt: now,
    fetchedAt: now,
    summary: opts.context,
    tags: [],
  };

  const mode: CouncilMode = opts.fullCouncil ? 'full' : 'quorum';
  const verdict = await runCouncil(
    item,
    mode,
    opts.hooks ?? {},
    opts.debateMode ?? 'deliberation',
    opts.signal,
  );
  const markdown = renderAnswer(opts.question, verdict);

  const dir = path.join(config.dataDir, 'asks');
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${now.slice(0, 10)}-${slugify(opts.question) || id}.md`);
  await writeFile(file, markdown);
  logger.info({ file, mode, seats: verdict.opinions.length }, 'ask answered');

  return { verdict, markdown, file };
}

function bar(score: number): string {
  const filled = Math.round(score * 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

export function renderAnswer(question: string, v: CouncilVerdict): string {
  const lines: string[] = [];
  lines.push(`# The council deliberates`);
  lines.push('');
  lines.push(`> **Question:** ${question}`);
  lines.push('');

  if (v.answer) {
    lines.push(`## The council's answer`);
    lines.push('');
    lines.push(v.answer);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  for (const o of v.opinions) {
    lines.push(`## ${o.displayName} _(${o.branch})_ - ${o.verdictScore.toFixed(2)}`);
    lines.push('');
    lines.push(`**${o.oneLiner}**`);
    lines.push('');
    lines.push(o.reasoning);
    lines.push('');
    lines.push(
      `| Wisdom | Courage | Justice | Temperance |`,
      `|--------|---------|---------|------------|`,
      `| ${bar(o.virtueScores.wisdom)} | ${bar(o.virtueScores.courage)} | ${bar(o.virtueScores.justice)} | ${bar(o.virtueScores.temperance)} |`,
    );
    if (o.concerns.length) {
      lines.push('');
      lines.push(`Concerns: ${o.concerns.join(' · ')}`);
    }
    lines.push('');
  }

  lines.push(`## Ibn ʿArabī - synthesis (${v.synthesis.unifiedScore.toFixed(2)})`);
  lines.push('');
  lines.push(`**Unifying reading.** ${v.synthesis.unifyingReading}`);
  lines.push('');
  lines.push(`**Hidden continuity.** ${v.synthesis.hiddenContinuity}`);
  lines.push('');
  lines.push(`**Caution.** ${v.synthesis.mysticalCaution}`);
  lines.push('');

  if (v.minority) {
    lines.push(`## Minority report`);
    lines.push('');
    lines.push(
      `Disagreement: **${v.minority.disagreement.toFixed(2)}**` +
        (v.minority.contestedVirtues.length
          ? ` · contested on: ${v.minority.contestedVirtues.join(', ')}`
          : ' · the council was broadly aligned'),
    );
    if (v.minority.dissenter) {
      const d = v.minority.dissenter;
      lines.push('');
      lines.push(
        `**${d.displayName}** dissented hardest (${d.verdictScore.toFixed(2)}, ${d.delta > 0 ? '+' : ''}${d.delta.toFixed(2)} vs synthesis): "${d.oneLiner}"`,
      );
      lines.push('');
      lines.push(`> ${d.reasoning}`);
    }
    lines.push('');
  }

  if (v.ralph.length) {
    const last = v.ralph[v.ralph.length - 1];
    if (last) {
      lines.push(`## Self-critique (Ralph loop, ${v.ralph.length} pass${v.ralph.length > 1 ? 'es' : ''})`);
      lines.push('');
      lines.push(last.refinedVerdict);
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('');
  lines.push(
    `**Final score:** ${v.finalScore.toFixed(2)} · **Recommendation:** ${v.finalRecommendation} · _model: ${v.model} · mode: ${v.mode}${v.debateMode && v.debateMode !== 'deliberation' ? ` · format: ${v.debateMode}` : ''}_`,
  );
  lines.push('');
  return lines.join('\n');
}
