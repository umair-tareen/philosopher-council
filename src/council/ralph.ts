import { config } from '../config.js';
import type {
  RalphCritique,
  TrendItem,
} from '../types.js';
import { complete, extractJson } from './client.js';
import { renderItem } from './personas/_shared.js';

const MAX_ITERATIONS = 2;
const SCORE_DELTA_THRESHOLD = 0.05; // Stop if critique moves the score by < 5%

// Stub for your search tool (e.g., Tavily, Serper, or direct Arxiv API)
async function searchWeb(query: string): Promise<string> {
  // TODO: Implement actual search here
  return `Search results for "${query}": [No implementation yet, assume baseline facts]`; 
}

export interface RalphCritique {
  iteration: number;
  weakestClaim: string;
  searchEvidence: string;
  refinedVerdict: string;
  refinedScore: number;
}

export async function groundedRalphLoop(
  item: TrendItem,
  initialScore: number,
  prevVerdict: string,
  signal?: AbortSignal,
): Promise<RalphCritique[]> {
  const out: RalphCritique[] = [];
  let currentScore = initialScore;
  let currentVerdict = prevVerdict;

  for (let i = 1; i <= MAX_ITERATIONS; i++) {
    try {
      // STEP 1: Identify the weakest claim
      const identifyPrompt = `Read this verdict: "${currentVerdict}". Identify the single weakest, most unsubstantiated claim in it. Return ONLY JSON: {"weakestClaim": "..."}`;
      const { text: weakText } = await complete({
        system: "You are a ruthless fact-checker.",
        user: identifyPrompt,
        maxTokens: 150,
        model: config.councilModels['ralph'],
        signal,
      });
      const { weakestClaim } = extractJson<{ weakestClaim: string }>(weakText);

      // STEP 2: Ground the critique with external search
      const evidence = await searchWeb(weakestClaim);

      // STEP 3: Refine the verdict and score based on EVIDENCE, not just vibes
      const refineSystem = `You are the Ralph-loop critic. The council claimed: "${weakestClaim}". 
Here is external evidence: "${evidence}". 
Revise the verdict to correct any hallucinations, and provide a new aggregate score (0..1).
Return ONLY JSON: {"refinedVerdict": "...", "refinedScore": 0.0}`;

      const { text: refineText } = await complete({
        system: refineSystem,
        user: `Original Verdict: ${currentVerdict}\nItem: ${renderItem(item)}`,
        maxTokens: 500,
        model: config.councilModels['ralph'],
        signal,
      });

      const raw = extractJson<{ refinedVerdict?: string; refinedScore?: number }>(refineText);
      
      const refinedScore = typeof raw.refinedScore === 'number' ? raw.refinedScore : currentScore;
      const refinedVerdict = raw.refinedVerdict || currentVerdict;

      out.push({
        iteration: i,
        weakestClaim,
        searchEvidence: evidence,
        refinedVerdict,
        refinedScore,
      });

      // STEP 4: Deterministic Stopping
      const scoreDelta = Math.abs(refinedScore - currentScore);
      if (scoreDelta < SCORE_DELTA_THRESHOLD) {
        break; // The critique didn't change the fundamental math, stop looping.
      }

      currentScore = refinedScore;
      currentVerdict = refinedVerdict;

    } catch (err) {
      console.warn('Ralph iteration failed:', err);
      break;
    }
  }

  return out;
}
