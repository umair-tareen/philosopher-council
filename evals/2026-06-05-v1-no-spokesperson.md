# Eval: single answer vs generic debate vs philosopher council

Blind-judged by `anthropic:claude-sonnet-4-5` on insight, rigor, blind-spot coverage, and actionability. Answers were anonymized and shuffled per question. N=5.

| Strategy | Mean score | Wins (rank 1) | Calls per question |
|----------|-----------|---------------|--------------------|
| single | 0.763 | 5/5 | 1 |
| debate | 0.667 | 0/5 | 3 |
| council | 0.370 | 0/5 | 6 |

## Is chain-of-thought prompting genuine reasoning or sophisticated imitation?

- **single** - score 0.775, rank 1
- **debate** - score 0.650, rank 2
- **council** - score 0.350, rank 3

> Judge rationale: Answer B provides the most rigorous and actionable analysis by clearly articulating testable criteria (transferable causal models, error detection, neurological evidence) that would resolve the question. It identifies concrete empirical failures while acknowledging philosophical complications. Answer C offers useful synthesis and recognizes the phenomenon's resistance to binary classification, but is less precise about what evidence would matter. Answer A, while philosophically sophisticated in identifying the question's framing issues, becomes self-referential and obscure—spending more effort meta-analyzing the question's conceptual structure than engaging the empirical phenomenon, and its claims about 'unanimous recognition' and 'conceptual traps' lack clear support.

## Should agentic AI systems be allowed to spend money autonomously?

- **single** - score 0.750, rank 1
- **debate** - score 0.665, rank 2
- **council** - score 0.473, rank 3

> Judge rationale: Answer B provides the most balanced and actionable response, with concrete examples, clear conditions for autonomous spending, and specific criteria for changing the position. Answer A offers valuable conceptual distinctions (automated vs. autonomous) and identifies key uncertainties, but spends significant space analyzing a debate between unspecified parties rather than directly addressing the question. Answer C, while philosophically intriguing in its meta-analysis of framing issues, remains largely abstract and provides minimal practical guidance—its self-contradictory structure (claiming unity then fragmentation) and theatrical presentation obscure rather than illuminate the core question.

## Will fine-tuned small models displace frontier-model API calls for most production use cases?

- **single** - score 0.800, rank 1
- **debate** - score 0.625, rank 2
- **council** - score 0.400, rank 3

> Judge rationale: Answer B provides the strongest analysis by directly addressing the question with concrete, falsifiable claims supported by specific mechanisms (development velocity, capability ceilings, moving targets). It acknowledges steel-manning the opposing view and specifies what evidence would change the conclusion. Answer A offers reasonable insights about hybrid equilibrium but spends significant space on meta-debate dynamics rather than the core question, reducing actionability. Answer C engages in excessive philosophical abstraction that obscures rather than illuminates the practical question, offering meta-commentary on how different philosophers would frame the issue without providing clear directional guidance on the actual prediction.

## Is synthetic training data a dead end or the future of model improvement?

- **single** - score 0.765, rank 1
- **debate** - score 0.695, rank 2
- **council** - score 0.375, rank 3

> Judge rationale: Answer A provides the most actionable and rigorous analysis, clearly identifying model collapse as the key concern while specifying concrete evidence that would change the conclusion. Answer C offers solid domain-specific insights and acknowledges uncertainty well, but is less precise about falsification criteria. Answer B, while intellectually sophisticated in its meta-critique of the question's framing, prioritizes philosophical analysis over practical guidance—it spends more effort deconstructing why the question is difficult than answering what we can know, making it least actionable despite some valid methodological points about binary framings.

## Does interpretability research actually make AI systems safer?

- **single** - score 0.725, rank 1
- **debate** - score 0.700, rank 2
- **council** - score 0.250, rank 3

> Judge rationale: Answer C provides the most balanced and actionable analysis, clearly articulating both benefits and limitations while specifying concrete evidence that would change the conclusion. Answer B offers strong empirical grounding and correctly identifies key uncertainties, though it's framed as meta-commentary on a debate rather than direct analysis. Answer A is heavily obscured by unnecessary philosophical framing ('the council speaks') and spends more effort critiquing its own methodology than addressing the question—the actual substance (interpretability provides understanding but not guaranteed control) is buried under meta-analysis that adds little value.

---

**Caveats.** Single-judge evaluation by an LLM shares biases with the systems under test; small N; the council answer is a synthesis of more raw tokens than the single answer. Treat this as a directional signal, not a benchmark.
