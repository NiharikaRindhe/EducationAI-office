import React from 'react';
import {
  Upload, FileText, X, Loader2, CheckCircle2, AlertCircle, CalendarClock, Sparkles,
} from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { MAX_UPLOAD_MB, formatFileSize, validatePdf } from '../../lib/bookLibrary';

/**
 * Previous-year question paper upload — a PDF of the actual exam paper, not
 * a spreadsheet of typed-out questions (that's QuestionBankUploader). Most
 * papers a Super Admin uploads are Class 10 board papers, so Class defaults
 * to 10 here rather than 1 the way the textbook uploader does; Subject is a
 * plain dropdown since a school year produces one paper per subject, not a
 * mixed set.
 *
 * Goes through the same NCERT ingestion pipeline as a textbook (storage →
 * chunking → embedding), tagged is_pyq=true so the library and the AI
 * tutor's citations can tell a board paper from a chapter.
 */

interface Props {
  uploadPath: string;
  /** Subjects valid for a class, per the platform's class→subject matrix.
   *  Class 1 has no Science, so offering it would only produce an upload the
   *  server rejects. */
  subjectsForClass: (classNum: number) => string[];
  classOptions?: number[];
  defaultClass?: number;
  onUploaded: () => void;
}

const labelCls = 'block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1.5';
const fieldCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';

export const PyqPaperUploader: React.FC<Props> = ({
  uploadPath, subjectsForClass, classOptions = Array.from({ length: 10 }, (_, i) => i + 1),
  defaultClass = 10, onUploaded,
}) => {
  const currentYear = new Date().getFullYear();

  const [classNum, setClassNum] = React.useState(defaultClass);
  const [pickedSubject, setPickedSubject] = React.useState('');
  const [year, setYear] = React.useState(currentYear);
  const [board, setBoard] = React.useState('CBSE');
  const [title, setTitle] = React.useState('');
  const [titleTouched, setTitleTouched] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [successMsg, setSuccessMsg] = React.useState('');
  const [error, setError] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Derived, not synced in an effect: switching class can strand the chosen
  // subject (Class 10 has Science, Class 2 doesn't), so fall back to the first
  // subject the new class actually has.
  const subjects = subjectsForClass(classNum);
  const subject = subjects.includes(pickedSubject) ? pickedSubject : (subjects[0] ?? '');

  const autoTitle = subject && year ? `${subject} — Previous Year Paper ${year} (Class ${classNum})` : '';
  const effectiveTitle = titleTouched ? title : autoTitle;

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
  };

  const clearFile = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  };

  const yearInvalid = year < 1990 || year > currentYear + 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !subject || yearInvalid || uploading) return;
    setUploading(true);
    setProgress(0);
    setSuccessMsg('');
    setError('');
    try {
      await api.upload(
        uploadPath,
        file,
        {
          classNum: String(classNum),
          subject,
          bookTitle: effectiveTitle.trim(),
          isPyq: 'true',
          pyqYear: String(year),
          pyqSource: board.trim(),
        },
        setProgress,
      );
      setSuccessMsg(`"${effectiveTitle.trim()}" uploaded — indexing has started in the library below.`);
      setTitle('');
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
          <CalendarClock size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-slate-900">Upload a previous year paper</h2>
          <p className="mt-0.5 text-[12px] leading-5 text-slate-500">
            PDF of the actual exam paper · up to {MAX_UPLOAD_MB} MB · mostly Class 10 board papers, but any class works.
          </p>
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
          {/* Drop target */}
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
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex h-[calc(100%-1.6rem)] min-h-[92px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${
                  isDragging
                    ? 'cursor-copy border-indigo-400 bg-indigo-50'
                    : 'cursor-pointer border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                />
                <Upload size={19} className={isDragging ? 'text-indigo-500' : 'text-slate-400'} />
                <span className="text-[13px] font-medium text-slate-600">
                  {isDragging ? 'Drop the PDF to attach it' : 'Drag the paper PDF here, or click to browse'}
                </span>
                <span className="text-[11px] text-slate-400">PDF only · up to {MAX_UPLOAD_MB} MB</span>
              </label>
            )}
          </div>

          {/* Class · Subject · Year · Board, then title + submit */}
          <div className="flex flex-col gap-3 lg:col-span-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className={labelCls} htmlFor="pyq-class">Class</label>
                <select
                  id="pyq-class"
                  value={classNum}
                  onChange={(e) => setClassNum(Number(e.target.value))}
                  disabled={uploading}
                  className={`${fieldCls} cursor-pointer`}
                >
                  {classOptions.map((c) => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="pyq-subject">Subject</label>
                <select
                  id="pyq-subject"
                  value={subject}
                  onChange={(e) => setPickedSubject(e.target.value)}
                  disabled={subjects.length === 0 || uploading}
                  className={`${fieldCls} cursor-pointer`}
                >
                  {subjects.length === 0 && <option value="">No subjects</option>}
                  {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="pyq-year">Year</label>
                <input
                  id="pyq-year"
                  type="number"
                  min={1990}
                  max={currentYear + 1}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  disabled={uploading}
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="pyq-board">Board</label>
                <input
                  id="pyq-board"
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  placeholder="CBSE"
                  disabled={uploading}
                  className={fieldCls}
                />
              </div>
            </div>

            {yearInvalid && (
              <p className="text-[11.5px] text-rose-600">Year must be between 1990 and {currentYear + 1}.</p>
            )}

            <div>
              <label className={labelCls} htmlFor="pyq-title">Paper title</label>
              <input
                id="pyq-title"
                value={effectiveTitle}
                onChange={(e) => { setTitle(e.target.value); setTitleTouched(true); }}
                disabled={uploading}
                className={fieldCls}
              />
              {!titleTouched && (
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-400">
                  <Sparkles size={11} /> Filled in from class, subject and year — edit if you'd like.
                </p>
              )}
            </div>

            <div className="mt-auto flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-[200px] flex-1">
                {uploading && (
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
                )}
              </div>
              <button
                type="submit"
                disabled={uploading || !file || !subject || yearInvalid || !effectiveTitle.trim()}
                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? 'Uploading…' : 'Upload & index'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
