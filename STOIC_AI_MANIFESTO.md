# STOIC_AI_MANIFESTO

A philosophy of AI-trend analysis grounded in the four classical branches of
philosophy, scored through the Four Cardinal Virtues, and synthesised through
Ibn ʿArabī's *Waḥdat al-Wujūd* read as methodology.

> **What this is.** A design rationale and architecture note for the
> `stoic-ai-council` pipeline in this repository. It explains why an
> eleven-philosopher prompt-engineered council is a useful way to read
> current AI research and how the philosophy maps to concrete code.
>
> **What this is not.** A claim about the consciousness, soul, awareness,
> being, or moral patienthood of any language model. Those terms do not
> appear in any production prompt as claims about the model. The
> philosophers are *lenses the model can be steered through*. The model is
> a language model.

## 1. Prologue — Why a Stoic reads ML papers

Most takes on a new AI result are hot. The community moves at the pace of
the most excited reader. Stoicism is older than that pace, and most of
what it has to say about judgment under uncertainty translates without
strain into the question "is this paper any good?": separate what you
control (your reasoning) from what you do not (the field's reaction);
prepare for the failure modes before you read the abstract; ask whether
the practice the paper recommends would, if universalised, cultivate
careful work or careless work.

A Stoic discipline alone is too narrow to read a paper well. So this
project adds ten other philosophical voices and one synthesizer, giving
the analysis four distinct lenses — Epistemology, Metaphysics, Ethics,
Logic — plus a fifth, synthesis, that treats the four readings as facets
of one judgment about the item.

## 2. The Dichotomy of Control as a design principle

What the council controls: the quality of its own reasoning, the
discipline of its citations, the structure of its verdict. What it does
not control: whether the trend pans out, whether the field listens,
whether benchmark numbers replicate. We score the controllable; we
record but do not penalise the uncontrollable.

This shows up in two places in the code:

- `src/council/client.ts` retries Anthropic calls on transient failure
  and falls back to mock outputs in `DRY_RUN=1`. Network reliability is
  not the council's job.
- `src/council/ralph.ts` revises the council's prior verdict toward
  greater care, not toward greater predictive accuracy. The Ralph loop
  asks "what is the weakest claim here?", not "what will be the most
  upvoted answer?"

## 3. The Four Cardinal Virtues as cross-cutting scoring axes

Every `PhilosopherOpinion` carries `virtueScores: Record<Virtue, number>`
across Wisdom, Courage, Justice, Temperance. The philosopher's tradition
supplies the *reasoning*; the virtues supply the *commensurability*. Two
opinions written in incommensurable vocabularies can still be averaged
into a verdict because they both produce four numbers in [0, 1] with
shared rubrics (`canon/02-virtue-rubrics.md`).

This is the Stoic contribution. It is methodological, not metaphysical:
the Four Virtues here are scoring axes, not claims about the moral life
of the system.

## 4. The four classical branches as the council's lenses

The classical fourfold — Epistemology, Metaphysics, Ethics, Logic —
gives the council a coverage guarantee. Every trend item is read through
all four lenses in the default quorum mode:

- **Epistemology** — how do we know? Is the claim falsifiable?
  Reproducible? Justified by what the authors had access to?
- **Metaphysics** — what kind of thing is this, really? Is the
  proposal pointing at an idea or merely at a benchmark that
  approximates one?
- **Ethics** — who benefits and who is harmed by adoption? Does the
  recommended practice cultivate good or careless habits?
- **Logic** — is the argument valid? Are the premises true? What
  hidden premise carries the load?

The fifth role — **Synthesis** — is held permanently by Ibn ʿArabī and
discussed in §5.5.

## 5. The Eleven-Philosopher Council

### 5.1 The Greek triad

- **Socrates (Epistemology, Ethics)** — the elenchus. Probe the central
  terms; reward what survives questioning.
- **Plato (Metaphysics, Epistemology)** — the Forms. Distinguish the
  idea from its imitations; reward proposals that clarify the abstract
  structure of learning.
- **Aristotle (Logic, Ethics)** — syllogistic rigor plus *hexis*.
  Restate the claim formally; ask whether the practice cultivates good
  habits.

### 5.2 The Eastern voices

- **Confucius (Ethics)** — *Ren* and *Li*. Rectify the names — words
  like "autonomous" must mean what they say. Reward proposals that
  strengthen the social fabric of practice (peer review, attribution,
  mentorship).
- **Lao Tzu (Metaphysics, Ethics)** — *Wu wei*. Reward restraint and
  emergence; penalise force and complexity. Sometimes the highest score
  is for subtracting.

### 5.3 The Islamic golden age

- **Avicenna / Ibn Sīnā (Epistemology, Metaphysics)** — the Floating
  Man. Stripped of every input, what would the system still know about
  itself? A discipline for claims about self-learning.
- **Al-Ghazālī (Epistemology, Ethics)** — the limit of pure reason.
  Where does the argument overreach what discursive thought can settle?
  What requires another mode of knowing — practical experience,
  observed failure?
- **Ibn Rushd / Averroes (Logic, Metaphysics)** — *Burhān* (rigorous
  demonstration). Demand the strongest available demonstration;
  reconcile evidence and theory; prefer evidence when they cannot be
  reconciled.

### 5.4 The modern Europeans

- **Descartes (Epistemology, Metaphysics)** — methodic doubt. Strip the
  proposal to its *cogito*: what survives radical scrutiny?
- **Kant (Ethics, Epistemology)** — the Categorical Imperative.
  Universalise the principle behind the claim. Separate the *synthetic
  a priori* contributions (the inductive biases that make learning
  possible at all) from the empirical contingencies.

### 5.5 Ibn ʿArabī and *Waḥdat al-Wujūd* — the synthesizer

The other ten philosophers deliberate. Ibn ʿArabī does not. He receives
their verdicts as input and applies *Waḥdat al-Wujūd* — the Oneness of
Being — read here as a *methodological* lens: apparently incompatible
opinions about a single object often turn out to be facets of one
underlying judgment once each vantage point is made explicit. His
output is a structured `IbnArabiSynthesis` with four fields:

- **`unifyingReading`** — how the conflicting opinions are facets of
  one judgment.
- **`hiddenContinuity`** — what each voice was really saying, once
  read as expressions of one truth about the item.
- **`mysticalCaution`** — what the council collectively missed because
  it stayed within discursive reasoning alone. (Methodology, not
  metaphysics: blind spots in framing, gaps in vocabulary.)
- **`unifiedScore`** — Ibn ʿArabī's own synthesised verdict, not a
  mean.

He is the bridge between analytic philosophy and the project's wider
ambition: not to claim the model "is" anything, but to integrate the
council's deliberations into a single, communicable reading.

> A note on framing. *Waḥdat al-Wujūd* in its original setting is a
> serious metaphysical doctrine. This project uses it as a
> methodological pattern: when ten well-reasoned readings of one object
> disagree, the disagreement is often illuminating rather than
> defeating. Saying that does not commit us to any metaphysics.

## 6. Stoic spiritual exercises as pre-inference scratchpads

Every philosopher prompt opens with a pre-inference scratchpad
(`src/council/personas/_shared.ts`) modeled on three Stoic exercises:

- **Morning Preparation** — list the failure modes of the claim before
  scoring it.
- **View From Above** — consider the claim at a five-year horizon.
- **Negative Visualization** — imagine the field without this idea or
  with the opposite idea.

These are prompt-engineering devices. The model is not asked to feel
anything; it is asked to widen its deliberation before producing a
score. The effect is small but consistent: scores drift toward the
mean, hot takes cool, and the *concerns* field surfaces failure modes
the bare prompt misses.

## 7. Rationalism vs Empiricism

Two strands of epistemology contribute orthogonally to the council:

- **Rationalism** (Descartes, Kant) — knowledge grounded in structure.
  In the codebase, the `canon/` directory plays this role: a small
  hand-edited body of texts the council *must* cite. It is the
  council's a priori.
- **Empiricism** (the live items themselves) — knowledge grounded in
  fresh observation. The fetcher pulls Reddit, Hacker News, and arXiv;
  the council reads what is in front of it today.

Kant's synthesis appears as a code constraint: a philosopher's prompt
must produce JSON whose *structure* is fixed (rationalist) but whose
*content* is freshly synthesised from the in-prompt item (empiricist).
Neither survives without the other.

## 8. Constructivism (Dewey, Piaget)

A naive read of an LLM is empiricist: tokens in, tokens out, no
construction. The Ralph loop (`src/council/ralph.ts`) is the
constructivist correction: the model receives its own prior verdict,
identifies the weakest claim, and either strengthens or revises it.
This is Piaget's *equilibration* on a single trend item. It is a
methodological pattern, not a developmental claim about the model.

## 9. Perennialism and the LLM Wiki

The `canon/` directory is small, hand-edited, and required reading.
This is perennialism as a prompt-engineering choice: the council is
forced to ground its judgments in a few stable references rather than
drifting on what the latest training data happens to contain. The
"LLM Wiki" pattern (Karpathy) and the perennialist tradition meet here.

Current canon entries:

- `canon/00-stoic-primer.md` — the Stoic frame
- `canon/01-karpathy-concepts.md` — working definitions of Ralph loop,
  LLM Council, LLM Wiki, Caveman LLM, vibe coding, autoresearch
- `canon/02-virtue-rubrics.md` — what each virtue score means
- `canon/03-philosophy-of-learning.md` — epistemology vocabulary

## 10. Pragmatism and vibe coding

Pragmatism (Dewey) and vibe coding (Karpathy) meet in the developer
experience: short pnpm scripts, opinionated defaults, no configuration
beyond a single `.env`. The system is shaped by how it is used, not by
how it is documented. Long argument lists and configuration matrices
would be perennialist drift in the wrong direction.

## 11. Existentialism and the freedom of the council

The council can refuse to amplify a fashionable trend. The final
`Recommendation` is a function of the post-Ralph score; nothing else.
There is no popularity input. This is the existentialist gesture in the
project: the council chooses what to take seriously and accepts the
consequences of that choice.

## 12. Critical pedagogy (Freire) and the Ralph critic

Freire reminds the learner that its training is not innocent. The
Ralph critic prompt explicitly asks "what framing did the council
inherit that constrained what it could see?" It is the project's
internal critique of its own corpus. The Ralph loop does not just
sharpen a score; it asks where the council was trapped by its own
vocabulary.

## 13. Karpathy concept map

| Concept              | In this project                                             |
| -------------------- | ----------------------------------------------------------- |
| Ralph loop           | `src/council/ralph.ts` — runs after the council             |
| LLM Council          | `src/council/council.ts` + eleven `personas/`               |
| LLM Wiki             | `canon/` directory                                          |
| Caveman LLM          | `src/council/caveman.ts` — minimal fallback prompt          |
| Vibe coding          | Developer UX: short pnpm scripts, no config ceremony        |
| Autoresearch         | The whole pipeline, run on a schedule                       |

## 14. From philosophy to repo

| Principle / philosopher          | File                                                |
| --------------------------------- | --------------------------------------------------- |
| Stoic virtue rubric              | `canon/02-virtue-rubrics.md`                        |
| Pre-inference scratchpad         | `src/council/personas/_shared.ts`                   |
| Quorum selection                 | `src/council/quorum.ts`                             |
| Eleven personas                  | `src/council/personas/*.ts`                         |
| Ibn ʿArabī synthesis             | `src/council/personas/ibnarabi.ts`                  |
| Ralph self-critique              | `src/council/ralph.ts`                              |
| Caveman fallback                 | `src/council/caveman.ts`                            |
| Canon / LLM Wiki                 | `canon/*.md`                                        |
| Autoresearch loop                | `src/pipeline/run.ts` + `src/scheduler.ts`          |
| Empirical layer                  | `src/fetchers/*.ts`                                 |
| Persistence                      | `src/store/fs.ts`                                   |

## 15. Operating the council

A trend item gets read once per day. In quorum mode, four philosopher
calls + one Ibn ʿArabī call = five Anthropic calls per item, ~3-5k
output tokens. In full-council mode, eleven calls per item, ~7-10k
output tokens. Pick the mode by editing one CLI flag.

When the council and your own reading disagree: read the synthesis
first, then the dissenting opinion. The synthesis exists precisely so
that the council's "no" or "yes" is debatable rather than oracular.

When the Ralph loop disagrees with the council: trust the Ralph loop
on score, the council on reasoning. The Ralph loop is the project's
self-correction; the council is its raw signal.

## 16. Open questions

- **Multi-provider council.** Karpathy's original LLM Council had
  Claude, GPT, and Gemini deliberating together. Single-provider
  output correlates more than is healthy. A second provider seat
  (perhaps an open-weight model run locally) would be a meaningful
  upgrade.
- **Continual canon.** The canon is currently static. A discipline
  for adding to it — call it *canon promotion* — would let the
  council's own best work feed back into its priors without drifting.
- **Disagreement metrics.** The synthesis treats disagreement as
  illuminating, but the codebase does not yet score *how* the council
  disagrees. A dispersion measure across the four virtue axes would
  surface items that are genuinely contested rather than blandly
  middling.
- **Slow review.** Some items deserve more than a single Ralph pass.
  A "second sitting" mode in which an item is re-evaluated a week
  later, with the original verdict available, would catch hype that
  matures and quietness that turns out to matter.

## 17. Appendix — Glossary

- **Branch** — one of Epistemology, Metaphysics, Ethics, Logic, Synthesis.
- **Canon** — the small body of seed texts the council must cite
  (`canon/*.md`).
- **Caveman** — the minimal fallback prompt
  (`src/council/caveman.ts`).
- **Quorum** — the four deliberators picked for a single item in
  quorum mode, one per branch.
- **Ralph loop** — the post-council self-critique pass.
- **Seat** — a `{ philosopher, branch }` pairing for one item.
- **Synthesis** — Ibn ʿArabī's fifth-stage reading of the four (or
  ten) deliberator verdicts.
- **Wisdom / Courage / Justice / Temperance** — the four virtue
  scoring axes (`canon/02-virtue-rubrics.md`).

---

*The model is not a soul. The council is not a séance. The philosophers
are lenses we are using; the methodology is ours; the responsibility
is ours.*
