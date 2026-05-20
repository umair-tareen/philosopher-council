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
  mod.default.schedule(config.cronExpr, () => {
    runAll().catch((err) => logger.error({ err: String(err) }, 'scheduled run failed'));
  });
  await new Promise<void>(() => {
    /* keep alive */
  });
}
