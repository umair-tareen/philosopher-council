import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const DATA_DIR = './.test-data-store';

beforeAll(async () => {
  process.env.DRY_RUN = '1';
  process.env.DATA_DIR = DATA_DIR;
  await rm(DATA_DIR, { recursive: true, force: true });
});

afterAll(async () => {
  await rm(DATA_DIR, { recursive: true, force: true });
});

describe('fs store', () => {
  it('skips corrupted item files instead of crashing the run', async () => {
    const { loadTodaysItems, saveItem } = await import('../src/store/fs.js');
    await saveItem({
      id: 'good-1',
      source: 'reddit',
      title: 'A good item',
      url: 'https://example/good',
      publishedAt: '2026-06-09T00:00:00Z',
      fetchedAt: '2026-06-09T01:00:00Z',
      tags: [],
    });
    const day = new Date().toISOString().slice(0, 10);
    const dir = path.join(DATA_DIR, 'trends', day);
    await writeFile(path.join(dir, 'broken-bad-1.item.json'), '{ not json !!!');

    const items = await loadTodaysItems();
    expect(items.length).toBe(1);
    expect(items[0]?.id).toBe('good-1');
  });

  it('skips corrupted verdict files too', async () => {
    const { loadTodaysVerdicts } = await import('../src/store/fs.js');
    const day = new Date().toISOString().slice(0, 10);
    const dir = path.join(DATA_DIR, 'trends', day);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'broken-bad-1.verdict.json'), '[truncated');

    const verdicts = await loadTodaysVerdicts();
    expect(verdicts.length).toBe(0);
  });

  it('saveItem writes atomically: valid JSON round-trips with no .tmp left behind', async () => {
    const { saveItem, loadTodaysItems } = await import('../src/store/fs.js');
    const file = await saveItem({
      id: 'atomic-1',
      source: 'arxiv',
      title: 'Atomic write check',
      url: 'https://example/atomic',
      publishedAt: '2026-06-13T00:00:00Z',
      fetchedAt: '2026-06-13T01:00:00Z',
      tags: ['x'],
    });
    expect(file.endsWith('.item.json')).toBe(true);
    const items = await loadTodaysItems();
    expect(items.some((i) => i.id === 'atomic-1')).toBe(true);

    const day = new Date().toISOString().slice(0, 10);
    const dir = path.join(DATA_DIR, 'trends', day);
    const tmps = (await readdir(dir)).filter((f) => f.includes('.tmp'));
    expect(tmps).toEqual([]);
  });
});

describe('writeFileAtomic', () => {
  it('survives concurrent writes to the same file without corruption', async () => {
    const { writeFileAtomic } = await import('../src/store/atomic.js');
    const file = path.join(DATA_DIR, 'concurrent.json');
    const payloads = Array.from({ length: 25 }, (_, i) =>
      JSON.stringify({ writer: i, padding: 'x'.repeat(500) }),
    );
    await Promise.all(payloads.map((p) => writeFileAtomic(file, p)));

    // Whatever write landed last, the file must be one intact payload...
    const content = await readFile(file, 'utf-8');
    expect(payloads).toContain(content);
    expect(() => JSON.parse(content)).not.toThrow();

    // ...and no temp files may be left behind.
    const leftovers = (await readdir(DATA_DIR)).filter((f) => f.endsWith('.tmp'));
    expect(leftovers).toEqual([]);
  });
});
