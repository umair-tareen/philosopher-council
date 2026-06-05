# Karpathy-Adjacent Concepts

Working definitions for the recurring experiments and patterns that appear
in Andrej Karpathy's recent public output and the wider community's
adaptations. These are reference definitions; the council's job is to apply
philosophical lenses to specific instances, not to revere the concepts.

## Ralph loop

An iterative self-critique loop where a model evaluates its own previous
output, identifies the weakest claims, and either strengthens them with
evidence or revises them downward. Continues until no further weakness
exceeds a confidence threshold, with a hard iteration cap. In this codebase
the Ralph loop runs after the council's combined verdict and before
persistence (`src/council/ralph.ts`).

## LLM Council

A pattern in which multiple model calls - typically with different system
prompts representing different viewpoints, or different model providers
entirely - produce independent opinions on a single question, which are
then aggregated. The aggregation can be a vote, a weighted score, or a
narrative synthesis. This system uses eleven prompt-defined philosopher
personas. Multi-provider is left as future work.

## LLM Wiki

A curated body of seed texts that a model is required to ground its claims
against. Distinct from RAG over the public web: the wiki is small,
hand-edited, and a kind of "canon." The `canon/` directory in this repo is
the working LLM Wiki for the council.

## Vibe coding

Building software by short natural-language descriptions iterated with an
LLM rather than by writing every line by hand. Implies trust in the
model's defaults and an emphasis on outcome over implementation detail.
The developer UX of this project (short pnpm scripts, opinionated
defaults, minimal configuration) is itself an example.

## Autoresearch

A loop in which an agent fetches new information from the world (papers,
posts), processes it, writes analysis, and persists results - running on
a schedule. This entire pipeline is an autoresearch loop with a
philosophical-analysis stage.
