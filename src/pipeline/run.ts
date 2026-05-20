import { logger } from '../logger.js';
import { runAnalyze } from './analyze.js';
import { runDigest } from './digest.js';
import { runFetch } from './fetch.js';

interface RunOptions {
  offline?: boolean;
  fullCouncil?: boolean;
}

export async function runAll(opts: RunOptions = {}): Promise<void> {
  logger.info({ opts }, 'pipeline start');
  const items = await runFetch({ offline: opts.offline });
  logger.info({ count: items.length }, 'fetch stage complete');
  const verdicts = await runAnalyze({ fullCouncil: opts.fullCouncil });
  logger.info({ count: verdicts.length }, 'analyze stage complete');
  const digestFile = await runDigest();
  logger.info({ digestFile }, 'pipeline complete');
}
