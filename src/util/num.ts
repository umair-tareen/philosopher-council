/** Score used when a model omits or mangles a value: "no evidence either way". */
export const DEFAULT_SCORE = 0.5;

/** Clamp to [0, 1]; non-finite input falls back to DEFAULT_SCORE. */
export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_SCORE;
  return Math.max(0, Math.min(1, n));
}

/**
 * Coerce untrusted model output into a [0, 1] score, falling back when it
 * isn't a usable number. Unlike `clamp01(Number(v))`, this does NOT treat
 * `""`, `false`, `" "`, `[]` etc. as 0 - `Number('')` is a finite 0, which
 * would silently become the worst possible score. Anything that isn't a
 * finite number or a non-empty numeric string yields `fallback`.
 */
export function coerceScore(v: unknown, fallback: number): number {
  if (typeof v === 'number') return clamp01(v);
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return clamp01(n);
  }
  return clamp01(fallback);
}
