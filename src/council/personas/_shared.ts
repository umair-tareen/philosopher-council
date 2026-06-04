import type { TrendItem } from '../../types.js';

export const JSON_ENVELOPE = `You MUST respond with a single JSON object matching this TypeScript shape and nothing else:
{
  "virtueScores": { "wisdom": number, "courage": number, "justice": number, "temperance": number },
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
