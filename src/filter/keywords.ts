export interface KeywordRule {
  tag: string;
  pattern: RegExp;
}

export const KARPATHY_KEYWORDS: KeywordRule[] = [
  { tag: 'ralph-loop', pattern: /\bralph[- ]?loop\b/i },
  { tag: 'llm-council', pattern: /\bllm[- ]?council\b/i },
  { tag: 'llm-wiki', pattern: /\bllm[- ]?wiki\b/i },
  { tag: 'vibe-coding', pattern: /\bvibe[ -]?cod(?:ing|e[rd]?)\b/i },
  { tag: 'autoresearch', pattern: /\bauto[- ]?research\b/i },
  { tag: 'self-improving', pattern: /\bself[- ]?improv(?:e|ing|ed|ement)\b/i },
  { tag: 'nanoGPT', pattern: /\bnano[- ]?gpt\b/i },
  { tag: 'micrograd', pattern: /\bmicrograd\b/i },
  { tag: 'karpathy', pattern: /\bkarpathy\b/i },
  { tag: 'agent-loop', pattern: /\bagent(?:ic)?[ -]?loop\b/i },
  { tag: 'continual-learning', pattern: /\bcontinual[ -]learning\b/i },
  { tag: 'in-context-learning', pattern: /\bin[- ]?context[ -]learning\b/i },
  { tag: 'test-time-training', pattern: /\btest[- ]?time[ -]training\b/i },
  { tag: 'world-model', pattern: /\bworld[- ]?model\b/i },
  { tag: 'self-play', pattern: /\bself[- ]?play\b/i },
];

export function matchKeywords(text: string): string[] {
  const out: string[] = [];
  for (const rule of KARPATHY_KEYWORDS) {
    if (rule.pattern.test(text)) out.push(rule.tag);
  }
  return out;
}
