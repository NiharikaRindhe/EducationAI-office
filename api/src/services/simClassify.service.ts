// api/src/services/simClassify.service.ts
//
// Ported from pdf-simulation-master/server/src/services/sim/classify.ts.
// The entire three-provider cascade (OpenRouter -> Groq -> Gemini, each
// hand-rolled with its own SDK, its own retry/backoff, its own env vars)
// collapses to one chatCompletion() call: lib/ai.ts already owns key
// rotation, the cloud/Ollama fallback, and the Super Admin's per-tier
// kill-switches, so re-implementing a cascade here would just be a second,
// competing one. cleanJsonResponse / parseCandidateResponse are upstream's
// own defensive JSON parsing and are kept verbatim — models still wrap
// output in code fences or a `{candidates:[...]}` envelope regardless of
// which provider answered.

import { chatCompletion } from '../lib/ai.js';
import type { AiUsageContext } from '../lib/aiUsage.js';
import { logger } from '../lib/logger.js';
import { loadPrompt } from '../prompts/sim/loadPrompt.js';
import { CandidateSchema, type Candidate } from './simCandidateSchema.js';
import { generateProceduralSimSpec, type ConceptContext } from './simProcedural.service.js';
import {
  allowedTemplatePrompt,
  createTemplateSpec,
  dropCitationParams,
  isTemplateId,
  maskCitations,
  matchTemplateFromText,
  parseTemplateParams,
} from '../lib/simShared/index.js';

// Cached per class (the catalog offered to the curator is filtered to the
// book's own class — see allowedTemplatePrompt's doc comment) rather than
// per process, since one running server ingests books across every class.
const systemPromptCache = new Map<string, string>();

function getSystemPrompt(classNum?: number): string {
  const key = classNum === undefined ? 'all' : String(classNum);
  let cached = systemPromptCache.get(key);
  if (!cached) {
    const template = loadPrompt('simspec.v3.md');
    cached = template.replace('{{CATALOG}}', allowedTemplatePrompt(classNum));
    systemPromptCache.set(key, cached);
  }
  return cached;
}

/** Strips markdown code fences (```json ... ```) from LLM output. */
export function cleanJsonResponse(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  return trimmed;
}

/** Parses raw JSON text into a validated Candidate array. Handles a bare
 *  array, a single object, or a wrapper object ({ candidates: [...] } or
 *  { simulations: [...] }) — the shape actually varies by model even
 *  when the prompt asks for one specific shape every time. */
export function parseCandidateResponse(jsonStr: string): Candidate[] {
  const cleaned = cleanJsonResponse(jsonStr);
  if (!cleaned || cleaned === '[]') return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Conversational prefix/suffix around the JSON — pull out the substring.
    const firstBracket = cleaned.indexOf('[');
    const firstBrace = cleaned.indexOf('{');
    const start = firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace) ? firstBracket : firstBrace;
    const lastBracket = cleaned.lastIndexOf(']');
    const lastBrace = cleaned.lastIndexOf('}');
    const end = Math.max(lastBracket, lastBrace);
    if (start === -1 || end <= start) return [];
    try {
      parsed = JSON.parse(cleaned.substring(start, end + 1));
    } catch {
      return [];
    }
  }

  let list: unknown[];
  if (Array.isArray(parsed)) {
    list = parsed;
  } else if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.candidates)) list = obj.candidates;
    else if (Array.isArray(obj.simulations)) list = obj.simulations;
    else list = [parsed];
  } else {
    return [];
  }

  const validCandidates: Candidate[] = [];
  for (const item of list) {
    const result = CandidateSchema.safeParse(item);
    if (result.success) validCandidates.push(result.data as Candidate);
    if (validCandidates.length >= 3) break;
  }
  return validCandidates;
}

export interface ClassifyOptions {
  /** Filters the curator's template offer to this class. Omit for the
   *  on-demand /generate path, which has no book/class context. */
  classNum?: number;
  systemPrompt?: string;
  usageContext?: AiUsageContext;
}

/** Curates a page's text into up to 3 candidate SimSpecs. Unlike upstream
 *  (which asked for a bare top-level JSON array — incompatible with
 *  OpenAI-compatible `response_format: json_object`, which requires a
 *  top-level OBJECT), the prompt here asks for `{"candidates":[...]}` so
 *  jsonMode can be used reliably, matching this codebase's own convention
 *  (see examGenerator.service.ts's buildPrompt). parseCandidateResponse
 *  still tolerates a bare array or a `{simulations:[...]}` wrapper as a
 *  safety net for whichever shape a given model actually returns. A
 *  failure here returns [] — same as "no simulations on this page" —
 *  rather than failing the whole ingest page. */
export async function classifyPage(pageText: string, options: ClassifyOptions = {}): Promise<Candidate[]> {
  const systemPrompt = options.systemPrompt ?? getSystemPrompt(options.classNum);
  try {
    const raw = await chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Analyze the following textbook page text and extract 0 to 3 high-value simulations as { "candidates": [...] }:\n\n---\n${pageText}\n---`,
        },
      ],
      { jsonMode: true, tier: 'qgen', usageContext: options.usageContext },
    );
    return parseCandidateResponse(raw);
  } catch (err) {
    logger.warn({ err }, '[simClassify] classification call failed — page gets no simulations');
    return [];
  }
}

/** On-demand simulation generator. Prefers a catalog template match (no
 *  LLM); an unmatched topic falls to the curator prompt, then to the
 *  guaranteed-safe procedural mapper. */
export async function generateCustomSimulation(
  promptOrText: string,
  options: ClassifyOptions = {},
  context: ConceptContext = {},
): Promise<Candidate> {
  const blob = [
    promptOrText,
    context.title,
    context.subtitle,
    context.parentTopic,
    context.topicExplanation,
    context.quote,
    (context.equations || []).join(' '),
  ]
    .filter(Boolean)
    .join(' ');

  const matched = matchTemplateFromText(blob);
  if (matched) {
    const spec = createTemplateSpec(matched.templateId, matched.params, {
      title: context.title || matched.title,
      subtitle: context.subtitle,
      parentTopic: context.parentTopic,
      domain: context.domain as Candidate['domain'] | undefined,
      topicExplanation: context.topicExplanation,
      equations: context.equations,
      quote: context.quote || promptOrText.substring(0, 200),
    });
    return { ...spec, importance: 8 };
  }

  const customSystemPrompt = `${getSystemPrompt(options.classNum)}

IMPORTANT FOR ON-DEMAND GENERATION:
Pick exactly one known templateId + extracted params.
If nothing matches, return one Candidate with isSimulatable false and a short reason.
Do not invent stage.elements or an unknown templateId.`;

  const queryText = context.title
    ? `Concept to animate:
Title: ${context.title}
Subtitle: ${context.subtitle || ''}
Domain: ${context.domain || 'physics'}
Parent Topic: ${context.parentTopic || ''}
Equations: ${(context.equations || []).join('; ')}
Explanation: ${context.topicExplanation || ''}
Textbook Context / Quote: "${context.quote || promptOrText}"`
    : promptOrText;

  const candidates = await classifyPage(maskCitations(queryText), { ...options, systemPrompt: customSystemPrompt });
  const first = candidates[0];
  if (first?.isSimulatable && first.templateId && isTemplateId(first.templateId)) {
    const { params, paramMeta } = parseTemplateParams(first.templateId, dropCitationParams(first.params, blob));
    return { ...first, params, paramMeta, stage: undefined };
  }

  return generateProceduralSimSpec(promptOrText, context);
}
