import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { complete, extractJson } from '../council/client.js';
import { runCouncil } from '../council/council.js';
import { logger } from '../logger.js';
import type { CouncilMode, TrendItem } from '../types.js';
import { clamp01 } from '../util/num.js';

export type StrategyId = 'single' | 'debate' | 'council';

const STRATEGIES = ['single', 'debate', 'council'] as const satisfies readonly StrategyId[];

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
  judges: string[];
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
  // Spokesperson stage gives the direct answer; fall back to the synthesis
  // composition if it failed (the v1 behaviour that lost the first eval).
  const answer =
    verdict.answer ??
    [
      verdict.synthesis.unifyingReading,
      verdict.synthesis.hiddenContinuity,
      `Caution: ${verdict.synthesis.mysticalCaution}`,
    ]
      .join('\n\n')
      .trim();
  const calls =
    verdict.opinions.length +
    1 /* synthesizer */ +
    verdict.ralph.length +
    (verdict.answer ? 1 : 0);
  return { strategy: 'council', answer, calls };
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
): Promise<{
  judged: JudgeScores[];
  labelToStrategy: Record<string, StrategyId>;
  judges: string[];
}> {
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
  const judges = config.evalJudges.length ? config.evalJudges : [config.defaultModel];
  const judged: JudgeScores[] = [];
  for (const judge of judges) {
    const { text } = await complete({
      system: JUDGE_SYSTEM,
      user: `Question: ${question}\n\n${blocks.join('\n\n')}`,
      maxTokens: 800,
      model: judge,
    });
    judged.push(extractJson<JudgeScores>(text));
  }
  return { judged, labelToStrategy, judges };
}

// --- harness --------------------------------------------------------------

export interface EvalOptions {
  questions?: string[];
  fullCouncil?: boolean;
  /** How many questions to evaluate concurrently (default 3). */
  concurrency?: number;
}

async function evalOneQuestion(question: string, fullCouncil: boolean): Promise<EvalResult> {
  logger.info({ question }, 'eval question start');
  const answers: StrategyAnswer[] = [
    await runSingle(question),
    await runDebate(question),
    await runCouncilStrategy(question, fullCouncil ? 'full' : 'quorum'),
  ];
  const { judged, labelToStrategy } = await judgeAnswers(question, answers);

  // Average each label's axis scores across all judges, then map to strategy.
  // Every strategy starts at 0 so one a judge omits is ranked last, never
  // silently dropped from the competition (and thus never charged a loss).
  const meanScores = { single: 0, debate: 0, council: 0 } as Record<StrategyId, number>;
  for (const [label, strategy] of Object.entries(labelToStrategy)) {
    const perJudge: number[] = [];
    for (const j of judged) {
      const axes = j.scores?.[label];
      if (!axes) continue;
      const vals = RUBRIC_AXES.map((ax) => clamp01(Number(axes[ax] ?? 0.5)));
      perJudge.push(vals.reduce((s, v) => s + v, 0) / vals.length);
    }
    if (perJudge.length) {
      meanScores[strategy] = perJudge.reduce((a, b) => a + b, 0) / perJudge.length;
    }
  }

  // Competition ranking: tied scores share a rank (1, 1, 3), not arbitrary order.
  const ordered = (Object.entries(meanScores) as Array<[StrategyId, number]>).sort(
    (a, b) => b[1] - a[1],
  );
  const ranks = {} as Record<StrategyId, number>;
  ordered.forEach(([strategy, score], i) => {
    const prev = ordered[i - 1];
    ranks[strategy] = prev && prev[1] === score ? ranks[prev[0]]! : i + 1;
  });

  const rationale = judged.map((j, i) => `Judge ${i + 1}: ${j.rationale ?? ''}`).join(' | ');

  return { question, answers, meanScores, ranks, rationale };
}

export async function runEval(opts: EvalOptions = {}): Promise<EvalReport> {
  const questions = opts.questions?.length ? opts.questions : DEFAULT_QUESTIONS;
  const concurrency = Math.max(1, opts.concurrency ?? 3);
  const results: EvalResult[] = new Array(questions.length);

  let next = 0;
  async function worker(): Promise<void> {
    for (;;) {
      const i = next++;
      if (i >= questions.length) return;
      results[i] = await evalOneQuestion(questions[i] as string, !!opts.fullCouncil);
      logger.info({ done: i + 1, total: questions.length }, 'eval progress');
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, questions.length) }, () => worker()),
  );

  const overall = {} as Record<StrategyId, number>;
  const wins = {} as Record<StrategyId, number>;
  for (const s of STRATEGIES) {
    const scores = results.map((r) => r.meanScores[s]).filter((n) => Number.isFinite(n));
    overall[s] = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    // Rank-1 ties all count as wins, so the wins column sums consistently.
    wins[s] = results.filter((r) => r.ranks[s] === 1).length;
  }

  const judges = config.evalJudges.length ? config.evalJudges : [config.defaultModel];
  const markdown = renderReport(results, overall, wins, judges);
  const dir = path.join(config.dataDir, 'evals');
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${new Date().toISOString().slice(0, 10)}.md`);
  await writeFile(file, markdown);
  logger.info({ file }, 'eval report written');

  return { results, overall, wins, judges, file };
}

export function renderReport(
  results: EvalResult[],
  overall: Record<StrategyId, number>,
  wins: Record<StrategyId, number>,
  judges: string[],
): string {
  const lines: string[] = [];
  lines.push('# Eval: single answer vs generic debate vs philosopher council');
  lines.push('');
  lines.push(
    `Blind-judged by ${judges.map((j) => `\`${j}\``).join(' + ')} on insight, rigor, blind-spot coverage, and actionability. Scores are averaged across judges; ranks derive from the averaged scores. Answers were anonymized and shuffled per question. N=${results.length}.`,
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
    lines.push(`> ${r.rationale}`);
    lines.push('');
  }
  lines.push('---');
  lines.push('');
  lines.push(
    `**Caveats.** LLM judges share biases with the systems under test (all judges here are same-family models); the council answer is distilled from more raw tokens than the single answer; question set is fixed and public (evals/questions.json), so treat cross-version comparisons as the meaningful signal. ${judges.length} judge(s), N=${results.length}.`,
  );
  lines.push('');
  return lines.join('\n');
}
