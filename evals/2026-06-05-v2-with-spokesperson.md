# Eval: single answer vs generic debate vs philosopher council

Blind-judged by `anthropic:claude-sonnet-4-5` on insight, rigor, blind-spot coverage, and actionability. Answers were anonymized and shuffled per question. N=5.

| Strategy | Mean score | Wins (rank 1) | Calls per question |
|----------|-----------|---------------|--------------------|
| single | 0.758 | 1/5 | 1 |
| debate | 0.588 | 0/5 | 3 |
| council | 0.717 | 4/5 | 7 |

## Is chain-of-thought prompting genuine reasoning or sophisticated imitation?

- **single** - score 0.775, rank 2
- **debate** - score 0.475, rank 3
- **council** - score 0.737, rank 1

> Judge rationale: Answer A excels at dissolving the false dichotomy itself, offering the deepest philosophical insight by questioning whether 'genuine reasoning' is a coherent category with explanatory power. Answer B provides superior structure and actionability with concrete empirical criteria, though accepts the question's framing more readily. Answer C appears to be a meta-commentary on a debate not present in the other answers, creating confusion; it offers synthesis without adding substantive analysis, and its 'middle ground' position adds little beyond what A already argued more rigorously about the inadequacy of binary framing.

## Should agentic AI systems be allowed to spend money autonomously?

- **single** - score 0.738, rank 1
- **debate** - score 0.563, rank 3
- **council** - score 0.575, rank 2

> Judge rationale: Answer B provides the most balanced and actionable framework, identifying concrete conditions under which autonomous spending could work while acknowledging real risks. It surfaces practical considerations (global coordination difficulties, existing delegation mechanisms) and specifies falsifiable conditions that would change the conclusion. Answer C offers deeper philosophical insight about the agency question but suffers from treating all autonomous spending as categorically equivalent and dismissing gradualist approaches too quickly. Answer A attempts synthesis but lacks original analysis—it summarizes a debate between unspecified parties rather than directly addressing the question, resulting in vague conclusions about 'context-dependent implementation' without the practical specificity of B or philosophical depth of C.

## Will fine-tuned small models displace frontier-model API calls for most production use cases?

- **single** - score 0.750, rank 2
- **debate** - score 0.600, rank 3
- **council** - score 0.750, rank 1

> Judge rationale: Answer C provides the deepest insight by identifying hidden assumptions in the question itself—particularly that 'most' conflates different concepts and that the dichotomy may be generative rather than competitive. Answer B offers the most rigorous, actionable analysis with concrete percentages, clear evidence requirements, and balanced consideration of both sides. Answer A, while structured as a debate evaluation, makes unsupported claims about what the 'truth most likely is' without justifying its hybrid future prediction or the percentage splits it implies. C's philosophical depth about moving targets and social infrastructure reveals blindspots others miss, though B's specificity makes it more immediately useful for decision-making.

## Is synthetic training data a dead end or the future of model improvement?

- **single** - score 0.757, rank 2
- **debate** - score 0.703, rank 3
- **council** - score 0.757, rank 1

> Judge rationale: Answer B provides the deepest insight by identifying that the binary framing itself is problematic and distinguishing between capability and alignment—a crucial blindspot others underemphasize. Answer A offers superior actionability with clear falsification criteria and concrete examples, plus strong rigor in qualifying claims. Answer C, while competent, is derivative—it presents itself as synthesizing a debate but doesn't add substantial new considerations beyond what A and B already cover. B's weakness is lower actionability (more philosophical than practical), but its meta-level critique of the question and emphasis on irreducible human values represent genuinely non-obvious contributions.

## Does interpretability research actually make AI systems safer?

- **single** - score 0.772, rank 2
- **debate** - score 0.600, rank 3
- **council** - score 0.765, rank 1

> Judge rationale: Answer A provides the most sophisticated analysis, making the crucial distinction between 'legibility and control, diagnosis and cure'—a non-obvious insight that cuts to the heart of the question. It rigorously identifies the missing causal chain while acknowledging interpretability's value. Answer C excels at surfacing specific blindspots (the 'looking under the streetlight' problem, false confidence) and provides highly actionable falsification criteria. Answer B, while structured, reads more like a debate summary than direct analysis, offering less novel insight and weaker actionability despite reasonable coverage of trade-offs.

---

**Caveats.** Single-judge evaluation by an LLM shares biases with the systems under test; small N; the council answer is a synthesis of more raw tokens than the single answer. Treat this as a directional signal, not a benchmark.
