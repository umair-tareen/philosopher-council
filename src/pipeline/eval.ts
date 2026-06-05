import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { complete, extractJson } from '../council/client.js';
import { runCouncil } from '../council/council.js';
import { logger } from '../logger.js';
import type { CouncilMode, TrendItem } from '../types.js';

export type StrategyId = 'single' | 'debate' | 'council';

export const DEFAULT_QUESTIONS = [
  'Is chain-of-thought prompting genuine reasoning or sophisticated imitation?',
  'Should agentic AI systems be allowed to spend money autonomously?',
  'Will fine-tuned small models displace frontier-model API calls for most production use cases?',
  'Is synthetic training data a dead end or the future of model improvement?',
  'Does interpretability research actually make AI systems safer?',
];

const RUBRIC_AXES = ['insight', 'rigor', 'blindspots', 'actionability'] as const;
type RubricAxis = (typeof RUBRIC_AXES)[number];

interface StrategyAnswer {
  strategy: StrategyId;
  answer: string;
  calls: number;
}

interface JudgeScores {
  scores: Record<string, Record<RubricAxis, number>>;
  ranking: string[];
  rationale: string;
}

export interface EvalResult {
  question: string;
  answers: StrategyAnswer[];
  /** strategy -> mean rubric score in [0,1] */
  meanScores: Record<StrategyId, number>;
  /** strategy -> rank (1 = best) */
  ranks: Record<StrategyId, number>;
  rationale: string;
}

export interface EvalReport {
  results: EvalResult[];
  /** strategy -> mean of per-question mean scores */
  overall: Record<StrategyId, number>;
  /** strategy -> count of rank-1 finishes */
  wins: Record<StrategyId, number>;
  judgeModel: string;
  file: string;
}

// --- strategies -----------------------------------------------------------

async function runSingle(question: string): Promise<StrategyAnswer> {
  const { text } = await complete({
    system:
      'You are a careful analyst. Answer the question in 200-300 words: state your position, the strongest reasons for it, the strongest objection to it, and what evidence would change your mind.',
    user: question,
    maxTokens: 600,
  });
  return { strategy: 'single', answer: text.trim(), calls: 1 };
}

async function runDebate(question: string): Promise<StrategyAnswer> {
  const advocate = await complete({
    system:
      'You are the Advocate in a structured debate. Make the strongest possible case FOR the proposition implied by the question, in 150 words.',
    user: question,
    maxTokens: 400,
  });
  const critic = await complete({
    system:
      'You are the Critic in a structured debate. Attack the following argument: find its weakest premises and counter them, in 150 words.',
    user: `Question: ${question}\n\nAdvocate's argument:\n${advocate.text}`,
    maxTokens: 400,
  });
  const judge = await complete({
    system:
      'You are the Judge in a structured debate. Read both sides and deliver a balanced verdict in 200-300 words: who argued better, what the truth most likely is, and what remains uncertain.',
    user: `Question: ${question}\n\nAdvocate:\n${advocate.text}\n\nCritic:\n${critic.text}`,
    maxTokens: 600,
  });
  return { strategy: 'debate', answer: judge.text.trim(), calls: 3 };
}

async function runCouncilStrategy(
  question: string,
  mode: CouncilMode,
): Promise<StrategyAnswer> {
  const now = new Date().toISOString();
  const item: TrendItem = {
    id: createHash('sha1').update(question).digest('hex').slice(0, 10),
    source: 'question',
    title: question,
    url: 'n/a',
    publishedAt: now,
    fetchedAt: now,
    tags: [],
  };
  const verdict = await runCouncil(item, mode);
  const parts = [
    verdict.synthesis.unifyingReading,
    verdict.synthesis.hiddenContinuity,
    `Caution: ${verdict.synthesis.mysticalCaution}`,
  ];
  const last = verdict.ralph[verdict.ralph.length - 1];
  if (last) parts.push(`On reflection: ${last.refinedVerdict}`);
  const calls =
    verdict.opinions.length + 1 /* synthesizer */ + verdict.ralph.length;
  return { strategy: 'council', answer: parts.join('\n\n').trim(), calls };
}

// --- blind judging --------------------------------------------------------

/** Deterministic per-question shuffle so reruns are reproducible. */
function shuffledLabels(question: string, n: number): number[] {
  const seedHex = createHash('sha1').update(question).digest('hex');
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = parseInt(seedHex.slice((i * 2) % 32, ((i * 2) % 32) + 4), 16) % (i + 1);
    const a = order[i] as number;
    order[i] = order[j] as number;
    order[j] = a;
  }
  return order;
}

const JUDGE_SYSTEM = `You are a blind judge of answer quality. You receive a question and several anonymous answers labeled A, B, C, ...
Score each answer on four axes in [0, 1]:
- insight: does it say something non-obvious and true?
- rigor: are claims supported, qualified, and internally consistent?
- blindspots: does it surface considerations a naive answer would miss?
- actionability: does it tell the reader what would change the conclusion?

You MUST respond with a single JSON object and nothing else:
{
  "scores": { "A": { "insight": n, "rigor": n, "blindspots": n, "actionability": n }, ... },
  "ranking": ["B", "A", ...],   // best first
  "rationale": string           // 2-4 sentences
}`;

async function judgeAnswers(
  question: string,
  answers: StrategyAnswer[],
): Promise<{ judged: JudgeScores; labelToStrategy: Record<string, StrategyId> }> {
  const order = shuffledLabels(question, answers.length);
  const labels = ['A', 'B', 'C', 'D', 'E'];
  const labelToStrategy: Record<string, StrategyId> = {};
  const blocks: string[] = [];
  order.forEach((answerIdx, pos) => {
    const label = labels[pos] as string;
    const a = answers[answerIdx] as StrategyAnswer;
    labelToStrategy[label] = a.strategy;
    blocks.push(`### Answer ${label}\n${a.answer}`);
  });
  const { text } = await complete({
    system: JUDGE_SYSTEM,
    user: `Question: ${question}\n\n${blocks.join('\n\n')}`,
    maxTokens: 800,
    model: config.councilModels['judge'],
  });
  return { judged: extractJson<JudgeScores>(text), labelToStrategy };
}

// --- harness --------------------------------------------------------------

export interface EvalOptions {
  questions?: string[];
  fullCouncil?: boolean;
}

export async function runEval(opts: EvalOptions = {}): Promise<EvalReport> {
  const questions = opts.questions?.length ? opts.questions : DEFAULT_QUESTIONS;
  const results: EvalResult[] = [];

  for (const question of questions) {
    logger.info({ question }, 'eval question start');
    const answers: StrategyAnswer[] = [
      await runSingle(question),
      await runDebate(question),
      await runCouncilStrategy(question, opts.fullCouncil ? 'full' : 'quorum'),
    ];
    const { judged, labelToStrategy } = await judgeAnswers(question, answers);

    const meanScores = {} as Record<StrategyId, number>;
    for (const [label, axes] of Object.entries(judged.scores)) {
      const strategy = labelToStrategy[label];
      if (!strategy) continue;
      const vals = RUBRIC_AXES.map((ax) => clamp01(Number(axes?.[ax] ?? 0.5)));
      meanScores[strategy] = vals.reduce((s, v) => s + v, 0) / vals.length;
    }
    const ranks = {} as Record<StrategyId, number>;
    judged.ranking.forEach((label, i) => {
      const strategy = labelToStrategy[label];
      if (strategy) ranks[strategy] = i + 1;
    });

    results.push({
      question,
      answers,
      meanScores,
      ranks,
      rationale: judged.rationale ?? '',
    });
  }

  const strategies: StrategyId[] = ['single', 'debate', 'council'];
  const overall = {} as Record<StrategyId, number>;
  const wins = {} as Record<StrategyId, number>;
  for (const s of strategies) {
    const scores = results.map((r) => r.meanScores[s]).filter((n) => Number.isFinite(n));
    overall[s] = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    wins[s] = results.filter((r) => r.ranks[s] === 1).length;
  }

  const judgeModel = config.councilModels['judge'] ?? config.defaultModel;
  const markdown = renderReport(results, overall, wins, judgeModel);
  const dir = path.join(config.dataDir, 'evals');
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${new Date().toISOString().slice(0, 10)}.md`);
  await writeFile(file, markdown);
  logger.info({ file }, 'eval report written');

  return { results, overall, wins, judgeModel, file };
}

export function renderReport(
  results: EvalResult[],
  overall: Record<StrategyId, number>,
  wins: Record<StrategyId, number>,
  judgeModel: string,
): string {
  const lines: string[] = [];
  lines.push('# Eval: single answer vs generic debate vs philosopher council');
  lines.push('');
  lines.push(
    `Blind-judged by \`${judgeModel}\` on insight, rigor, blind-spot coverage, and actionability. Answers were anonymized and shuffled per question. N=${results.length}.`,
  );
  lines.push('');
  lines.push('| Strategy | Mean score | Wins (rank 1) | Calls per question |');
  lines.push('|----------|-----------|---------------|--------------------|');
  const callsFor = (s: StrategyId) =>
    results[0]?.answers.find((a) => a.strategy === s)?.calls ?? 0;
  for (const s of ['single', 'debate', 'council'] as StrategyId[]) {
    lines.push(
      `| ${s} | ${overall[s].toFixed(3)} | ${wins[s]}/${results.length} | ${callsFor(s)} |`,
    );
  }
  lines.push('');
  for (const r of results) {
    lines.push(`## ${r.question}`);
    lines.push('');
    for (const s of ['single', 'debate', 'council'] as StrategyId[]) {
      const score = r.meanScores[s];
      lines.push(
        `- **${s}** - score ${Number.isFinite(score) ? score.toFixed(3) : 'n/a'}, rank ${r.ranks[s] ?? 'n/a'}`,
      );
    }
    lines.push('');
    lines.push(`> Judge rationale: ${r.rationale}`);
    lines.push('');
  }
  lines.push('---');
  lines.push('');
  lines.push(
    '**Caveats.** Single-judge evaluation by an LLM shares biases with the systems under test; small N; the council answer is a synthesis of more raw tokens than the single answer. Treat this as a directional signal, not a benchmark.',
  );
  lines.push('');
  return lines.join('\n');
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}
