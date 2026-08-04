import React from 'react';
import {
  Upload, FileText, X, Loader2, CheckCircle2, AlertCircle, CloudUpload, Sparkles,
} from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import {
  MAX_UPLOAD_MB, formatFileSize, titleFromFilename, validatePdf,
} from '../../lib/bookLibrary';

/**
 * Book upload card shared by the Super Admin and School Admin content pages.
 *
 * Laid out as a full-width horizontal band above the library rather than a
 * narrow side rail: the drop target gets real estate worth aiming at, the
 * three fields sit on one line, and the table below keeps the full width it
 * needs for seven columns.
 *
 * Three things it does that the previous per-portal forms didn't, all of which
 * matter for a 150MB textbook on a school's connection: it rejects a bad file
 * before the upload starts, it shows real byte-level progress instead of a
 * spinner, and it fills the book title in from the filename so the common case
 * is one drag and one click.
 */

export interface QuotaState {
  used: number;
  limit: number;
}

interface Props {
  /** Full API path, e.g. '/super-admin/ncert/upload'. */
  uploadPath: string;
  classOptions?: number[];
  /** Subjects selectable for a class. An empty list disables the form. */
  subjectsForClass: (classNum: number) => string[];
  onUploaded: () => void;
  title?: string;
  subtitle?: string;
  titlePlaceholder?: string;
  /** Return null where no per-subject cap applies (Super Admin). */
  quotaFor?: (classNum: number, subject: string) => QuotaState | null;
  /** Escape hatch offered once the quota is exhausted. */
  onQuotaExceeded?: (classNum: number, subject: string) => void;
  quotaActionLabel?: string;
  /** Quiet strip along the bottom of the panel — context, not instruction. */
  footerNote?: React.ReactNode;
}

const labelCls = 'block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1.5';
const fieldCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';

export const BookUploader: React.FC<Props> = ({
  uploadPath,
  classOptions = Array.from({ length: 10 }, (_, i) => i + 1),
  subjectsForClass,
  onUploaded,
  title = 'Upload a book',
  subtitle = `PDF up to ${MAX_UPLOAD_MB} MB · indexed automatically for the AI tutor.`,
  titlePlaceholder = 'Science — Curiosity (Class 7)',
  quotaFor,
  onQuotaExceeded,
  quotaActionLabel = 'Request a higher limit',
  footerNote,
}) => {
  const [classNum, setClassNum] = React.useState(classOptions[0] ?? 1);
  const [pickedSubject, setPickedSubject] = React.useState('');
  const [bookTitle, setBookTitle] = React.useState('');
  const [titleTouched, setTitleTouched] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [successMsg, setSuccessMsg] = React.useState('');
  const [error, setError] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const subjects = subjectsForClass(classNum);
  // Derived rather than synced in an effect: switching class can strand the
  // chosen subject, and a stale one would fail server-side validation for a
  // reason the admin can't see. Falling back to the first valid subject keeps
  // the form always submittable.
  const subject = subjects.includes(pickedSubject) ? pickedSubject : (subjects[0] ?? '');

  const quota = quotaFor && subject ? quotaFor(classNum, subject) : null;
  const atLimit = quota !== null && quota.used >= quota.limit;
  const noSubjects = subjects.length === 0;
  const disabled = noSubjects || atLimit;

  const pickFile = (next: File | null) => {
    if (!next) return;
    const problem = validatePdf(next);
    if (problem) {
      setError(problem);
      setFile(null);
      return;
    }
    setError('');
    setSuccessMsg('');
    setFile(next);
    if (!titleTouched || !bookTitle.trim()) setBookTitle(titleFromFilename(next.name));
  };

  const clearFile = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    pickFile(e.dataTransfer.files?.[0] ?? null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || disabled || uploading) return;
    setUploading(true);
    setProgress(0);
    setSuccessMsg('');
    setError('');
    try {
      await api.upload(
        uploadPath,
        file,
        { classNum: String(classNum), subject, bookTitle: bookTitle.trim() },
        setProgress,
      );
      setSuccessMsg(`"${bookTitle.trim()}" uploaded — indexing has started in the library below.`);
      setBookTitle('');
      setTitleTouched(false);
      clearFile();
      onUploaded();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="portal-panel">
      <div className="flex items-start gap-3 border-b border-slate-100 bg-gradient-to-r from-white via-white to-slate-50/80 px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
          <CloudUpload size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-[12px] leading-5 text-slate-500">{subtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
        {successMsg && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[12.5px] leading-5 text-emerald-800">
            <CheckCircle2 size={15} className="mt-px shrink-0" />
            <span className="min-w-0 flex-1">{successMsg}</span>
            <button type="button" onClick={() => setSuccessMsg('')} className="shrink-0 cursor-pointer text-emerald-600 hover:text-emerald-800">
              <X size={14} />
            </button>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12.5px] leading-5 text-rose-700">
            <AlertCircle size={15} className="mt-px shrink-0" />
            <span className="min-w-0 flex-1">{error}</span>
            <button type="button" onClick={() => setError('')} className="shrink-0 cursor-pointer text-rose-500 hover:text-rose-700">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Drop target — given its own column so it stays a big, obvious aim point */}
          <div className="lg:col-span-4">
            <label className={labelCls}>PDF file <span className="text-rose-500">*</span></label>
            {file ? (
              <div className="flex h-[calc(100%-1.6rem)] min-h-[92px] items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                  <FileText size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-slate-800">{file.name}</span>
                  <span className="block text-[11px] tabular-nums text-slate-500">{formatFileSize(file.size)}</span>
                </div>
                {!uploading && (
                  <button
                    type="button"
                    onClick={clearFile}
                    aria-label="Remove selected file"
                    className="shrink-0 cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-rose-600"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            ) : (
              <label
                onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex h-[calc(100%-1.6rem)] min-h-[92px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${
                  disabled
                    ? 'cursor-not-allowed border-slate-200 bg-slate-50'
                    : isDragging
                      ? 'cursor-copy border-indigo-400 bg-indigo-50'
                      : 'cursor-pointer border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  disabled={disabled}
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                />
                <Upload size={19} className={isDragging ? 'text-indigo-500' : 'text-slate-400'} />
                <span className="text-[13px] font-medium text-slate-600">
                  {isDragging ? 'Drop the PDF to attach it' : 'Drag a PDF here, or click to browse'}
                </span>
                <span className="text-[11px] text-slate-400">PDF only · up to {MAX_UPLOAD_MB} MB</span>
              </label>
            )}
          </div>

          {/* Class · Subject · Title, all on one line on a wide screen */}
          <div className="flex flex-col gap-3 lg:col-span-8">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              <div className="sm:col-span-3">
                <label className={labelCls} htmlFor="book-class">Class</label>
                <select
                  id="book-class"
                  value={classNum}
                  onChange={(e) => setClassNum(Number(e.target.value))}
                  disabled={uploading}
                  className={`${fieldCls} cursor-pointer`}
                >
                  {classOptions.map((c) => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div className="sm:col-span-4">
                <label className={labelCls} htmlFor="book-subject">Subject</label>
                <select
                  id="book-subject"
                  value={subject}
                  onChange={(e) => setPickedSubject(e.target.value)}
                  disabled={noSubjects || uploading}
                  className={`${fieldCls} cursor-pointer`}
                >
                  {noSubjects && <option value="">No subjects enabled</option>}
                  {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="sm:col-span-5">
                <label className={labelCls} htmlFor="book-title">
                  Book title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="book-title"
                  required
                  value={bookTitle}
                  onChange={(e) => { setBookTitle(e.target.value); setTitleTouched(true); }}
                  placeholder={titlePlaceholder}
                  disabled={disabled || uploading}
                  className={fieldCls}
                />
              </div>
            </div>

            {noSubjects && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-[12px] leading-5 text-amber-800">
                Class {classNum} has no subjects enabled yet, so there's nothing to file a book under.
                Ask the Super Admin to enable its subjects first.
              </p>
            )}

            {file && !titleTouched && !disabled && (
              <p className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <Sparkles size={11} /> Title filled in from the filename — edit it if you'd like.
              </p>
            )}

            {/* Status strip: quota / upload progress on the left, action on the right */}
            <div className="mt-auto flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-[200px] flex-1">
                {uploading ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between text-[12px]">
                      <span className="font-medium text-slate-600">
                        {progress < 100 ? 'Uploading…' : 'Handing over to the indexer…'}
                      </span>
                      <span className="font-semibold tabular-nums text-slate-700">
                        {file ? `${formatFileSize((file.size * progress) / 100)} of ${formatFileSize(file.size)}` : `${progress}%`}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-indigo-500 transition-all duration-200" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                ) : quota ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between text-[12px]">
                      <span className="text-slate-500">Class {classNum} {subject} quota</span>
                      <span className={`font-semibold tabular-nums ${atLimit ? 'text-rose-600' : 'text-slate-700'}`}>
                        {quota.used} / {quota.limit} used
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: quota.limit }, (_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 flex-1 rounded-full ${i < quota.used ? (atLimit ? 'bg-rose-400' : 'bg-indigo-500') : 'bg-slate-200'}`}
                        />
                      ))}
                    </div>
                    {atLimit && (
                      <p className="text-[11.5px] leading-4 text-slate-500">
                        All {quota.limit} slots for this subject are in use. Delete a book below to free one,
                        or ask the platform team to raise the limit.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>

              {atLimit && onQuotaExceeded ? (
                <button
                  type="button"
                  onClick={() => onQuotaExceeded(classNum, subject)}
                  className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  {quotaActionLabel}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={disabled || uploading || !file || !bookTitle.trim()}
                  className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploading ? 'Uploading…' : 'Upload & index'}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      {footerNote && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-[12px] leading-5 text-slate-500">
          {footerNote}
        </div>
      )}
    </div>
  );
};
