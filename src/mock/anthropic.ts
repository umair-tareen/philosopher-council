import type { CouncilCall } from '../council/client.js';

interface PersonaProfile {
  name: string;
  match: RegExp;
  oneLiner: string;
  reasoning: string;
  scores: { wisdom: number; courage: number; justice: number; temperance: number };
  concerns: string[];
}

const PROFILES: PersonaProfile[] = [
  {
    name: 'Socrates',
    match: /You are Socrates/,
    oneLiner: 'Questions survive but the answer rests on undefined terms.',
    reasoning:
      'I asked the claim three questions and only one returned a coherent reply. The notion of "self-improvement" remains undefined under repeated probing; the speaker means several non-equivalent things by it.',
    scores: { wisdom: 0.55, courage: 0.5, justice: 0.6, temperance: 0.55 },
    concerns: ['Central term ambiguous', 'No falsifier offered'],
  },
  {
    name: 'Plato',
    match: /You are Plato/,
    oneLiner: 'Points at a Form but mistakes a benchmark for it.',
    reasoning:
      'The proposal gestures toward the Form of an inquiring system but anchors itself to a particular benchmark and so confuses the abstraction with one of its shadows. The instance described is partial light cast on a fuller idea.',
    scores: { wisdom: 0.6, courage: 0.6, justice: 0.55, temperance: 0.5 },
    concerns: ['Conflates benchmark with concept', 'Form unstated'],
  },
  {
    name: 'Aristotle',
    match: /You are Aristotle/,
    oneLiner: 'Argument valid as stated; missing a load-bearing premise.',
    reasoning:
      'Reconstructed as a syllogism the argument is valid, but the major premise — that iteration improves quality monotonically — is empirically false past some bound. The recommended practice would cultivate restraint if and only if iteration is capped.',
    scores: { wisdom: 0.65, courage: 0.55, justice: 0.6, temperance: 0.65 },
    concerns: ['Premise false past iteration 3', 'Habit cultivated only with a cap'],
  },
  {
    name: 'Confucius',
    match: /You are Confucius/,
    oneLiner: 'Names not yet rectified; ritual fabric partially honoured.',
    reasoning:
      'The word "autonomous" is used where "supervised with delay" would be more honest; rectifying the name would cool the claim by half. Mentorship and attribution remain intact, which is to the proposal\'s credit.',
    scores: { wisdom: 0.55, courage: 0.45, justice: 0.65, temperance: 0.6 },
    concerns: ['Name "autonomous" used loosely', 'Stakeholder consent implicit'],
  },
  {
    name: 'Lao Tzu',
    match: /You are Lao Tzu/,
    oneLiner: 'Adds where subtracting would have served better.',
    reasoning:
      'Wu wei would have removed the scaffolding rather than added a critic on top of it. The proposal grows; it does not flow. The same gain may be available with less by trusting the model\'s defaults.',
    scores: { wisdom: 0.55, courage: 0.6, justice: 0.55, temperance: 0.75 },
    concerns: ['Adds complexity', 'Achievable by subtraction'],
  },
  {
    name: 'Ibn Sīnā',
    match: /You are Ibn Sīnā/,
    oneLiner: 'Floating-man test fails: no kernel of self without the inputs.',
    reasoning:
      'Stripped of every context and corpus the proposed system retains nothing that could be called self-knowing. The essence/accident distinction reveals that the proposal\'s "self" is wholly accidental to its context window.',
    scores: { wisdom: 0.5, courage: 0.5, justice: 0.55, temperance: 0.6 },
    concerns: ['"Self" reduces to context', 'Essence not identified'],
  },
  {
    name: 'Al-Ghazālī',
    match: /You are Al-Ghazālī/,
    oneLiner: 'Reason walks confidently past its own limit.',
    reasoning:
      'Where the discursive argument runs out the proposal smooths over with rhetoric. Practical experience and observed failure modes are dismissed as outside scope; they are not. Confidence is inflated where humility is owed.',
    scores: { wisdom: 0.5, courage: 0.45, justice: 0.55, temperance: 0.7 },
    concerns: ['Confidence inflation', 'Ignores practical failure modes'],
  },
  {
    name: 'Ibn Rushd',
    match: /You are Ibn Rushd/,
    oneLiner: 'Demonstration partial; evidence outweighs theory here.',
    reasoning:
      'A proper *burhān* would require independent replication, which is not yet present. The empirical evidence is suggestive but does not cohere with the strongest theoretical framing the authors offer; prefer the evidence.',
    scores: { wisdom: 0.6, courage: 0.55, justice: 0.6, temperance: 0.6 },
    concerns: ['No independent replication', 'Theory/evidence mismatch'],
  },
  {
    name: 'Descartes',
    match: /You are René Descartes/,
    oneLiner: 'Cogito of the proposal survives; periphery does not.',
    reasoning:
      'Methodic doubt strips away the proposal\'s rhetorical envelope and leaves a small, defensible kernel: that iterated critique can sometimes correct overclaims. The wider claims do not survive the same scrutiny.',
    scores: { wisdom: 0.6, courage: 0.5, justice: 0.55, temperance: 0.6 },
    concerns: ['Wider claims unsupported', 'Kernel narrower than advertised'],
  },
  {
    name: 'Kant',
    match: /You are Immanuel Kant/,
    oneLiner: 'Universalisable only with a published iteration cap.',
    reasoning:
      'If every actor adopted unlimited self-critique loops the field would collapse into runaway revision; the maxim therefore cannot be willed as a universal law without a published bound. With that bound the principle universalises cleanly.',
    scores: { wisdom: 0.6, courage: 0.55, justice: 0.7, temperance: 0.6 },
    concerns: ['Requires published cap', 'Empirical contingencies underspecified'],
  },
];

const DEFAULT_PROFILE: Omit<PersonaProfile, 'name' | 'match'> = {
  oneLiner: 'A modest, well-shaped contribution worth tracking.',
  reasoning:
    'The claim is precise enough to be falsified, does not over-promise, and the cited evidence is at least partially independent. Replication by a second group would justify amplification; for now, track.',
  scores: { wisdom: 0.6, courage: 0.55, justice: 0.6, temperance: 0.7 },
  concerns: ['No independent replication yet', 'Benchmarks chosen by the authors'],
};

export function mockComplete(call: CouncilCall): string {
  if (/Ralph-loop critic/i.test(call.system)) {
    return JSON.stringify({
      weaknesses: [
        'Some philosopher opinions lacked specific canon citations',
        'Aggregate score did not weight Logic-branch verdict explicitly',
        'Iteration-cap dependency not surfaced in the consensus line',
      ],
      refinedVerdict:
        'After cross-checking against canon/01 and canon/02, the verdict holds but the item is closer to "track" than "amplify" because evidence is still pre-replication and the iteration-cap condition is load-bearing.',
      refinedScore: 0.55,
      stopConfidence: 0.8,
    });
  }

  if (/You are Ibn ʿArabī/.test(call.system) || /unifyingReading/.test(call.system)) {
    return JSON.stringify({
      unifyingReading:
        'The deliberators appear to disagree on novelty versus restraint, but each is pointing at the same underlying judgment: the idea is interesting precisely because it removes some complexity from a noisy practice, and the disagreement is over how far that subtraction can be pushed before it becomes a different idea entirely.',
      hiddenContinuity:
        'Socrates is asking what survives questioning; Lao Tzu is asking what survives subtraction. They are the same question stated from different vantage points. The ethicists ask who gains and who loses; the logicians ask whether the proposal actually performs the subtraction it promises.',
      mysticalCaution:
        'The council framed the trend within the vocabulary of contemporary AI research and so could not name what the vocabulary itself does not yet name. A follow-up should ask which features of "learning" the field currently has no word for.',
      unifiedScore: 0.62,
    });
  }

  for (const p of PROFILES) {
    if (p.match.test(call.system)) {
      return JSON.stringify({
        virtueScores: p.scores,
        oneLiner: p.oneLiner,
        reasoning: p.reasoning,
        concerns: p.concerns,
        citations: ['canon/02-virtue-rubrics.md', 'canon/03-philosophy-of-learning.md'],
      });
    }
  }

  return JSON.stringify({
    virtueScores: DEFAULT_PROFILE.scores,
    oneLiner: DEFAULT_PROFILE.oneLiner,
    reasoning: DEFAULT_PROFILE.reasoning,
    concerns: DEFAULT_PROFILE.concerns,
    citations: ['canon/02-virtue-rubrics.md', 'canon/03-philosophy-of-learning.md'],
  });
}
