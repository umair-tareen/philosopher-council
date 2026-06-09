import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-5'),
  OPENAI_API_KEY: z.string().optional(),
  // Optional: lets the clerk brief the bench with web research before deliberation.
  TAVILY_API_KEY: z.string().optional(),
  // Any OpenAI-compatible endpoint: OpenRouter, LM Studio, Groq, llamafile, vLLM...
  OPENAI_BASE_URL: z.string().default('https://api.openai.com/v1'),
  GEMINI_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  // Default model spec for every council call: "provider:model".
  // Falls back to anthropic:<ANTHROPIC_MODEL> when unset.
  DEFAULT_MODEL: z.string().default(''),
  // Per-seat overrides, e.g. "laotzu=ollama:llama3.1,kant=openai:gpt-4o,ralph=anthropic:claude-haiku-4-5-20251001"
  COUNCIL_MODELS: z.string().default(''),
  // Per-source ranking weights, e.g. "arxiv=1.2,reddit=0.9,hn=1.0"
  SOURCE_WEIGHTS: z.string().default('arxiv=1.2,hn=1.0,reddit=1.0'),
  // Comma-separated judge model specs for pnpm eval (blind judging).
  EVAL_JUDGES: z
    .string()
    .default('anthropic:claude-sonnet-4-5,anthropic:claude-haiku-4-5-20251001'),
  // How many philosopher seats deliberate concurrently (1 = sequential).
  COUNCIL_CONCURRENCY: z.coerce.number().int().min(1).max(11).default(4),
  CRON_EXPR: z.string().default('0 */6 * * *'),
  SOURCES_REDDIT: z.string().default('LocalLLaMA,MachineLearning,singularity'),
  MAX_ITEMS_PER_RUN: z.coerce.number().int().positive().default(10),
  DRY_RUN: z.coerce.number().int().min(0).max(1).default(0),
  DATA_DIR: z.string().default('./data'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = schema.parse(process.env);

function parsePairs(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of raw.split(',')) {
    const trimmed = pair.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const id = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (id && value) out[id] = value;
  }
  return out;
}

function parseSourceWeights(raw: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [source, value] of Object.entries(parsePairs(raw))) {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0) out[source] = n;
  }
  return out;
}

export const config = {
  anthropicApiKey: parsed.ANTHROPIC_API_KEY,
  anthropicModel: parsed.ANTHROPIC_MODEL,
  openaiApiKey: parsed.OPENAI_API_KEY,
  tavilyApiKey: parsed.TAVILY_API_KEY,
  openaiBaseUrl: parsed.OPENAI_BASE_URL.replace(/\/$/, ''),
  geminiApiKey: parsed.GEMINI_API_KEY,
  ollamaBaseUrl: parsed.OLLAMA_BASE_URL,
  defaultModel: parsed.DEFAULT_MODEL || `anthropic:${parsed.ANTHROPIC_MODEL}`,
  councilModels: parsePairs(parsed.COUNCIL_MODELS),
  sourceWeights: parseSourceWeights(parsed.SOURCE_WEIGHTS),
  evalJudges: parsed.EVAL_JUDGES.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  councilConcurrency: parsed.COUNCIL_CONCURRENCY,
  cronExpr: parsed.CRON_EXPR,
  redditSubs: parsed.SOURCES_REDDIT.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  maxItemsPerRun: parsed.MAX_ITEMS_PER_RUN,
  dryRun: parsed.DRY_RUN === 1,
  dataDir: parsed.DATA_DIR,
  logLevel: parsed.LOG_LEVEL,
} as const;

export type Config = typeof config;
