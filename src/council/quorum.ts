import type { Branch, PhilosopherId } from '../types.js';
import { BRANCH_INDEX } from './registry.js';

const DELIBERATIVE_BRANCHES: Branch[] = [
  'logic',
  'metaphysics',
  'epistemology',
  'ethics',
];

export interface QuorumSeat {
  id: Exclude<PhilosopherId, 'ibnarabi'>;
  branch: Branch;
}

export function selectQuorum(seed: string): QuorumSeat[] {
  const rand = mulberry32(hash32(seed));
  const seats: QuorumSeat[] = [];
  const used = new Set<PhilosopherId>();
  for (const branch of DELIBERATIVE_BRANCHES) {
    const pool = BRANCH_INDEX[branch].filter((p) => !used.has(p));
    if (pool.length === 0) continue;
    const idx = Math.floor(rand() * pool.length);
    const choice = pool[idx];
    if (!choice || choice === 'ibnarabi') continue;
    seats.push({ id: choice as Exclude<PhilosopherId, 'ibnarabi'>, branch });
    used.add(choice);
  }
  return seats;
}

function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(a: number): () => number {
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
