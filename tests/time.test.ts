import { describe, expect, it } from 'vitest';
import { safeIso } from '../src/util/time.js';

const FALLBACK = '2026-06-13T00:00:00.000Z';

describe('safeIso', () => {
  it('passes through a valid date string', () => {
    expect(safeIso('2026-01-02T03:04:05Z', FALLBACK)).toBe('2026-01-02T03:04:05.000Z');
  });

  it('accepts epoch milliseconds (Reddit created_utc * 1000)', () => {
    expect(safeIso(Date.UTC(2026, 0, 2), FALLBACK)).toBe('2026-01-02T00:00:00.000Z');
  });

  it('falls back instead of throwing or producing NaN on bad input', () => {
    expect(safeIso(undefined, FALLBACK)).toBe(FALLBACK);
    expect(safeIso(null, FALLBACK)).toBe(FALLBACK);
    expect(safeIso('', FALLBACK)).toBe(FALLBACK);
    expect(safeIso('not a date', FALLBACK)).toBe(FALLBACK);
    expect(safeIso(Number.NaN, FALLBACK)).toBe(FALLBACK);
  });
});
