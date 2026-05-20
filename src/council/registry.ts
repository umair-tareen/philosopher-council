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
  avicenna: {
    id: 'avicenna',
    displayName: 'Ibn Sīnā (Avicenna)',
    primaryBranch: 'epistemology',
    secondaryBranch: 'metaphysics',
    tradition: 'Persian / Islamic',
  },
  alghazali: {
    id: 'alghazali',
    displayName: 'Al-Ghazālī',
    primaryBranch: 'epistemology',
    secondaryBranch: 'ethics',
    tradition: 'Persian / Islamic',
  },
  ibnrushd: {
    id: 'ibnrushd',
    displayName: 'Ibn Rushd (Averroes)',
    primaryBranch: 'logic',
    secondaryBranch: 'metaphysics',
    tradition: 'Andalusian / Islamic',
  },
  descartes: {
    id: 'descartes',
    displayName: 'René Descartes',
    primaryBranch: 'epistemology',
    secondaryBranch: 'metaphysics',
    tradition: 'Modern European',
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
    primaryBranch: 'synthesis',
    secondaryBranch: 'metaphysics',
    tradition: 'Andalusian / Sufi',
  },
};

export const BRANCH_INDEX: Record<Branch, PhilosopherId[]> = {
  epistemology: ['socrates', 'avicenna', 'alghazali', 'descartes', 'kant'],
  metaphysics: ['plato', 'laotzu', 'avicenna', 'ibnrushd', 'descartes'],
  ethics: ['socrates', 'aristotle', 'confucius', 'laotzu', 'alghazali', 'kant'],
  logic: ['aristotle', 'ibnrushd'],
  synthesis: ['ibnarabi'],
};

export const ALL_DELIBERATORS: PhilosopherId[] = [
  'socrates',
  'plato',
  'aristotle',
  'confucius',
  'laotzu',
  'avicenna',
  'alghazali',
  'ibnrushd',
  'descartes',
  'kant',
];
