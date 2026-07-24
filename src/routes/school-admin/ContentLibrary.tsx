import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Upload, FileText, RotateCcw, BookOpen, Trash2, AlertTriangle } from 'lucide-react';
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
}

interface SubjectRow {
  class_num: number;
  subject: string;
}

// Must match SCHOOL_UPLOAD_LIMIT_PER_SUBJECT in api/src/services/superAdminContent.service.ts
const UPLOAD_LIMIT_PER_SUBJECT = 2;

const inputCls =
  'w-full px-3 py-2 text-[13px] text-slate-800 bg-white border border-slate-300 rounded-lg outline-none transition-colors focus:border-slate-500 focus:ring-2 focus:ring-slate-100 disabled:opacity-50 disabled:cursor-not-allowed';
const labelCls = 'block text-[12px] font-medium text-slate-600 mb-1';

const STATUS_BADGES: Record<Job['status'], { label: string; cls: string }> = {
  queued: { label: 'Queued', cls: 'bg-slate-100 text-slate-600' },
  chunking: { label: 'Extracting', cls: 'bg-sky-50 text-sky-700' },
  embedding: { label: 'Indexing', cls: 'bg-amber-50 text-amber-700' },
  done: { label: 'Ready', cls: 'bg-emerald-50 text-emerald-700' },
  error: { label: 'Failed', cls: 'bg-rose-50 text-rose-700' },
};

export const SchoolAdminContentLibrary: React.FC = () => {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [classFilter, setClassFilter] = useState('');

  const [uploadClass, setUploadClass] = useState('1');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadBookTitle, setUploadBookTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchJobs = () => {
    api.get<Job[]>('/school-admin/ncert/jobs').then(setJobs).catch(() => setJobs([]));
  };

  useEffect(() => {
    fetchJobs();
    api.get<SubjectRow[]>('/school-admin/subjects').then(setSubjects).catch(() => {});
    let interval: number | undefined;
    interval = window.setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const availableSubjects = subjects.filter((s) => s.class_num === Number(uploadClass));
  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.some((s) => s.subject === uploadSubject)) {
      setUploadSubject(availableSubjects[0]!.subject);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadClass, subjects]);

  const uploadCount = (jobs ?? []).filter(
    (j) => j.class_num === Number(uploadClass) && j.subject === uploadSubject && j.status !== 'error',
  ).length;
  const atLimit = Boolean(uploadSubject) && uploadCount >= UPLOAD_LIMIT_PER_SUBJECT;

  const goRaiseTicket = () => {
    navigate('/school-admin/tickets', {
      state: {
        prefillTicket: {
          category: 'content',
          subject: `More book uploads needed — Class ${uploadClass} ${uploadSubject}`,
          body: `We've reached the limit of ${UPLOAD_LIMIT_PER_SUBJECT} uploaded books for Class ${uploadClass} ${uploadSubject} and need to add more. Could you help us add: `,
        },
      },
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || atLimit) return;
    setUploading(true);
    setUploadMsg('');
    setUploadError('');
    try {
      await api.upload('/school-admin/ncert/upload', selectedFile, {
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
      await api.post(`/school-admin/ncert/jobs/${job.id}/retry`);
      fetchJobs();
    } catch (err) {
      setUploadError(err instanceof ApiClientError ? err.message : 'Retry failed');
    } finally {
      setRetryingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/school-admin/ncert/jobs/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchJobs();
    } catch (err) {
      setUploadError(err instanceof ApiClientError ? err.message : 'Delete failed');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const visibleJobs = (jobs ?? []).filter((j) => !classFilter || String(j.class_num) === classFilter);

  return (
    <div className="grid grid-cols-12 gap-5 items-start">
      {/* Upload panel */}
      <div className="col-span-12 xl:col-span-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-[14px] font-semibold text-slate-800">Upload a book</h2>
            <p className="text-[12px] text-slate-400 mt-0.5">
              Supplementary material for your school only — indexed for the AI tutor alongside the platform library. Up to {UPLOAD_LIMIT_PER_SUBJECT} books per class &amp; subject.
            </p>
          </div>

          <form onSubmit={handleUpload} className="p-5 flex flex-col gap-4">
            {uploadMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
                <FileText size={15} className="shrink-0" /> {uploadMsg}
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
                <select
                  value={uploadSubject}
                  onChange={(e) => setUploadSubject(e.target.value)}
                  disabled={availableSubjects.length === 0}
                  className={inputCls}
                >
                  {availableSubjects.length === 0 && <option value="">No subjects for this class</option>}
                  {availableSubjects.map((s) => <option key={s.subject} value={s.subject}>{s.subject}</option>)}
                </select>
              </div>
            </div>

            {uploadSubject && (
              <p className={`text-[12px] ${atLimit ? 'text-rose-600 font-medium' : 'text-slate-400'}`}>
                {uploadCount} of {UPLOAD_LIMIT_PER_SUBJECT} uploaded for Class {uploadClass} {uploadSubject}
                {atLimit ? ' — limit reached.' : ''}
              </p>
            )}

            {atLimit ? (
              <button
                type="button"
                onClick={goRaiseTicket}
                className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Raise a ticket to add more
              </button>
            ) : (
              <>
                <div>
                  <label className={labelCls}>Book title <span className="text-rose-500">*</span></label>
                  <input required value={uploadBookTitle} onChange={(e) => setUploadBookTitle(e.target.value)} placeholder="Extra Practice Worksheets (Class 7)" className={inputCls} />
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
                  disabled={uploading || !selectedFile || !uploadSubject}
                  className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload &amp; process
                </button>
              </>
            )}
          </form>
        </div>
      </div>

      {/* Books table */}
      <div className="col-span-12 xl:col-span-8">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-[14px] font-semibold text-slate-800">Your school's library</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">{(jobs ?? []).length} book{(jobs ?? []).length === 1 ? '' : 's'} · status refreshes automatically</p>
            </div>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
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
                    {['Book', 'Class', 'Subject', 'Indexing', 'Status', ''].map((h) => (
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
                              title="This book's chapter headings weren't recognized, so retrieved answers can't be attributed to a chapter and citations are less precise."
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
                                onClick={() => setDeleteTarget(job)}
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

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-[15px] font-semibold text-slate-800">Delete this book?</h3>
            <p className="text-[13px] text-slate-500 mt-2">"{deleteTarget.book_title}" (Class {deleteTarget.class_num}, {deleteTarget.subject})</p>
            <p className="text-[12px] text-slate-400 mt-2">The PDF, every indexed chunk, and every extracted diagram from this book will be permanently removed. This cannot be undone.</p>
            <div className="flex items-center justify-end gap-3 mt-5">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="text-[13px] font-semibold text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50">Cancel</button>
              <button
                onClick={() => void confirmDelete()}
                disabled={deleting}
                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
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
