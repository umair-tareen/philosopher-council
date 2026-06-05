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
  .action(async (words: string[], opts) => {
    const { markdown, file } = await runAsk({
      question: words.join(' '),
      context: opts.context,
      fullCouncil: !!opts.fullCouncil,
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
  .option('-n, --limit <count>', 'limit number of default questions', parseInt)
  .action(async (words: string[], opts) => {
    const { runEval, DEFAULT_QUESTIONS } = await import('./pipeline/eval.js');
    const questions = words.length
      ? [words.join(' ')]
      : DEFAULT_QUESTIONS.slice(0, opts.limit || DEFAULT_QUESTIONS.length);
    const report = await runEval({ questions, fullCouncil: !!opts.fullCouncil });
    console.log(`\nOverall (mean blind-judge score):`);
    for (const [s, v] of Object.entries(report.overall)) {
      console.log(
        `  ${s.padEnd(8)} ${v.toFixed(3)}  (wins: ${report.wins[s as keyof typeof report.wins]}/${report.results.length})`,
      );
    }
    console.log(`\nReport saved to ${report.file}`);
  });

program.command('serve').action(async () => {
  await serve();
});

program.parseAsync(process.argv).catch((err) => {
  logger.error({ err: String(err) }, 'cli error');
  process.exit(1);
});
