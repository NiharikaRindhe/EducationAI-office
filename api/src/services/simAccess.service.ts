// api/src/services/simAccess.service.ts
//
// The single access-control gate every student-facing sim endpoint goes
// through: which book, whose class, whose school. Centralised here rather
// than repeated per-route so the trust boundary is asserted once — the
// same reasoning chat.service.ts documents for RAG retrieval: "the
// session's class is ALWAYS the student's own class from their profile —
// never the client-supplied value."
//
// A book is reachable by a student only once its RAG index is ready
// (status='done') AND its simulations are ready (sim_status='ready') — the
// student-facing book list (listReadableBooks) only ever offers sim-ready
// books, so this is consistent rather than an extra restriction layered on
// top of what the UI already implies.

import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { NCERT_BUCKET } from './superAdminContent.service.js';
import { writeAuditLog } from './auditLog.service.js';
import type { SimSpec } from '../lib/simShared/index.js';

const SIGNED_URL_TTL_SECONDS = 15 * 60;

export interface StudentIdentity {
  id: string;
  schoolId: string | null;
}

export interface ReadableBook {
  id: string;
  classNum: number;
  subject: string;
  bookTitle: string;
  schoolId: string | null;
  storagePath: string | null;
}

async function getStudentClassNum(studentId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('student_profiles')
    .select('class_num')
    .eq('user_id', studentId)
    .single();
  if (error || !data) throw new ApiError('NOT_FOUND', 'Student profile not found');
  return data.class_num as number;
}

/** Every check a student's book access must pass. Returns NOT_FOUND (never
 *  FORBIDDEN) on any failure — matching requireJobOwnedBySchool's own
 *  reasoning: a wrong-class or wrong-school request must never confirm
 *  that a book with this id exists at all. */
export async function requireReadableBook(jobId: string, student: StudentIdentity): Promise<ReadableBook> {
  const classNum = await getStudentClassNum(student.id);

  const { data: job, error } = await supabaseAdmin
    .from('ncert_ingestion_jobs')
    .select('id, class_num, subject, book_title, school_id, storage_path, status, sim_status')
    .eq('id', jobId)
    .maybeSingle();
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load book', error.message);

  const notFound = () => new ApiError('NOT_FOUND', 'Book not found');
  if (!job) throw notFound();
  if (job.class_num !== classNum) throw notFound();
  if (job.school_id && job.school_id !== student.schoolId) throw notFound();
  if (job.status !== 'done' || job.sim_status !== 'ready') throw notFound();

  return {
    id: job.id,
    classNum: job.class_num,
    subject: job.subject,
    bookTitle: job.book_title,
    schoolId: job.school_id,
    storagePath: job.storage_path,
  };
}

export interface ReadableBookSummary {
  id: string;
  classNum: number;
  subject: string;
  bookTitle: string;
  pagesSimulated: number;
}

/** Every sim-ready book this student's class can read — platform-wide
 *  (school_id IS NULL) union their own school's uploads. Matches the
 *  `school_id.is.null,school_id.eq.<schoolId>` idiom already used by
 *  examGenerator.service.ts's chapter/chunk lookups. */
export async function listReadableBooks(student: StudentIdentity): Promise<ReadableBookSummary[]> {
  const classNum = await getStudentClassNum(student.id);

  let query = supabaseAdmin
    .from('ncert_ingestion_jobs')
    .select('id, class_num, subject, book_title, sim_pages_done')
    .eq('class_num', classNum)
    .eq('status', 'done')
    .eq('sim_status', 'ready');
  query = student.schoolId
    ? query.or(`school_id.is.null,school_id.eq.${student.schoolId}`)
    : query.is('school_id', null);

  const { data, error } = await query.order('subject').order('book_title');
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list books', error.message);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    classNum: row.class_num as number,
    subject: row.subject as string,
    bookTitle: row.book_title as string,
    pagesSimulated: (row.sim_pages_done as number) ?? 0,
  }));
}

/** A short-lived signed URL so react-pdf can stream the PDF directly from
 *  Storage — a 40MB textbook never passes through this API process. The
 *  cost of the short window is that the URL is shareable for that long;
 *  accepted for a book any student in the class can already open. */
export async function getSignedPdfUrl(jobId: string, student: StudentIdentity): Promise<{ url: string; expiresAt: string }> {
  const book = await requireReadableBook(jobId, student);
  if (!book.storagePath) throw new ApiError('NOT_FOUND', 'This book has no stored PDF');

  const { data, error } = await supabaseAdmin.storage
    .from(NCERT_BUCKET)
    .createSignedUrl(book.storagePath, SIGNED_URL_TTL_SECONDS);
  if (error || !data) throw new ApiError('INTERNAL_ERROR', 'Failed to create a download link', error?.message);

  await writeAuditLog({
    schoolId: student.schoolId,
    actorId: student.id,
    action: 'sim.pdf_url_issued',
    entity: 'ncert_ingestion_job',
    entityId: jobId,
  });

  return { url: data.signedUrl, expiresAt: new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString() };
}

export interface AnnotationSummary {
  id: string;
  pageNumber: number;
  quote: string;
  spec: SimSpec;
  specVersion: string;
}

/** Raw annotation specs (templateId + params, no stage) for a book, or one
 *  page of it. The browser binds templateId/params to a live stage itself
 *  via bindTemplate() from @sim/shared — matching upstream's read path,
 *  where ingest stores template metadata only and the client's shared
 *  package does the solving at render time. */
export async function getAnnotations(jobId: string, student: StudentIdentity, page?: number): Promise<AnnotationSummary[]> {
  await requireReadableBook(jobId, student);

  let query = supabaseAdmin
    .from('sim_annotations')
    .select('id, page_number, quote, spec, spec_version')
    .eq('job_id', jobId);
  if (page !== undefined) query = query.eq('page_number', page);

  const { data, error } = await query.order('page_number');
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load annotations', error.message);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    pageNumber: row.page_number as number,
    quote: row.quote as string,
    spec: row.spec as SimSpec,
    specVersion: row.spec_version as string,
  }));
}

/** One annotation, scoped to a readable book — the /explain endpoint's
 *  input. The client sends an annotationId it already legitimately holds
 *  (from a prior getAnnotations call), not a free-form spec, so the
 *  explanation is always grounded in what this server actually classified. */
export async function getAnnotationById(jobId: string, annotationId: string, student: StudentIdentity): Promise<AnnotationSummary> {
  await requireReadableBook(jobId, student);
  const { data, error } = await supabaseAdmin
    .from('sim_annotations')
    .select('id, page_number, quote, spec, spec_version')
    .eq('id', annotationId)
    .eq('job_id', jobId)
    .maybeSingle();
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load simulation', error.message);
  if (!data) throw new ApiError('NOT_FOUND', 'Simulation not found');
  return {
    id: data.id as string,
    pageNumber: data.page_number as number,
    quote: data.quote as string,
    spec: data.spec as SimSpec,
    specVersion: data.spec_version as string,
  };
}

/** Overwrites an existing annotation's spec — the /generate endpoint's
 *  "re-animate this sim with a custom prompt" path. Scoped to job_id so a
 *  student can only ever touch an annotation on a book they can read. */
export async function updateAnnotationSpec(
  jobId: string,
  annotationId: string,
  student: StudentIdentity,
  spec: SimSpec,
  quote: string,
): Promise<AnnotationSummary> {
  await requireReadableBook(jobId, student);
  const { data, error } = await supabaseAdmin
    .from('sim_annotations')
    .update({ spec, quote, spec_version: spec.version || '2.0' })
    .eq('id', annotationId)
    .eq('job_id', jobId)
    .select('id, page_number, quote, spec, spec_version')
    .maybeSingle();
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to save the regenerated simulation', error.message);
  if (!data) throw new ApiError('NOT_FOUND', 'Simulation not found');
  return {
    id: data.id as string,
    pageNumber: data.page_number as number,
    quote: data.quote as string,
    spec: data.spec as SimSpec,
    specVersion: data.spec_version as string,
  };
}

/** Server-side grounding text for chat / highlight-explain — the client
 *  sends a page number, never page text (see the module header comment). */
export async function getPageText(jobId: string, student: StudentIdentity, pageNumber: number): Promise<string> {
  await requireReadableBook(jobId, student);

  const { data, error } = await supabaseAdmin
    .from('sim_pages')
    .select('text')
    .eq('job_id', jobId)
    .eq('page_number', pageNumber)
    .maybeSingle();
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load page text', error.message);
  return (data?.text as string | undefined) ?? '';
}

/** Other chapters / mapped simulations across this book, for the chat
 *  system prompt's "other topics you may mention" list — mirrors upstream's
 *  attachBookSyllabus. Capped at 60 annotation rows: topicsFromSpecs itself
 *  dedupes and caps at 24 topics, this just bounds the read. */
export async function listBookTopics(jobId: string, student: StudentIdentity): Promise<SimSpec[]> {
  await requireReadableBook(jobId, student);
  const { data, error } = await supabaseAdmin
    .from('sim_annotations')
    .select('spec')
    .eq('job_id', jobId)
    .limit(60);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load book topics', error.message);
  return (data ?? []).map((row) => row.spec as SimSpec);
}
