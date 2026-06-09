import { config } from './config.js';
import { logger } from './logger.js';
import { runAll } from './pipeline/run.js';

export async function serve(): Promise<void> {
  const mod = await import('node-cron').catch(() => null);
  if (!mod) {
    logger.error('node-cron is not installed. `pnpm add node-cron` and retry.');
    process.exit(1);
  }
  logger.info({ cron: config.cronExpr }, 'scheduler starting');
  // Single-flight: if a run (slow LLM council) outlasts the cron interval,
  // skip the tick rather than overlapping read-modify-write of the seen-store.
  let running = false;
  mod.default.schedule(config.cronExpr, async () => {
    if (running) {
      logger.warn('previous scheduled run still in progress; skipping this tick');
      return;
    }
    running = true;
    // try/finally (not .finally on the promise) so a synchronous throw out of
    // runAll() cannot leave the flag stuck and wedge the scheduler for good.
    try {
      await runAll();
    } catch (err) {
      logger.error({ err: String(err) }, 'scheduled run failed');
    } finally {
      running = false;
    }
  });
  await new Promise<void>(() => {
    /* keep alive */
  });
}
