// api/src/prompts/sim/loadPrompt.ts
//
// Ported from pdf-simulation-master/server/src/prompts/loadPrompt.ts.
// formatLlmDump / formatChatLlmDump are NOT ported: upstream used them to
// stamp the exact system+user prompt text onto every explain/chat response
// as `llmPrompt`, which reached the browser. Dropped deliberately — see
// simExplain.service.ts's header comment.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOM = String.fromCharCode(0xfeff);

export function loadPrompt(fileName: string): string {
  const filePath = path.resolve(__dirname, fileName);
  const text = fs.readFileSync(filePath, 'utf-8');
  return text.startsWith(BOM) ? text.slice(1) : text;
}

export function fillPrompt(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '');
}
