import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { writeFileAtomic } from './atomic.js';

const SEEN_PATH = () => path.join(config.dataDir, '.seen.json');

export async function loadSeen(): Promise<Set<string>> {
  const p = SEEN_PATH();
  if (!existsSync(p)) return new Set();
  const buf = await readFile(p, 'utf-8');
  try {
    const arr = JSON.parse(buf) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export async function saveSeen(set: Set<string>): Promise<void> {
  await writeFileAtomic(SEEN_PATH(), JSON.stringify([...set], null, 2));
}
