import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { createServer, type ServerResponse } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import { PHILOSOPHERS } from '../council/registry.js';
import { logger } from '../logger.js';
import { runAsk } from '../pipeline/ask.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));

function sse(res: ServerResponse, event: string, data: unknown): void {
  if (res.writableEnded || res.destroyed) return;
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

const MAX_QUESTION_LEN = 4000;

async function handleStream(res: ServerResponse, url: URL): Promise<void> {
  const question = url.searchParams.get('q')?.trim();
  if (!question) {
    res.writeHead(400, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'missing q parameter' }));
    return;
  }
  if (question.length > MAX_QUESTION_LEN) {
    res.writeHead(413, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: `question exceeds ${MAX_QUESTION_LEN} chars` }));
    return;
  }
  const fullCouncil = url.searchParams.get('full') === '1';
  const modeParam = url.searchParams.get('mode') ?? 'deliberation';
  const { DEBATE_MODES, adviseMode } = await import('../council/modes.js');
  let debateMode = modeParam as keyof typeof DEBATE_MODES;
  let advisorReason = '';
  if (modeParam === 'auto') {
    try {
      const advice = await adviseMode(question);
      debateMode = advice.mode;
      advisorReason = advice.reason;
    } catch {
      debateMode = 'deliberation';
    }
  }
  if (!Object.hasOwn(DEBATE_MODES, debateMode)) debateMode = 'deliberation';

  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
  });

  // Stop burning provider calls the moment the browser tab goes away.
  const abort = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) {
      logger.info(
        { question: question.slice(0, 60) },
        'sse client disconnected; aborting deliberation',
      );
      abort.abort();
    }
  });

  try {
    sse(res, 'mode', { mode: debateMode, advisorReason });
    const { verdict, file } = await runAsk({
      question,
      fullCouncil,
      debateMode,
      signal: abort.signal,
      onPrecedents: (precedents) =>
        sse(res, 'precedents', {
          precedents: precedents.map((p) => ({
            question: p.question,
            date: p.date,
            finalScore: p.finalScore,
            finalRecommendation: p.finalRecommendation,
            file: p.file,
          })),
        }),
      onClerk: () => sse(res, 'clerk', { briefed: true }),
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
        onToken: (philosopher, t) => sse(res, 'token', { philosopher, t }),
        onSeatFailed: (philosopher) => sse(res, 'seatfailed', { philosopher }),
        onOpinion: (opinion) => sse(res, 'opinion', opinion),
        onSynthesis: (synthesis) => sse(res, 'synthesis', synthesis),
        onAnswerToken: (t) => sse(res, 'answertoken', { t }),
        onAnswer: (answer) => sse(res, 'answer', { answer }),
      },
    });
    sse(res, 'verdict', {
      finalScore: verdict.finalScore,
      finalRecommendation: verdict.finalRecommendation,
      ralph: verdict.ralph,
      minority: verdict.minority,
      mode: verdict.mode,
      debateMode: verdict.debateMode,
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

  // Bind to loopback by default - the chamber drives billable provider calls
  // with no auth. Set UI_HOST=0.0.0.0 to deliberately expose it on the LAN.
  const host = process.env.UI_HOST || '127.0.0.1';
  await new Promise<void>((resolve) => server.listen(port, host, resolve));
  logger.info({ port, host }, 'council chamber ui listening');
  const shown = host === '127.0.0.1' ? 'localhost' : host;
  console.log(`\n  🏛️  Council chamber: http://${shown}:${port}\n`);
  if (host !== '127.0.0.1') {
    console.log(
      '  ⚠️  Exposed on a non-loopback interface with no auth - anyone who can reach it spends your API budget.\n',
    );
  }
  return server;
}
