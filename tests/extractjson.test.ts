import { describe, expect, it } from 'vitest';
import { extractJson, JsonExtractionError } from '../src/council/client.js';

describe('extractJson', () => {
  it('parses a bare object', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('prefers a ```json fence', () => {
    const text = 'Here is the answer:\n```json\n{"score":0.7}\n```\nthanks';
    expect(extractJson(text)).toEqual({ score: 0.7 });
  });

  it('ignores leading and trailing prose without a fence', () => {
    const text = 'Sure! {"verdict":"track"} hope that helps {not json}';
    expect(extractJson(text)).toEqual({ verdict: 'track' });
  });

  it('stops at the matching brace, not a later one (no over-capture)', () => {
    // Greedy lastIndexOf would swallow the trailing "{x}" and throw.
    const text = '{"a":{"b":2}} and separately consider {x}';
    expect(extractJson(text)).toEqual({ a: { b: 2 } });
  });

  it('does not treat braces inside strings as structure', () => {
    const text = '{"note":"use a {placeholder} here","n":1}';
    expect(extractJson(text)).toEqual({ note: 'use a {placeholder} here', n: 1 });
  });

  it('throws JsonExtractionError when there is no object', () => {
    expect(() => extractJson('no json at all')).toThrow(JsonExtractionError);
  });

  it('throws JsonExtractionError on an unparseable span', () => {
    expect(() => extractJson('{"a": }')).toThrow(JsonExtractionError);
  });
});
