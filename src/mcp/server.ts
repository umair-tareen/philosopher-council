import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { DEBATE_MODES, type DebateModeId } from '../council/modes.js';
import { logger } from '../logger.js';
import { runAsk } from '../pipeline/ask.js';
import { findPrecedents } from '../store/precedents.js';
import type { CouncilVerdict } from '../types.js';

const MODE_IDS = Object.keys(DEBATE_MODES) as [DebateModeId, ...DebateModeId[]];

/** Compact, chat-friendly rendering of a verdict - the full transcript stays on disk. */
export function renderDeliberation(verdict: CouncilVerdict, file: string): string {
  const lines: string[] = [];
  if (verdict.answer) {
    lines.push(`## The council's answer`, '', verdict.answer, '');
  }
  lines.push(
    `**Verdict:** ${verdict.finalScore.toFixed(2)} · ${verdict.finalRecommendation}` +
      `${verdict.debateMode && verdict.debateMode !== 'deliberation' ? ` · format: ${verdict.debateMode}` : ''}`,
    '',
    '**The bench:**',
    ...verdict.opinions.map(
      (o) => `- ${o.displayName} (${o.branch}) ${o.verdictScore.toFixed(2)}: ${o.oneLiner}`,
    ),
    '',
    `**Synthesis (Ibn ʿArabī, ${verdict.synthesis.unifiedScore.toFixed(2)}):** ${verdict.synthesis.unifyingReading}`,
  );
  const d = verdict.minority?.dissenter;
  if (d) {
    lines.push(
      '',
      `**Minority report** (disagreement ${verdict.minority.disagreement.toFixed(2)}): ` +
        `${d.displayName} dissented (${d.verdictScore.toFixed(2)}, ${d.delta > 0 ? '+' : ''}${d.delta.toFixed(2)} vs synthesis): "${d.oneLiner}"`,
    );
  }
  if (verdict.preservation) {
    const { conceptSurvival, surviving, total, dissentEngagement } = verdict.preservation;
    lines.push(
      '',
      `**Preservation:** ${surviving}/${total} seat concerns survived (${(conceptSurvival * 100).toFixed(0)}%)` +
        (dissentEngagement !== undefined
          ? ` · dissent engagement ${dissentEngagement.toFixed(2)}`
          : ''),
    );
  }
  if (verdict.synthesis.mysticalCaution) {
    lines.push('', `**Caution:** ${verdict.synthesis.mysticalCaution}`);
  }
  lines.push('', `Full transcript: ${file}`);
  return lines.join('\n');
}

export function buildServer(): McpServer {
  const server = new McpServer({ name: 'philo-council', version: '0.2.0' });

  server.registerTool(
    'deliberate',
    {
      title: 'Convene the philosopher council',
      description:
        'Put a question to an eleven-philosopher LLM council. Each seat (Socrates, Kant, Lao Tzu, ...) evaluates it through its own documented methodology with virtue scores; Ibn ʿArabī synthesizes; dissent survives as a first-class minority report. Use for decisions, plans, or claims that deserve multi-perspective scrutiny - not for factual lookups. Costs one LLM call per seat.',
      inputSchema: {
        question: z
          .string()
          .min(1)
          .max(4000)
          .describe('The question or claim to deliberate on'),
        context: z
          .string()
          .max(8000)
          .optional()
          .describe('Optional background context for the bench'),
        fullCouncil: z
          .boolean()
          .optional()
          .describe(
            'Seat all ten deliberators instead of the default quorum of four (10+ LLM calls)',
          ),
        mode: z
          .enum(MODE_IDS)
          .optional()
          .describe(
            'Debate format: deliberation (default) | socratic | oxford | delphi | vote (median score, plurality recommendation, no critic pass)',
          ),
      },
    },
    async ({ question, context, fullCouncil, mode }) => {
      const { verdict, file } = await runAsk({
        question,
        context,
        fullCouncil: !!fullCouncil,
        debateMode: mode ?? 'deliberation',
      });
      return { content: [{ type: 'text', text: renderDeliberation(verdict, file) }] };
    },
  );

  server.registerTool(
    'precedents',
    {
      title: "Search the council's case law",
      description:
        'Retrieve past council deliberations similar to a question (token-overlap retrieval over saved verdicts). Cheap - no LLM calls. Use before deliberating to see whether the bench has already ruled on something like this.',
      inputSchema: {
        question: z.string().min(1).max(4000).describe('The question to find precedents for'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .describe('Max precedents to return (default 2)'),
      },
    },
    async ({ question, limit }) => {
      const precedents = await findPrecedents(question, limit ?? 2);
      if (!precedents.length) {
        return {
          content: [
            {
              type: 'text',
              text: 'No precedents found - the bench has not seen a similar question.',
            },
          ],
        };
      }
      const text = precedents
        .map(
          (p) =>
            `- ${p.date} · similarity ${p.similarity.toFixed(2)} · "${p.question}" → ${p.finalScore.toFixed(2)} (${p.finalRecommendation})\n  ${p.excerpt}`,
        )
        .join('\n');
      return { content: [{ type: 'text', text }] };
    },
  );

  return server;
}

export async function startMcpServer(): Promise<void> {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('philo-council MCP server listening on stdio');
}
