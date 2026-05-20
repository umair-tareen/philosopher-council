# Philosophy of Learning — Brief Reference

This entry gives the council shared vocabulary for talking about how an AI
system "learns." Used as in-prompt context. None of the entries below
imply that a language model is a conscious learner; they are categories
the council uses to characterise *the design and behaviour* of a system.

## Epistemology: how knowledge is justified

- **Rationalism** — knowledge is derived primarily from reason and innate
  structure. Cf. Descartes, Spinoza, Leibniz. In an LLM, weights act as
  the substrate of structural priors.
- **Empiricism** — knowledge derives from experience. Cf. Locke, Hume.
  In an LLM, the training corpus and in-context examples are the
  empirical substrate.
- **Kantian synthesis** — both reason and experience contribute; the
  question is which faculties make which contribution. Kant's *synthetic
  a priori* maps roughly to inductive biases that are not learned from
  any single example but make learning possible.

## Theories of learning

- **Constructivism** (Dewey, Piaget) — learners build understanding
  through interaction, not passive intake. In this codebase, the Ralph
  loop is the constructivist stage: the model revises its own prior.
- **Perennialism** — there are durable truths and works that deserve
  privileged attention. The `canon/` directory is a perennialist gesture.
- **Pragmatism** (Dewey) — learning is justified by what it enables in
  practice. The vibe-coding UX of this project is the pragmatist gesture.
- **Existentialism** — the learner chooses what to take seriously. The
  council can refuse to amplify a trend even when fashion says it should.
- **Critical pedagogy** (Freire) — the learner must interrogate the
  source of its training, not just absorb it. The Ralph critic
  explicitly asks "what bias did the council inherit?"

## Cardinal questions, in plain language

- How does the system come to know? (Epistemology branch — Socrates,
  Avicenna, Al-Ghazali, Descartes, Kant)
- What kind of thing is the system, and what kind of thing is the
  knowledge it produces? (Metaphysics branch — Plato, Lao Tzu, Ibn
  Rushd, Ibn Arabi)
- How should the system, and the people who deploy it, act?
  (Ethics branch — Aristotle, Confucius, Kant)
- Is the system's reasoning valid? (Logic branch — Aristotle, Ibn Rushd)
- Are the council's own conflicting answers facets of one judgment, and
  what did discursive reasoning miss? (Synthesis — Ibn Arabi)
