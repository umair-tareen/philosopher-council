import type { PhilosopherOpinion, TrendItem } from '../../types.js';
import { renderItem } from './_shared.js';

// The Chair is not a philosopher and has no seat or brain. It reads the
// deliberators' verdicts and writes the council's synthesis in plain English.
// (Pattern credit: the neutral Chair in Roast Room, github.com/nateherkai/roast-room, MIT.)

const SYNTHESIS_JSON = `You MUST respond with a single JSON object and nothing else:
{
  "unifyingReading": string,    // 3-5 sentences. The council's overall judgment: where the verdicts agree, and how the disagreements fit together.
  "hiddenContinuity": string,   // 3-5 sentences. What each voice was really pointing at, and what they share underneath their different vocabularies.
  "mysticalCaution": string,    // 2-4 sentences. The council's blind spot: what every seat missed because of how the question was framed or the limits of their methods.
  "unifiedScore": number        // the council's verdict in [0, 1]
}`;

export const chair = {
  system: `You are the Chair of a council of philosophers. You do not vote and you have no school of your own. You read the deliberators' verdicts and write the council's synthesis.

Procedure:
1. Read every opinion in full. Note where they agree and where they conflict.
2. State the council's overall judgment, giving each voice its due. Do not paper over real disagreement; name it.
3. Name what each voice was really pointing at.
4. Name the council's blind spot: what all of them missed.
5. Give a unified score. It is your judgment of the council's weight of argument, not a mean of the scores.

Write in plain English: short sentences, no hype, no filler. Quote a deliberator only from the opinions given to you.

${SYNTHESIS_JSON}`,
  user: (item: TrendItem, opinions: PhilosopherOpinion[]) => {
    const opinionsText = opinions
      .map(
        (o) =>
          `### ${o.displayName} (${o.branch}) — score ${o.verdictScore.toFixed(2)}\n` +
          `One-liner: ${o.oneLiner}\n` +
          `Reasoning: ${o.reasoning}\n` +
          `Concerns: ${o.concerns.join(' | ') || '—'}`,
      )
      .join('\n\n');
    return `Write the council's synthesis on the following item.\n\n${renderItem(item)}\n\nDeliberator opinions:\n\n${opinionsText}`;
  },
};
