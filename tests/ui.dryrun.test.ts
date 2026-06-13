import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const PORT = 41973;
let server: Server;

beforeAll(async () => {
  process.env.DRY_RUN = '1';
  process.env.DATA_DIR = './.test-data';
  const { serveUi } = await import('../src/ui/server.js');
  server = await serveUi(PORT);
});

afterAll(() => {
  server?.close();
});

describe('council chamber ui', () => {
  it('serves the chamber page', async () => {
    const res = await fetch(`http://localhost:${PORT}/`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('PHILOSOPHER COUNCIL');
    expect(html).toContain('/api/ask/stream');
  });

  it('streams a full deliberation over SSE', async () => {
    const res = await fetch(
      `http://localhost:${PORT}/api/ask/stream?q=${encodeURIComponent('Is scaling all you need?')}`,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    const body = await res.text();
    expect(body).toContain('event: seats');
    expect(body).toContain('event: token'); // token-level streaming
    expect((body.match(/event: opinion/g) ?? []).length).toBe(4); // quorum
    expect(body).toContain('event: synthesis');
    expect(body).toContain('event: answertoken');
    expect(body).toContain('event: verdict');
    expect(body).toContain('event: done');
    expect(body).toContain('"minority"');
  });

  it('lists transcripts', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/transcripts`);
    expect(res.status).toBe(200);
    const items = (await res.json()) as Array<{ name: string; file: string }>;
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0); // the stream test just saved one
  });

  it('rejects a missing question', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/ask/stream`);
    expect(res.status).toBe(400);
  });

  it('rejects an oversized question', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/ask/stream?q=${'x'.repeat(4001)}`);
    expect(res.status).toBe(413);
  });

  it('serves a saved transcript by name', async () => {
    const list = await fetch(`http://localhost:${PORT}/api/transcripts`);
    const items = (await list.json()) as Array<{ name: string; file: string }>;
    expect(items.length).toBeGreaterThan(0);
    const res = await fetch(`http://localhost:${PORT}/api/transcripts/${items[0]?.file}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/markdown');
    expect((await res.text()).length).toBeGreaterThan(0);
  });

  it('refuses transcript paths that try to escape the asks directory', async () => {
    const attempts = [
      '/api/transcripts/..%2F..%2F..%2Fetc%2Fpasswd.md',
      '/api/transcripts/%2E%2E%2Fsecret.md',
      '/api/transcripts/sub/dir.md',
      '/api/transcripts/no-extension',
    ];
    for (const p of attempts) {
      const res = await fetch(`http://localhost:${PORT}${p}`);
      expect(res.status).toBe(404);
    }
  });

  it('404s unknown routes', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/nope`);
    expect(res.status).toBe(404);
  });
});
