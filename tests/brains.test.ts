import { describe, expect, it } from 'vitest';
import { loadBrain, verifyQuotes, withBrain } from '../src/council/brains.js';

const CORPUS = `- "The unexamined life is not worth living for a man." (SOC-S01)
- "I know that I know nothing." (SOC-S02)`;

describe('verifyQuotes', () => {
  it('accepts a verbatim quote regardless of case, punctuation and curly quotes', () => {
    const r = verifyQuotes('As I said, “the unexamined life is not worth living” - so examine it.', CORPUS);
    expect(r.verified).toEqual(['the unexamined life is not worth living']);
    expect(r.unverified).toEqual([]);
  });

  it('flags a quote that is not in the corpus', () => {
    const r = verifyQuotes('Remember: "wisdom begins in wonder at all things" (SOC-S01).', CORPUS);
    expect(r.unverified).toEqual(['wisdom begins in wonder at all things']);
    expect(r.verified).toEqual([]);
  });

  it('skips short quoted terms, which are terms rather than quotations', () => {
    const r = verifyQuotes('The so-called "elenchus method" applies here.', CORPUS);
    expect(r).toEqual({ verified: [], unverified: [] });
  });
});

describe('brains', () => {
  it('leaves a system prompt untouched when the seat has no brain', () => {
    // A seat id with no folder on disk behaves like brains are off.
    expect(loadBrain('nobody' as never)).toBe('');
    expect(withBrain('You are X.', 'nobody' as never)).toBe('You are X.');
  });
});
