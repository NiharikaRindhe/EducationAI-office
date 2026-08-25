// api/src/services/simIngest.service.ts
//
// Ported from pdf-simulation-master/server/src/services/sim/ingest.ts, with
// its two repository.ts dependencies (findAnnotationsByHash, insertAnnotations)
// folded in here rather than kept as a separate repository layer — this
// codebase doesn't have one (superAdminContent.service.ts, the closest
// analogue, talks to supabaseAdmin directly too).
//
// The content-hash cache is the load-bearing piece for cost: two
// ncert_ingestion_jobs rows (a platform upload and a school's re-upload of
// the same PDF, or two different schools uploading the same file) whose
// page text hashes identically skip classifyPage() entirely and just copy
// the existing annotations onto the new job_id — see findAnnotationsByHash.

import crypto from 'node:crypto';
import * as mathjs from 'mathjs';
import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import type { AiUsageContext } from '../lib/aiUsage.js';
import { isExpr, isTemplateId, parseTemplateParams, dropCitationParams, maskCitations, type SimSpec } from '../lib/simShared/index.js';
import { classifyPage } from './simClassify.service.js';
import { ensureSimBrief } from './simExplain.service.js';
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

async function findAnnotationsByHash(contentHash: string): Promise<AnnotationRecord[]> {
  const { data, error } = await supabaseAdmin
    .from('sim_annotations')
    .select('*')
    .eq('content_hash', contentHash)
    .limit(3);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to look up cached annotations', error.message);
  return (data ?? []) as AnnotationRecord[];
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
  /** Filters the curator's template offer to the book's own class. */
  classNum?: number;
  skipCache?: boolean;
  usageContext?: AiUsageContext;
}

/**
 * Orchestrates one page: content-hash cache -> word-count pre-filter ->
 * LLM curation -> triage -> template normalize -> math guard -> student
 * brief (once) -> persist. Matches upstream's processPageIngestion funnel;
 * the word-count pre-filter (shouldClassify, >=100 words) is applied by
 * the caller (simWorker.job.ts) before this is invoked, since it also
 * decides the inter-page throttle.
 */
export async function processPageIngestion(params: IngestPageParams): Promise<AnnotationRecord[]> {
  const { jobId, pageNumber, pageText, classNum, skipCache = false, usageContext } = params;
  if (!pageText || pageText.trim().length === 0) return [];

  const contentHash = computeContentHash(pageText);

  if (!skipCache) {
    try {
      const cached = await findAnnotationsByHash(contentHash);
      if (cached.length > 0) {
        const toInsert: CreateAnnotationInput[] = [];
        for (const c of cached) {
          const spec = await ensureSimBrief(c.spec, c.quote, usageContext);
          toInsert.push({
            job_id: jobId,
            page_number: pageNumber,
            quote: c.quote,
            spec,
            spec_version: c.spec_version,
            content_hash: contentHash,
          });
        }
        return await insertAnnotations(toInsert);
      }
    } catch (err) {
      logger.warn({ err }, '[simIngest] cache lookup failed — falling through to classification');
    }
  }

  const candidates = await classifyPage(maskCitations(pageText), { classNum, usageContext });
  if (candidates.length === 0) return [];

  const triaged = triageCandidates(candidates);
  if (triaged.length === 0) return [];

  const normalized = triaged
    .map((c) => normalizeTemplateCandidate(c, pageText))
    .filter((c): c is Candidate => c !== null);
  if (normalized.length === 0) return [];

  const validCandidates = normalized.filter((cand) => validateMathExpressions(cand));
  if (validCandidates.length === 0) return [];

  const annotationsToInsert: CreateAnnotationInput[] = [];
  for (const cand of validCandidates) {
    const { importance: _importance, ...simSpec } = cand;
    void _importance;
    const quote = simSpec.quote || pageText.substring(0, 200);
    const spec = await ensureSimBrief(simSpec as SimSpec, quote, usageContext);
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
