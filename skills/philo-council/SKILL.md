---
name: philo-council
description: Convene an eleven-philosopher LLM council on a question, decision, plan, or claim - virtue-scored opinions from named philosophers (Socrates, Kant, Lao Tzu, ...), a synthesis, and a first-class minority report. Use when the user asks to "convene the council", "ask the philosophers", wants a decision deliberated from multiple perspectives, or invokes /philo-council. Not for factual lookups - deliberation costs one LLM call per seat.
---

# philo-council: convene the philosopher council

Put the user's question to the philosopher council and present the deliberation:
each seat evaluates through its own documented methodology with virtue scores
(Wisdom, Courage, Justice, Temperance), Ibn ʿArabī synthesizes, and the
strongest dissent survives as a minority report. The value is legible
disagreement, not a single oracle answer.

## How to run it

**Preferred - MCP tools.** If the `philo-council` MCP server is connected
(tools named like `mcp__philo-council__deliberate`):

1. Optionally call `precedents` first with the question - it is free (no LLM
   calls) and shows whether the bench has already ruled on something similar.
2. Call `deliberate` with:
   - `question` (required) - phrase it as a single deliberable question
   - `context` - background the bench should know
   - `fullCouncil: true` - all ten deliberators instead of the quorum of four
     (use only when the user asks for the full bench; it is ~2.5x the cost)
   - `mode` - `socratic` (fuzzy terms need examining), `oxford` (binary
     proposition), `delphi` (forecast), else omit for open deliberation

**Fallback - CLI.** If the MCP server is not connected but the
philosopher-council repo is available locally:

```bash
pnpm --dir <path-to-philosopher-council> ask "the question"
pnpm --dir <path-to-philosopher-council> ask --full-council --mode oxford "..."
```

Requires `pnpm install` once, plus an API key in `.env` (`ANTHROPIC_API_KEY`,
or any seat remapped to openai/gemini/ollama via `COUNCIL_MODELS`).
`DRY_RUN=1` gives an instant offline demo with mock opinions.

If neither is available, say so and point the user at
https://github.com/umair-tareen/philosopher-council - do not fake a
deliberation by role-playing the philosophers yourself.

## Presenting the result

- Lead with the council's direct answer, then the verdict score and
  recommendation (amplify / track / ignore).
- Always surface the minority report - the dissent is the product. Never
  smooth it into the consensus.
- Quote at most 2-3 individual opinions inline; the full transcript path is
  in the output for the rest.
- Keep the framing honest: these are prompt-engineered lenses on one model
  family, not eleven independent minds. If the user asks whether the council
  "beats" a single model, the repo's own published eval says the margin is
  thin (0.728 vs 0.717) - its value is auditable, multi-perspective reasoning
  with preserved dissent.
