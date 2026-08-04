import React from 'react';
import {
  Upload, FileSpreadsheet, X, Loader2, CheckCircle2, AlertCircle, CloudUpload,
  Download, ChevronDown, ChevronUp,
} from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

/**
 * Bulk question/PYQ importer for the Super Admin's global question bank.
 *
 * Matches the visual language of BookUploader (drag-drop, pre-flight
 * validation, real progress) but is shaped for a spreadsheet row-import
 * rather than a PDF ingestion job: the server parses and inserts every row
 * synchronously and returns a per-row result in one response, so there's no
 * job/poll cycle — just an upload, then a result.
 *
 * The previous version of this form only ever showed two numbers ("12
 * imported, 3 failed") with no way to see *why* a row failed short of
 * re-opening the spreadsheet and guessing. That's the actual gap this closes:
 * failed rows list their reason inline, and a template download removes the
 * guesswork about column names and enum values up front.
 */

export interface ImportResultRow {
  row: number;
  text?: string;
  reason: string;
}

export interface ImportResult {
  created: number;
  errors: ImportResultRow[];
}

interface Props {
  uploadPath: string;
  onImported: (result: ImportResult) => void;
}

const MAX_UPLOAD_MB = 25;
const TEMPLATE_HEADER = 'class_num,subject,chapter_num,type,difficulty,text,correct_answer,rubric,marks,is_pyq,pyq_year,pyq_source';
const TEMPLATE_ROWS = [
  '9,Science,3,mcq,medium,"What is the SI unit of force?",Newton,,1,false,,',
  '10,Mathematics,,short_answer,hard,"Prove that the sum of exterior angles of any polygon is 360°.",,"Full marks for a complete proof with correct reasoning.",4,true,2019,CBSE Class 10 Board Exam',
];

function validateSpreadsheet(file: File): string | null {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xls')) return 'Old .xls format is not supported — save as .xlsx or .csv.';
  const isCsv = name.endsWith('.csv') || file.type === 'text/csv';
  const isXlsx = name.endsWith('.xlsx') || file.type.includes('spreadsheetml');
  if (!isCsv && !isXlsx) return `"${file.name}" isn't a CSV or XLSX file.`;
  if (file.size === 0) return `"${file.name}" is empty.`;
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return `"${file.name}" is larger than ${MAX_UPLOAD_MB} MB — split it into smaller batches.`;
  }
  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function downloadTemplate() {
  const blob = new Blob([`${TEMPLATE_HEADER}\n${TEMPLATE_ROWS.join('\n')}\n`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'question-bank-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export const QuestionBankUploader: React.FC<Props> = ({ uploadPath, onImported }) => {
  const [file, setFile] = React.useState<File | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [errorsExpanded, setErrorsExpanded] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const pickFile = (next: File | null) => {
    if (!next) return;
    const problem = validateSpreadsheet(next);
    if (problem) {
      setError(problem);
      setFile(null);
      return;
    }
    setError('');
    setResult(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || uploading) return;
    setUploading(true);
    setProgress(0);
    setError('');
    setResult(null);
    setErrorsExpanded(false);
    try {
      const res = await api.upload<ImportResult>(uploadPath, file, undefined, setProgress);
      setResult(res);
      clearFile();
      onImported(res);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Import failed');
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
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold text-slate-900">Bulk import questions &amp; PYQs</h2>
          <p className="mt-0.5 text-[12px] leading-5 text-slate-500">
            CSV or XLSX, up to {MAX_UPLOAD_MB} MB · adds straight to the platform-wide question bank used by every school.
          </p>
        </div>
        <button
          type="button"
          onClick={downloadTemplate}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
        >
          <Download size={13} /> Download template
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
        {result && (
          <div className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[12.5px] leading-5 text-emerald-800">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={15} className="mt-px shrink-0" />
              <span className="min-w-0 flex-1">
                {result.created} question{result.created === 1 ? '' : 's'} imported.
                {result.errors.length > 0 && (
                  <span className="text-rose-700"> {result.errors.length} row{result.errors.length === 1 ? '' : 's'} failed.</span>
                )}
              </span>
              <button type="button" onClick={() => setResult(null)} className="shrink-0 cursor-pointer text-emerald-600 hover:text-emerald-800">
                <X size={14} />
              </button>
            </div>

            {result.errors.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setErrorsExpanded((v) => !v)}
                  className="inline-flex cursor-pointer items-center gap-1 text-[12px] font-semibold text-rose-700 hover:text-rose-900"
                >
                  {errorsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {errorsExpanded ? 'Hide' : 'Show'} failed rows
                </button>
                {errorsExpanded && (
                  <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-rose-200 bg-white divide-y divide-rose-100">
                    {result.errors.map((e, i) => (
                      <li key={i} className="px-3 py-2 text-[12px] leading-4">
                        <span className="font-semibold text-rose-700">Row {e.row}</span>
                        <span className="text-slate-500"> — {e.reason}</span>
                        {e.text && <span className="block truncate text-slate-400">{e.text}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
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

        <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
          <div className="flex-1">
            {file ? (
              <div className="flex h-full min-h-[76px] items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                  <FileSpreadsheet size={16} />
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
                className={`flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-4 text-center transition-colors ${
                  isDragging
                    ? 'cursor-copy border-indigo-400 bg-indigo-50'
                    : 'cursor-pointer border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                />
                <span className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-600">
                  <Upload size={16} className={isDragging ? 'text-indigo-500' : 'text-slate-400'} />
                  {isDragging ? 'Drop the file to attach it' : 'Drag a CSV/XLSX here, or click to browse'}
                </span>
                <span className="text-[11px] text-slate-400">One row per question · headers must match the template</span>
              </label>
            )}
          </div>

          <div className="flex shrink-0 flex-col justify-end gap-1.5 sm:w-48">
            {uploading && (
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between text-[11px]">
                  <span className="text-slate-500">Uploading…</span>
                  <span className="font-semibold tabular-nums text-slate-700">{progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-indigo-500 transition-all duration-200" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={uploading || !file}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? 'Importing…' : 'Import'}
            </button>
          </div>
        </div>

        <p className="text-[11px] leading-4 text-slate-400">
          <span className="font-semibold text-slate-500">type:</span> mcq · true_false · short_answer · long_answer · fill_blank &nbsp;·&nbsp;
          <span className="font-semibold text-slate-500">difficulty:</span> easy · medium · hard &nbsp;·&nbsp;
          <span className="font-semibold text-slate-500">is_pyq:</span> true/false — set with <span className="font-mono">pyq_year</span> and <span className="font-mono">pyq_source</span> for a previous-year question.
        </p>
      </form>
    </div>
  );
};
