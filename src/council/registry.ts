import type { Branch, PhilosopherId } from '../types.js';

export interface PhilosopherMeta {
  id: PhilosopherId;
  displayName: string;
  primaryBranch: Branch;
  secondaryBranch?: Branch;
  tradition: string;
}

export const PHILOSOPHERS: Record<PhilosopherId, PhilosopherMeta> = {
  socrates: {
    id: 'socrates',
    displayName: 'Socrates',
    primaryBranch: 'epistemology',
    secondaryBranch: 'ethics',
    tradition: 'Classical Greek',
  },
  plato: {
    id: 'plato',
    displayName: 'Plato',
    primaryBranch: 'metaphysics',
    secondaryBranch: 'epistemology',
    tradition: 'Classical Greek',
  },
  aristotle: {
    id: 'aristotle',
    displayName: 'Aristotle',
    primaryBranch: 'logic',
    secondaryBranch: 'ethics',
    tradition: 'Classical Greek',
  },
  confucius: {
    id: 'confucius',
    displayName: 'Confucius (Kǒng Fūzǐ)',
    primaryBranch: 'ethics',
    tradition: 'Chinese',
  },
  laotzu: {
    id: 'laotzu',
    displayName: 'Lao Tzu',
    primaryBranch: 'metaphysics',
    secondaryBranch: 'ethics',
    tradition: 'Chinese / Taoist',
  },
  kant: {
    id: 'kant',
    displayName: 'Immanuel Kant',
    primaryBranch: 'ethics',
    secondaryBranch: 'epistemology',
    tradition: 'Modern European',
  },
  ibnarabi: {
    id: 'ibnarabi',
    displayName: 'Ibn ʿArabī',
    primaryBranch: 'metaphysics',
    secondaryBranch: 'epistemology',
    tradition: 'Andalusian / Sufi',
  },
};

export const BRANCH_INDEX: Record<Branch, PhilosopherId[]> = {
  epistemology: ['socrates', 'plato', 'kant', 'ibnarabi'],
  metaphysics: ['plato', 'laotzu', 'ibnarabi'],
  ethics: ['socrates', 'aristotle', 'confucius', 'laotzu', 'kant'],
  logic: ['aristotle'],
  // The synthesis is written by the Chair, who holds no seat.
  synthesis: [],
};

export const ALL_DELIBERATORS: PhilosopherId[] = [
  'socrates',
  'plato',
  'aristotle',
  'confucius',
  'laotzu',
  'kant',
  'ibnarabi',
];
