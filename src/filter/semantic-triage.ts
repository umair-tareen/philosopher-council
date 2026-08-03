import { complete } from '../council/client.js';
import { extractJson } from '../council/client.js';

export interface TriageScore {
  technicalDepth: number; // 0-1: Is there actual math/code, or just vibes?
  hypeRatio: number;      // 0-1: 1 means pure engagement bait
  novelty: number;        // 0-1: Derivative wrapper vs. new paradigm
  verdict: 'analyze' | 'track' | 'ignore';
}

const TRIAGE_SYSTEM = `You are a ruthless technical triage agent for AI research. 
Evaluate the provided text (Reddit/HN/arXiv). 
- If it is a wrapper around an existing API or pure hype, hypeRatio > 0.8.
- If it proposes a novel architectural shift or rigorous math, novelty > 0.8.
- 'analyze' means send to the full council. 'track' means monitor later. 'ignore' means drop.
Return ONLY valid JSON matching the TriageScore schema.`;

export async function semanticFilter(item: string, model: string = 'groq:llama-3.1-8b-instant'): Promise<TriageScore> {
  const { text } = await complete({
    system: TRIAGE_SYSTEM,
    user: item,
    maxTokens: 200, // Very small context window needed for triage
    model,
  });
  
  return extractJson<TriageScore>(text);
}
