import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { logger } from '../logger.js';
import type { CouncilVerdict, TrendItem } from '../types.js';

function dayDir(kind: 'trends' | 'digests'): string {
  const day = new Date().toISOString().slice(0, 10);
  return path.join(config.dataDir, kind, day);
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function saveItem(item: TrendItem): Promise<string> {
  const dir = dayDir('trends');
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${slugify(item.title) || item.id}-${item.id}.item.json`);
  await writeFile(file, JSON.stringify(item, null, 2));
  return file;
}

export async function saveVerdict(
  item: TrendItem,
  verdict: CouncilVerdict,
): Promise<string> {
  const dir = dayDir('trends');
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${slugify(item.title) || item.id}-${item.id}.verdict.json`);
  await writeFile(
    file,
    JSON.stringify({ item, verdict }, null, 2),
  );
  return file;
}

export async function loadTodaysItems(): Promise<TrendItem[]> {
  const dir = dayDir('trends');
  if (!existsSync(dir)) return [];
  const files = await readdir(dir);
  const out: TrendItem[] = [];
  for (const f of files) {
    if (!f.endsWith('.item.json')) continue;
    const buf = await readFile(path.join(dir, f), 'utf-8');
    // One corrupted file on disk must not take down the whole run.
    try {
      out.push(JSON.parse(buf) as TrendItem);
    } catch (err) {
      logger.warn({ file: f, err: String(err) }, 'skipping unparseable item file');
    }
  }
  return out;
}

export async function loadTodaysVerdicts(): Promise<Array<{ item: TrendItem; verdict: CouncilVerdict }>> {
  const dir = dayDir('trends');
  if (!existsSync(dir)) return [];
  const files = await readdir(dir);
  const out: Array<{ item: TrendItem; verdict: CouncilVerdict }> = [];
  for (const f of files) {
    if (!f.endsWith('.verdict.json')) continue;
    const buf = await readFile(path.join(dir, f), 'utf-8');
    try {
      out.push(JSON.parse(buf) as { item: TrendItem; verdict: CouncilVerdict });
    } catch (err) {
      logger.warn({ file: f, err: String(err) }, 'skipping unparseable verdict file');
    }
  }
  return out;
}

export async function writeDigest(markdown: string): Promise<string> {
  const dir = dayDir('digests');
  await mkdir(dir, { recursive: true });
  const day = new Date().toISOString().slice(0, 10);
  const file = path.join(config.dataDir, 'digests', `${day}.md`);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, markdown);
  return file;
}
