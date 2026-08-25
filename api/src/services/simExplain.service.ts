// api/src/services/simExplain.service.ts
//
// Ported from pdf-simulation-master/server/src/services/sim/explainService.ts
// (1188 lines upstream). The three hand-rolled provider cascades (student
// explanation, selection explanation, chat) each collapse to at most two
// chatCompletion() calls — one with an image attached when present, one
// text-only retry — because lib/ai.ts already owns provider fallback, key
// rotation, and the Super Admin's per-tier kill-switches. A guaranteed
// procedural fallback (ported verbatim, zero LLM) still backs every path.
//
// Streaming is NOT ported. generateChatReplyStream() keeps its upstream
// (messages, context, emit) signature and {delta|done|error} event
// contract — the route and the reader's word-streamer both consume that
// shape — but internally makes one non-streaming chatCompletion() call and
// emits the whole reply as a single delta via emitFullChatReply(), which
// upstream already used as its own "provider produced no incremental
// output" fallback. The client's createWordStreamer already types the
// reply out at a fixed cadence regardless of how many deltas arrive, so
// this is invisible to the student.
//
// withLlmPrompt() / the `llmPrompt` response field are NOT ported: upstream
// stamped the exact system+user prompt text onto every explain/chat
// response and shipped it to the browser. Dropped as an unnecessary prompt
// leak.

import { chatCompletion } from '../lib/ai.js';
import type { AiUsageContext } from '../lib/aiUsage.js';
import { logger } from '../lib/logger.js';
import { parsePageImage } from '../lib/simPageImage.js';
import { fillPrompt, loadPrompt } from '../prompts/sim/loadPrompt.js';
import { cleanJsonResponse as cleanJson } from './simClassify.service.js';
import { assessSyllabusScope, syllabusRefusalReply } from './simSyllabusGuard.service.js';
import {
  bindTemplate,
  hasSimBrief,
  isTemplateId,
  mergeSimBrief,
  pageImageGateReason,
  proceduralSimBrief,
  shouldAttachPageImage,
  storedSimBrief,
  toKatexForLlm,
  type ChatImageSource,
  type SimBrief,
  type SimSpec,
} from '../lib/simShared/index.js';

export interface VariableExplanation {
  symbol: string;
  meaning: string;
  unit?: string;
}

export interface EquationBreakdown {
  formula: string;
  description: string;
  variables: VariableExplanation[];
}

export interface AnimationElementGuide {
  element: string;
  meaning: string;
}

export interface ThoughtExperiment {
  question: string;
  hint?: string;
  answer: string;
}

export interface StudentExplanation {
  summary: string;
  intuition: string[];
  animationGuide: AnimationElementGuide[];
  equationBreakdown: EquationBreakdown[];
  realWorldApplications: string[];
  thoughtExperiment: ThoughtExperiment;
  keyTakeaways: string[];
  tutorAnswer?: string;
}

export interface SelectionExplanation {
  selectedText: string;
  conceptTitle: string;
  domain: string;
  summary: string;
  detailedExplanation: string[];
  keyTakeaways: string[];
  realWorldExample?: string;
  relatedFormulas?: string[];
}

export interface ExplainSelectionOptions {
  selectedText: string;
  surroundingContext?: string;
  pageText?: string;
  currentPage?: number;
  parentTopic?: string;
  domain?: string;
  mode?: 'beginner' | 'standard' | 'advanced';
  pageImage?: string;
}

/** Keep enough of a textbook page for grounded answers without blowing the prompt. */
export const MAX_PAGE_CONTEXT_CHARS = 3500;

// Non-breaking / typographic space code points (NBSP, Ogham space, the
// U+2000-U+200A general punctuation spaces, narrow NBSP, medium mathematical
// space, ideographic space) — built from numeric code points rather than a
// \uXXXX regex literal so the exact character set is unambiguous in source.
const UNICODE_SPACE_RE = new RegExp(
  `[${[0x00a0, 0x1680, ...Array.from({ length: 11 }, (_, i) => 0x2000 + i), 0x202f, 0x205f, 0x3000]
    .map((code) => String.fromCharCode(code))
    .join('')}]`,
  'g',
);

/** Strips extraction noise: unicode spacing, hyphenation across line
 *  breaks, decorative border lines, pagination artifacts, and repeated
 *  publication marks ("Reprint 2023-24", "Not to be republished"). */
export function cleanPageText(raw?: string): string {
  if (!raw) return '';
  return raw
    .replace(UNICODE_SPACE_RE, ' ')
    .replace(/(\b\w+)-\s*\n\s*(\w+\b)/g, '$1$2')
    .replace(/^[\s\-_=*~#]{4,}$/gm, '')
    .replace(/^\s*(?:page\s+)?\d{1,4}\s*$/gim, '')
    .replace(/^\s*(?:reprint\s+\d{4}[-\d]*|not\s+to\s+be\s+republished)\s*$/gim, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Cleans and clips a page to the character budget, centering the window
 *  on a target snippet (a highlight, a chat question's key phrase) when
 *  the page is long enough to need trimming. */
export function clipPageContext(text?: string, max = MAX_PAGE_CONTEXT_CHARS, targetSnippet?: string): string {
  const cleaned = cleanPageText(text);
  if (!cleaned) return '';
  if (cleaned.length <= max) return cleaned;

  if (targetSnippet && targetSnippet.trim().length > 3) {
    const needle = targetSnippet.trim().toLowerCase();
    const idx = cleaned.toLowerCase().indexOf(needle);
    if (idx !== -1) {
      const half = Math.floor(max / 2);
      let start = Math.max(0, idx - half);
      let end = Math.min(cleaned.length, start + max);
      if (end - start < max) start = Math.max(0, end - max);

      const needleEnd = idx + needle.length;
      const maxSnap = Math.max(10, Math.floor(max * 0.1));

      if (start > 0) {
        const nextBreak = cleaned.indexOf('\n', start);
        if (nextBreak !== -1 && nextBreak <= idx && nextBreak - start < maxSnap) {
          start = nextBreak + 1;
        } else {
          const nextSpace = cleaned.indexOf(' ', start);
          if (nextSpace !== -1 && nextSpace <= idx && nextSpace - start < maxSnap) start = nextSpace + 1;
        }
      }

      if (end < cleaned.length) {
        const prevBreak = cleaned.lastIndexOf('\n', end);
        if (prevBreak !== -1 && prevBreak >= needleEnd && end - prevBreak < maxSnap) {
          end = prevBreak;
        } else {
          const prevSpace = cleaned.lastIndexOf(' ', end);
          if (prevSpace !== -1 && prevSpace >= needleEnd && end - prevSpace < maxSnap) end = prevSpace;
        }
      }

      const snippet = cleaned.slice(start, end).trim();
      const prefix = start > 0 ? '… ' : '';
      const suffix = end < cleaned.length ? ' …' : '';
      return `${prefix}${snippet}${suffix}`;
    }
  }

  let sliceEnd = max;
  const lastPeriod = cleaned.lastIndexOf('.', max);
  const lastNewline = cleaned.lastIndexOf('\n', max);
  const boundary = Math.max(lastPeriod, lastNewline);
  if (boundary > max * 0.75) sliceEnd = boundary + 1;
  return `${cleaned.slice(0, sliceEnd).trim()}…`;
}

function imageContextBlock(pageImage?: string): string {
  return parsePageImage(pageImage)
    ? `\nA page image is attached (pasted screenshot, snipped figure, or the full current page). Use diagrams, graphs, photos, and labeled figures in the image. Prefer the image for what a figure shows; prefer the page text for exact wording and formulas. If they disagree, say so briefly and ground the answer in the textbook page.\n`
    : '';
}

export function buildSelectionPrompts(options: ExplainSelectionOptions): { systemPrompt: string; userPrompt: string } {
  const { selectedText, surroundingContext, pageText, currentPage, parentTopic, domain = 'physics', mode = 'standard' } = options;
  const pageContext = clipPageContext(toKatexForLlm(pageText || surroundingContext), MAX_PAGE_CONTEXT_CHARS, selectedText);
  const systemPrompt = loadPrompt('explainSelection.system.md').trim();
  const userPrompt = fillPrompt(loadPrompt('explainSelection.user.md'), {
    MODE: mode.toUpperCase(),
    SELECTED_TEXT: toKatexForLlm(selectedText),
    PARENT_TOPIC_LINE: parentTopic ? `Parent topic / chapter: "${parentTopic}"\n` : '',
    CURRENT_PAGE_LINE: typeof currentPage === 'number' ? `Current page: ${currentPage}\n` : '',
    DOMAIN_LINE: domain ? `Academic domain: "${domain}"\n` : '',
    PAGE_CONTEXT_BLOCK: pageContext
      ? `Full current textbook page (use this as the primary context for the page/topic):\n"""\n${pageContext}\n"""\n`
      : '',
  }).trim();
  return { systemPrompt, userPrompt };
}

export interface ExplainOptions {
  spec: SimSpec;
  quote?: string;
  pageText?: string;
  mode?: 'beginner' | 'standard' | 'advanced';
  customQuestion?: string;
  metrics?: Record<string, number | string | boolean>;
}

function formatBookNumbers(spec: SimSpec, metrics?: Record<string, number | string | boolean>): string {
  const params = spec.params || {};
  const meta = spec.paramMeta || {};
  const paramBits = Object.entries(params).map(([k, v]) => {
    const src = meta[k]?.source === 'extracted' ? 'from the textbook' : 'catalog default';
    return `${k} = ${v} (${src})`;
  });
  const metricBits = Object.entries(metrics || {}).map(([k, v]) => `${k} = ${v}`);
  const parts = [
    paramBits.length ? `Textbook / slider params: ${paramBits.join(', ')}` : '',
    metricBits.length ? `Computed metrics (use these numbers in the explanation): ${metricBits.join(', ')}` : '',
  ].filter(Boolean);
  return parts.join('\n');
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatBookContext {
  title?: string;
  currentPage?: number;
  parentTopic?: string;
  domain?: string;
  pageText?: string;
  pageImage?: string;
  imageSource?: ChatImageSource;
  recentHadImage?: boolean;
  syllabusTopics?: string[];
  bookId?: string;
}

export interface ChatReply {
  reply: string;
  relatedFormulas?: string[];
  keyTakeaways?: string[];
}

export type ChatStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; relatedFormulas?: string[]; keyTakeaways?: string[] }
  | { type: 'error'; error: string };

export type ChatStreamSink = (event: ChatStreamEvent) => void;

const MAX_CHAT_TURNS = 10;

/** Procedural fallback student explanation — zero LLM, always succeeds. */
export function generateProceduralStudentExplanation(
  spec: SimSpec,
  quote?: string,
  mode: 'beginner' | 'standard' | 'advanced' = 'standard',
  customQuestion?: string,
  metrics?: Record<string, number | string | boolean>,
): StudentExplanation {
  const domain = spec.domain || 'physics';
  const title = spec.title || 'Scientific Concept';
  const numbers = formatBookNumbers(spec, metrics);

  const equationBreakdowns: EquationBreakdown[] = (spec.equations || []).map((eq) => {
    const vars: VariableExplanation[] = [];
    if (eq.includes('F')) vars.push({ symbol: 'F', meaning: 'Net Force acting on object', unit: 'Newtons (N)' });
    if (eq.includes('m')) vars.push({ symbol: 'm', meaning: 'Mass of the moving body', unit: 'Kilograms (kg)' });
    if (eq.includes('a')) vars.push({ symbol: 'a', meaning: 'Acceleration of the object', unit: 'm/s²' });
    if (eq.includes('v') || eq.includes('\\vec{v}')) vars.push({ symbol: 'v', meaning: 'Instantaneous Velocity', unit: 'm/s' });
    if (eq.includes('B') || eq.includes('\\vec{B}')) vars.push({ symbol: 'B', meaning: 'Magnetic Field Strength', unit: 'Tesla (T)' });
    if (eq.includes('I')) vars.push({ symbol: 'I', meaning: 'Electric Current flow', unit: 'Amperes (A)' });
    if (eq.includes('r') || eq.includes('R')) vars.push({ symbol: 'r', meaning: 'Radial distance or radius', unit: 'Meters (m)' });
    if (eq.includes('q')) vars.push({ symbol: 'q', meaning: 'Electric Charge', unit: 'Coulombs (C)' });
    if (eq.includes('\\omega')) vars.push({ symbol: 'ω', meaning: 'Angular frequency', unit: 'rad/s' });
    if (eq.includes('k')) vars.push({ symbol: 'k', meaning: 'Spring / constant parameter', unit: 'N/m' });
    if (eq.includes('g')) vars.push({ symbol: 'g', meaning: 'Gravitational acceleration (approx 9.8)', unit: 'm/s²' });
    if (eq.includes('t') || eq.includes('time')) vars.push({ symbol: 't', meaning: 'Elapsed time', unit: 'seconds (s)' });
    if (vars.length === 0) vars.push({ symbol: 'Variables', meaning: 'Parameters governing rate of change and equilibrium' });
    return {
      formula: eq,
      description: `Governs the quantitative relationship and dynamical equilibrium of ${title}.`,
      variables: vars,
    };
  });

  const animationGuide: AnimationElementGuide[] = [];
  if (spec.stage?.elements) {
    for (const el of spec.stage.elements) {
      if (el.type === 'circle' && el.role === 'projectile') {
        animationGuide.push({ element: 'Moving Particle (Circle)', meaning: 'Represents the active particle/body moving continuously over elapsed time.' });
      } else if (el.type === 'wave') {
        animationGuide.push({ element: 'Sinusoidal Waveform', meaning: 'Visualizes continuous wave propagation and phase oscillation across space.' });
      } else if (el.type === 'arrow') {
        animationGuide.push({ element: 'Directional Vector (Arrow)', meaning: 'Shows the instantaneous direction of force, velocity, or field intensity.' });
      } else if (el.type === 'line' || el.type === 'rect') {
        animationGuide.push({ element: 'Reference Boundary / Axis', meaning: 'Provides the spatial coordinate frame or physical constraint.' });
      } else if (el.type === 'particles') {
        animationGuide.push({ element: 'Particle Ensemble', meaning: 'Illustrates statistical/thermal distribution of microscopic entities.' });
      }
    }
  }
  if (animationGuide.length === 0) {
    animationGuide.push({ element: 'Animated SVG Elements', meaning: `Continuously update according to mathematical time-functions $f(time)$ to model ${title}.` });
  }

  const intuition = [
    spec.topicExplanation || `${title} illustrates how physical states evolve predictably under governing natural laws.`,
    mode === 'beginner'
      ? `Imagine rolling a ball on a smooth track or watching water ripples spread: the motion follows strict rules that keep repeating smoothly without stopping.`
      : mode === 'advanced'
        ? `The state vector transitions through continuous phase space, where energy or quantity conservation dictates the exact path at every infinitesimal time step.`
        : `As time progresses in the simulation, observe how changing one physical quantity directly alters the motion and speed of the surrounding elements.`,
  ];

  let tutorAnswer: string | undefined;
  if (customQuestion) {
    tutorAnswer = `Regarding "${customQuestion}": In ${title}, the behavior is fundamentally dictated by the governing parameters. Changing one variable causes an immediate proportional shift in the simulated trajectory and energy dynamics.`;
  }

  return {
    summary: spec.subtitle || `Interactive pedagogical simulation demonstrating ${title} in ${domain}.`,
    intuition,
    animationGuide,
    equationBreakdown: equationBreakdowns,
    realWorldApplications: [
      `Modern engineering and technology systems utilizing ${title}`,
      `Everyday physical phenomena where ${domain} principles maintain equilibrium`,
      `Scientific measurement instruments and computational models`,
    ],
    thoughtExperiment: {
      question: `What would happen to the simulation motion if the governing rate parameter or mass was doubled?`,
      hint: `Check the governing equation to see if the variable is directly or inversely proportional.`,
      answer: `The frequency or acceleration would shift inversely or proportionally, causing the animation cycles to either speed up or slow down according to the formula.`,
    },
    keyTakeaways: [
      `${title} operates deterministically as a function of elapsed time and physical constraints.`,
      numbers ? `Explain using spec.params and computed metrics only. ${numbers}` : `The visual components in the stage reflect exact algebraic balance.`,
      `Understanding this foundational principle simplifies advanced topics across ${domain}.`,
    ],
    tutorAnswer,
  };
}

function buildPrompt(options: ExplainOptions): { systemPrompt: string; userPrompt: string } {
  const { spec, quote, pageText, mode = 'standard', customQuestion, metrics } = options;
  const bookNumbers = formatBookNumbers(spec, metrics);

  const systemPrompt = `You are a world-class STEM professor and educational explainer known for making physics, chemistry, mathematics, and science crystal-clear, fascinating, and deeply intuitive for high-school and undergraduate students.

Your objective: Explain the interactive visual simulation provided below with utmost clarity, pedagogical rigor, and relatable intuition.
Explain using spec.params and computed metrics only. Walk through those textbook numbers; do not invent replacements.

Respond ONLY with a valid, clean JSON object matching this structure (no markdown formatting fences, just pure JSON):
{
  "summary": "1 memorable sentence summarizing the core principle",
  "intuition": [
    "Paragraph 1: Clear, jargon-free explanation with a relatable real-world analogy (e.g. sports, car, swing, water, guitar string)",
    "Paragraph 2: Explanation of the underlying physical/mathematical mechanism and cause-and-effect"
  ],
  "animationGuide": [
    { "element": "Name/Color of visual part", "meaning": "What this moving element specifically represents in the real world" }
  ],
  "equationBreakdown": [
    {
      "formula": "LaTeX or plain math formula",
      "description": "Plain English explanation of what the equation tells us",
      "variables": [
        { "symbol": "v", "meaning": "Velocity", "unit": "m/s" }
      ]
    }
  ],
  "realWorldApplications": [
    "Concrete real-world application 1 (e.g. Smartphone accelerometers)",
    "Concrete real-world application 2 (e.g. Planetary orbits & satellites)",
    "Concrete real-world application 3 (e.g. Acoustic sound engineering)"
  ],
  "thoughtExperiment": {
    "question": "An intriguing 'What if?' challenge question for the student to test their understanding",
    "hint": "A subtle hint pointing to the relationship in the formula",
    "answer": "Clear, satisfying answer explaining the correct physical reasoning"
  },
  "keyTakeaways": [
    "Takeaway 1 (concise bullet)",
    "Takeaway 2 (concise bullet)",
    "Takeaway 3 (concise bullet)"
  ]${customQuestion ? ',\n  "tutorAnswer": "Direct, friendly, concise and pedagogically insightful answer to the student\'s question."' : ''}
}`;

  const userPrompt = `Target Learning Level: ${mode.toUpperCase()}
Simulation Title: ${spec.title}
Subtitle: ${spec.subtitle || ''}
Domain: ${spec.domain || 'physics'}
Parent Topic: ${spec.parentTopic || ''}
Governing Equations: ${(spec.equations || []).map((eq) => toKatexForLlm(eq)).join('; ') || 'None provided'}
Initial Concept Note: ${spec.topicExplanation || ''}
Visual Caption: ${spec.caption || ''}
${bookNumbers ? `${bookNumbers}\n` : ''}
Stage Elements: ${JSON.stringify(spec.stage?.elements || []).substring(0, 500)}
${quote ? `Textbook Excerpt: "${toKatexForLlm(quote)}"\n` : ''}
${pageText ? `Page Context: "${toKatexForLlm(pageText).substring(0, 400)}"\n` : ''}
${customQuestion ? `Student's Specific Question: "${toKatexForLlm(customQuestion)}"\n` : ''}

Provide a deep, engaging, student-friendly explanation JSON.`;

  return { systemPrompt, userPrompt };
}

export async function generateStudentExplanation(options: ExplainOptions, usageContext?: AiUsageContext): Promise<StudentExplanation> {
  const { systemPrompt, userPrompt } = buildPrompt(options);
  try {
    const raw = await chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { jsonMode: true, tier: 'chat', usageContext },
    );
    const parsed = JSON.parse(cleanJson(raw)) as StudentExplanation;
    if (parsed.summary && parsed.intuition) return parsed;
  } catch (err) {
    logger.warn({ err }, '[simExplain] student explanation call failed — using procedural fallback');
  }
  return generateProceduralStudentExplanation(options.spec, options.quote, options.mode, options.customQuestion, options.metrics);
}

/** Procedural fallback for explaining selected text — zero LLM, always succeeds. */
export function generateProceduralSelectionExplanation(options: ExplainSelectionOptions): SelectionExplanation {
  const { selectedText, parentTopic, domain = 'physics', mode = 'standard' } = options;
  const trimmed = selectedText.trim();
  const title = trimmed.length > 50 ? `${trimmed.substring(0, 47)}...` : trimmed;
  return {
    selectedText: trimmed,
    conceptTitle: parentTopic ? `${parentTopic}: ${title}` : title,
    domain,
    summary: `Explanation of "${trimmed}" in the context of ${parentTopic || domain}.`,
    detailedExplanation: [
      `In ${domain}, "${trimmed}" relates to the fundamental physical principles governing the system's state, balance, and dynamical evolution.`,
      mode === 'beginner'
        ? `Think of it like a key component in an interconnected machine: when this aspect changes, it directly influences the observable outcome and behavior.`
        : `This term or phrase establishes the boundary condition and analytical basis used to describe the underlying quantitative relationship.`,
    ],
    keyTakeaways: [
      `Key concept in ${parentTopic || domain}: "${trimmed}"`,
      `Interpreted in the context of the surrounding textbook material.`,
      `Crucial for setting up the governing equation or conceptual model.`,
    ],
    realWorldExample: `Practical application of ${title} in scientific analysis and everyday technology.`,
    relatedFormulas: [],
  };
}

export async function generateSelectionExplanation(options: ExplainSelectionOptions, usageContext?: AiUsageContext): Promise<SelectionExplanation> {
  const { systemPrompt, userPrompt } = buildSelectionPrompts(options);
  const parsedImage = parsePageImage(options.pageImage);

  if (parsedImage) {
    try {
      const raw = await chatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt, images: [parsedImage.base64] },
        ],
        { jsonMode: true, tier: 'vision', usageContext },
      );
      const parsed = JSON.parse(cleanJson(raw)) as SelectionExplanation;
      if (parsed.summary && parsed.detailedExplanation) return parsed;
    } catch (err) {
      logger.warn({ err }, '[simExplain] selection explanation (vision) failed — retrying text-only');
    }
  }

  try {
    const raw = await chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { jsonMode: true, tier: 'chat', usageContext },
    );
    const parsed = JSON.parse(cleanJson(raw)) as SelectionExplanation;
    if (parsed.summary && parsed.detailedExplanation) return parsed;
  } catch (err) {
    logger.warn({ err }, '[simExplain] selection explanation call failed — using procedural fallback');
  }

  return generateProceduralSelectionExplanation(options);
}

function sanitizeChatTurns(messages: ChatTurn[]): ChatTurn[] {
  return messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m) => ({ role: m.role, content: m.role === 'user' ? toKatexForLlm(m.content.trim()) : m.content.trim() }))
    .slice(-MAX_CHAT_TURNS);
}

/** Drop a silent full-page JPEG when the question is text-only (client may
 *  still send one) — defense in depth, the same heuristic runs client-side
 *  first (shared/imageIntent.ts). */
export function gateChatPageImage(turns: ChatTurn[], bookContext: ChatBookContext): ChatBookContext {
  const lastUser = [...turns].reverse().find((t) => t.role === 'user');
  if (!lastUser?.content || !bookContext.pageImage) return bookContext;

  const gateInput = {
    question: lastUser.content,
    pageImage: bookContext.pageImage,
    imageSource: bookContext.imageSource,
    recentHadImage: bookContext.recentHadImage,
  };

  if (shouldAttachPageImage(gateInput)) {
    const reason = pageImageGateReason(gateInput) || 'visual-intent';
    logger.debug({ reason }, '[simExplain] chat: using page image');
    return bookContext;
  }
  logger.debug('[simExplain] chat: skipping page image (text-only intent)');
  return { ...bookContext, pageImage: undefined };
}

function syllabusTopicsBlock(topics?: string[]): string {
  const unique = [...new Set((topics || []).map((topic) => topic.trim()).filter(Boolean))].slice(0, 24);
  if (unique.length === 0) return '';
  return `Syllabus topics already mapped in this book:\n${unique.map((topic) => `- ${topic}`).join('\n')}\n`;
}

export function buildChatSystemPrompt(bookContext: ChatBookContext): string {
  const title = bookContext.title || 'this textbook';
  const domain = bookContext.domain || 'physics';
  const pageContext = clipPageContext(toKatexForLlm(bookContext.pageText));
  return fillPrompt(loadPrompt('chatTutor.system.md'), {
    TITLE: title,
    DOMAIN: domain,
    TOPIC_SENTENCE: bookContext.parentTopic ? ` The student is currently studying: ${bookContext.parentTopic}.` : '',
    PAGE_SENTENCE: typeof bookContext.currentPage === 'number' ? ` They are on page ${bookContext.currentPage}.` : '',
    SYLLABUS_TOPICS_BLOCK: syllabusTopicsBlock(bookContext.syllabusTopics),
    PAGE_CONTEXT_BLOCK: pageContext ? `\nCurrent page text:\n"""\n${pageContext}\n"""\n` : '',
    IMAGE_CONTEXT_BLOCK: imageContextBlock(bookContext.pageImage),
  }).trim();
}

function asChatReply(parsed: unknown): ChatReply | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const reply = (parsed as { reply?: unknown }).reply;
  if (typeof reply !== 'string' || !reply.trim()) return null;
  const formulas = (parsed as { relatedFormulas?: unknown }).relatedFormulas;
  const takeaways = (parsed as { keyTakeaways?: unknown }).keyTakeaways;
  return {
    reply: reply.trim(),
    relatedFormulas: Array.isArray(formulas) ? formulas.filter((f): f is string => typeof f === 'string' && f.trim().length > 0) : undefined,
    keyTakeaways: Array.isArray(takeaways) ? takeaways.filter((t): t is string => typeof t === 'string' && t.trim().length > 0) : undefined,
  };
}

function isMarkedOffSyllabus(parsed: unknown): boolean {
  return Boolean(parsed && typeof parsed === 'object' && (parsed as { inSyllabus?: unknown }).inSyllabus === false);
}

function chatReplyFromParsed(parsed: unknown, bookContext: ChatBookContext): ChatReply | null {
  if (isMarkedOffSyllabus(parsed)) return syllabusRefusalReply(bookContext);
  return asChatReply(parsed);
}

export function generateProceduralChatReply(messages: ChatTurn[], bookContext: ChatBookContext = {}): ChatReply {
  const lastUser = [...sanitizeChatTurns(messages)].reverse().find((m) => m.role === 'user');
  const topic = bookContext.parentTopic || bookContext.title || bookContext.domain || 'this topic';
  const question = lastUser?.content || 'your question';
  const pageSnippet = clipPageContext(bookContext.pageText, 280);
  return {
    reply: `In the context of **${topic}**, here is a simple way to think about "${question}":

- It connects to the main idea on this page of the textbook.
- Picture a real-life version of the same idea (a moving car, a phone, or a ball you throw).
- This is a local fallback while the AI tutor is unavailable.
${pageSnippet ? `\nFrom this page: ${pageSnippet}` : ''}

| Piece | What to notice |
| --- | --- |
| Your question | ${question.slice(0, 80)} |
| Context | ${topic} |`,
    relatedFormulas: [],
    keyTakeaways: [`Focus: ${question.slice(0, 80)}`, `Context: ${topic}`],
  };
}

function emitFullChatReply(reply: ChatReply, emit: ChatStreamSink): void {
  if (reply.reply) emit({ type: 'delta', text: reply.reply });
  emit({ type: 'done', relatedFormulas: reply.relatedFormulas, keyTakeaways: reply.keyTakeaways });
}

/**
 * Multi-turn tutor reply. Ported signature/event-contract only — see this
 * file's header comment for why the actual provider call is a single
 * chatCompletion() rather than a streamed multi-provider cascade.
 * Cascade: image attempt (if present) -> text-only retry -> procedural.
 */
export async function generateChatReplyStream(
  messages: ChatTurn[],
  bookContext: ChatBookContext = {},
  emit: ChatStreamSink,
  usageContext?: AiUsageContext,
): Promise<void> {
  const turns = sanitizeChatTurns(messages);
  const lastUser = turns[turns.length - 1];
  if (turns.length === 0 || !lastUser || lastUser.role !== 'user') {
    emitFullChatReply(generateProceduralChatReply(turns, bookContext), emit);
    return;
  }

  const context = gateChatPageImage(turns, bookContext);
  const systemPrompt = buildChatSystemPrompt(context);

  // Zero-LLM firewall — a refusal here never spends a chatCompletion call.
  const scope = assessSyllabusScope({
    question: lastUser.content,
    context,
    hasImage: Boolean(parsePageImage(context.pageImage)),
    hasPriorAssistant: turns.some((turn) => turn.role === 'assistant'),
  });
  if (!scope.allowed) {
    emitFullChatReply(syllabusRefusalReply(context), emit);
    return;
  }

  const parsedImage = parsePageImage(context.pageImage);
  const llmMessages = [{ role: 'system' as const, content: systemPrompt }, ...turns];

  if (parsedImage) {
    try {
      const raw = await chatCompletion(
        llmMessages.map((m, i) => (i === llmMessages.length - 1 ? { ...m, images: [parsedImage.base64] } : m)),
        { jsonMode: true, tier: 'vision', usageContext },
      );
      const parsed = JSON.parse(cleanJson(raw));
      const reply = chatReplyFromParsed(parsed, context);
      if (reply) {
        emitFullChatReply(reply, emit);
        return;
      }
    } catch (err) {
      logger.warn({ err }, '[simExplain] chat (vision) failed — retrying text-only');
    }
  }

  try {
    const raw = await chatCompletion(llmMessages, { jsonMode: true, tier: 'chat', usageContext });
    const parsed = JSON.parse(cleanJson(raw));
    const reply = chatReplyFromParsed(parsed, context);
    if (reply) {
      emitFullChatReply(reply, emit);
      return;
    }
  } catch (err) {
    logger.warn({ err }, '[simExplain] chat call failed — using procedural fallback');
  }

  emitFullChatReply(generateProceduralChatReply(turns, context), emit);
}

export function generateProceduralSimBrief(spec: SimSpec, quote?: string): SimBrief {
  return proceduralSimBrief(spec, quote);
}

function specForBriefPrompt(spec: SimSpec): { promptSpec: SimSpec; metrics?: Record<string, number | string | boolean> } {
  if (!spec.templateId || !isTemplateId(spec.templateId)) return { promptSpec: spec };
  try {
    const bound = bindTemplate(spec.templateId, spec.params, spec);
    return { promptSpec: bound.spec, metrics: bound.metrics };
  } catch {
    return { promptSpec: spec };
  }
}

export async function generateSimBrief(
  spec: SimSpec,
  quote?: string,
  metrics?: Record<string, number | string | boolean>,
  usageContext?: AiUsageContext,
): Promise<SimBrief> {
  const stored = storedSimBrief(spec);
  if (stored) return stored;

  const excerpt = (quote || spec.quote || '').trim();
  const systemPrompt = `You are a friendly STEM tutor for high-school students. Explain ONE simulation in two short sections.

Rules:
- Simple language. Define jargon in a short phrase.
- Include one everyday example in howItWorks.
- Use markdown: short paragraphs, bullets, **bold** key terms, and $LaTeX$ for formulas.
- Do NOT write a long essay. about: 3–5 sentences. howItWorks: 1 short intro + 3–5 bullets.

Respond ONLY with JSON (no markdown fences around the JSON):
{
  "about": "What this simulation is showing and why it exists.",
  "howItWorks": "How the topic works in THIS animation (what moves, what the formula means, one real-life example)."
}`;

  const userPrompt = `Title: ${spec.title}
Subtitle: ${spec.subtitle || ''}
Domain: ${spec.domain || 'physics'}
Template: ${spec.templateId || 'none'}
Topic notes: ${spec.topicExplanation || ''}
Caption: ${spec.caption || ''}
Equations: ${(spec.equations || []).join('; ') || 'none'}
Textbook excerpt: ${excerpt || 'none'}
${formatBookNumbers(spec, metrics)}
Stage elements: ${JSON.stringify(spec.stage?.elements || []).substring(0, 400)}

Write the two-section student brief.`;

  try {
    const raw = await chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { jsonMode: true, tier: 'chat', usageContext },
    );
    const parsed = JSON.parse(cleanJson(raw)) as { about?: unknown; howItWorks?: unknown };
    if (typeof parsed.about === 'string' && parsed.about.trim() && typeof parsed.howItWorks === 'string' && parsed.howItWorks.trim()) {
      return { about: parsed.about.trim(), howItWorks: parsed.howItWorks.trim() };
    }
  } catch (err) {
    logger.warn({ err }, '[simExplain] sim brief call failed — using procedural fallback');
  }

  return generateProceduralSimBrief(spec, quote);
}

/** Writes about + howItWorks onto a mapped spec once (ingest / on-demand
 *  generate). Skips the LLM entirely when the spec already has both. */
export async function ensureSimBrief(spec: SimSpec, quote?: string, usageContext?: AiUsageContext): Promise<SimSpec> {
  if (hasSimBrief(spec)) return spec;
  const { promptSpec, metrics } = specForBriefPrompt(spec);
  const brief = await generateSimBrief(promptSpec, quote || spec.quote, metrics, usageContext);
  return mergeSimBrief(spec, brief);
}
