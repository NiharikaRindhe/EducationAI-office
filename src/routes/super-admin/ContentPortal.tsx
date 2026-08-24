import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertCircle, FileText, Search, BookOpen, Trash2, Database, Clock3, CircleAlert, X, Info } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { MetricCard, PortalPageHeader } from '../../components/shared/PortalPageHeader';
import { BookUploader } from '../../components/shared/BookUploader';
import { BookLibraryTable } from '../../components/shared/BookLibraryTable';
import { PyqPaperUploader } from '../../components/shared/PyqPaperUploader';
import { QuestionBankUploader, type ImportResult } from '../../components/shared/QuestionBankUploader';
import { ContentUploadUsageTable, type UploadUsageRow } from '../../components/shared/ContentUploadUsageTable';
import { useBookLibrary } from '../../lib/bookLibrary';

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

// Hidden, not deleted (item #14, UI testing pass Aug 24 2026) — the manual/
// global question bank duplicates what AI generation from uploaded books
// now covers. One-line flip back if it turns out to still be needed.
const GLOBAL_QUESTION_BANK_TAB_ENABLED = false;

export const SuperAdminContentPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'library' | 'questions' | 'subjects'>('library');
  const [uploadMode, setUploadMode] = useState<'book' | 'pyq'>('book');
  const lib = useBookLibrary({ basePath: '/super-admin' });

  // Every school's content-upload quota usage, across every class+subject —
  // the "overall school info" table (item #7), separate from the AI
  // Console's unrelated concurrency panel.
  const [uploadUsage, setUploadUsage] = useState<UploadUsageRow[] | null>(null);
  useEffect(() => {
    api.get<UploadUsageRow[]>('/super-admin/content/upload-usage').then(setUploadUsage).catch(() => setUploadUsage([]));
  }, []);

  // Class → Subject whitelist. Loaded on mount rather than only when the
  // Subjects tab opens, because the uploaders need it to offer the right
  // subjects per class — Class 1 has no Science.
  const [classSubjects, setClassSubjects] = useState<ClassSubjectRow[] | null>(null);
  const [addSubjectValue, setAddSubjectValue] = useState<Record<number, string>>({});
  const [subjectsBusy, setSubjectsBusy] = useState<string | null>(null);
  const [subjectsError, setSubjectsError] = useState('');

  // Question bank
  const [questions, setQuestions] = useState<QuestionItem[] | null>(null);
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [pyqFilter, setPyqFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<QuestionItem | null>(null);
  const [qError, setQError] = useState('');

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
    if (GLOBAL_QUESTION_BANK_TAB_ENABLED && activeTab === 'questions') fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, classFilter, subjectFilter, pyqFilter]);

  const handleImported = (res: ImportResult) => {
    if (res.created > 0) fetchQuestions();
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
    fetchClassSubjects();
  }, []);

  /** The class→subject matrix, as the uploaders' dropdown source. Falls back to
   *  the master list only while the matrix is still loading, so the selects are
   *  never empty on first paint. */
  const subjectsForClass = useMemo(() => {
    const byClass = new Map<number, string[]>();
    for (const row of classSubjects ?? []) {
      byClass.set(row.class_num, [...(byClass.get(row.class_num) ?? []), row.subject]);
    }
    return (classNum: number): string[] => {
      if (classSubjects === null) return SUBJECTS_LIST;
      return (byClass.get(classNum) ?? []).sort((a, b) => a.localeCompare(b));
    };
  }, [classSubjects]);

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

  return (
    <div className="flex flex-col gap-4">
      <PortalPageHeader
        eyebrow="Knowledge operations"
        title="Content intelligence hub"
        description="Upload trusted curriculum content, monitor indexing health and govern the question bank used across every school."
      >
        <div className="portal-metrics-grid">
          <MetricCard label="Books" value={lib.counts.total} hint="across the platform" icon={<BookOpen size={18} />} />
          <MetricCard label="AI ready" value={lib.counts.ready} hint="fully indexed" icon={<Database size={18} />} tone="emerald" />
          <MetricCard label="Processing" value={lib.counts.processing} hint="in the pipeline" icon={<Clock3 size={18} />} tone="sky" />
          <MetricCard
            label="Needs attention"
            value={lib.counts.failed}
            hint={lib.counts.failed ? 'failed jobs' : 'all healthy'}
            icon={<CircleAlert size={18} />}
            tone={lib.counts.failed ? 'rose' : 'slate'}
          />
        </div>
      </PortalPageHeader>

      {/* Tabs — the upload-mode toggle sits on the same row as the main tabs
          (only while Library is open) rather than stacked below with its own
          gap, which was taking up far more vertical space than two rows of
          small pill buttons need. */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {([
            { id: 'library', label: 'Book Library' },
            { id: 'questions', label: 'Global Question Bank' },
            { id: 'subjects', label: 'Class Subjects' },
          ] as const).filter((tab) => GLOBAL_QUESTION_BANK_TAB_ENABLED || tab.id !== 'questions').map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors cursor-pointer ${
                activeTab === tab.id ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'library' && (
          <div className="inline-flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {([
              { id: 'book', label: 'Upload textbook' },
              { id: 'pyq', label: 'Upload previous year paper' },
            ] as const).map((mode) => (
              <button
                key={mode.id}
                onClick={() => setUploadMode(mode.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors cursor-pointer ${
                  uploadMode === mode.id ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === 'library' ? (
        <div className="flex flex-col gap-4">
          {lib.error && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
              <AlertCircle size={15} className="shrink-0" /> {lib.error}
              <button onClick={() => lib.setError('')} className="ml-auto cursor-pointer"><X size={14} /></button>
            </div>
          )}

          {uploadMode === 'book' ? (
            <BookUploader
              uploadPath="/super-admin/ncert/upload"
              subjectsForClass={subjectsForClass}
              onUploaded={() => void lib.reload()}
              title="Upload curriculum book"
              subtitle="PDF up to 150 MB · goes into the platform library, available to every school."
              titlePlaceholder="Science — Curiosity (Class 7)"
              footerNote={
                <span className="flex items-start gap-2">
                  <Info size={14} className="mt-px shrink-0 text-slate-400" />
                  <span>
                    Books uploaded here are platform-wide. A school's own supplementary uploads appear in the
                    table below tagged with that school's name, and stay scoped to its students.
                  </span>
                </span>
              }
            />
          ) : (
            <PyqPaperUploader
              uploadPath="/super-admin/ncert/upload"
              subjectsForClass={subjectsForClass}
              defaultClass={10}
              onUploaded={() => void lib.reload()}
            />
          )}

          <BookLibraryTable
            lib={lib}
            showSource
            showKind
            heading="Platform library"
            description="Every book and previous year paper on the platform. Status refreshes automatically."
          />

          {/* Per-school upload quota usage — a real table, not a bar, since
              the 3-per-(class,subject) quota is per school, not a shared
              platform-wide pool (item #5/#7). The same-shaped table also
              appears on each School Detail page, scoped to just that school. */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-[14px] font-semibold text-slate-800">School content-upload usage</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">
                Every school's own uploads against its {uploadUsage?.[0]?.limit ?? 3}-per-class-per-subject quota. Platform-wide books uploaded above don't count against any school's quota.
              </p>
            </div>
            <ContentUploadUsageTable rows={uploadUsage} showSchool />
          </div>
        </div>
      ) : activeTab === 'questions' && GLOBAL_QUESTION_BANK_TAB_ENABLED ? (
        <div className="flex flex-col gap-5">
          {qError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
              <AlertCircle size={15} /> {qError}
            </div>
          )}

          <QuestionBankUploader uploadPath="/super-admin/question-bank/import" onImported={handleImported} />

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
          </div>

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

    </div>
  );
};
