# Contributing

Contributions are welcome - new personas, debate modes, providers, fetchers, eval questions, or fixes.

## Getting started

Everything runs offline with mock model responses, so you never need an API key to develop:

```bash
pnpm install
pnpm build          # type-check (tsc, strict)
pnpm lint           # biome - lint + format check
pnpm test           # vitest, all dry-run

DRY_RUN=1 pnpm ask "Does this still work?"   # instant, no key
```

`pnpm lint:fix` applies formatting and safe lint fixes automatically. CI runs lint, build, and test on Node 20 and 22; all three must pass.

## Ground rules

- **Methodology, not metaphysics.** No production prompt may claim the system has a soul, awareness, or being. The philosophers are prompt-engineered lenses - keep it that way.
- **Tests are dry-run.** New features need tests that pass with `DRY_RUN=1` and no network. Extend `src/mock/anthropic.ts` if your feature requires new mock responses.
- **Degrade, don't crash.** Model output is hostile input: validate it at the boundary (see `src/council/schemas.ts`) and fall back to safe defaults rather than aborting a deliberation.
- **Disagreement is the product.** Changes to synthesis, scoring, or the minority report should preserve legible dissent, not average it away.

## Adding a philosopher

1. Add a persona module in `src/council/personas/<id>.ts` (system prompt + `user()` via `evaluateAs`).
2. Register the seat in `src/council/registry.ts` (id, display name, tradition, primary branch, quorum branches).
3. Wire the persona into `PERSONAS` in `src/council/council.ts`.
4. Add a matching profile to `src/mock/anthropic.ts` so dry-run output stays in character.
5. Ground the prompt in documented methodology - cite `canon/` where possible.

## Eval changes

If your change plausibly affects answer quality, run `pnpm eval --file evals/questions.json` and include the report - losses included. This project publishes the benchmarks it loses; keep that honest.
