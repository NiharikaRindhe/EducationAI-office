import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle, Upload, FileText, RotateCcw, Search, BookOpen, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

interface Job {
  id: string;
  class_num: number;
  subject: string;
  book_title: string;
  original_filename: string;
  status: 'queued' | 'chunking' | 'embedding' | 'done' | 'error';
  total_pages?: number;
  chunks_created: number;
  chunks_embedded: number;
  error_message?: string;
  chapters_detected?: boolean | null;
  created_at: string;
  school_id: string | null;
  schools: { name: string } | null;
}

interface QuestionItem {
  id: string;
  class_num: number;
  subject: string;
  chapter_num?: number;
  type: string;
  difficulty: string;
  text: string;
  marks: number;
  is_pyq: boolean;
  pyq_year?: number;
}

// The finalized book-hierarchy subject list — the only subjects the platform
// teaches. Hindi/Sanskrit/Arts/Physical Education are intentionally excluded.
// Must match MASTER_SUBJECTS in api/src/schemas/superAdmin.schema.ts.
const SUBJECTS_LIST = ['English', 'Mathematics', 'Science', 'World Around Us', 'Social Science', 'ICT'];

interface ClassSubjectRow {
  class_num: number;
  subject: string;
  has_exams: boolean;
}

const inputCls =
  'w-full px-3 py-2 text-[13px] text-slate-800 bg-white border border-slate-300 rounded-lg outline-none transition-colors focus:border-slate-500 focus:ring-2 focus:ring-slate-100 placeholder:text-slate-400';
const labelCls = 'block text-[12px] font-medium text-slate-600 mb-1';

const STATUS_BADGES: Record<Job['status'], { label: string; cls: string }> = {
  queued: { label: 'Queued', cls: 'bg-slate-100 text-slate-600' },
  chunking: { label: 'Extracting', cls: 'bg-sky-50 text-sky-700' },
  embedding: { label: 'Indexing', cls: 'bg-amber-50 text-amber-700' },
  done: { label: 'Ready', cls: 'bg-emerald-50 text-emerald-700' },
  error: { label: 'Failed', cls: 'bg-rose-50 text-rose-700' },
};

export const SuperAdminContentPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'library' | 'questions' | 'subjects'>('library');

  // Class → Subject whitelist
  const [classSubjects, setClassSubjects] = useState<ClassSubjectRow[] | null>(null);
  const [addSubjectValue, setAddSubjectValue] = useState<Record<number, string>>({});
  const [subjectsBusy, setSubjectsBusy] = useState<string | null>(null);
  const [subjectsError, setSubjectsError] = useState('');

  // Library
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [classFilterLib, setClassFilterLib] = useState('');
  const [uploadClass, setUploadClass] = useState('7');
  const [uploadSubject, setUploadSubject] = useState('Science');
  const [uploadBookTitle, setUploadBookTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [deleteJobTarget, setDeleteJobTarget] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Question bank
  const [questions, setQuestions] = useState<QuestionItem[] | null>(null);
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [pyqFilter, setPyqFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; errors: { row: number; reason: string }[] } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuestionItem | null>(null);
  const [qError, setQError] = useState('');

  const fetchJobs = () => {
    api.get<Job[]>('/super-admin/ncert/jobs').then(setJobs).catch(() => setJobs([]));
  };

  useEffect(() => {
    fetchJobs();
    let interval: number | undefined;
    if (activeTab === 'library') interval = window.setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchQuestions = () => {
    setQuestions(null);
    const query: Record<string, string | boolean> = {};
    if (classFilter) query.classNum = classFilter;
    if (subjectFilter) query.subject = subjectFilter;
    if (pyqFilter) query.isPyq = true;
    if (search) query.search = search;
    api.get<QuestionItem[]>('/super-admin/question-bank', query).then(setQuestions).catch(() => setQuestions([]));
  };

  useEffect(() => {
    if (activeTab === 'questions') fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, classFilter, subjectFilter, pyqFilter]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    setUploadMsg('');
    setUploadError('');
    try {
      await api.upload('/super-admin/ncert/upload', selectedFile, {
        classNum: uploadClass,
        subject: uploadSubject,
        bookTitle: uploadBookTitle,
      });
      setUploadMsg(`"${uploadBookTitle}" uploaded — processing has started.`);
      setUploadBookTitle('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchJobs();
    } catch (err) {
      setUploadError(err instanceof ApiClientError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRetry = async (job: Job) => {
    setRetryingId(job.id);
    try {
      await api.post(`/super-admin/ncert/jobs/${job.id}/retry`);
      fetchJobs();
    } catch (err) {
      setUploadError(err instanceof ApiClientError ? err.message : 'Retry failed');
    } finally {
      setRetryingId(null);
    }
  };

  const confirmDeleteJob = async () => {
    if (!deleteJobTarget) return;
    setDeletingJob(true);
    try {
      await api.delete(`/super-admin/ncert/jobs/${deleteJobTarget.id}`);
      setDeleteJobTarget(null);
      fetchJobs();
    } catch (err) {
      setUploadError(err instanceof ApiClientError ? err.message : 'Delete failed');
      setDeleteJobTarget(null);
    } finally {
      setDeletingJob(false);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    setImporting(true);
    setImportResult(null);
    setQError('');
    try {
      const res = await api.upload<{ created: number; errors: { row: number; reason: string }[] }>('/super-admin/question-bank/import', csvFile);
      setImportResult(res);
      setCsvFile(null);
      fetchQuestions();
    } catch (err) {
      setQError(err instanceof ApiClientError ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const confirmDeleteQuestion = async () => {
    if (!deleteTarget) return;
    setQError('');
    try {
      await api.delete(`/super-admin/question-bank/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchQuestions();
    } catch (err) {
      setQError(err instanceof ApiClientError ? err.message : 'Delete failed');
    }
  };

  const fetchClassSubjects = () => {
    api.get<ClassSubjectRow[]>('/super-admin/class-subjects').then(setClassSubjects).catch(() => setClassSubjects([]));
  };

  useEffect(() => {
    if (activeTab === 'subjects' && classSubjects === null) fetchClassSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleAddSubject = async (classNum: number) => {
    const subject = addSubjectValue[classNum];
    if (!subject) return;
    setSubjectsBusy(`add-${classNum}`);
    setSubjectsError('');
    try {
      await api.post('/super-admin/class-subjects', { classNum, subject });
      setAddSubjectValue((p) => ({ ...p, [classNum]: '' }));
      fetchClassSubjects();
    } catch (err) {
      setSubjectsError(err instanceof ApiClientError ? err.message : 'Failed to add subject');
    } finally {
      setSubjectsBusy(null);
    }
  };

  const handleRemoveSubject = async (classNum: number, subject: string) => {
    setSubjectsBusy(`${classNum}-${subject}`);
    setSubjectsError('');
    try {
      await api.delete(`/super-admin/class-subjects/${classNum}/${encodeURIComponent(subject)}`);
      fetchClassSubjects();
    } catch (err) {
      setSubjectsError(err instanceof ApiClientError ? err.message : 'Failed to remove subject');
    } finally {
      setSubjectsBusy(null);
    }
  };

  const visibleJobs = (jobs ?? []).filter((j) => !classFilterLib || String(j.class_num) === classFilterLib);

  return (
    <div className="flex flex-col gap-5">
      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6">
        {([
          { id: 'library', label: 'Book Library' },
          { id: 'questions', label: 'Global Question Bank' },
          { id: 'subjects', label: 'Class Subjects' },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 -mb-px text-[13px] font-semibold transition-colors cursor-pointer border-b-2 ${
              activeTab === tab.id ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'library' ? (
        <div className="grid grid-cols-12 gap-5 items-start">
          {/* Upload panel */}
          <div className="col-span-12 xl:col-span-4">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-[14px] font-semibold text-slate-800">Upload a book</h2>
                <p className="text-[12px] text-slate-400 mt-0.5">PDF up to 150 MB. Content is extracted, chunked, and indexed for the AI tutor.</p>
              </div>

              <form onSubmit={handleUpload} className="p-5 flex flex-col gap-4">
                {uploadMsg && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
                    <CheckCircle2 size={15} className="shrink-0" /> {uploadMsg}
                  </div>
                )}
                {uploadError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" /> {uploadError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Class</label>
                    <select value={uploadClass} onChange={(e) => setUploadClass(e.target.value)} className={inputCls}>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => <option key={c} value={c}>Class {c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Subject</label>
                    <select value={uploadSubject} onChange={(e) => setUploadSubject(e.target.value)} className={inputCls}>
                      {SUBJECTS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Book title <span className="text-rose-500">*</span></label>
                  <input required value={uploadBookTitle} onChange={(e) => setUploadBookTitle(e.target.value)} placeholder="Science — Curiosity (Class 7)" className={inputCls} />
                </div>

                <div>
                  <label className={labelCls}>PDF file <span className="text-rose-500">*</span></label>
                  <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg px-4 py-6 cursor-pointer transition-colors ${
                    selectedFile ? 'border-slate-400 bg-slate-50' : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                  }`}>
                    <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
                    {selectedFile ? (
                      <>
                        <FileText size={20} className="text-slate-600" />
                        <span className="text-[13px] font-medium text-slate-700 text-center break-all">{selectedFile.name}</span>
                        <span className="text-[11px] text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB — click to change</span>
                      </>
                    ) : (
                      <>
                        <Upload size={20} className="text-slate-400" />
                        <span className="text-[13px] text-slate-500">Click to choose a PDF</span>
                      </>
                    )}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload &amp; process
                </button>
              </form>
            </div>
          </div>

          {/* Books table */}
          <div className="col-span-12 xl:col-span-8">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <h2 className="text-[14px] font-semibold text-slate-800">Library</h2>
                  <p className="text-[12px] text-slate-400 mt-0.5">{(jobs ?? []).length} book{(jobs ?? []).length === 1 ? '' : 's'} · status refreshes automatically</p>
                </div>
                <select
                  value={classFilterLib}
                  onChange={(e) => setClassFilterLib(e.target.value)}
                  className="px-3 py-2 text-[13px] text-slate-700 bg-white border border-slate-300 rounded-lg outline-none cursor-pointer focus:border-slate-500"
                >
                  <option value="">All classes</option>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>

              {jobs === null ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-400" /></div>
              ) : visibleJobs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
                  <BookOpen size={28} strokeWidth={1.5} />
                  <p className="text-[13px]">{(jobs ?? []).length === 0 ? 'No books uploaded yet.' : 'No books for this class yet.'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        {['Book', 'Class', 'Subject', 'Source', 'Indexing', 'Status', ''].map((h) => (
                          <th key={h} className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleJobs.map((job) => {
                        const badge = STATUS_BADGES[job.status];
                        const progress = job.chunks_created > 0 ? Math.round((job.chunks_embedded / job.chunks_created) * 100) : 0;
                        return (
                          <tr key={job.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-3">
                              <span className="block text-[13px] font-semibold text-slate-800">{job.book_title}</span>
                              <span className="block text-[12px] text-slate-400 break-all">{job.original_filename}{job.total_pages ? ` · ${job.total_pages} pages` : ''}</span>
                            </td>
                            <td className="px-4 py-3 text-[13px] text-slate-700 whitespace-nowrap">Class {job.class_num}</td>
                            <td className="px-4 py-3 text-[13px] text-slate-700 whitespace-nowrap">{job.subject}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {job.school_id ? (
                                <span className="inline-flex text-[11px] font-semibold px-2 py-1 rounded-md bg-indigo-50 text-indigo-700" title="Uploaded by a school admin — only visible to that school's students">
                                  {job.schools?.name ?? 'School'}
                                </span>
                              ) : (
                                <span className="inline-flex text-[11px] font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-600">Platform</span>
                              )}
                            </td>
                            <td className="px-4 py-3 min-w-[140px]">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ${job.status === 'error' ? 'bg-rose-400' : job.status === 'done' ? 'bg-emerald-500' : 'bg-sky-500'}`}
                                    style={{ width: `${job.status === 'done' ? 100 : progress}%` }}
                                  />
                                </div>
                                <span className="text-[11px] text-slate-400 tabular-nums shrink-0">{job.chunks_embedded}/{job.chunks_created}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex text-[11px] font-semibold px-2 py-1 rounded-md ${badge.cls}`} title={job.error_message ?? undefined}>
                                {badge.label}
                              </span>
                              {job.status === 'error' && job.error_message && (
                                <span className="block text-[11px] text-rose-500 mt-1 max-w-[180px] truncate" title={job.error_message}>{job.error_message}</span>
                              )}
                              {job.status === 'done' && job.chapters_detected === false && (
                                <span
                                  className="flex items-center gap-1 text-[11px] text-amber-600 mt-1 max-w-[220px]"
                                  title="This book's chapter headings weren't recognized, so retrieved answers can't be attributed to a chapter and citations are less precise. Re-upload it with a manual chapter map (page ranges) to fix this."
                                >
                                  <AlertTriangle size={11} className="shrink-0" /> No chapters detected
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                {(job.status === 'error' || job.status === 'done') && (
                                  <button
                                    onClick={() => void handleRetry(job)}
                                    disabled={retryingId === job.id}
                                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                    title="Re-run extraction and indexing for this book"
                                  >
                                    {retryingId === job.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />} Re-process
                                  </button>
                                )}
                                {job.status !== 'chunking' && job.status !== 'embedding' && (
                                  <button
                                    onClick={() => setDeleteJobTarget(job)}
                                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                                    title="Delete this book, its PDF, and everything indexed from it"
                                  >
                                    <Trash2 size={12} /> Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'questions' ? (
        <div className="flex flex-col gap-5">
          {qError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
              <AlertCircle size={15} /> {qError}
            </div>
          )}

          {/* Filter toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative max-w-xs flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchQuestions()}
                placeholder="Search question text… (press Enter)"
                className={`${inputCls} pl-9`}
              />
            </div>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="px-3 py-2 text-[13px] bg-white border border-slate-300 rounded-lg outline-none cursor-pointer">
              <option value="">All classes</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => <option key={c} value={c}>Class {c}</option>)}
            </select>
            <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="px-3 py-2 text-[13px] bg-white border border-slate-300 rounded-lg outline-none cursor-pointer">
              <option value="">All subjects</option>
              {SUBJECTS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <label className="inline-flex items-center gap-2 text-[13px] text-slate-600 cursor-pointer select-none">
              <input type="checkbox" checked={pyqFilter} onChange={(e) => setPyqFilter(e.target.checked)} className="accent-slate-800 w-4 h-4" />
              PYQs only
            </label>

            {/* Bulk import */}
            <form onSubmit={handleBulkImport} className="flex items-center gap-2 ml-auto">
              <label className="text-[12px] font-semibold text-slate-500 border border-slate-300 rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="file" accept=".csv,.xlsx" className="hidden" onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)} />
                {csvFile ? csvFile.name : 'Choose CSV/XLSX…'}
              </label>
              <button
                type="submit"
                disabled={importing || !csvFile}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {importing && <Loader2 size={13} className="animate-spin" />} Import
              </button>
            </form>
          </div>

          {importResult && (
            <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-[13px] flex items-center gap-4">
              <span className="text-emerald-700 font-semibold">✓ {importResult.created} questions imported</span>
              {importResult.errors.length > 0 && <span className="text-rose-600 font-semibold">{importResult.errors.length} rows failed</span>}
              <button onClick={() => setImportResult(null)} className="ml-auto text-slate-400 hover:text-slate-600 cursor-pointer text-[12px]">Dismiss</button>
            </div>
          )}

          {/* Questions table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {questions === null ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-400" /></div>
            ) : questions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
                <FileText size={28} strokeWidth={1.5} />
                <p className="text-[13px]">No questions match these filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      {['Question', 'Class', 'Subject', 'Type', 'Marks', 'Source', ''].map((h) => (
                        <th key={h} className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q) => (
                      <tr key={q.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 text-[13px] text-slate-700 max-w-md"><span className="line-clamp-2">{q.text}</span></td>
                        <td className="px-4 py-3 text-[13px] text-slate-600 whitespace-nowrap">Class {q.class_num}</td>
                        <td className="px-4 py-3 text-[13px] text-slate-600 whitespace-nowrap">{q.subject}</td>
                        <td className="px-4 py-3 text-[12px] text-slate-500 uppercase whitespace-nowrap">{q.type.replace('_', ' ')}</td>
                        <td className="px-4 py-3 text-[13px] text-slate-600 tabular-nums">{q.marks}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {q.is_pyq ? (
                            <span className="inline-flex text-[11px] font-semibold px-2 py-1 rounded-md bg-amber-50 text-amber-700">PYQ {q.pyq_year ?? ''}</span>
                          ) : (
                            <span className="text-[12px] text-slate-400">Original</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setDeleteTarget(q)}
                            className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-[14px] font-semibold text-slate-800">Class → Subject whitelist</h2>
            <p className="text-[12px] text-slate-400 mt-0.5">
              Controls which subjects are valid for tasks, exams, chat scope, and teaching assignments in each class. Only the finalized subject list can be assigned.
            </p>
          </div>

          {subjectsError && (
            <div className="mx-5 mt-4 bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" /> {subjectsError}
            </div>
          )}

          {classSubjects === null ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-400" /></div>
          ) : (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((classNum) => {
                const assigned = classSubjects.filter((cs) => cs.class_num === classNum).map((cs) => cs.subject);
                const available = SUBJECTS_LIST.filter((s) => !assigned.includes(s));
                return (
                  <div key={classNum} className="px-5 py-4 flex items-center gap-4 flex-wrap">
                    <span className="text-[13px] font-semibold text-slate-700 w-20 shrink-0">Class {classNum}</span>
                    <div className="flex items-center gap-2 flex-wrap flex-1">
                      {assigned.length === 0 && <span className="text-[12px] text-slate-400 italic">No subjects yet</span>}
                      {assigned.map((subject) => (
                        <span key={subject} className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-[12px] font-medium pl-2.5 pr-1.5 py-1 rounded-full">
                          {subject}
                          <button
                            onClick={() => void handleRemoveSubject(classNum, subject)}
                            disabled={subjectsBusy === `${classNum}-${subject}`}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer disabled:opacity-50 leading-none"
                            title={`Remove ${subject} from Class ${classNum}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    {available.length > 0 && (
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={addSubjectValue[classNum] ?? ''}
                          onChange={(e) => setAddSubjectValue((p) => ({ ...p, [classNum]: e.target.value }))}
                          className="px-2.5 py-1.5 text-[12px] bg-white border border-slate-300 rounded-lg outline-none cursor-pointer"
                        >
                          <option value="">+ Add subject…</option>
                          {available.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button
                          onClick={() => void handleAddSubject(classNum)}
                          disabled={!addSubjectValue[classNum] || subjectsBusy === `add-${classNum}`}
                          className="text-[12px] font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-[15px] font-semibold text-slate-800">Delete this question?</h3>
            <p className="text-[13px] text-slate-500 mt-2 line-clamp-3">"{deleteTarget.text}"</p>
            <p className="text-[12px] text-slate-400 mt-2">It will no longer appear in any school's question bank. This cannot be undone.</p>
            <div className="flex items-center justify-end gap-3 mt-5">
              <button onClick={() => setDeleteTarget(null)} className="text-[13px] font-semibold text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg cursor-pointer">Cancel</button>
              <button onClick={() => void confirmDeleteQuestion()} className="bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer">
                Delete question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete book confirmation */}
      {deleteJobTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-[15px] font-semibold text-slate-800">Delete this book?</h3>
            <p className="text-[13px] text-slate-500 mt-2">"{deleteJobTarget.book_title}" (Class {deleteJobTarget.class_num}, {deleteJobTarget.subject})</p>
            <p className="text-[12px] text-slate-400 mt-2">The PDF, every indexed chunk, and every extracted diagram from this book will be permanently removed — the AI tutor will no longer be able to answer from it. This cannot be undone.</p>
            <div className="flex items-center justify-end gap-3 mt-5">
              <button onClick={() => setDeleteJobTarget(null)} disabled={deletingJob} className="text-[13px] font-semibold text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50">Cancel</button>
              <button
                onClick={() => void confirmDeleteJob()}
                disabled={deletingJob}
                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {deletingJob && <Loader2 size={14} className="animate-spin" />} Delete book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
