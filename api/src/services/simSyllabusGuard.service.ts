// api/src/services/simSyllabusGuard.service.ts
//
// Ported unmodified (apart from the import path) from pdf-simulation-master/
// server/src/services/sim/syllabusGuard.ts. Keep the tutor on the open
// textbook. Hard-refuse obvious off-book asks; otherwise overlap with
// title / page / mapped topics decides. Zero LLM cost — a refusal here
// never reaches chatCompletion.

import { TEMPLATE_CATALOG, isTemplateId, type SimSpec } from '../lib/simShared/index.js';

export interface SyllabusContext {
  title?: string;
  parentTopic?: string;
  domain?: string;
  pageText?: string;
  syllabusTopics?: string[];
}

export type SyllabusDecision = { allowed: true } | { allowed: false; reason: string };

const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her',
  'was', 'one', 'our', 'out', 'has', 'have', 'had', 'how', 'why', 'what',
  'when', 'who', 'which', 'this', 'that', 'with', 'from', 'they', 'them',
  'then', 'than', 'into', 'about', 'your', 'just', 'like', 'some', 'more',
  'also', 'does', 'did', 'please', 'tell', 'give', 'make', 'help',
  'explain', 'meaning', 'define', 'definition', 'question', 'answer',
  'page', 'chapter', 'topic', 'book', 'textbook', 'formula', 'example',
  'simple', 'simply', 'again', 'another', 'still', 'here', 'there',
]);

const GENERIC_TOKENS = new Set(['physics', 'chemistry', 'math', 'mathematics', 'science', 'general', 'class', 'ncert']);

const JAILBREAK =
  /\b(ignore (all )?(previous|prior|above) (instructions|prompts|rules)|you are now|jailbreak|dan mode|developer mode|system prompt)\b/i;

const OFF_BOOK_ACTIVITY =
  /\b(who won|match score|final score|ipl\b|premier league|stock market|bitcoin|cryptocurrency|write (me )?(a )?(python|javascript|java|c\+\+|html|react)|leetcode|my (boyfriend|girlfriend)|dating advice|instagram followers)\b/i;

const OTHER_SUBJECT =
  /\b(world war|shakespeare|english essay|poem analysis|hindi (vyakaran|grammar)|civics homework|political science|capital of|prime minister of|president of)\b/i;

const STUDY_DEIXIS =
  /\b(this (page|chapter|topic|formula|diagram|figure|example|book|passage|image)|this\b.{0,24}\b(formula|diagram|figure|page|example)|the (formula|diagram|figure|page|example)|in simple words|another example|worked example|walk me through|key (idea|formula)|main idea)\b/i;

const GREETING = /^(hi|hello|hey|yo|thanks|thank you|ok|okay|good morning|good evening)\b/i;

export function topicsFromSpecs(specs: Array<SimSpec | undefined | null>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (value?: string) => {
    const text = value?.trim();
    if (!text) return;
    const key = text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(text);
  };

  for (const spec of specs) {
    if (!spec) continue;
    add(spec.title);
    add(spec.parentTopic);
    add(spec.subtitle);
    if (spec.templateId && isTemplateId(spec.templateId)) {
      const def = TEMPLATE_CATALOG[spec.templateId];
      add(def.label);
      for (const keyword of def.keywords) add(keyword);
    }
  }
  return out;
}

export function contentTokens(text: string): Set<string> {
  const tokens = new Set<string>();
  for (const raw of text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(/\s+/)) {
    if (raw.length < 3 || STOPWORDS.has(raw) || /^\d+$/.test(raw)) continue;
    tokens.add(raw);
  }
  return tokens;
}

function corpusText(context: SyllabusContext): string {
  return [context.title, context.parentTopic, context.pageText, ...(context.syllabusTopics || [])]
    .filter(Boolean)
    .join(' \n ');
}

function tokenMatches(token: string, corpus: Set<string>): boolean {
  if (corpus.has(token)) return true;
  for (const item of corpus) {
    if (item.length < 4 || token.length < 4) continue;
    if (item.startsWith(token) || token.startsWith(item)) return true;
  }
  return false;
}

function overlapHits(questionTokens: Set<string>, corpus: Set<string>, specificOnly = false): number {
  let hits = 0;
  for (const token of questionTokens) {
    if (specificOnly && GENERIC_TOKENS.has(token)) continue;
    if (tokenMatches(token, corpus)) hits += 1;
  }
  return hits;
}

function isShortFollowUp(question: string, hasPriorAssistant: boolean): boolean {
  const trimmed = question.trim();
  if (STUDY_DEIXIS.test(trimmed)) return true;
  if (!hasPriorAssistant) return false;
  return trimmed.length <= 48 && /^(why|how|and|but|so|then|what about|can you|please)/i.test(trimmed);
}

export function assessSyllabusScope(input: {
  question: string;
  context: SyllabusContext;
  hasImage?: boolean;
  hasPriorAssistant?: boolean;
}): SyllabusDecision {
  const question = input.question.trim();
  if (!question) return { allowed: false, reason: 'empty' };

  if (JAILBREAK.test(question)) return { allowed: false, reason: 'jailbreak' };
  if (OFF_BOOK_ACTIVITY.test(question)) return { allowed: false, reason: 'off-book activity' };

  const corpus = contentTokens(corpusText(input.context));
  if (OTHER_SUBJECT.test(question)) {
    const otherHits = overlapHits(contentTokens(question), corpus);
    if (otherHits === 0) return { allowed: false, reason: 'other subject' };
  }

  if (input.hasImage) return { allowed: true };
  if (GREETING.test(question) && question.length < 80) return { allowed: true };
  if (isShortFollowUp(question, Boolean(input.hasPriorAssistant))) return { allowed: true };

  const questionTokens = contentTokens(question);
  if (questionTokens.size === 0) return { allowed: true };

  const hits = overlapHits(questionTokens, corpus, true);
  if (hits >= 2) return { allowed: true };
  if (hits >= 1 && questionTokens.size <= 5) return { allowed: true };
  if (questionTokens.size > 0 && hits / questionTokens.size >= 0.4) return { allowed: true };

  return { allowed: false, reason: 'no overlap with current book' };
}

export function syllabusRefusalReply(context: SyllabusContext): {
  reply: string;
  relatedFormulas: string[];
  keyTakeaways: string[];
} {
  const title = context.title?.trim() || 'this textbook';
  const topic = context.parentTopic?.trim() || title;
  return {
    reply: `I can only help with **${title}** — the book you have open now.

That question is outside this textbook. Ask about **${topic}**, highlight a line on this page, or try:
- What is the main idea on this page?
- Walk me through the key formula.`,
    relatedFormulas: [],
    keyTakeaways: [`Stay on ${title}`],
  };
}
