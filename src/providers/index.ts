import { config } from '../config.js';
import { anthropicComplete } from './anthropic.js';
import { openAiCompatComplete } from './openai-compat.js';

export const PROVIDER_NAMES = ['anthropic', 'openai', 'gemini', 'ollama'] as const;
export type ProviderName = (typeof PROVIDER_NAMES)[number];

export interface ModelSpec {
  provider: ProviderName;
  model: string;
}

export interface ProviderRequest {
  system: string;
  user: string;
  maxTokens: number;
  model: string;
}

export interface ProviderResult {
  text: string;
  model: string;
}

/**
 * Parse a model spec string like "anthropic:claude-sonnet-4-5",
 * "openai:gpt-4o", "gemini:gemini-2.0-flash", "ollama:llama3.1".
 * A bare model name (no prefix) defaults to the anthropic provider.
 */
export function parseModelSpec(spec: string): ModelSpec {
  const trimmed = spec.trim();
  const idx = trimmed.indexOf(':');
  if (idx === -1) {
    if (!trimmed) throw new Error('Empty model spec');
    return { provider: 'anthropic', model: trimmed };
  }
  const provider = trimmed.slice(0, idx) as ProviderName;
  const model = trimmed.slice(idx + 1);
  if (!PROVIDER_NAMES.includes(provider)) {
    throw new Error(
      `Unknown provider "${provider}" in model spec "${spec}" (expected one of: ${PROVIDER_NAMES.join(', ')})`,
    );
  }
  if (!model) throw new Error(`Model spec "${spec}" has no model name after the provider`);
  return { provider, model };
}

/** Format a spec back to its canonical "provider:model" string. */
export function formatModelSpec(spec: ModelSpec): string {
  return `${spec.provider}:${spec.model}`;
}

export async function completeWith(
  spec: ModelSpec,
  req: Omit<ProviderRequest, 'model'>,
): Promise<ProviderResult> {
  const full: ProviderRequest = { ...req, model: spec.model };
  switch (spec.provider) {
    case 'anthropic':
      return anthropicComplete(full);
    case 'openai':
      if (!config.openaiApiKey) {
        throw new Error('OPENAI_API_KEY is required for openai: model specs');
      }
      return openAiCompatComplete('https://api.openai.com/v1', config.openaiApiKey, full);
    case 'gemini':
      if (!config.geminiApiKey) {
        throw new Error('GEMINI_API_KEY is required for gemini: model specs');
      }
      return openAiCompatComplete(
        'https://generativelanguage.googleapis.com/v1beta/openai',
        config.geminiApiKey,
        full,
      );
    case 'ollama':
      return openAiCompatComplete(`${config.ollamaBaseUrl.replace(/\/$/, '')}/v1`, 'ollama', full);
  }
}
