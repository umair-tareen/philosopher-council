import { createServer, type ServerResponse } from 'node:http';
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import { runCouncil } from '../council/council.js';
import { PHILOSOPHERS } from '../council/registry.js';
import { runAsk } from '../pipeline/ask.js';
import { logger } from '../logger.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));

function sse(res: ServerResponse, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

async function handleStream(res: ServerResponse, url: URL): Promise<void> {
  const question = url.searchParams.get('q')?.trim();
  if (!question) {
    res.writeHead(400, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'missing q parameter' }));
    return;
  }
  const fullCouncil = url.searchParams.get('full') === '1';

  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
  });

  try {
    const { verdict, file } = await runAsk({
      question,
      fullCouncil,
      hooks: {
        onSeats: (seats) =>
          sse(res, 'seats', {
            seats: seats.map((s) => ({
              id: s.id,
              branch: s.branch,
              displayName: PHILOSOPHERS[s.id].displayName,
              tradition: PHILOSOPHERS[s.id].tradition,
            })),
          }),
        onOpinion: (opinion) => sse(res, 'opinion', opinion),
        onSynthesis: (synthesis) => sse(res, 'synthesis', synthesis),
        onAnswer: (answer) => sse(res, 'answer', { answer }),
      },
    });
    sse(res, 'verdict', {
      finalScore: verdict.finalScore,
      finalRecommendation: verdict.finalRecommendation,
      ralph: verdict.ralph,
      minority: verdict.minority,
      mode: verdict.mode,
      model: verdict.model,
      file,
    });
    sse(res, 'done', {});
  } catch (err) {
    logger.warn({ err: String(err) }, 'ui stream failed');
    sse(res, 'error', { message: String(err) });
  }
  res.end();
}

async function listTranscripts(): Promise<Array<{ name: string; file: string }>> {
  const dir = path.join(config.dataDir, 'asks');
  if (!existsSync(dir)) return [];
  const files = await readdir(dir);
  return files
    .filter((f) => f.endsWith('.md'))
    .sort()
    .reverse()
    .map((f) => ({ name: f.replace(/\.md$/, ''), file: f }));
}

export async function serveUi(port: number): Promise<import('node:http').Server> {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://localhost:${port}`);
      if (url.pathname === '/') {
        const html = await readFile(path.join(HERE, 'index.html'), 'utf-8');
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }
      if (url.pathname === '/api/ask/stream') {
        await handleStream(res, url);
        return;
      }
      if (url.pathname === '/api/transcripts') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify(await listTranscripts()));
        return;
      }
      const transcriptMatch = url.pathname.match(/^\/api\/transcripts\/([\w.-]+\.md)$/);
      if (transcriptMatch) {
        const file = path.join(config.dataDir, 'asks', transcriptMatch[1] as string);
        if (!existsSync(file)) {
          res.writeHead(404, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ error: 'not found' }));
          return;
        }
        res.writeHead(200, { 'content-type': 'text/markdown; charset=utf-8' });
        res.end(await readFile(file, 'utf-8'));
        return;
      }
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found' }));
    } catch (err) {
      logger.warn({ err: String(err) }, 'ui request failed');
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: String(err) }));
    }
  });

  await new Promise<void>((resolve) => server.listen(port, resolve));
  logger.info({ port }, 'council chamber ui listening');
  console.log(`\n  🏛️  Council chamber: http://localhost:${port}\n`);
  return server;
}
