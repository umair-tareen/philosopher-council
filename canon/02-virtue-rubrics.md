# Virtue Rubrics

How each cardinal virtue is scored across all philosopher opinions. All
scores in [0, 1]; 0.5 is "neutral / no evidence either way."

## Wisdom (sophia / phronesis)

- 0.0 - Claim is incoherent, unfalsifiable, or contradicts its own premises.
- 0.3 - Plausible but evidence-free; pattern-matches to hype.
- 0.5 - Plausible; some evidence; not yet replicated.
- 0.7 - Well-evidenced, falsifiable, reproducible by a small team.
- 1.0 - Strongly evidenced, robustly replicated, and points beyond itself.

## Courage (andreia)

- 0.0 - Reckless contrarianism; ignores known counter-evidence.
- 0.3 - Bold but undisciplined; underestimates downside.
- 0.5 - Modestly novel; mostly incremental.
- 0.7 - Challenges consensus where evidence warrants; bounded ambition.
- 1.0 - Names a real failure mode of the field and offers a credible
  alternative that has been tested.

## Justice (dikaiosyne)

- 0.0 - Externalises serious harm; concentrates power; opaque to those affected.
- 0.3 - Significant unmitigated downside risks; weak accountability.
- 0.5 - Standard dual-use posture; no obvious red flags.
- 0.7 - Demonstrably aligned with the stated interests of users / stakeholders.
- 1.0 - Distributes benefit broadly; transparent; accountable; reversible.

## Temperance (sophrosyne)

- 0.0 - Demands enormous resources for marginal gain; over-engineered.
- 0.3 - Heavier than necessary; chases breadth at the cost of depth.
- 0.5 - Proportionate; reasonable resource profile.
- 0.7 - Surprisingly small footprint relative to results.
- 1.0 - Demonstrably "less is more"; cuts complexity rather than adding it.

## Aggregation

A philosopher's `verdictScore` is the unweighted mean of their four virtue
scores. The council's `aggregateScore` is the unweighted mean across the
philosopher opinions present in that mode (4 in quorum, 10 in full;
Ibn Arabi is excluded from this mean and contributes only the synthesis).
