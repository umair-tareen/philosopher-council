import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';

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
    expect((body.match(/event: opinion/g) ?? []).length).toBe(4); // quorum
    expect(body).toContain('event: synthesis');
    expect(body).toContain('event: verdict');
    expect(body).toContain('event: done');
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
});
