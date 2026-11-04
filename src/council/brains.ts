import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import type { PhilosopherId, QuoteCheck } from '../types.js';

// Each seat's "brain" is a folder of markdown distilled from two public-domain
// books: canon/brains/<id>/{_hot,frameworks,books,voice,quotes,sources}.md.
// The pattern (a compiled brain per seat, verbatim quotes checked against it)
// follows Roast Room (github.com/nateherkai/roast-room, MIT).

const HERE = path.dirname(fileURLToPath(import.meta.url));
// Resolves from src/council (tsx) and dist/council (built) alike.
const BRAINS_DIR = path.resolve(HERE, '..', '..', 'canon', 'brains');

/** Loaded into the prompt in this order; sources.md is for humans and stays out. */
const PROMPT_FILES = [
  '_hot.md',
  'frameworks.md',
  'books.md',
  'voice.md',
  'quotes.md',
] as const;

const cache = new Map<PhilosopherId, string>();

function read(id: PhilosopherId, file: string): string {
  const p = path.join(BRAINS_DIR, id, file);
  return existsSync(p) ? readFileSync(p, 'utf-8').trim() : '';
}

/** The seat's brain as one prompt block, or '' when it has none (or brains are off). */
export function loadBrain(id: PhilosopherId): string {
  if (!config.brains) return '';
  const hit = cache.get(id);
  if (hit !== undefined) return hit;
  const parts = PROMPT_FILES.map((f) => [f, read(id, f)] as const).filter(([, t]) => t);
  const block = parts.length
    ? parts.map(([f, t]) => `===== brain/${f} =====\n${t}`).join('\n\n')
    : '';
  cache.set(id, block);
  return block;
}

const BRAIN_RULES = `## Your brain
Below is your brain: notes distilled from two of your own books. It is your memory.
- Reason from it first. Cite a framework or idea by its source id, e.g. (SOC-S01).
- Quote ONLY lines that appear word for word in brain/quotes.md, inside double quotes, with the source id. Every quote is checked against that file; an unverifiable quote is flagged to the reader.
- Everything else is your own reasoning in your own voice, unquoted. When you carry an ancient idea into a modern AI question, say it is your application, not the text.
- Put the source ids you used into "citations".`;

/** Appends the brain (if any) to a persona's system prompt. */
export function withBrain(system: string, id: PhilosopherId): string {
  const brain = loadBrain(id);
  return brain ? `${system}\n\n${BRAIN_RULES}\n\n${brain}` : system;
}

// ---------- quote verification ----------

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[‘’`]/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const QUOTE_RE = /["“]([^"”]{12,400})["”]/g;
const MIN_WORDS = 4;

/**
 * Finds the double-quoted passages in `text` and checks each against `corpus`
 * (whitespace-, case- and punctuation-insensitive). Short phrases under four
 * words are treated as terms, not quotations, and skipped.
 */
export function verifyQuotes(text: string, corpus: string): QuoteCheck {
  const haystack = normalize(corpus);
  const verified: string[] = [];
  const unverified: string[] = [];
  for (const m of text.matchAll(QUOTE_RE)) {
    const quote = (m[1] ?? '').trim();
    const n = normalize(quote);
    if (n.split(' ').length < MIN_WORDS) continue;
    (haystack.includes(n) ? verified : unverified).push(quote);
  }
  return { verified, unverified };
}

/** Checks a seat's quotes against its own brain/quotes.md. Undefined when the seat has no quotes file. */
export function checkSeatQuotes(id: PhilosopherId, text: string): QuoteCheck | undefined {
  if (!config.brains) return undefined;
  const corpus = read(id, 'quotes.md');
  if (!corpus) return undefined;
  return verifyQuotes(text, corpus);
}
