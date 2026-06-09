import { z } from 'zod';
import { clamp01 } from '../util/num.js';

const NEUTRAL = 0.5;

/**
 * A 0..1 score from model output: accepts numbers or numeric strings,
 * degrades anything unusable to neutral, and clamps the rest.
 */
const score = z
  .preprocess((v) => Number(v ?? NEUTRAL), z.number().catch(NEUTRAL))
  .transform(clamp01);

const NEUTRAL_VIRTUES = {
  wisdom: NEUTRAL,
  courage: NEUTRAL,
  justice: NEUTRAL,
  temperance: NEUTRAL,
};

/** Keep only string entries, capped at `max` - one bad element must not void the list. */
const stringList = (max: number) =>
  z
    .unknown()
    .transform((v) =>
      Array.isArray(v)
        ? v.filter((x): x is string => typeof x === 'string').slice(0, max)
        : [],
    );

/**
 * Shape of a deliberator's extracted JSON. Models drop or mangle fields under
 * pressure; every field degrades to a safe default rather than failing the
 * seat, so a forgotten `concerns` array still yields a usable opinion.
 */
export const rawOpinionSchema = z.object({
  virtueScores: z
    .object({ wisdom: score, courage: score, justice: score, temperance: score })
    .catch(NEUTRAL_VIRTUES),
  oneLiner: z
    .string()
    .catch('')
    .transform((s) => s.slice(0, 140)),
  reasoning: z.string().catch(''),
  concerns: stringList(4),
  citations: stringList(4),
});

export type RawOpinion = z.infer<typeof rawOpinionSchema>;

/** Shape of the synthesizer's extracted JSON, with the same degrade-don't-fail policy. */
export const rawSynthesisSchema = z.object({
  unifyingReading: z.string().catch(''),
  hiddenContinuity: z.string().catch(''),
  mysticalCaution: z.string().catch(''),
  unifiedScore: score,
});

export type RawSynthesis = z.infer<typeof rawSynthesisSchema>;
