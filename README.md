# 🏛️ philosopher-council

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) ![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white) ![Claude](https://img.shields.io/badge/Claude%20API-%23191919.svg?style=for-the-badge&logo=anthropic&logoColor=white) ![Vitest](https://img.shields.io/badge/vitest-%236E9F18.svg?style=for-the-badge&logo=vitest&logoColor=white) ![Zod](https://img.shields.io/badge/zod-%233068b7.svg?style=for-the-badge&logo=zod&logoColor=white)

**An eleven-philosopher LLM council.** Ask it a question — Socrates interrogates it, Kant universalises it, Lao Tzu subtracts from it, and Ibn ʿArabī weaves their verdicts into one reading. Or point it at the AI-research firehose (Reddit / Hacker News / arXiv) and let the council triage what's worth your attention.

**Methodology, not metaphysics.** The philosophers are prompt-engineered lenses, not séance guests. The model is a language model. No production prompt claims the system has a soul, awareness, or being.

---

## 💬 Ask the council anything

```bash
pnpm ask "Is chain-of-thought prompting genuine reasoning or imitation?"
pnpm ask --full-council "Should agentic AI systems spend money autonomously?"
pnpm ask --context "We run a 5-agent trading desk" "Where should a human stay in the loop?"
```

Each deliberator answers in character — virtue scores, reasoning, concerns — then the synthesizer speaks last:

```
# The council deliberates

> Question: Is scaling all you need?

## Aristotle (logic) — 0.61
**Argument valid as stated; missing a load-bearing premise.**
| Wisdom     | Courage    | Justice    | Temperance |
| ███████░░░ | ██████░░░░ | ██████░░░░ | ███████░░░ |

## Ibn ʿArabī — synthesis (0.62)
**Unifying reading.** The deliberators appear to disagree on novelty
versus restraint, but each is pointing at the same underlying judgment…
```

Transcripts are saved to `data/asks/<date>-<question>.md`.

## 🤔 Why philosophy, and why now

Philosophy is already running inside production AI — it's just uncredited:

- **Constitutional AI** (Anthropic's own training method) is literally a written constitution of normative principles the model deliberates against — applied moral philosophy as a training loop.
- **RLHF** is preference utilitarianism with a reward model.
- **AI safety guardrails** are deontology: rules that hold regardless of outcome.
- **Interpretability research** is epistemology: *how do we know what the model knows?*
- **Karpathy's "LLM Council"** showed that multiple model perspectives beat one — this project takes the obvious next step and gives the perspectives 2,500 years of documented methodology.

And there's a fitting irony in the plumbing: **Anthropic** takes its name from the Greek *ánthrōpos* — "human." A company named *human* built the model; this council uses it to put humanity's oldest reasoning traditions — Athens, Baghdad, Córdoba, Qufu — back in the judgment seat over AI's newest claims. The wheel turns full circle: the machines trained on everything we ever wrote are steered by the best of what we ever thought.

So: if a constitution of principles can align a model, a council of philosophers can interrogate one. Same move, made explicit.

## ⚡ First sixty seconds (no API key needed)

```bash
pnpm install
pnpm build                          # type-check
pnpm test                           # vitest, all dry-run mocks

$env:DRY_RUN = "1"                  # (PowerShell) or DRY_RUN=1 on bash
pnpm ask "What is a benchmark, really?"   # mock model, instant
pnpm trends:run --offline           # full pipeline on fixture data
```

## 🔑 Live mode (Claude API)

```bash
cp .env.example .env                # add ANTHROPIC_API_KEY=sk-ant-...
pnpm ask "your question"            # 5 Claude calls (quorum) per question
pnpm ask --full-council "..."       # 11 calls — every philosopher speaks
pnpm trends:run                     # triage today's AI-research trends
```

Default model is `claude-sonnet-4-5` (set `ANTHROPIC_MODEL` to override).

## 🏛️ The eleven philosophers

| Branch         | Quorum candidates                                              |
| -------------- | -------------------------------------------------------------- |
| Epistemology   | Socrates, Avicenna, Al-Ghazālī, Descartes, Kant                |
| Metaphysics    | Plato, Lao Tzu, Avicenna, Ibn Rushd, Descartes                 |
| Ethics         | Socrates, Aristotle, Confucius, Lao Tzu, Al-Ghazālī, Kant      |
| Logic          | Aristotle, Ibn Rushd                                           |
| **Synthesis**  | **Ibn ʿArabī** — fixed seat, speaks last, weaves the verdicts  |

Quorum mode seats one philosopher per branch, selected deterministically from the item id — the same question always convenes the same bench. Full-council mode seats all ten deliberators. Ibn ʿArabī always closes.

Every opinion is scored against the **four cardinal virtues** — Wisdom, Courage, Justice, Temperance ∈ [0, 1] — using the rubrics in [`canon/02-virtue-rubrics.md`](canon/02-virtue-rubrics.md), making verdicts from very different methodologies commensurable.

## 🔄 Pipeline stages

```
ask ─────────────────┐
                     ├──> council ──> ralph (self-critique) ──> verdict
fetch ──> filter ────┘                                            │
                                                    digest <──────┘
```

- **ask** (`src/pipeline/ask.ts`) — wraps your question as the item under deliberation
- **fetch** (`src/fetchers/`) — Reddit `new.json`, HN Algolia, arXiv RSS (`cs.AI`, `cs.LG`); dedupe via `data/.seen.json`
- **filter** (`src/filter/`) — keyword regex set + recency/upvote heuristic
- **council** (`src/council/`) — one Claude call per seat, JSON-only opinions; Ibn ʿArabī synthesises
- **ralph** (`src/council/ralph.ts`) — self-critique loop, max 2 iterations, early-stops at `stopConfidence ≥ 0.6`
- **digest** (`src/pipeline/digest.ts`) — daily Markdown digest grouped by `amplify` / `track` / `ignore`

## 📁 Project layout

```
canon/            seed texts the council must cite (LLM Wiki pattern)
data/             generated artifacts (gitignored)
src/
  council/        registry, quorum, client, ralph, 11 personas
  fetchers/       reddit, hn, arxiv
  filter/         keyword + heuristic scoring
  pipeline/       ask / fetch / analyze / digest / run
  store/          JSON-on-disk persistence
  mock/           fixtures + mock Claude client (DRY_RUN=1)
tests/            vitest, all dry-run
STOIC_AI_MANIFESTO.md   the long-form design philosophy
```

## 🚫 What this is not

- Not a claim that the model is conscious. The philosophical framing is methodology.
- Not a prediction market. Verdicts are judged by reasoning quality, not by whether a trend pans out.
- Not a replacement for human judgment. The council's output is a starting point for a human to read, not a decision.

---

## 🌐 Connect

[![LinkedIn](https://img.shields.io/badge/LinkedIn-%230077B5.svg?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/umairtareen/) [![TikTok](https://img.shields.io/badge/TikTok-%23000000.svg?logo=TikTok&logoColor=white)](https://www.tiktok.com/@quantify.life) [![X](https://img.shields.io/badge/X-black.svg?logo=X&logoColor=white)](https://x.com/UAT_34) [![GitHub](https://img.shields.io/badge/GitHub-%23121011.svg?logo=github&logoColor=white)](https://github.com/umair-tareen)

*Built by Umair Tareen*
