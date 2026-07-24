import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { tryEmbedText } from '../lib/ai.js';
import { extractPdf, parseChapterMap } from '../lib/pdfExtract.js';
import { requireWhitelistedSubject } from '../lib/classSubjects.js';
import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────
//  GLOBAL QUESTION BANK — super_admin can read/write scope='global'
//  questions across all schools. Teachers only write 'school'-scoped.
// ─────────────────────────────────────────────────────────────

const questionTypeEnum = z.enum(['mcq', 'true_false', 'short_answer', 'long_answer', 'fill_blank']);

const bulkQuestionRowSchema = z.object({
  class_num: z.coerce.number().int().min(1).max(10),
  subject: z.string().min(1),
  chapter_num: z.coerce.number().int().optional().nullable(),
  type: questionTypeEnum,
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  text: z.string().min(2),
  correct_answer: z.string().optional().nullable(),
  rubric: z.string().optional().nullable(),
  marks: z.coerce.number().int().min(1).max(20).default(1),
  is_pyq: z.preprocess(
    (v) => (typeof v === 'string' ? v.toLowerCase() === 'true' || v === '1' : Boolean(v)),
    z.boolean().default(false),
  ),
  pyq_year: z.coerce.number().int().optional().nullable(),
  pyq_source: z.string().optional().nullable(),
});

type BulkQuestionRow = z.infer<typeof bulkQuestionRowSchema>;

const normalizeHeader = (h: string) => h.trim().toLowerCase().replace(/\s+/g, '_');

async function bufferToRecords(buffer: Buffer, filename: string): Promise<Record<string, string>[]> {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.xls')) {
    throw new ApiError('VALIDATION_ERROR', 'Old .xls format is not supported — save as .xlsx or .csv');
  }
  if (lower.endsWith('.xlsx')) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) return [];
    const headers: string[] = [];
    sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
      headers[col] = normalizeHeader(cell.text ?? '');
    });
    const records: Record<string, string>[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const record: Record<string, string> = {};
      let hasValue = false;
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        const key = headers[col];
        if (!key) return;
        const value = (cell.text ?? '').trim();
        record[key] = value;
        if (value) hasValue = true;
      });
      if (hasValue) records.push(record);
    });
    return records;
  }
  return parse(buffer, {
    columns: (header: string[]) => header.map(normalizeHeader),
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });
}

export async function listGlobalQuestionBank(filters: {
  classNum?: number;
  subject?: string;
  type?: string;
  isPyq?: boolean;
  search?: string;
} = {}) {
  let query = supabaseAdmin
    .from('question_bank')
    .select('id, class_num, subject, chapter_num, type, difficulty, text, marks, source, is_pyq, pyq_year, pyq_source, created_at, created_by')
    .eq('scope', 'global');

  if (filters.classNum !== undefined) query = query.eq('class_num', filters.classNum);
  if (filters.subject) query = query.eq('subject', filters.subject);
  if (filters.type) query = query.eq('type', filters.type);
  if (filters.isPyq !== undefined) query = query.eq('is_pyq', filters.isPyq);
  if (filters.search) query = query.ilike('text', `%${filters.search}%`);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list global question bank', error.message);
  return data ?? [];
}

export async function addGlobalQuestion(
  superAdminId: string,
  input: {
    classNum: number;
    subject: string;
    chapterNum?: number;
    type: string;
    difficulty: string;
    text: string;
    options?: unknown;
    correctAnswer?: string;
    rubric?: string;
    marks: number;
    isPyq?: boolean;
    pyqYear?: number;
    pyqSource?: string;
  },
) {
  const { data, error } = await supabaseAdmin
    .from('question_bank')
    .insert({
      scope: 'global',
      school_id: null,
      class_num: input.classNum,
      subject: input.subject,
      chapter_num: input.chapterNum ?? null,
      type: input.type,
      difficulty: input.difficulty,
      text: input.text,
      options: input.options ?? null,
      correct_answer: input.correctAnswer ?? null,
      rubric: input.rubric ?? null,
      marks: input.marks,
      source: 'eduai',
      created_by: superAdminId,
      is_pyq: input.isPyq ?? false,
      pyq_year: input.pyqYear ?? null,
      pyq_source: input.pyqSource ?? null,
    })
    .select()
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to add global question', error.message);
  return data;
}

export async function deleteGlobalQuestion(questionId: string) {
  const { data: existing } = await supabaseAdmin
    .from('question_bank')
    .select('id, scope')
    .eq('id', questionId)
    .maybeSingle();
  if (!existing) throw new ApiError('NOT_FOUND', 'Question not found');
  if (existing.scope !== 'global') {
    throw new ApiError('FORBIDDEN', 'Only global-scoped questions can be deleted by Super Admin');
  }
  const { error } = await supabaseAdmin.from('question_bank').delete().eq('id', questionId);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to delete question', error.message);
  return { deleted: true };
}

export async function bulkImportGlobalQuestions(
  superAdminId: string,
  buffer: Buffer,
  filename: string,
) {
  const rawRows = await bufferToRecords(buffer, filename);

  const created: BulkQuestionRow[] = [];
  const errors: { row: number; text?: string; reason: string }[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i]!;
    const parsed = bulkQuestionRowSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push({ row: i + 2, text: raw.text, reason: parsed.error.issues[0]?.message ?? 'Invalid row' });
      continue;
    }
    const row = parsed.data;
    const { error } = await supabaseAdmin.from('question_bank').insert({
      scope: 'global',
      school_id: null,
      class_num: row.class_num,
      subject: row.subject,
      chapter_num: row.chapter_num ?? null,
      type: row.type,
      difficulty: row.difficulty,
      text: row.text,
      correct_answer: row.correct_answer ?? null,
      rubric: row.rubric ?? null,
      marks: row.marks,
      source: 'eduai',
      created_by: superAdminId,
      is_pyq: row.is_pyq,
      pyq_year: row.pyq_year ?? null,
      pyq_source: row.pyq_source ?? null,
    });
    if (error) {
      errors.push({ row: i + 2, text: row.text, reason: error.message });
    } else {
      created.push(row);
    }
  }

  return { created: created.length, errors };
}

// ─────────────────────────────────────────────────────────────
//  NCERT INGESTION JOBS
//  The actual PDF → chunks → embeddings pipeline runs as a
//  separate Python process (or will in production). The Node
//  API handles: job creation, status queries, and status updates
//  called by the pipeline worker when each stage completes.
//  The upload itself stores the file in Supabase Storage;
//  this service records the job row and returns the storage path
//  so the caller (controller) can initiate the pipeline.
// ─────────────────────────────────────────────────────────────

export async function createIngestionJob(
  superAdminId: string,
  input: {
    classNum: number;
    subject: string;
    bookTitle: string;
    originalFilename: string;
    storagePath: string;
    chapterMap?: unknown;
    /** Set only for a School Admin's own upload. Omitted/null = platform-wide
     *  book (Super Admin upload), visible to every school — unchanged behavior. */
    schoolId?: string | null;
  },
) {
  const { data, error } = await supabaseAdmin
    .from('ncert_ingestion_jobs')
    .insert({
      class_num: input.classNum,
      subject: input.subject,
      book_title: input.bookTitle,
      original_filename: input.originalFilename,
      storage_path: input.storagePath,
      chapter_map: input.chapterMap ?? null,
      school_id: input.schoolId ?? null,
      status: 'queued',
      uploaded_by: superAdminId,
    })
    .select()
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to create ingestion job', error.message);
  return data;
}

export async function listIngestionJobs(
  filters: { classNum?: number; subject?: string; status?: string; schoolId?: string } = {},
) {
  let query = supabaseAdmin
    .from('ncert_ingestion_jobs')
    // schools(name): only resolves for a school-uploaded job (school_id set) —
    // lets the Super Admin's merged view tell "platform" and school uploads
    // apart, since both now live in the same table.
    .select('id, class_num, subject, book_title, original_filename, status, total_pages, chunks_created, chunks_embedded, error_message, chapters_detected, uploaded_by, school_id, created_at, updated_at, schools(name)');

  if (filters.classNum !== undefined) query = query.eq('class_num', filters.classNum);
  if (filters.subject) query = query.eq('subject', filters.subject);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.schoolId) query = query.eq('school_id', filters.schoolId);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list ingestion jobs', error.message);
  return data ?? [];
}

/** School Admin's own-upload quota, per (class, subject) — keeps their
 *  supplementary library small and curated; more than a couple of competing
 *  books for one subject muddies retrieval instead of improving it. A failed
 *  upload doesn't count against the quota (it never produced usable content). */
export const SCHOOL_UPLOAD_LIMIT_PER_SUBJECT = 2;

export async function countSchoolUploads(schoolId: string, classNum: number, subject: string) {
  const { count, error } = await supabaseAdmin
    .from('ncert_ingestion_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('class_num', classNum)
    .eq('subject', subject)
    .neq('status', 'error');
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to count uploaded books', error.message);
  return count ?? 0;
}

/** Validates + queues a School Admin's own PDF upload: subject must be
 *  whitelisted for the class, and the school must be under its quota for
 *  that (class, subject) pair. */
export async function createSchoolIngestionJob(
  schoolAdminId: string,
  schoolId: string,
  input: {
    classNum: number;
    subject: string;
    bookTitle: string;
    originalFilename: string;
    pdfBuffer: Buffer;
    chapterMap?: unknown;
  },
) {
  await requireWhitelistedSubject(input.classNum, input.subject);

  const existing = await countSchoolUploads(schoolId, input.classNum, input.subject);
  if (existing >= SCHOOL_UPLOAD_LIMIT_PER_SUBJECT) {
    throw new ApiError(
      'VALIDATION_ERROR',
      `Your school already has ${existing} uploaded book${existing === 1 ? '' : 's'} for Class ${input.classNum} ${input.subject} (limit ${SCHOOL_UPLOAD_LIMIT_PER_SUBJECT}). Raise a support ticket if you need to add more.`,
    );
  }

  const storagePath = `pdfs/school-${schoolId}/class-${input.classNum}/${input.subject.replace(/\s+/g, '_')}/${Date.now()}_${input.originalFilename}`;
  await uploadPdfToStorage(storagePath, input.pdfBuffer);

  return createIngestionJob(schoolAdminId, {
    classNum: input.classNum,
    subject: input.subject,
    bookTitle: input.bookTitle,
    originalFilename: input.originalFilename,
    storagePath,
    chapterMap: input.chapterMap,
    schoolId,
  });
}

/** Throws NOT_FOUND if the job doesn't exist or isn't owned by this school —
 *  the ownership check a School Admin's retry/delete must pass before acting
 *  on a job id (never leaks whether a job owned by ANOTHER school exists). */
export async function requireJobOwnedBySchool(jobId: string, schoolId: string) {
  const { data, error } = await supabaseAdmin
    .from('ncert_ingestion_jobs')
    .select('id')
    .eq('id', jobId)
    .eq('school_id', schoolId)
    .maybeSingle();
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to verify job ownership', error.message);
  if (!data) throw new ApiError('NOT_FOUND', 'Ingestion job not found');
}

export async function updateIngestionJobStatus(
  jobId: string,
  update: {
    status: 'queued' | 'chunking' | 'embedding' | 'done' | 'error';
    totalPages?: number;
    chunksCreated?: number;
    chunksEmbedded?: number;
    errorMessage?: string;
    chaptersDetected?: boolean;
  },
) {
  const { data: existing } = await supabaseAdmin
    .from('ncert_ingestion_jobs')
    .select('id')
    .eq('id', jobId)
    .maybeSingle();
  if (!existing) throw new ApiError('NOT_FOUND', 'Ingestion job not found');

  const updatePayload: Record<string, unknown> = { status: update.status };
  if (update.totalPages !== undefined) updatePayload.total_pages = update.totalPages;
  if (update.chunksCreated !== undefined) updatePayload.chunks_created = update.chunksCreated;
  if (update.chunksEmbedded !== undefined) updatePayload.chunks_embedded = update.chunksEmbedded;
  if (update.errorMessage !== undefined) updatePayload.error_message = update.errorMessage;
  if (update.chaptersDetected !== undefined) updatePayload.chapters_detected = update.chaptersDetected;

  const { data, error } = await supabaseAdmin
    .from('ncert_ingestion_jobs')
    .update(updatePayload)
    .eq('id', jobId)
    .select()
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to update ingestion job', error.message);
  return data;
}

// ─────────────────────────────────────────────────────────────
//  NCERT INGESTION PIPELINE — real implementation.
//  Runs in-process (see jobs/ingestionWorker.job.ts): the jobs
//  table IS the queue, single-concurrency, and every stage
//  checkpoints its counters so the portal's progress bar works
//  and a crash resumes by re-queueing (re-runs are idempotent:
//  each run first deletes everything previously extracted from
//  this same book).
//
//  Stages:
//    chunking  — MuPDF text extraction, chapter tagging (heading
//                detection or the job's manual chapter_map),
//                ~500-token chunks + figure/caption extraction
//    embedding — mxbai-embed-large per chunk + per caption;
//                figures upload to the `ncert` Storage bucket
// ─────────────────────────────────────────────────────────────

export const NCERT_BUCKET = 'ncert';
const EMBED_BATCH_SIZE = 8;

export async function uploadPdfToStorage(storagePath: string, pdfBuffer: Buffer) {
  const { error } = await supabaseAdmin.storage
    .from(NCERT_BUCKET)
    .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true });
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to store PDF', error.message);
}

export async function runIngestionPipeline(jobId: string) {
  try {
    const { data: job, error: jobError } = await supabaseAdmin
      .from('ncert_ingestion_jobs')
      .select('id, class_num, subject, book_title, storage_path, chapter_map, school_id')
      .eq('id', jobId)
      .single();
    if (jobError || !job) throw new Error('Ingestion job not found');
    if (!job.storage_path) throw new Error('Job has no stored PDF to ingest');

    // --- Stage 1: extract ---
    await updateIngestionJobStatus(jobId, { status: 'chunking' });

    const { data: pdfBlob, error: downloadError } = await supabaseAdmin.storage
      .from(NCERT_BUCKET)
      .download(job.storage_path);
    if (downloadError || !pdfBlob) throw new Error(`Could not download PDF from storage: ${downloadError?.message}`);
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    const chapterMap = parseChapterMap(job.chapter_map);
    const extracted = await extractPdf(pdfBuffer, { chapterMap });

    // Idempotency: this book's previous rows go away before re-insert, so a
    // re-upload of a corrected PDF (or a crash-retry) can never duplicate.
    // school_id is part of the match too — two different schools (or a
    // school and the platform library) can otherwise share the same
    // (class, subject, book_title) and must never delete each other's rows.
    let deleteChunks = supabaseAdmin
      .from('text_chunks')
      .delete()
      .eq('class_num', job.class_num)
      .eq('subject', job.subject)
      .eq('book_title', job.book_title);
    deleteChunks = job.school_id ? deleteChunks.eq('school_id', job.school_id) : deleteChunks.is('school_id', null);
    await deleteChunks;

    let deleteImages = supabaseAdmin
      .from('book_images')
      .delete()
      .eq('class_num', job.class_num)
      .eq('subject', job.subject)
      .eq('book_title', job.book_title);
    deleteImages = job.school_id ? deleteImages.eq('school_id', job.school_id) : deleteImages.is('school_id', null);
    await deleteImages;

    await updateIngestionJobStatus(jobId, {
      status: 'embedding',
      totalPages: extracted.totalPages,
      chunksCreated: extracted.chunks.length,
    });

    // --- Stage 2: embed + insert chunks (batched, checkpointed) ---
    let embedded = 0;
    for (let i = 0; i < extracted.chunks.length; i += EMBED_BATCH_SIZE) {
      const batch = extracted.chunks.slice(i, i + EMBED_BATCH_SIZE);
      const embeddings = await Promise.all(batch.map((c) => tryEmbedText(c.content)));

      const rows = batch.map((chunk, j) => ({
        class_num: job.class_num,
        subject: job.subject,
        book_title: job.book_title,
        school_id: job.school_id,
        chapter_num: chunk.chapterNum,
        chapter_title: chunk.chapterTitle,
        page_num: chunk.pageNum,
        content: chunk.content,
        token_count: chunk.tokenCount,
        // A chunk without an embedding is still inserted — retrieval skips it
        // until a re-run embeds it, but the content is never silently lost.
        embedding: embeddings[j] ?? null,
      }));

      const { error } = await supabaseAdmin.from('text_chunks').insert(rows);
      if (error) throw new Error(`Chunk insert failed at batch ${i / EMBED_BATCH_SIZE + 1}: ${error.message}`);

      embedded += embeddings.filter((e) => e !== null).length;
      await updateIngestionJobStatus(jobId, { status: 'embedding', chunksEmbedded: embedded });
    }

    // --- Stage 3: figures → Storage + caption embeddings ---
    for (let i = 0; i < extracted.figures.length; i++) {
      const fig = extracted.figures[i]!;
      const figPath = `figures/${jobId}/${i + 1}.png`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from(NCERT_BUCKET)
        .upload(figPath, fig.png, { contentType: 'image/png', upsert: true });
      if (uploadError) continue; // one bad figure shouldn't fail the book

      const { data: urlData } = supabaseAdmin.storage.from(NCERT_BUCKET).getPublicUrl(figPath);

      // Embed the CAPTION, not pixels — "show me the triangle from chapter 11"
      // matches "Fig 11.4 Triangle ABC". A caption-less figure falls back to
      // its chapter title as a weak retrieval key.
      const captionText = fig.caption ?? `${fig.chapterTitle ?? job.book_title} figure, page ${fig.pageNum}`;
      const captionEmbedding = await tryEmbedText(captionText);

      await supabaseAdmin.from('book_images').insert({
        class_num: job.class_num,
        subject: job.subject,
        book_title: job.book_title,
        school_id: job.school_id,
        chapter_num: fig.chapterNum,
        chapter_title: fig.chapterTitle,
        page_num: fig.pageNum,
        image_url: urlData.publicUrl,
        caption: fig.caption,
        embedding: captionEmbedding,
      });
    }

    // ivfflat was built on an empty table — refresh planner stats after a
    // bulk load or retrieval quality/planning degrades silently.
    await supabaseAdmin.rpc('analyze_rag_tables');

    // Some NCERT books (newer NEP/"Curiosity" series) don't say "Chapter N"
    // anywhere — heading detection then tags 0% of chunks. The book still
    // ingests and RAG still retrieves fine, but citations lose their chapter
    // reference. Surface that instead of shipping it silently — the admin
    // can re-run with a manual chapter map (already supported) to fix it.
    const chaptersDetected = extracted.chunks.length > 0 && extracted.chunks.some((c) => c.chapterNum !== null);

    await updateIngestionJobStatus(jobId, { status: 'done', chunksEmbedded: embedded, chaptersDetected });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateIngestionJobStatus(jobId, { status: 'error', errorMessage: message }).catch(() => {});
    throw err;
  }
}

/** Deletes a book entirely: the ingestion job row, every indexed chunk/image
 *  for it, and the original PDF + extracted figures from Storage. Uses the
 *  same (class_num, subject, book_title) delete key the pipeline itself uses
 *  for idempotent re-runs, so this can never leave orphaned chunks behind. */
export async function deleteIngestionJob(jobId: string) {
  const { data: job, error: jobError } = await supabaseAdmin
    .from('ncert_ingestion_jobs')
    .select('id, class_num, subject, book_title, storage_path, status, school_id')
    .eq('id', jobId)
    .maybeSingle();
  if (jobError) throw new ApiError('INTERNAL_ERROR', 'Failed to load ingestion job', jobError.message);
  if (!job) throw new ApiError('NOT_FOUND', 'Ingestion job not found');
  if (job.status === 'chunking' || job.status === 'embedding') {
    throw new ApiError('VALIDATION_ERROR', 'Cannot delete a job that is currently being processed');
  }

  // school_id is part of the match — see the matching comment in
  // runIngestionPipeline's idempotent delete for why.
  let deleteChunks = supabaseAdmin
    .from('text_chunks')
    .delete()
    .eq('class_num', job.class_num)
    .eq('subject', job.subject)
    .eq('book_title', job.book_title);
  deleteChunks = job.school_id ? deleteChunks.eq('school_id', job.school_id) : deleteChunks.is('school_id', null);
  await deleteChunks;

  let deleteImages = supabaseAdmin
    .from('book_images')
    .delete()
    .eq('class_num', job.class_num)
    .eq('subject', job.subject)
    .eq('book_title', job.book_title);
  deleteImages = job.school_id ? deleteImages.eq('school_id', job.school_id) : deleteImages.is('school_id', null);
  await deleteImages;

  if (job.storage_path) {
    await supabaseAdmin.storage.from(NCERT_BUCKET).remove([job.storage_path]);
  }
  const { data: figureFiles } = await supabaseAdmin.storage.from(NCERT_BUCKET).list(`figures/${jobId}`);
  if (figureFiles && figureFiles.length > 0) {
    await supabaseAdmin.storage.from(NCERT_BUCKET).remove(figureFiles.map((f) => `figures/${jobId}/${f.name}`));
  }

  const { error } = await supabaseAdmin.from('ncert_ingestion_jobs').delete().eq('id', jobId);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to delete ingestion job', error.message);
  return { deleted: true };
}

/** Re-queue a finished/failed job — the worker re-runs it idempotently. */
export async function retryIngestionJob(jobId: string) {
  const { data: job } = await supabaseAdmin
    .from('ncert_ingestion_jobs')
    .select('id, status, storage_path')
    .eq('id', jobId)
    .maybeSingle();
  if (!job) throw new ApiError('NOT_FOUND', 'Ingestion job not found');
  if (!job.storage_path) throw new ApiError('VALIDATION_ERROR', 'Job has no stored PDF — upload the book again instead');
  if (job.status === 'chunking' || job.status === 'embedding') {
    throw new ApiError('VALIDATION_ERROR', 'Job is currently being processed');
  }
  return updateIngestionJobStatus(jobId, { status: 'queued', errorMessage: '' });
}
