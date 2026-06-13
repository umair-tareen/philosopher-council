## What this changes

<!-- One or two sentences. Link the issue if there is one. -->

## How it was verified

<!-- Everything runs offline: pnpm lint && pnpm build && pnpm test (DRY_RUN, no API key needed).
     If you ran it live, say which provider/model. -->

## Checklist

- [ ] `pnpm lint`, `pnpm build`, and `pnpm test` pass
- [ ] New behavior has dry-run tests (extend `src/mock/anthropic.ts` if needed)
- [ ] Model output is validated at the boundary (`src/council/schemas.ts` pattern) - degrade, don't crash
- [ ] No production prompt claims the system has a soul, awareness, or being
- [ ] If answer quality could be affected: `pnpm eval` report attached, losses included
