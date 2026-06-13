import { describe, expect, it } from 'vitest';
import { clamp01, coerceScore, DEFAULT_SCORE } from '../src/util/num.js';

describe('clamp01', () => {
  it('clamps into [0, 1]', () => {
    expect(clamp01(1.7)).toBe(1);
    expect(clamp01(-0.3)).toBe(0);
    expect(clamp01(0.42)).toBe(0.42);
  });

  it('falls back to DEFAULT_SCORE on non-finite input', () => {
    expect(clamp01(Number.NaN)).toBe(DEFAULT_SCORE);
    expect(clamp01(Number.POSITIVE_INFINITY)).toBe(DEFAULT_SCORE);
    expect(clamp01(Number.NEGATIVE_INFINITY)).toBe(DEFAULT_SCORE);
  });
});

describe('coerceScore', () => {
  it('passes through and clamps real numbers', () => {
    expect(coerceScore(0.7, 0.1)).toBe(0.7);
    expect(coerceScore(2, 0.1)).toBe(1);
    expect(coerceScore(-1, 0.1)).toBe(0);
  });

  it('parses non-empty numeric strings', () => {
    expect(coerceScore('0.8', 0.1)).toBe(0.8);
    expect(coerceScore('  0.25 ', 0.1)).toBe(0.25);
  });

  it('does NOT treat empty/blank/falsy values as 0 - the core bug', () => {
    // Number('') / Number(false) / Number(' ') are all a finite 0 that would
    // otherwise sail through as the worst possible score.
    expect(coerceScore('', 0.5)).toBe(0.5);
    expect(coerceScore('   ', 0.5)).toBe(0.5);
    expect(coerceScore(false, 0.5)).toBe(0.5);
    expect(coerceScore(null, 0.5)).toBe(0.5);
    expect(coerceScore(undefined, 0.5)).toBe(0.5);
    expect(coerceScore('not a number', 0.5)).toBe(0.5);
    expect(coerceScore([], 0.5)).toBe(0.5);
  });

  it('clamps the fallback too', () => {
    expect(coerceScore(undefined, 9)).toBe(1);
  });
});
