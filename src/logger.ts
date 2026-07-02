import pino from 'pino';
import { config } from './config.js';

// In MCP stdio mode, stdout carries the JSON-RPC protocol stream - a single
// log line there corrupts it. The MCP entrypoint sets this flag before any
// import so every logger call in the codebase lands on stderr instead.
const stdioSafe = process.env.PHILO_COUNCIL_STDIO === '1';

export const logger = stdioSafe
  ? pino({ level: config.logLevel }, pino.destination(2))
  : pino({
      level: config.logLevel,
      transport: process.stdout.isTTY
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    });
