import type { PhilosopherId } from '../types.js';
import { complete, extractJson } from './client.js';

export type DebateModeId = 'deliberation' | 'socratic' | 'oxford' | 'delphi' | 'vote';

export interface DebateMode {
  id: DebateModeId;
  title: string;
  description: string;
  /** Fixed bench for this mode (quorum selection is skipped). */
  seats?: Array<Exclude<PhilosopherId, 'ibnarabi'>>;
  /** Extra instruction appended to each deliberator's prompt; receives seat index. */
  instruction?: (seatIndex: number) => string;
  /**
   * How the final verdict is derived: 'synthesis' (default) refines via the
   * ralph critic; 'vote' takes the median seat score + plurality
   * recommendation and skips the critic.
   */
  governance?: 'synthesis' | 'vote';
}

export const DEBATE_MODES: Record<DebateModeId, DebateMode> = {
  deliberation: {
    id: 'deliberation',
    title: 'Deliberation',
    description:
      'The default: each seat evaluates the question through its own methodology, independently.',
  },
  socratic: {
    id: 'socratic',
    title: 'Socratic interrogation',
    description:
      'Best for fuzzy or loaded questions whose terms need examining before any answer is possible.',
    seats: ['socrates', 'plato', 'alghazali', 'kant'],
    instruction: () =>
      'MODE - Socratic interrogation: before scoring, pose the three most probing questions this claim must survive, answer each honestly, and let the survivors determine your verdict. Surface any undefined term.',
  },
  oxford: {
    id: 'oxford',
    title: 'Oxford debate',
    description:
      'Best for binary propositions: two seats argue FOR, two argue AGAINST, then score honestly.',
    seats: ['aristotle', 'kant', 'laotzu', 'alghazali'],
    instruction: (i) =>
      i < 2
        ? 'MODE - Oxford debate, you are on the FOR bench: make the strongest possible case FOR the proposition first, in your own method. Then score honestly - your virtue scores may disagree with your assigned side.'
        : 'MODE - Oxford debate, you are on the AGAINST bench: make the strongest possible case AGAINST the proposition first, in your own method. Then score honestly - your virtue scores may disagree with your assigned side.',
  },
  delphi: {
    id: 'delphi',
    title: 'Delphi forecast',
    description:
      'Best for predictions: each seat gives an independent probability estimate and the conditions it hinges on.',
    seats: ['aristotle', 'ibnrushd', 'avicenna', 'descartes'],
    instruction: () =>
      'MODE - Delphi forecast: treat this as a forecasting question. State your probability estimate (as a percentage) and the two or three conditioning factors it most depends on, then score. Reward calibration over confidence.',
  },
  vote: {
    id: 'vote',
    title: 'Deliberate → Vote',
    governance: 'vote',
    description:
      'Independent deliberation, then a mechanical vote: median seat score, plurality recommendation, no critic pass. The top-performing governance structure in the llm-council-governance study - here with fully independent seats (no inter-seat discussion).',
    instruction: () =>
      'MODE - Deliberate then vote: your virtue scores ARE your ballot. Commit: score decisively from your own methodology, state your single strongest reason, and do not hedge toward the middle.',
  },
};

const ADVISOR_SYSTEM = `You are the council's Method Advisor. Given a question, recommend the best debate mode:
- "deliberation": open-ended or multi-dimensional questions
- "socratic": fuzzy/loaded questions whose terms need examining first
- "oxford": clear binary propositions (should X / is X better than Y)
- "delphi": forecasting questions about what will happen
- "vote": scoreable accept/reject calls where a defensible tally matters more than an essay

Respond with a single JSON object and nothing else:
{ "mode": "deliberation" | "socratic" | "oxford" | "delphi" | "vote", "reason": string }`;

export async function adviseMode(
  question: string,
): Promise<{ mode: DebateModeId; reason: string }> {
  const { text } = await complete({
    system: ADVISOR_SYSTEM,
    user: question,
    maxTokens: 200,
  });
  const raw = extractJson<{ mode?: string; reason?: string }>(text);
  const mode = (raw.mode ?? 'deliberation') as DebateModeId;
  return {
    mode: Object.hasOwn(DEBATE_MODES, mode) ? mode : 'deliberation',
    reason: raw.reason ?? '',
  };
}
