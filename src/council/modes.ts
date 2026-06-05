import type { PhilosopherId } from '../types.js';
import { complete, extractJson } from './client.js';

export type DebateModeId = 'deliberation' | 'socratic' | 'oxford' | 'delphi';

export interface DebateMode {
  id: DebateModeId;
  title: string;
  description: string;
  /** Fixed bench for this mode (quorum selection is skipped). */
  seats?: Array<Exclude<PhilosopherId, 'ibnarabi'>>;
  /** Extra instruction appended to each deliberator's prompt; receives seat index. */
  instruction?: (seatIndex: number) => string;
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
};

const ADVISOR_SYSTEM = `You are the council's Method Advisor. Given a question, recommend the best debate mode:
- "deliberation": open-ended or multi-dimensional questions
- "socratic": fuzzy/loaded questions whose terms need examining first
- "oxford": clear binary propositions (should X / is X better than Y)
- "delphi": forecasting questions about what will happen

Respond with a single JSON object and nothing else:
{ "mode": "deliberation" | "socratic" | "oxford" | "delphi", "reason": string }`;

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
    mode: DEBATE_MODES[mode] ? mode : 'deliberation',
    reason: raw.reason ?? '',
  };
}
