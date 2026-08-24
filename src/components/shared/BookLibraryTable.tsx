import React from 'react';
import {
  Search, X, RotateCcw, Trash2, Loader2, Info, FileText, Building2, Globe2, CalendarClock,
} from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { DataTable, type DataTableColumn } from './DataTable';
import {
  STATUS_META, jobProgress, formatUploadedAt,
  type BookJob, type BookFilters, type BookLibrary,
} from '../../lib/bookLibrary';

/**
 * The book library table, shared by both content portals.
 *
 * Status used to be two columns — a badge plus a raw "412/900" chunk counter —
 * which told an admin nothing actionable. It's now one column that answers the
 * only question they actually have: can the AI tutor use this book yet, and if
 * not, what is it doing and how far along is it.
 */

interface Props {
  lib: BookLibrary;
  /** Super Admin: adds the platform-vs-school origin column and filter. */
  showSource?: boolean;
  /** Super Admin: adds the textbook-vs-PYQ filter. */
  showKind?: boolean;
  heading?: string;
  description?: string;
}

const selectCls =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none transition-colors cursor-pointer focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';

const StatusCell: React.FC<{ job: BookJob }> = ({ job }) => {
  const meta = STATUS_META[job.status];
  const pct = jobProgress(job);
  const inFlight = job.status === 'chunking' || job.status === 'embedding';

  return (
    <div className="flex min-w-[190px] flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${meta.chip}`} title={meta.hint}>
          {inFlight && <Loader2 size={10} className="animate-spin" />}
          {meta.label}
        </span>
        {job.status !== 'error' && (
          <span className="text-[11px] tabular-nums text-slate-400">{pct}%</span>
        )}
      </div>

      {job.status !== 'error' && (
        <div className="h-1 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full transition-all duration-700 ${meta.bar}`} style={{ width: `${pct}%` }} />
        </div>
      )}

      {job.status === 'error' && job.error_message && (
        <span className="line-clamp-2 max-w-[220px] text-[11px] leading-4 text-rose-500" title={job.error_message}>
          {job.error_message}
        </span>
      )}

      {/* Informational, not an error — the book is Ready and fully usable by
          the tutor either way, just without chapter-level citations. Kept
          neutral (not amber/warning-colored) so it doesn't read as a problem
          that needs fixing (item #19, UI testing pass Aug 24 2026). */}
      {job.status === 'done' && job.chapters_detected === false && (
        <span
          className="inline-flex items-center gap-1 text-[11px] text-slate-400"
          title="This book's chapter headings weren't recognised, so answers retrieved from it can't be attributed to a chapter and citations are less precise. Re-upload it with a manual chapter map (page ranges) to fix this."
        >
          <Info size={11} className="shrink-0" /> No chapters detected
        </span>
      )}

      {inFlight && job.chunks_created > 0 && (
        <span className="text-[11px] tabular-nums text-slate-400">
          {job.chunks_embedded.toLocaleString('en-IN')} of {job.chunks_created.toLocaleString('en-IN')} sections
        </span>
      )}
    </div>
  );
};

export const BookLibraryTable: React.FC<Props> = ({
  lib, showSource = false, showKind = false,
  heading = 'Book library',
  description = 'Status refreshes automatically every few seconds.',
}) => {
  const [retryingId, setRetryingId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<BookJob | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const { setError, reload, basePath } = lib;

  const handleRetry = React.useCallback(async (job: BookJob) => {
    setRetryingId(job.id);
    try {
      await api.post(`${basePath}/ncert/jobs/${job.id}/retry`);
      await reload();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not re-process this book');
    } finally {
      setRetryingId(null);
    }
  }, [basePath, reload, setError]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`${basePath}/ncert/jobs/${deleteTarget.id}`);
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not delete this book');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const columns = React.useMemo<DataTableColumn<BookJob>[]>(() => {
    const cols: DataTableColumn<BookJob>[] = [
      {
        key: 'book', header: 'Book', sortKey: 'book',
        render: (job) => (
          <div className="flex items-start gap-2.5">
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${job.is_pyq ? 'bg-violet-50 text-violet-600' : 'bg-slate-100 text-slate-500'}`}>
              {job.is_pyq ? <CalendarClock size={15} /> : <FileText size={15} />}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="block truncate text-[13px] font-semibold text-slate-800">{job.book_title}</span>
                {job.is_pyq && (
                  <span
                    className="inline-flex shrink-0 items-center rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-700"
                    title={job.pyq_source ? `Previous year paper — ${job.pyq_source}` : 'Previous year paper'}
                  >
                    PYQ{job.pyq_year ? ` ${job.pyq_year}` : ''}
                  </span>
                )}
              </div>
              <span className="block truncate text-[11px] text-slate-400" title={job.original_filename}>
                {job.original_filename}{job.total_pages ? ` · ${job.total_pages} pages` : ''}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: 'class', header: 'Class', sortKey: 'class',
        render: (job) => (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[12px] font-semibold tabular-nums text-slate-700">
            {job.class_num}
          </span>
        ),
      },
      { key: 'subject', header: 'Subject', sortKey: 'subject', render: (job) => <span className="whitespace-nowrap">{job.subject}</span> },
    ];

    if (showSource) {
      cols.push({
        key: 'source', header: 'Source', hideOnMobile: true,
        render: (job) => (job.school_id ? (
          <span
            className="inline-flex max-w-[150px] items-center gap-1.5 truncate rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700"
            title="Uploaded by this school's admin — only its own students retrieve from it"
          >
            <Building2 size={11} className="shrink-0" />
            <span className="truncate">{job.schools?.name ?? 'School'}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600" title="Platform library — available to every school">
            <Globe2 size={11} /> Platform
          </span>
        )),
      });
    }

    cols.push(
      { key: 'status', header: 'Indexing status', sortKey: 'status', render: (job) => <StatusCell job={job} /> },
      {
        key: 'created', header: 'Uploaded', sortKey: 'created', hideOnMobile: true,
        render: (job) => <span className="whitespace-nowrap text-slate-500">{formatUploadedAt(job.created_at)}</span>,
      },
      {
        key: 'actions', header: '', align: 'right', className: 'w-28',
        render: (job) => (
          <div className="inline-flex items-center gap-1">
            {(job.status === 'error' || job.status === 'done') && (
              <button
                onClick={() => void handleRetry(job)}
                disabled={retryingId === job.id}
                aria-label="Re-process this book"
                title="Re-run extraction and indexing for this book"
                className="cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                {retryingId === job.id ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
              </button>
            )}
            {job.status !== 'chunking' && job.status !== 'embedding' && (
              <button
                onClick={() => setDeleteTarget(job)}
                aria-label="Delete this book"
                title="Delete this book, its PDF and everything indexed from it"
                className="cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ),
      },
    );

    return cols;
  }, [showSource, retryingId, handleRetry]);

  const classesPresent = React.useMemo(
    () => [...new Set(lib.all.map((j) => j.class_num))].sort((a, b) => a - b),
    [lib.all],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">{heading}</h2>
          <p className="mt-0.5 text-[12px] text-slate-400">{description}</p>
        </div>
        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-[12px] font-semibold tabular-nums text-slate-500">
          {lib.filtered.length.toLocaleString('en-IN')} of {lib.counts.total.toLocaleString('en-IN')} book{lib.counts.total === 1 ? '' : 's'}
        </span>
      </div>

      {/* Developer-only reminder — a real admin can't run this command and
          shouldn't see what reads as an alarming yellow error every time the
          single-concurrency worker has more than one book queued at once
          (item #17, UI testing pass Aug 24 2026). Still useful locally, so
          gated to dev builds rather than deleted. */}
      {import.meta.env.DEV && lib.all.some((j) => j.status === 'queued') && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12.5px] leading-5 text-amber-900">
          A PDF is sitting on <span className="font-semibold">Queued</span>. Indexing only starts when the background worker is running
          — in the <code className="rounded bg-amber-100 px-1">api</code> folder run{' '}
          <code className="rounded bg-amber-100 px-1">npm run dev:worker</code>. The API alone stores the file; it does not process it.
        </div>
      )}

      <div className="portal-toolbar">
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={lib.filters.search}
            onChange={(e) => lib.setFilters({ search: e.target.value })}
            placeholder="Search book title or filename…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-[13px] text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <select
          value={lib.filters.classNum}
          onChange={(e) => lib.setFilters({ classNum: e.target.value })}
          className={selectCls}
          aria-label="Filter by class"
        >
          <option value="">All classes</option>
          {classesPresent.map((c) => <option key={c} value={c}>Class {c}</option>)}
        </select>

        <select
          value={lib.filters.subject}
          onChange={(e) => lib.setFilters({ subject: e.target.value })}
          className={selectCls}
          aria-label="Filter by subject"
        >
          <option value="">All subjects</option>
          {lib.subjectsPresent.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={lib.filters.status}
          onChange={(e) => lib.setFilters({ status: e.target.value as BookFilters['status'] })}
          className={selectCls}
          aria-label="Filter by indexing status"
        >
          <option value="all">Any status</option>
          <option value="done">Ready for the tutor</option>
          <option value="processing">Still processing</option>
          <option value="error">Failed</option>
        </select>

        {showSource && (
          <select
            value={lib.filters.source}
            onChange={(e) => lib.setFilters({ source: e.target.value as BookFilters['source'] })}
            className={selectCls}
            aria-label="Filter by source"
          >
            <option value="all">All sources</option>
            <option value="platform">Platform library</option>
            <option value="school">School uploads</option>
          </select>
        )}

        {showKind && (
          <select
            value={lib.filters.kind}
            onChange={(e) => lib.setFilters({ kind: e.target.value as BookFilters['kind'], ...(e.target.value !== 'pyq' ? { pyqYear: '' } : {}) })}
            className={selectCls}
            aria-label="Filter by content type"
          >
            <option value="all">Books &amp; PYQs</option>
            <option value="book">Textbooks only</option>
            <option value="pyq">PYQ papers only</option>
          </select>
        )}

        {/* PYQ-specific filter — a book has no exam year, so this only ever
            narrows the PYQ set, not the whole library (item #18, UI testing
            pass Aug 24 2026). */}
        {showKind && lib.filters.kind === 'pyq' && lib.pyqYearsPresent.length > 0 && (
          <select
            value={lib.filters.pyqYear}
            onChange={(e) => lib.setFilters({ pyqYear: e.target.value })}
            className={selectCls}
            aria-label="Filter by paper year"
          >
            <option value="">All years</option>
            {lib.pyqYearsPresent.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        )}

        {lib.hasActiveFilters && (
          <button
            onClick={lib.resetFilters}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-2 text-[12px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>

      <DataTable
        rows={lib.rows}
        columns={columns}
        getRowId={(job) => job.id}
        total={lib.filtered.length}
        page={lib.page}
        pageSize={lib.pageSize}
        onPageChange={lib.setPage}
        onPageSizeChange={(n) => { lib.setPageSize(n); lib.setPage(1); }}
        sortKey={lib.sortKey}
        sortDir={lib.sortDir}
        onSortChange={lib.changeSort}
        isLoading={lib.isLoading}
        emptyTitle={lib.hasActiveFilters ? 'No books match these filters' : 'No books uploaded yet'}
        emptyHint={
          lib.hasActiveFilters
            ? 'Try clearing a filter.'
            : 'Upload a PDF to make it answerable by the AI tutor.'
        }
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Trash2 size={17} />
              </span>
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-slate-900">Delete this book?</h3>
                <p className="mt-1 text-[13px] text-slate-600">
                  <span className="font-medium">{deleteTarget.book_title}</span> — Class {deleteTarget.class_num}, {deleteTarget.subject}
                </p>
              </div>
            </div>
            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-[12px] leading-5 text-slate-500">
              The PDF, every indexed section and every extracted diagram from this book will be permanently removed —
              the AI tutor will no longer be able to answer from it. This cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="cursor-pointer rounded-lg px-4 py-2 text-[13px] font-semibold text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void confirmDelete()}
                disabled={deleting}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting && <Loader2 size={14} className="animate-spin" />} Delete book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
