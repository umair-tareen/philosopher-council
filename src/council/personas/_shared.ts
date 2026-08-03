import type { TrendItem } from '../../types.js';

export interface EpistemicMetrics {
  empirical_rigor: number; // 0-1: Backed by ablation studies/math?
  paradigm_novelty: number; // 0-1: Derivative vs. fundamental shift?
  reproducibility: number; // 0-1: Open code/data vs. closed/proprietary?
  hype_penalty: number;    // 0-1: Higher score = LESS hype (inverted for easier math)
}

export interface PhilosopherOpinion {
  philosopherId: string;
  providerModel: string;
  verdict: string;
  metrics: EpistemicMetrics;
  minority_flag: boolean; // Set to true if this philosopher's score variance is highest
}

// Update the shared system prompt preamble to instruct the models on these new metrics
export const SHARED_SYSTEM_PREAMBLE = `
You must evaluate the item across four epistemic metrics (scored 0.0 to 1.0):
1. empirical_rigor: Are claims backed by rigorous proof/benchmarks?
2. paradigm_novelty: Is this a fundamental shift or just a wrapper?
3. reproducibility: Can an independent researcher verify this today?
4. hype_penalty: Score HIGH if the text avoids buzzwords ("AGI", "sentient", "100x") and stays grounded.
`;

export const JSON_ENVELOPE = `You MUST respond with a single JSON object matching this TypeScript shape and nothing else:
{
  "metrics": { "empirical_rigor": number, "paradigm_novelty": number, "reproducibility": number, "hype_penalty": number },
  "oneLiner": string,        // <= 140 chars
  "reasoning": string,       // 3-5 sentences, in your voice
  "concerns": string[],      // at most 4 short bullets
  "citations": string[]      // canon file refs you actually used, e.g. ["canon/02-virtue-rubrics.md"]
}
All scores are in [0, 1]. 0.5 is "no evidence either way."`;

export const PRE_INFERENCE_SCRATCHPAD = `Before scoring, silently widen your view:
- Morning Preparation: list the failure modes of the claim.
- View From Above: ask if this still matters at a five-year horizon.
- Negative Visualization: imagine the field without this idea. What is gained or lost?
These are deliberative exercises, not feelings. Use them, then score.`;

export function renderItem(item: TrendItem): string {
  if (item.source === 'question') {
    const parts = [`Question: ${item.title}`];
    if (item.summary) parts.push(`\nContext:\n${item.summary}`);
    return parts.join('\n');
  }
  const parts = [
    `Title: ${item.title}`,
    `Source: ${item.source}${item.subSource ? ` (${item.subSource})` : ''}`,
    `URL: ${item.url}`,
    `Published: ${item.publishedAt}`,
    `Tags: ${item.tags.join(', ') || '—'}`,
  ];
  if (item.summary) parts.push(`\nSummary:\n${item.summary}`);
  return parts.join('\n');
}

export function evaluateAs(name: string, item: TrendItem): string {
  const task =
    item.source === 'question'
      ? `The council has been asked a direct question. Deliberate on it as ${name}. Treat the question itself as the claim under examination.`
      : `Evaluate the following AI-research trend item as ${name}.`;
  return `${task}\n\n${renderItem(item)}`;
}
