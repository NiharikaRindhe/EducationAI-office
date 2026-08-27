// api/src/services/simIngest.service.ts
//
// Ported from pdf-simulation-master/server/src/services/sim/ingest.ts, with
// its two repository.ts dependencies (findAnnotationsByHash, insertAnnotations)
// folded in here rather than kept as a separate repository layer — this
// codebase doesn't have one (superAdminContent.service.ts, the closest
// analogue, talks to supabaseAdmin directly too).
//
// Placement is hardcoded in ncertPageTags — no curator LLM per page.

import crypto from 'node:crypto';
import * as mathjs from 'mathjs';
import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import type { AiUsageContext } from '../lib/aiUsage.js';
import {
  isExpr,
  isTemplateId,
  parseTemplateParams,
  dropCitationParams,
  createTemplateSpec,
  proceduralSimBrief,
  mergeSimBrief,
  type SimSpec,
} from '../lib/simShared/index.js';
import { lookupNcertPageTags } from '../lib/simShared/ncertPageTags.catalog.js';
import type { Candidate } from './simCandidateSchema.js';

export interface AnnotationRecord {
  id: string;
  job_id: string;
  page_number: number;
  quote: string;
  spec: SimSpec;
  spec_version: string;
  content_hash: string | null;
  created_at: string;
}

/** Runs mathjs.parse on every `{ $expr }` in the spec's stage. A normal
 *  ingest-path spec (template metadata only, no stage) passes immediately —
 *  this guard only bites on-demand-generated specs that do carry a stage. */
export function validateMathExpressions(spec: SimSpec): boolean {
  if (!spec.isSimulatable || !spec.stage) return true;

  for (const element of spec.stage.elements) {
    if (element.props) {
      for (const [key, val] of Object.entries(element.props)) {
        if (isExpr(val)) {
          try {
            mathjs.parse(val.$expr);
          } catch {
            logger.warn({ elementId: element.id, key, expr: val.$expr }, '[simIngest] math guard dropped an element — invalid expression');
            return false;
          }
        }
      }
    }
    if (element.text && isExpr(element.text)) {
      try {
        mathjs.parse(element.text.$expr);
      } catch {
        logger.warn({ elementId: element.id, expr: element.text.$expr }, '[simIngest] math guard dropped an element — invalid text expression');
        return false;
      }
    }
  }
  return true;
}

/** Curator rules: drop importance < 6, sort by importance, keep top 3. */
export function triageCandidates(candidates: Candidate[]): Candidate[] {
  return candidates.filter((c) => c.importance >= 6).sort((a, b) => b.importance - a.importance).slice(0, 3);
}

/** Books only store templateId + params. Unknown ids and LLM-drawn stages
 *  are dropped; citation numbers (Fig. 8.5, Activity 8.4, ...) are stripped
 *  from params unless they also appear as a real unit-backed quantity. */
export function normalizeTemplateCandidate(candidate: Candidate, sourceText = ''): Candidate | null {
  if (!candidate.templateId) {
    if (candidate.isSimulatable) {
      logger.warn('[simIngest] dropping candidate with no templateId (LLM stage is not stored)');
      return null;
    }
    return candidate;
  }
  if (!isTemplateId(candidate.templateId)) {
    logger.warn({ templateId: candidate.templateId }, '[simIngest] dropping unknown templateId');
    return null;
  }

  const source = [sourceText, candidate.quote].filter(Boolean).join('\n');
  const cleaned = dropCitationParams(candidate.params, source);
  const { params, paramMeta } = parseTemplateParams(candidate.templateId, cleaned);
  return { ...candidate, params, paramMeta, stage: undefined, isSimulatable: true, reasonIfNotSimulatable: '' };
}

/** 16-char SHA-256 prefix of the trimmed page text — the dedup/cache key. */
export function computeContentHash(pageText: string): string {
  return crypto.createHash('sha256').update(pageText.trim()).digest('hex').substring(0, 16);
}

interface CreateAnnotationInput {
  job_id: string;
  page_number: number;
  quote: string;
  spec: SimSpec;
  spec_version: string;
  content_hash: string;
}

async function insertAnnotations(rows: CreateAnnotationInput[]): Promise<AnnotationRecord[]> {
  if (rows.length === 0) return [];
  const { data, error } = await supabaseAdmin.from('sim_annotations').insert(rows).select();
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to save simulation annotations', error.message);
  return (data ?? []) as AnnotationRecord[];
}

export interface IngestPageParams {
  jobId: string;
  pageNumber: number;
  pageText: string;
  classNum?: number;
  subject?: string;
  bookTitle?: string;
  skipCache?: boolean;
  usageContext?: AiUsageContext;
}

/**
 * Hardcoded NCERT page tags → template spec → procedural brief → persist.
 * Untagged pages get no simulation. No curator LLM.
 */
export async function processPageIngestion(params: IngestPageParams): Promise<AnnotationRecord[]> {
  const { jobId, pageNumber, pageText, classNum, subject = '', bookTitle = '' } = params;
  if (!pageText || pageText.trim().length === 0) return [];
  if (!classNum) return [];

  const contentHash = computeContentHash(pageText);
  const tags = lookupNcertPageTags({ classNum, subject, bookTitle, pageNumber, pageText });
  if (tags.length === 0) return [];

  const annotationsToInsert: CreateAnnotationInput[] = [];
  for (const tag of tags) {
    if (!isTemplateId(tag.templateId)) {
      logger.warn({ templateId: tag.templateId, pageNumber }, '[simIngest] tagged unknown templateId — skipped');
      continue;
    }
    const quote = pageText.replace(/\s+/g, ' ').trim().slice(0, 200);
    const spec = mergeSimBrief(createTemplateSpec(tag.templateId, tag.params, { quote }), proceduralSimBrief(createTemplateSpec(tag.templateId, tag.params), quote));
    if (!validateMathExpressions(spec)) continue;
    annotationsToInsert.push({
      job_id: jobId,
      page_number: pageNumber,
      quote,
      spec,
      spec_version: spec.version || '2.0',
      content_hash: contentHash,
    });
  }

  return await insertAnnotations(annotationsToInsert);
}

/** Upserts one page's extracted text — the server-side grounding store for
 *  chat and highlight-explain, and the classification input for this page. */
export async function upsertSimPage(jobId: string, pageNumber: number, text: string, wordCount: number): Promise<void> {
  const { error } = await supabaseAdmin
    .from('sim_pages')
    .upsert(
      { job_id: jobId, page_number: pageNumber, text, word_count: wordCount, content_hash: text.trim() ? computeContentHash(text) : null },
      { onConflict: 'job_id,page_number' },
    );
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to save page text', error.message);
}
