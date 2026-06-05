#!/usr/bin/env node
import { Command } from 'commander';
import { runAnalyze } from './pipeline/analyze.js';
import { runAsk } from './pipeline/ask.js';
import { runDigest } from './pipeline/digest.js';
import { runFetch } from './pipeline/fetch.js';
import { runAll } from './pipeline/run.js';
import { serve } from './scheduler.js';
import { logger } from './logger.js';

const program = new Command();
program
  .name('philosopher-council')
  .description(
    'Eleven-philosopher LLM council — ask it questions, or point it at AI-research trends',
  );

program
  .command('ask')
  .description('put a question directly to the council')
  .argument('<question...>', 'the question to deliberate on')
  .option('--full-council', 'use all 10 deliberators (vs quorum of 4)')
  .option('--context <text>', 'optional extra context for the council')
  .option(
    '--mode <mode>',
    'debate format: deliberation | socratic | oxford | delphi | auto (Method Advisor picks)',
    'deliberation',
  )
  .action(async (words: string[], opts) => {
    const question = words.join(' ');
    let debateMode = opts.mode as string;
    if (debateMode === 'auto') {
      const { adviseMode } = await import('./council/modes.js');
      const advice = await adviseMode(question);
      debateMode = advice.mode;
      console.log(`Method Advisor: ${advice.mode} - ${advice.reason}`);
    }
    const { DEBATE_MODES } = await import('./council/modes.js');
    if (!(debateMode in DEBATE_MODES)) {
      console.error(`Unknown mode "${debateMode}". Valid: ${Object.keys(DEBATE_MODES).join(', ')}, auto`);
      process.exit(1);
    }
    const { markdown, file } = await runAsk({
      question,
      context: opts.context,
      fullCouncil: !!opts.fullCouncil,
      debateMode: debateMode as import('./council/modes.js').DebateModeId,
    });
    console.log(`\n${markdown}`);
    console.log(`Saved to ${file}`);
  });

program
  .command('fetch')
  .option('--offline', 'use fixture items instead of live sources')
  .action(async (opts) => {
    await runFetch({ offline: !!opts.offline });
  });

program.command('analyze')
  .option('--full-council', 'use all 10 deliberators (vs quorum of 4)')
  .action(async (opts) => {
    await runAnalyze({ fullCouncil: !!opts.fullCouncil });
  });

program.command('digest').action(async () => {
  await runDigest();
});

program
  .command('run')
  .option('--offline', 'use fixture items instead of live sources')
  .option('--full-council', 'use all 10 deliberators (vs quorum of 4)')
  .action(async (opts) => {
    await runAll({ offline: !!opts.offline, fullCouncil: !!opts.fullCouncil });
  });

program
  .command('eval')
  .description('blind-judged comparison: single answer vs generic debate vs philosopher council')
  .argument('[questions...]', 'a question to evaluate (defaults to the built-in set)')
  .option('--full-council', 'council strategy uses all 10 deliberators')
  .option('-n, --limit <count>', 'limit number of questions', parseInt)
  .option('--file <path>', 'JSON file with a {questions: string[]} benchmark set')
  .option('--concurrency <count>', 'questions evaluated in parallel', parseInt)
  .action(async (words: string[], opts) => {
    const { runEval, DEFAULT_QUESTIONS } = await import('./pipeline/eval.js');
    let questions: string[];
    if (words.length) {
      questions = [words.join(' ')];
    } else if (opts.file) {
      const { readFile } = await import('node:fs/promises');
      const parsed = JSON.parse(await readFile(opts.file, 'utf-8')) as {
        questions: string[];
      };
      questions = parsed.questions;
    } else {
      questions = DEFAULT_QUESTIONS;
    }
    if (opts.limit) questions = questions.slice(0, opts.limit);
    const report = await runEval({
      questions,
      fullCouncil: !!opts.fullCouncil,
      concurrency: opts.concurrency,
    });
    console.log(`\nOverall (mean blind-judge score):`);
    for (const [s, v] of Object.entries(report.overall)) {
      console.log(
        `  ${s.padEnd(8)} ${v.toFixed(3)}  (wins: ${report.wins[s as keyof typeof report.wins]}/${report.results.length})`,
      );
    }
    console.log(`\nReport saved to ${report.file}`);
  });

program
  .command('ui')
  .description('serve the council chamber web UI')
  .option('-p, --port <port>', 'port to listen on', parseInt)
  .action(async (opts) => {
    const { serveUi } = await import('./ui/server.js');
    await serveUi(opts.port || 4173);
  });

program.command('serve').action(async () => {
  await serve();
});

program.parseAsync(process.argv).catch((err) => {
  logger.error({ err: String(err) }, 'cli error');
  process.exit(1);
});
