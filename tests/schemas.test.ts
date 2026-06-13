import { describe, expect, it } from 'vitest';
import { rawOpinionSchema, rawSynthesisSchema } from '../src/council/schemas.js';

describe('rawOpinionSchema', () => {
  it('passes a well-formed opinion through unchanged', () => {
    const input = {
      virtueScores: { wisdom: 0.6, courage: 0.5, justice: 0.7, temperance: 0.55 },
      oneLiner: 'A modest claim.',
      reasoning: 'Because reasons.',
      concerns: ['one', 'two'],
      citations: ['canon/02-virtue-rubrics.md'],
    };
    expect(rawOpinionSchema.parse(input)).toEqual(input);
  });

  it('clamps out-of-range virtue scores to [0, 1]', () => {
    const out = rawOpinionSchema.parse({
      virtueScores: { wisdom: 1.7, courage: -0.2, justice: 0.5, temperance: 0.5 },
    });
    expect(out.virtueScores.wisdom).toBe(1);
    expect(out.virtueScores.courage).toBe(0);
  });

  it('coerces numeric-string scores', () => {
    const out = rawOpinionSchema.parse({
      virtueScores: { wisdom: '0.7', courage: 0.5, justice: 0.5, temperance: 0.5 },
    });
    expect(out.virtueScores.wisdom).toBe(0.7);
  });

  it('degrades empty/blank/falsy scores to neutral, NOT to 0', () => {
    // Regression guard: Number('')/Number(false) are a finite 0 that the old
    // schema accepted as the worst possible score.
    const out = rawOpinionSchema.parse({
      virtueScores: { wisdom: '', courage: '   ', justice: false, temperance: 'high' },
    });
    expect(out.virtueScores.wisdom).toBe(0.5);
    expect(out.virtueScores.courage).toBe(0.5);
    expect(out.virtueScores.justice).toBe(0.5);
    expect(out.virtueScores.temperance).toBe(0.5);
  });

  it('degrades missing or garbage fields to safe defaults instead of throwing', () => {
    const out = rawOpinionSchema.parse({
      virtueScores: 'not an object',
      oneLiner: 42,
      reasoning: null,
      concerns: 'not an array',
    });
    expect(out.virtueScores).toEqual({
      wisdom: 0.5,
      courage: 0.5,
      justice: 0.5,
      temperance: 0.5,
    });
    expect(out.oneLiner).toBe('');
    expect(out.reasoning).toBe('');
    expect(out.concerns).toEqual([]);
    expect(out.citations).toEqual([]);
  });

  it('defaults an unusable single score without failing the rest', () => {
    const out = rawOpinionSchema.parse({
      virtueScores: { wisdom: 'high', courage: 0.8, justice: 0.5, temperance: 0.5 },
    });
    expect(out.virtueScores.wisdom).toBe(0.5);
    expect(out.virtueScores.courage).toBe(0.8);
  });

  it('truncates oneLiner to 140 chars and lists to 4 entries', () => {
    const out = rawOpinionSchema.parse({
      oneLiner: 'x'.repeat(200),
      concerns: ['a', 'b', 'c', 'd', 'e', 'f'],
      citations: ['1', '2', '3', '4', '5'],
    });
    expect(out.oneLiner.length).toBe(140);
    expect(out.concerns).toEqual(['a', 'b', 'c', 'd']);
    expect(out.citations.length).toBe(4);
  });

  it('drops non-string entries from lists without voiding the rest', () => {
    const out = rawOpinionSchema.parse({
      concerns: [1, 'kept', { nope: true }, 'also kept'],
    });
    expect(out.concerns).toEqual(['kept', 'also kept']);
  });
});

describe('rawSynthesisSchema', () => {
  it('passes a well-formed synthesis through unchanged', () => {
    const input = {
      unifyingReading: 'One reading.',
      hiddenContinuity: 'A thread.',
      mysticalCaution: 'A caution.',
      unifiedScore: 0.62,
    };
    expect(rawSynthesisSchema.parse(input)).toEqual(input);
  });

  it('clamps unifiedScore and defaults missing fields', () => {
    const out = rawSynthesisSchema.parse({ unifiedScore: 3 });
    expect(out.unifiedScore).toBe(1);
    expect(out.unifyingReading).toBe('');
    expect(out.hiddenContinuity).toBe('');
    expect(out.mysticalCaution).toBe('');
  });

  it('defaults a garbage unifiedScore to neutral', () => {
    expect(rawSynthesisSchema.parse({ unifiedScore: 'very high' }).unifiedScore).toBe(0.5);
    expect(rawSynthesisSchema.parse({}).unifiedScore).toBe(0.5);
  });
});
