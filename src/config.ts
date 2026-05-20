import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-5'),
  CRON_EXPR: z.string().default('0 */6 * * *'),
  SOURCES_REDDIT: z
    .string()
    .default('LocalLLaMA,MachineLearning,singularity'),
  MAX_ITEMS_PER_RUN: z.coerce.number().int().positive().default(10),
  DRY_RUN: z.coerce.number().int().min(0).max(1).default(0),
  DATA_DIR: z.string().default('./data'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
});

const parsed = schema.parse(process.env);

export const config = {
  anthropicApiKey: parsed.ANTHROPIC_API_KEY,
  anthropicModel: parsed.ANTHROPIC_MODEL,
  cronExpr: parsed.CRON_EXPR,
  redditSubs: parsed.SOURCES_REDDIT.split(',').map((s) => s.trim()).filter(Boolean),
  maxItemsPerRun: parsed.MAX_ITEMS_PER_RUN,
  dryRun: parsed.DRY_RUN === 1,
  dataDir: parsed.DATA_DIR,
  logLevel: parsed.LOG_LEVEL,
} as const;

export type Config = typeof config;
