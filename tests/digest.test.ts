import { describe, expect, it } from 'vitest';
import { bucketByRecommendation } from '../src/pipeline/digest.js';
import type { CouncilVerdict, TrendItem } from '../src/types.js';

function entry(rec: string) {
  return {
    item: { id: rec, title: rec } as TrendItem,
    verdict: { finalRecommendation: rec } as unknown as CouncilVerdict,
  };
}

describe('bucketByRecommendation', () => {
  it('groups the three known recommendations', () => {
    const b = bucketByRecommendation([
      entry('amplify'),
      entry('track'),
      entry('ignore'),
      entry('track'),
    ]);
    expect(b.amplify).toHaveLength(1);
    expect(b.track).toHaveLength(2);
    expect(b.ignore).toHaveLength(1);
  });

  it('files an unknown recommendation under track instead of crashing', () => {
    // A corrupted or older-schema verdict must not blow up the whole digest.
    expect(() => bucketByRecommendation([entry('bogus')])).not.toThrow();
    const b = bucketByRecommendation([entry('bogus')]);
    expect(b.track).toHaveLength(1);
  });
});
