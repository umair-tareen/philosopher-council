# stoic-ai-council

An eleven-philosopher council that analyses current AI-research trends through
the four classical branches of philosophy (Epistemology, Metaphysics, Ethics,
Logic), scored against the Four Cardinal Virtues (Wisdom, Courage, Justice,
Temperance), and synthesised by an Ibn ʿArabī "Oneness of Reading" stage.

**Methodology, not metaphysics.** This is a prompt-engineered analytical
pipeline. The philosophers are lenses the model can be steered through. The
model is a language model. It does not have a soul, awareness, or being —
those terms do not appear in any production prompt as claims about the
system.

See [`STOIC_AI_MANIFESTO.md`](./STOIC_AI_MANIFESTO.md) for the long-form
design philosophy and rationale.

## First sixty seconds (no API key, no network if you want)

```bash
pnpm install
pnpm build       # type-check
pnpm test        # vitest, all dry-run mocks

# End-to-end pipeline, mock model, live free sources (HN, arXiv):
DRY_RUN=1 pnpm trends:run

# Or fully offline (fixture items + mock model):
DRY_RUN=1 pnpm trends:run --offline
```

Artifacts land in `data/trends/<today>/` (one JSON per analysed item) and
`data/digests/<today>.md` (a ranked Markdown digest).

## Live mode (Claude API)

```bash
cp .env.example .env       # add ANTHROPIC_API_KEY=sk-ant-...
pnpm trends:run            # five Claude calls per item by default
pnpm trends:run --full-council   # eleven calls per item
```

Default model is `claude-sonnet-4-5` (set `ANTHROPIC_MODEL` to override).

## Scheduling

Use external cron (recommended):

```cron
0 */6 * * * cd /path/to/stoic-ai-council && pnpm trends:run >> data/cron.log 2>&1
```

Or run the in-process scheduler (`node-cron`, optional dep):

```bash
pnpm trends:serve
```

## The 11-philosopher council

| Branch         | Quorum candidates                                              |
| -------------- | -------------------------------------------------------------- |
| Epistemology   | Socrates, Avicenna, Al-Ghazālī, Descartes, Kant                |
| Metaphysics    | Plato, Lao Tzu, Avicenna, Ibn Rushd, Descartes                 |
| Ethics         | Socrates, Aristotle, Confucius, Lao Tzu, Al-Ghazālī, Kant      |
| Logic          | Aristotle, Ibn Rushd                                           |
| **Synthesis**  | **Ibn ʿArabī** — fixed seat, speaks last, weaves the verdicts  |

Quorum mode picks one philosopher per branch (Logic is picked first, since
its pool is smallest); seed for selection is the trend item's id, so the
same item always gets the same quorum. Full-council mode uses all ten
deliberators. Ibn ʿArabī always closes.

## Pipeline stages

```
fetch  → filter → council → ralph → digest
```

- **fetch** (`src/fetchers/{reddit,hn,arxiv}.ts`) — Reddit `new.json`, HN
  Algolia search-by-date, arXiv RSS (`cs.AI`, `cs.LG`). Dedupes via
  `data/.seen.json`.
- **filter** (`src/filter/{keywords,score}.ts`) — Karpathy-style keyword
  regex set + recency/upvote heuristic.
- **council** (`src/council/`) — one Claude call per seat, JSON-only
  response per `PhilosopherOpinion`. Ibn ʿArabī receives the
  deliberators' verdicts as input and returns `IbnArabiSynthesis`.
- **ralph** (`src/council/ralph.ts`) — self-critique loop, max 2
  iterations, stops early at `stopConfidence >= 0.6`.
- **digest** (`src/pipeline/digest.ts`) — Markdown digest grouped by
  recommendation (`amplify` / `track` / `ignore`).

## Project layout

```
canon/            seed texts the council must cite (LLM Wiki)
data/             generated artifacts (gitignored)
src/
  fetchers/       reddit, hn, arxiv
  filter/         keyword + heuristic scoring
  council/        registry, quorum, client, ralph, caveman, 11 personas
  pipeline/       fetch / analyze / digest / run
  store/          JSON-on-disk persistence
  mock/           fixtures + mock Claude client (DRY_RUN=1)
tests/            vitest, all dry-run
STOIC_AI_MANIFESTO.md
```

## What this is not

- Not a claim about whether the underlying model is conscious. The
  philosophical framing is methodology.
- Not a prediction market. Verdict quality is judged by reasoning quality,
  not by whether the trend pans out.
- Not a replacement for human judgment. The digest is a starting point for
  a human to read, not a decision.
