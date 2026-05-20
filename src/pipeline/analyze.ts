import { runCouncil } from '../council/council.js';
import { logger } from '../logger.js';
import { loadTodaysItems, saveVerdict } from '../store/fs.js';
import type { CouncilMode, CouncilVerdict, TrendItem } from '../types.js';

interface AnalyzeOptions {
  fullCouncil?: boolean;
}

export async function runAnalyze(
  opts: AnalyzeOptions = {},
): Promise<Array<{ item: TrendItem; verdict: CouncilVerdict }>> {
  const items = await loadTodaysItems();
  const mode: CouncilMode = opts.fullCouncil ? 'full' : 'quorum';
  const out: Array<{ item: TrendItem; verdict: CouncilVerdict }> = [];
  for (const item of items) {
    try {
      const verdict = await runCouncil(item, mode);
      await saveVerdict(item, verdict);
      logger.info(
        {
          itemId: item.id,
          mode,
          finalScore: Number(verdict.finalScore.toFixed(2)),
          recommendation: verdict.finalRecommendation,
        },
        'verdict written',
      );
      out.push({ item, verdict });
    } catch (err) {
      logger.error({ itemId: item.id, err: String(err) }, 'analyze failed for item');
    }
  }
  return out;
}
