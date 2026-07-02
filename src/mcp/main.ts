#!/usr/bin/env node
// Entry point for the philo-council MCP server (stdio transport).
//
// This flag MUST be set before any project module is imported: logger.ts
// binds pino to stdout at import time, and stdout belongs to the JSON-RPC
// stream here. The dynamic import below keeps that ordering explicit.
process.env.PHILO_COUNCIL_STDIO = '1';

const { startMcpServer } = await import('./server.js');
await startMcpServer();
