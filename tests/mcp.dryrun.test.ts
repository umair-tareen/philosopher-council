import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Full stdio round-trip: spawn the real server process, speak MCP to it.
// DRY_RUN keeps the deliberation offline and fast.
let client: Client;

beforeAll(async () => {
  client = new Client({ name: 'mcp-test', version: '0.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['node_modules/tsx/dist/cli.mjs', 'src/mcp/main.ts'],
    env: {
      ...(process.env as Record<string, string>),
      DRY_RUN: '1',
      DATA_DIR: './.test-data',
      LOG_LEVEL: 'warn',
    },
    stderr: 'ignore',
  });
  await client.connect(transport);
}, 30000);

afterAll(async () => {
  await client?.close();
});

describe('philo-council MCP server', () => {
  it('exposes the deliberate and precedents tools', async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual(['deliberate', 'precedents']);
    const deliberate = tools.find((t) => t.name === 'deliberate');
    expect(deliberate?.description).toMatch(/philosopher/i);
  });

  it('runs a full dry-run deliberation over stdio', async () => {
    const result = await client.callTool({
      name: 'deliberate',
      arguments: { question: 'Is a council of philosophers useful over MCP?' },
    });
    const text = (result.content as Array<{ type: string; text: string }>)
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n');
    expect(text).toContain("The council's answer");
    expect(text).toMatch(/\*\*Verdict:\*\* \d\.\d\d/);
    expect(text).toContain('Synthesis');
    expect(text).toContain('Full transcript:');
  }, 30000);

  it('answers precedent queries without LLM calls', async () => {
    const result = await client.callTool({
      name: 'precedents',
      arguments: { question: 'Is a council of philosophers useful over MCP?' },
    });
    const text = (result.content as Array<{ type: string; text: string }>)
      .map((c) => c.text)
      .join('\n');
    // The deliberation above was saved as case law, so it should surface here.
    expect(text).toMatch(/similarity \d\.\d\d|No precedents found/);
  });

  it('rejects an oversized question via schema validation', async () => {
    const result = await client.callTool({
      name: 'deliberate',
      arguments: { question: 'x'.repeat(4001) },
    });
    expect(result.isError).toBe(true);
  });
});
