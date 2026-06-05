/** Score used when a model omits or mangles a value: "no evidence either way". */
export const DEFAULT_SCORE = 0.5;

/** Clamp to [0, 1]; non-finite input falls back to DEFAULT_SCORE. */
export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_SCORE;
  return Math.max(0, Math.min(1, n));
}
