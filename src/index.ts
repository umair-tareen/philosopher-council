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

program.command('serve').action(async () => {
  await serve();
});

program.parseAsync(process.argv).catch((err) => {
  logger.error({ err: String(err) }, 'cli error');
  process.exit(1);
});
