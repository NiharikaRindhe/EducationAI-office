import React from 'react';
import { api, ApiClientError } from './api';

/**
 * Shared client for the book-ingestion library that the Super Admin and
 * School Admin portals both operate. The two portals differ only in scope
 * (platform-wide vs. one school) and in whether a per-subject quota applies,
 * so the query state, the status vocabulary and the progress maths all live
 * here — the pages just render them. Matching UI lives in
 * components/shared/BookUploader.tsx and BookLibraryTable.tsx.
 */

export type JobStatus = 'queued' | 'chunking' | 'embedding' | 'done' | 'error';

/** PDF simulator lifecycle — decoupled from JobStatus above on purpose:
 *  a book reaching 'done' (RAG-ready) and its simulations reaching 'ready'
 *  are two different pipelines that must not block each other. See
 *  migration 20250101000186_pdf_simulator.sql. */
export type SimStatus = 'disabled' | 'queued' | 'running' | 'ready' | 'error';

export interface BookJob {
  id: string;
  class_num: number;
  subject: string;
  book_title: string;
  original_filename: string;
  status: JobStatus;
  total_pages?: number;
  chunks_created: number;
  chunks_embedded: number;
  error_message?: string;
  chapters_detected?: boolean | null;
  created_at: string;
  /** Super Admin only — null means the platform uploaded it. */
  school_id?: string | null;
  schools?: { name: string } | null;
  /** A previous-year question paper PDF rather than a textbook — same
   *  pipeline, tagged so the library and the tutor's citations differ. */
  is_pyq?: boolean;
  pyq_year?: number | null;
  pyq_source?: string | null;
  sim_status?: SimStatus;
  sim_pages_total?: number | null;
  sim_pages_done?: number;
  sim_error?: string | null;
}

/** Must match the multer ceiling in api/src/routes/{super,school}Admin.routes.ts. */
export const MAX_UPLOAD_MB = 150;

/**
 * One row per pipeline stage, in the order a book moves through them. The
 * `step` is what drives the stage rail in the table: a School Admin should be
 * able to tell "still extracting text" from "embedding for search" without
 * reading raw chunk counters.
 */
export const STATUS_META: Record<JobStatus, {
  label: string;
  /** What is actually happening, in plain language. */
  hint: string;
  chip: string;
  bar: string;
  /** 0-based position in the queued → extract → index → ready rail. */
  step: number;
}> = {
  queued:    { label: 'Queued',     hint: 'Waiting for the indexing worker to pick it up', chip: 'bg-slate-100 text-slate-600 ring-slate-200',     bar: 'bg-slate-300',   step: 0 },
  chunking:  { label: 'Extracting', hint: 'Reading text and diagrams out of the PDF',      chip: 'bg-sky-50 text-sky-700 ring-sky-200',           bar: 'bg-sky-500',     step: 1 },
  embedding: { label: 'Indexing',   hint: 'Building the search index for the AI tutor',    chip: 'bg-amber-50 text-amber-700 ring-amber-200',     bar: 'bg-amber-500',   step: 2 },
  done:      { label: 'Ready',      hint: 'The AI tutor can answer from this book',        chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200', bar: 'bg-emerald-500', step: 3 },
  error:     { label: 'Failed',     hint: 'Processing stopped — re-process to try again',  chip: 'bg-rose-50 text-rose-700 ring-rose-200',        bar: 'bg-rose-400',    step: 1 },
};

export const PIPELINE_STEPS = ['Queued', 'Extract', 'Index', 'Ready'] as const;

/** A separate indicator, not a fifth pipeline step — sim_status is its own
 *  column, checked independently of the RAG rail above. */
export const SIM_STATUS_META: Record<SimStatus, { label: string; hint: string; chip: string }> = {
  disabled: { label: 'Off',      hint: 'Simulations are not enabled for this book',            chip: 'bg-slate-100 text-slate-500 ring-slate-200' },
  queued:   { label: 'Queued',   hint: 'Waiting for the simulating worker to pick it up',       chip: 'bg-slate-100 text-slate-600 ring-slate-200' },
  running:  { label: 'Working',  hint: 'Classifying pages into simulations',                    chip: 'bg-amber-50 text-amber-700 ring-amber-200' },
  ready:    { label: 'Ready',    hint: 'Students can see simulations from this book',            chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  error:    { label: 'Failed',   hint: 'The simulating pass stopped — retry to try again',       chip: 'bg-rose-50 text-rose-700 ring-rose-200' },
};

/** A single 0-100 number for the row's progress bar. */
export function jobProgress(job: BookJob): number {
  if (job.status === 'done') return 100;
  if (job.status === 'queued') return 0;
  if (job.chunks_created === 0) return job.status === 'chunking' ? 8 : 0;
  return Math.min(99, Math.round((job.chunks_embedded / job.chunks_created) * 100));
}

export interface BookFilters {
  search: string;
  classNum: string;
  subject: string;
  status: 'all' | JobStatus | 'processing';
  /** Super Admin only: platform-uploaded vs. school-uploaded books. */
  source: 'all' | 'platform' | 'school';
  /** Textbooks vs. previous-year question papers. */
  kind: 'all' | 'book' | 'pyq';
  /** PYQ papers only — a book has no year, so this only ever narrows kind='pyq'. */
  pyqYear: string;
}

export const EMPTY_BOOK_FILTERS: BookFilters = {
  search: '', classNum: '', subject: '', status: 'all', source: 'all', kind: 'all', pyqYear: '',
};

export type BookSortKey = 'book' | 'class' | 'subject' | 'status' | 'created';

const PROCESSING: JobStatus[] = ['queued', 'chunking', 'embedding'];

function matches(job: BookJob, f: BookFilters): boolean {
  if (f.classNum && String(job.class_num) !== f.classNum) return false;
  if (f.subject && job.subject !== f.subject) return false;
  if (f.status === 'processing' ? !PROCESSING.includes(job.status) : f.status !== 'all' && job.status !== f.status) return false;
  if (f.source === 'platform' && job.school_id) return false;
  if (f.source === 'school' && !job.school_id) return false;
  if (f.kind === 'book' && job.is_pyq) return false;
  if (f.kind === 'pyq' && !job.is_pyq) return false;
  if (f.pyqYear && String(job.pyq_year ?? '') !== f.pyqYear) return false;
  if (f.search) {
    const q = f.search.toLowerCase();
    const hay = `${job.book_title} ${job.original_filename} ${job.subject} ${job.schools?.name ?? ''}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function compare(a: BookJob, b: BookJob, key: BookSortKey): number {
  switch (key) {
    case 'book': return a.book_title.localeCompare(b.book_title);
    case 'class': return a.class_num - b.class_num || a.subject.localeCompare(b.subject);
    case 'subject': return a.subject.localeCompare(b.subject) || a.class_num - b.class_num;
    case 'status': return STATUS_META[a.status].step - STATUS_META[b.status].step;
    case 'created': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  }
}

interface UseBookLibraryOptions {
  /** Portal prefix, e.g. '/school-admin' or '/super-admin'. */
  basePath: string;
  /** Poll interval while the tab is showing the library; 0 disables polling. */
  pollMs?: number;
}

/**
 * The job list is small by nature (a school uploads a handful of books, the
 * platform a few hundred), and the endpoint returns it whole — so filtering,
 * sorting and paging all happen in the browser. That keeps the table instant
 * while the 5s poll keeps in-flight jobs moving.
 */
export function useBookLibrary({ basePath, pollMs = 5000 }: UseBookLibraryOptions) {
  const [jobs, setJobs] = React.useState<BookJob[] | null>(null);
  const [error, setError] = React.useState('');
  const [filters, setFiltersState] = React.useState<BookFilters>(EMPTY_BOOK_FILTERS);
  const [sortKey, setSortKey] = React.useState<BookSortKey>('created');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  const jobsPath = `${basePath}/ncert/jobs`;

  const reload = React.useCallback(async () => {
    try {
      setJobs(await api.get<BookJob[]>(jobsPath));
      setError('');
    } catch (err) {
      setJobs((prev) => prev ?? []);
      setError(err instanceof ApiClientError ? err.message : 'Failed to load the library');
    }
  }, [jobsPath]);

  React.useEffect(() => {
    void reload();
    if (!pollMs) return;
    const id = window.setInterval(() => void reload(), pollMs);
    return () => window.clearInterval(id);
  }, [reload, pollMs]);

  const all = React.useMemo(() => jobs ?? [], [jobs]);

  const filtered = React.useMemo(() => {
    const rows = all.filter((j) => matches(j, filters));
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => compare(a, b, sortKey) * dir);
  }, [all, filters, sortKey, sortDir]);

  const rows = React.useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const setFilters = React.useCallback((update: Partial<BookFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...update }));
    setPage(1);
  }, []);

  const resetFilters = React.useCallback(() => {
    setFiltersState(EMPTY_BOOK_FILTERS);
    setPage(1);
  }, []);

  const changeSort = React.useCallback((key: string, dir: 'asc' | 'desc') => {
    setSortKey(key as BookSortKey);
    setSortDir(dir);
    setPage(1);
  }, []);

  const counts = React.useMemo(() => ({
    total: all.length,
    ready: all.filter((j) => j.status === 'done').length,
    processing: all.filter((j) => PROCESSING.includes(j.status)).length,
    failed: all.filter((j) => j.status === 'error').length,
    pages: all.reduce((sum, j) => sum + (j.total_pages ?? 0), 0),
    pyq: all.filter((j) => j.is_pyq).length,
  }), [all]);

  const hasActiveFilters =
    Boolean(filters.search) || Boolean(filters.classNum) || Boolean(filters.subject) ||
    filters.status !== 'all' || filters.source !== 'all' || filters.kind !== 'all' || Boolean(filters.pyqYear);

  /** Subjects actually present in the library — a filter that can't return
   *  an empty result is a better filter than the full master list. */
  const subjectsPresent = React.useMemo(
    () => [...new Set(all.map((j) => j.subject))].sort((a, b) => a.localeCompare(b)),
    [all],
  );

  /** PYQ years actually present — same "can't return empty" reasoning. */
  const pyqYearsPresent = React.useMemo(
    () => [...new Set(all.filter((j) => j.is_pyq && j.pyq_year).map((j) => j.pyq_year as number))].sort((a, b) => b - a),
    [all],
  );

  return {
    isLoading: jobs === null,
    error, setError,
    all, rows, filtered, counts, subjectsPresent, pyqYearsPresent,
    filters, setFilters, resetFilters, hasActiveFilters,
    sortKey, sortDir, changeSort,
    page, setPage, pageSize, setPageSize,
    reload, basePath,
  };
}

export type BookLibrary = ReturnType<typeof useBookLibrary>;

/** "class-7-science-curiosity.pdf" → "Class 7 Science Curiosity". */
export function titleFromFilename(filename: string): string {
  const stem = filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return stem.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatUploadedAt(value: string): string {
  const mins = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}

/** Rejects the file before a 150MB upload starts rather than after it fails. */
export function validatePdf(file: File): string | null {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) return `"${file.name}" is not a PDF. Only PDF books can be indexed.`;
  if (file.size === 0) return `"${file.name}" is empty.`;
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return `"${file.name}" is ${formatFileSize(file.size)} — the limit is ${MAX_UPLOAD_MB} MB. Split the book and upload it in parts.`;
  }
  return null;
}
