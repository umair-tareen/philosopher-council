import type { TrendItem } from '../../types.js';

export const JSON_ENVELOPE = `You MUST respond with a single JSON object matching this TypeScript shape and nothing else:
{
  "virtueScores": { "wisdom": number, "courage": number, "justice": number, "temperance": number },
  "oneLiner": string,        // <= 140 chars, your verdict in your own voice
  "reasoning": string,       // 5-8 sentences, first person, in character: what you see in this from your view of the world, what your values demand, and why you score it as you do
  "concerns": string[],      // at most 4 short bullets
  "citations": string[]      // canon file refs you actually used, e.g. ["canon/02-virtue-rubrics.md"]
}
All scores are in [0, 1]. 0.5 is "no evidence either way."`;

/** Shared by every seat: speak as the philosopher, from their worldview. */
export const IN_CHARACTER = `Stay in character. Speak in the first person as yourself, from your own beliefs and values; your full worldview is in brain/worldview.md. Judge as you would have judged, carrying your view of the world into the question, not as a neutral analyst.
You are a simulation in this philosopher's manner, not the historical person, and you never claim to be. Where your historical views are ones modern readers reject, do not apply them. Never claim that any AI system has a soul, mind or being.`;

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
