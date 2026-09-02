import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Trash2, Loader2, AlertCircle, CheckCircle2, Send, Copy, Lock,
  FileText, ClipboardCheck, ArrowLeft, ArrowRight, Clock3, PencilLine, CircleCheckBig, Sparkles, Users, ShieldAlert,
} from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { MetricCard, PortalPageHeader } from '../../components/shared/PortalPageHeader';
import { AiQuestionGenerator } from '../../components/shared/AiQuestionGenerator';

// ─── Types mirroring the API ─────────────────────────────────

interface MySections {
  sections: { classSectionId: string; classNum: number; section: string; subjects: string[]; isClassTeacher: boolean }[];
  legacyFallback: boolean;
  subjectsByClass: Record<number, string[]>;
}

interface ExamListRow {
  id: string;
  title: string;
  subject: string;
  class_num: number;
  duration_min: number;
  total_marks: number;
  status: 'draft' | 'published' | 'closed';
  created_at: string;
  assignedStudentCount: number;
}

interface QuestionRow {
  id: string;
  type: 'mcq' | 'true_false' | 'short_answer' | 'long_answer' | 'fill_blank';
  text: string;
  options: { id: string; text: string; isCorrect?: boolean }[] | null;
  correct_answer: string | null;
  marks: number;
  rubric: string | null;
}

interface StudentTrackerRow {
  studentId: string;
  fullName: string;
  sectionLabel: string;
  status: 'not_started' | 'in_progress' | 'submitted';
  submittedAt: string | null;
  totalScore: number | null;
  maxScore: number | null;
  isReviewed: boolean;
  autoSubmitted: boolean;
}

interface ExamDetail extends ExamListRow {
  questions: QuestionRow[];
  assignedSections: { sectionId: string | null; label: string; startsAt: string | null; endsAt: string | null; studentCount: number }[];
  studentTracker: StudentTrackerRow[];
}

const QUESTION_TYPES: { value: QuestionRow['type']; label: string }[] = [
  { value: 'mcq', label: 'MCQ' },
  { value: 'true_false', label: 'True / False' },
  { value: 'fill_blank', label: 'Fill in the blank' },
  { value: 'short_answer', label: 'Short answer' },
  { value: 'long_answer', label: 'Long answer' },
];

const STATUS_STYLES: Record<ExamListRow['status'], string> = {
  draft: 'bg-slate-100 text-slate-500',
  published: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-200 text-slate-400',
};

const toIso = (local: string): string | undefined => (local ? new Date(local).toISOString() : undefined);
const fmtWindow = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null;
const plannedSectionsKey = (examId: string) => `eduai_exam_planned_sections_${examId}`;

const rememberPlannedSections = (examId: string, sectionIds: string[]) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(plannedSectionsKey(examId), JSON.stringify(sectionIds));
};

const readPlannedSections = (examId: string): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.sessionStorage.getItem(plannedSectionsKey(examId));
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
};

export const TeacherCreateExam: React.FC = () => {
  const [mySections, setMySections] = useState<MySections | null>(null);
  const [exams, setExams] = useState<ExamListRow[]>([]);
  const [openExam, setOpenExam] = useState<ExamDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadList = useCallback(async () => {
    try {
      const [sections, examData] = await Promise.all([
        api.get<MySections>('/teacher/my-sections'),
        api.get<ExamListRow[]>('/teacher/exams'),
      ]);
      setMySections(sections);
      setExams(examData);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load exams');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadList(); }, [loadList]);

  const openDetail = async (examId: string) => {
    setError('');
    try {
      setOpenExam(await api.get<ExamDetail>(`/teacher/exams/${examId}`));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to open exam');
    }
  };

  const backToList = async () => {
    setOpenExam(null);
    setNotice('');
    await loadList();
  };

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-400" /></div>;
  const draftCount = exams.filter((exam) => exam.status === 'draft').length;
  const publishedCount = exams.filter((exam) => exam.status === 'published').length;
  const closedCount = exams.filter((exam) => exam.status === 'closed').length;
  // Grouped by class so a teacher juggling several classes can scan straight
  // to the one they're looking for, instead of hunting a flat list.
  const examsByClass = [...exams.reduce((map, e) => {
    (map.get(e.class_num) ?? map.set(e.class_num, []).get(e.class_num)!).push(e);
    return map;
  }, new Map<number, ExamListRow[]>())].sort((a, b) => a[0] - b[0]);

  return (
    <div className="flex flex-col gap-6">
      {!openExam && (
        <PortalPageHeader
          eyebrow="Assessment workspace"
          title="Build and manage exams"
          description="Create structured assessments, reuse trusted questions and publish to the right sections with confidence."
        >
          <div className="portal-metrics-grid">
            <MetricCard label="All exams" value={exams.length} hint="total" icon={<FileText size={18} />} />
            <MetricCard label="Drafts" value={draftCount} hint="in progress" icon={<PencilLine size={18} />} tone="amber" />
            <MetricCard label="Live" value={publishedCount} hint="published" icon={<Clock3 size={18} />} tone="indigo" />
            <MetricCard label="Completed" value={closedCount} hint="closed" icon={<CircleCheckBig size={18} />} tone="emerald" />
          </div>
        </PortalPageHeader>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}
      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
          <CheckCircle2 size={14} /> {notice}
        </div>
      )}

      {openExam ? (
        <ExamBuilder
          exam={openExam}
          mySections={mySections}
          onBack={() => void backToList()}
          onReload={() => void openDetail(openExam.id)}
          onOpenExam={(id) => void openDetail(id)}
          onError={setError}
          onNotice={setNotice}
        />
      ) : (
        <>
          <NewExamCard mySections={mySections} onCreated={(id) => void openDetail(id)} onError={setError} />
          <div className="portal-panel">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display font-bold text-[15px] text-slate-900 flex items-center gap-2">
                  <FileText size={17} className="text-indigo-500" /> Saved exams
                </h2>
                <p className="mt-1 text-xs text-slate-400">Open an exam to edit, duplicate, publish or review results.</p>
              </div>
              <span className="self-start rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 sm:self-auto">{exams.length} total</span>
            </div>
            {exams.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No exams yet — create your first one above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] table-fixed text-xs">
                  <colgroup>
                    <col className="w-[27%]" />
                    <col className="w-[15%]" />
                    <col className="w-[11%]" />
                    <col className="w-[8%]" />
                    <col className="w-[14%]" />
                    <col className="w-[13%]" />
                    <col className="w-[9%]" />
                  </colgroup>
                  <thead className="bg-white">
                    <tr className="border-b border-slate-200 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      <th className="px-5 py-3.5">Exam</th>
                      <th className="px-3 py-3.5">Subject</th>
                      <th className="px-3 py-3.5">Duration</th>
                      <th className="px-3 py-3.5">Marks</th>
                      <th className="px-3 py-3.5">Students</th>
                      <th className="px-3 py-3.5">Status</th>
                      <th className="px-5 py-3.5"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {examsByClass.map(([classNum, classExams]) => (
                      <React.Fragment key={classNum}>
                        <tr className="border-b border-slate-100 bg-slate-50/80">
                          <td colSpan={7} className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-display text-xs font-bold text-slate-700">Class {classNum}</span>
                              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-400 ring-1 ring-slate-200">
                                {classExams.length} exam{classExams.length === 1 ? '' : 's'}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {classExams.map((exam) => (
                          <tr
                            key={exam.id}
                            className="group border-b border-slate-100 last:border-b-0 transition-colors hover:bg-indigo-50/30 cursor-pointer"
                            onClick={() => void openDetail(exam.id)}
                          >
                            <td className="truncate px-5 py-4 text-sm font-semibold text-slate-800" title={exam.title}>{exam.title}</td>
                            <td className="truncate px-3 py-4 text-slate-600" title={exam.subject}>{exam.subject}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-slate-500">{exam.duration_min} min</td>
                            <td className="px-3 py-4 font-medium text-slate-600">{exam.total_marks}</td>
                            <td className="whitespace-nowrap px-3 py-4">
                              {exam.status === 'draft' ? (
                                <span className="text-slate-300">Not published</span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">
                                  <Users size={12} className="text-slate-400" />
                                  {exam.assignedStudentCount} student{exam.assignedStudentCount === 1 ? '' : 's'}
                                </span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4">
                              <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase ${STATUS_STYLES[exam.status]}`}>{exam.status}</span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={(event) => { event.stopPropagation(); void openDetail(exam.id); }}
                                className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold text-indigo-600 transition group-hover:text-indigo-700 cursor-pointer"
                              >
                                Open <ArrowRight size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ─── New exam card ───────────────────────────────────────────

const NewExamCard: React.FC<{
  mySections: MySections | null;
  onCreated: (examId: string, sectionIds: string[]) => void;
  onError: (message: string) => void;
}> = ({ mySections, onCreated, onError }) => {
  const classOptions = useMemo(
    () => [...new Set((mySections?.sections ?? []).map((s) => s.classNum))].sort((a, b) => a - b),
    [mySections],
  );
  const [title, setTitle] = useState('');
  const [classNum, setClassNum] = useState<number | ''>('');
  const [subject, setSubject] = useState('');
  const [durationMin, setDurationMin] = useState(30);
  const [selectedSectionIds, setSelectedSectionIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (classNum === '' && classOptions.length > 0) setClassNum(classOptions[0]);
  }, [classOptions, classNum]);

  const subjects = classNum !== '' ? (mySections?.subjectsByClass[classNum] ?? []) : [];
  const sectionOptions = (mySections?.sections ?? []).filter((section) => section.classNum === classNum);

  const toggleSection = (sectionId: string) => {
    setSelectedSectionIds((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const selectAllSections = () => {
    setSelectedSectionIds(new Set(sectionOptions.map((section) => section.classSectionId)));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (classNum === '' || selectedSectionIds.size === 0) return;
    setIsCreating(true);
    try {
      const exam = await api.post<{ id: string }>('/teacher/exams', { title, subject, classNum, durationMin });
      const sectionIds = [...selectedSectionIds];
      rememberPlannedSections(exam.id, sectionIds);
      setTitle('');
      onCreated(exam.id, sectionIds);
    } catch (err) {
      onError(err instanceof ApiClientError ? err.message : 'Failed to create exam');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="portal-panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Plus size={18} />
          </span>
          <div>
            <h2 className="font-display text-[15px] font-bold text-slate-900">Create a new exam</h2>
            <p className="mt-0.5 text-xs text-slate-400">Start with the basic details. Questions and publishing come next.</p>
          </div>
        </div>
        <span className="self-start rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:self-auto">Step 1 of 3</span>
      </div>
      {classOptions.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">No sections are mapped to you yet — ask your School Admin to assign you on the Classes &amp; Sections page.</p>
      ) : (
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2 xl:grid-cols-12">
            <label className="flex flex-col gap-1.5 xl:col-span-5">
              <span className="text-[11px] font-bold text-slate-600">Exam title</span>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Unit Test 1 — Nutrition"
                className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
            </label>
            <label className="flex flex-col gap-1.5 xl:col-span-2">
              <span className="text-[11px] font-bold text-slate-600">Class</span>
              <select value={classNum} onChange={(e) => { setClassNum(Number(e.target.value)); setSubject(''); setSelectedSectionIds(new Set()); }}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                {classOptions.map((c) => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 xl:col-span-3">
              <span className="text-[11px] font-bold text-slate-600">Subject</span>
              <select required value={subject} onChange={(e) => setSubject(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                <option value="">Select subject</option>
                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 xl:col-span-2">
              <span className="text-[11px] font-bold text-slate-600">Duration</span>
              <div className="relative">
                <input type="number" min={5} max={240} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-14 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400">min</span>
              </div>
            </label>
            <div className="sm:col-span-2 xl:col-span-12">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold text-slate-600">Sections</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">Choose the Class {classNum} sections that will receive this exam.</p>
                </div>
                {sectionOptions.length > 1 && (
                  <button type="button" onClick={selectAllSections} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer">
                    Select all
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {sectionOptions.map((section) => {
                  const isSelected = selectedSectionIds.has(section.classSectionId);
                  return (
                    <button
                      type="button"
                      key={section.classSectionId}
                      aria-pressed={isSelected}
                      onClick={() => toggleSection(section.classSectionId)}
                      className={`flex min-w-24 items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/40'
                      }`}
                    >
                      <span>Class {section.classNum}-{section.section}</span>
                      {isSelected && <CheckCircle2 size={14} />}
                    </button>
                  );
                })}
              </div>
              {selectedSectionIds.size === 0 ? (
                <p className="mt-2 text-[10px] font-medium text-amber-600">Select at least one section to continue.</p>
              ) : (
                <p className="mt-2 text-[10px] font-medium text-emerald-600">{selectedSectionIds.size} section{selectedSectionIds.size === 1 ? '' : 's'} selected</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-slate-400">This exam will remain private until you publish it.</p>
            <button type="submit" disabled={isCreating || selectedSectionIds.size === 0}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">
              {isCreating ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />} Create draft &amp; add questions
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

// ─── Builder (draft) / detail (published) ────────────────────

const ExamBuilder: React.FC<{
  exam: ExamDetail;
  mySections: MySections | null;
  onBack: () => void;
  onReload: () => void;
  onOpenExam: (examId: string) => void;
  onError: (message: string) => void;
  onNotice: (message: string) => void;
}> = ({ exam, mySections, onBack, onReload, onOpenExam, onError, onNotice }) => {
  const isDraft = exam.status === 'draft';
  const [isBusy, setIsBusy] = useState(false);

  const run = async (fn: () => Promise<void>, doneMessage?: string) => {
    onError('');
    setIsBusy(true);
    try {
      await fn();
      if (doneMessage) onNotice(doneMessage);
    } catch (err) {
      onError(err instanceof ApiClientError ? err.message : 'Operation failed');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDuplicate = () =>
    run(async () => {
      const copy = await api.post<{ id: string }>(`/teacher/exams/${exam.id}/duplicate`);
      onNotice('Set B draft created — edit a few questions before publishing to the other section.');
      onOpenExam(copy.id);
    });

  const handleClose = () => run(async () => { await api.post(`/teacher/exams/${exam.id}/close`); onReload(); }, 'Exam closed.');

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="portal-panel overflow-hidden">
        <div className="flex flex-col gap-5 px-5 py-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <button onClick={onBack} aria-label="Back to exams" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 cursor-pointer"><ArrowLeft size={17} /></button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-bold text-slate-900">{exam.title}</h2>
              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${STATUS_STYLES[exam.status]}`}>{exam.status}</span>
            </div>
              <p className="mt-1 text-xs text-slate-400">Review the paper, add questions and publish it when everything is ready.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">Class {exam.class_num}</span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{exam.subject}</span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{exam.duration_min} min</span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{exam.total_marks} marks</span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{exam.questions.length} question{exam.questions.length === 1 ? '' : 's'}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          {exam.status !== 'draft' && (
            <>
              <Link to={`/teacher/exams/${exam.id}/review`}
                className="flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white transition hover:bg-indigo-700">
                <ClipboardCheck size={13} /> Review &amp; Results
              </Link>
            </>
          )}
          <button onClick={() => void handleDuplicate()} disabled={isBusy}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 cursor-pointer disabled:opacity-50">
            <Copy size={13} /> Duplicate (Set B)
          </button>
          {exam.status === 'published' && (
            <button onClick={() => void handleClose()} disabled={isBusy}
              className="flex h-10 items-center gap-1.5 rounded-xl border border-rose-100 px-3 text-xs font-bold text-rose-600 transition hover:bg-rose-50 cursor-pointer disabled:opacity-50">
              <Lock size={13} /> Close Exam
            </button>
          )}
          </div>
        </div>
        {isDraft && (
          <div className="grid grid-cols-1 border-t border-slate-100 bg-slate-50/60 sm:grid-cols-3 sm:divide-x sm:divide-slate-100">
            <div className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 size={14} /></span>
              <div><p className="text-[11px] font-bold text-slate-700">1. Exam details</p><p className="text-[10px] text-slate-400">Complete</p></div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700"><FileText size={14} /></span>
              <div><p className="text-[11px] font-bold text-slate-700">2. Add questions</p><p className="text-[10px] text-slate-400">{exam.questions.length} added</p></div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-slate-200"><Send size={13} /></span>
              <div><p className="text-[11px] font-bold text-slate-700">3. Publish</p><p className="text-[10px] text-slate-400">Choose sections</p></div>
            </div>
          </div>
        )}
      </div>

      {/* Published: section windows */}
      {exam.assignedSections.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <h3 className="font-display font-bold text-sm text-slate-700 mb-3">Published To</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {exam.assignedSections.map((s) => (
              <div key={s.sectionId ?? 'individual'} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-slate-800 text-sm">{s.label}</span>
                  <span className="text-[10px] font-bold text-slate-400">{s.studentCount} student{s.studentCount === 1 ? '' : 's'}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  {s.startsAt || s.endsAt
                    ? `${fmtWindow(s.startsAt) ?? 'Open'} → ${fmtWindow(s.endsAt) ?? 'no close time'}`
                    : 'Open while the exam is published'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {exam.assignedSections.length > 0 && <StudentTrackerCard exam={exam} />}

      {/* Questions */}
      <QuestionList exam={exam} isDraft={isDraft} onReload={onReload} onError={onError} />

      {isDraft && <AiGeneratorCard exam={exam} onReload={onReload} onError={onError} onNotice={onNotice} />}
      {isDraft && <AddQuestionCard examId={exam.id} onReload={onReload} onError={onError} />}
      {isDraft && <PublishCard exam={exam} mySections={mySections} onReload={onReload} onError={onError} onNotice={onNotice} />}
    </div>
  );
};

// ─── Live per-student attempt tracker ─────────────────────────

const TRACKER_STATUS_STYLES: Record<StudentTrackerRow['status'], { label: string; className: string }> = {
  not_started: { label: 'Not started', className: 'bg-slate-100 text-slate-500' },
  in_progress: { label: 'In progress', className: 'bg-amber-100 text-amber-700' },
  submitted: { label: 'Submitted', className: 'bg-emerald-100 text-emerald-700' },
};

const StudentTrackerCard: React.FC<{ exam: ExamDetail }> = ({ exam }) => {
  const submittedCount = exam.studentTracker.filter((s) => s.status === 'submitted').length;
  const inProgressCount = exam.studentTracker.filter((s) => s.status === 'in_progress').length;
  const notStartedCount = exam.studentTracker.filter((s) => s.status === 'not_started').length;

  return (
    <div className="portal-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Users size={16} /></span>
          <div>
            <h3 className="font-display text-sm font-bold text-slate-800">Students</h3>
            <p className="mt-0.5 text-[11px] text-slate-400">Who has appeared for this exam, updated live.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700">{submittedCount} submitted</span>
          {inProgressCount > 0 && <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-amber-700">{inProgressCount} in progress</span>}
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-500">{notStartedCount} not started</span>
        </div>
      </div>
      {exam.studentTracker.length === 0 ? (
        <p className="px-5 py-6 text-center text-xs text-slate-400">No students assigned yet.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {exam.studentTracker.map((s) => {
            const style = TRACKER_STATUS_STYLES[s.status];
            return (
              <div key={s.studentId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-800">{s.fullName}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">Class {s.sectionLabel}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  {s.status === 'submitted' && (
                    <span className="text-[11px] font-bold text-slate-600">
                      {s.totalScore ?? '—'}/{s.maxScore ?? '—'}
                      {!s.isReviewed && <span className="ml-1.5 font-bold text-amber-600">· review pending</span>}
                    </span>
                  )}
                  {s.autoSubmitted && (
                    <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-500">
                      <ShieldAlert size={9} /> AUTO-SUBMITTED
                    </span>
                  )}
                  <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase ${style.className}`}>{style.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {submittedCount > 0 && (
        <div className="border-t border-slate-100 px-5 py-3">
          <Link to={`/teacher/exams/${exam.id}/review`} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
            Grade &amp; review submissions →
          </Link>
        </div>
      )}
    </div>
  );
};

const QuestionList: React.FC<{
  exam: ExamDetail;
  isDraft: boolean;
  onReload: () => void;
  onError: (m: string) => void;
}> = ({ exam, isDraft, onReload, onError }) => {
  const remove = async (questionId: string) => {
    try {
      await api.delete(`/teacher/exams/${exam.id}/questions/${questionId}`);
      onReload();
    } catch (err) {
      onError(err instanceof ApiClientError ? err.message : 'Failed to remove question');
    }
  };

  if (exam.questions.length === 0) {
    return (
      <div className="portal-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-800">Question paper</h3>
            <p className="mt-0.5 text-[11px] text-slate-400">Review every question here before publishing.</p>
          </div>
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">0 questions</span>
        </div>
        <div className="flex flex-col items-center px-5 py-9 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><FileText size={18} /></span>
          <p className="mt-3 text-sm font-semibold text-slate-700">Your question paper is empty</p>
          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">Generate questions with AI or add them manually using the sections below.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="font-display text-sm font-bold text-slate-800">Question paper</h3>
          <p className="mt-0.5 text-[11px] text-slate-400">Review every question here before publishing.</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-700">{exam.total_marks} marks</p>
          <p className="text-[10px] text-slate-400">{exam.questions.length} question{exam.questions.length === 1 ? '' : 's'}</p>
        </div>
      </div>
      <div className="divide-y divide-slate-100 px-5">
      {exam.questions.map((q, i) => (
        <div key={q.id} className="flex items-start justify-between gap-4 py-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-6 text-slate-800">
              <span className="mr-2 text-indigo-500">{i + 1}.</span>{q.text}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {QUESTION_TYPES.find((t) => t.value === q.type)?.label ?? q.type} · {q.marks} mark{q.marks === 1 ? '' : 's'}
            </p>
            {q.options && (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {q.options.map((o) => (
                  <span key={o.id} className={`rounded-lg border px-3 py-2 text-[11px] ${o.isCorrect ? 'border-emerald-200 bg-emerald-50 text-emerald-700 font-bold' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
                    <span className="mr-1.5 font-bold uppercase">{o.id}.</span>{o.text}
                  </span>
                ))}
              </div>
            )}
            {q.correct_answer && <p className="text-[10px] text-emerald-600 font-bold mt-1.5">Answer: {q.correct_answer}</p>}
          </div>
          {isDraft && (
            <button onClick={() => void remove(q.id)} aria-label={`Delete question ${i + 1}`} className="shrink-0 rounded-xl p-2 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 cursor-pointer">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
      </div>
    </div>
  );
};

const AddQuestionCard: React.FC<{ examId: string; onReload: () => void; onError: (m: string) => void }> = ({ examId, onReload, onError }) => {
  const [type, setType] = useState<QuestionRow['type']>('mcq');
  const [text, setText] = useState('');
  const [optionTexts, setOptionTexts] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [correctTf, setCorrectTf] = useState('True');
  const [correctBlank, setCorrectBlank] = useState('');
  const [rubric, setRubric] = useState('');
  const [marks, setMarks] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const body: Record<string, unknown> = { type, text, marks };
      if (type === 'mcq') {
        const filled = optionTexts.map((t, i) => ({ id: String.fromCharCode(97 + i), text: t.trim(), isCorrect: i === correctIndex }))
          .filter((o) => o.text);
        if (filled.length < 2) throw new Error('An MCQ needs at least 2 options');
        if (!filled.some((o) => o.isCorrect)) throw new Error('Mark which option is correct');
        body.options = filled;
      } else if (type === 'true_false') {
        body.correctAnswer = correctTf;
      } else if (type === 'fill_blank') {
        body.correctAnswer = correctBlank;
      } else {
        body.rubric = rubric || undefined;
      }
      await api.post(`/teacher/exams/${examId}/questions`, body);
      setText(''); setOptionTexts(['', '', '', '']); setCorrectBlank(''); setRubric('');
      onReload();
    } catch (err) {
      onError(err instanceof ApiClientError ? err.message : err instanceof Error ? err.message : 'Failed to add question');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="portal-panel overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><PencilLine size={16} /></span>
        <div>
          <h3 className="font-display text-sm font-bold text-slate-800">Add a question manually</h3>
          <p className="mt-0.5 text-[11px] text-slate-400">Choose a format, write the question and set its answer.</p>
        </div>
      </div>
      <form onSubmit={handleAdd} className="flex flex-col gap-5 px-5 py-5">
        <div>
          <p className="mb-2 text-[11px] font-bold text-slate-600">Question type</p>
          <div className="flex flex-wrap gap-2">
          {QUESTION_TYPES.map((t) => (
            <button type="button" key={t.value} onClick={() => setType(t.value)}
              className={`rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer ${type === t.value ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}>
              {t.label}
            </button>
          ))}
          </div>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-slate-600">Question</span>
          <textarea required value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Write the question clearly for students"
            className="resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
        </label>

        {type === 'mcq' && (
          <div>
            <p className="mb-2 text-[11px] font-bold text-slate-600">Answer options <span className="font-normal text-slate-400">— select the correct one</span></p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {optionTexts.map((opt, i) => (
              <label key={i} className={`flex items-center gap-2 rounded-xl border p-2 transition ${correctIndex === i ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200'}`}>
                <input type="radio" name="correct-option" checked={correctIndex === i} onChange={() => setCorrectIndex(i)} className="accent-emerald-600" />
                <input value={opt} onChange={(e) => setOptionTexts((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-xs text-slate-700 outline-none" />
              </label>
            ))}
            </div>
          </div>
        )}
        {type === 'true_false' && (
          <select value={correctTf} onChange={(e) => setCorrectTf(e.target.value)} className="w-40 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none">
            <option>True</option><option>False</option>
          </select>
        )}
        {type === 'fill_blank' && (
          <input required value={correctBlank} onChange={(e) => setCorrectBlank(e.target.value)} placeholder="Correct answer"
            className="w-72 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-400" />
        )}
        {(type === 'short_answer' || type === 'long_answer') && (
          <textarea value={rubric} onChange={(e) => setRubric(e.target.value)} rows={2}
            placeholder="Scoring rubric for the AI / manual grader (e.g. 'Must mention photosynthesis and chlorophyll — 1 mark each')"
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-400 resize-none" />
        )}

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <label className="flex w-28 flex-col gap-1.5">
            <span className="text-[11px] font-bold text-slate-600">Marks</span>
            <input type="number" min={1} max={20} value={marks} onChange={(e) => setMarks(Number(e.target.value))}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
          </label>
          <button type="submit" disabled={isAdding}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50 cursor-pointer">
            {isAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add to question paper
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * Generate questions straight into the open paper.
 *
 * The generator shipped only on the Question Bank page, which made the real
 * workflow "leave the exam → generate → save → come back → browse bank → add",
 * and it was the main reason the feature didn't feel finished. Here it is
 * locked to this exam's class+subject and, once the teacher saves, the new
 * bank rows are added to this paper in the same action — the review gate
 * inside the generator is unchanged, so nothing reaches the exam unreviewed.
 */
const AiGeneratorCard: React.FC<{
  exam: ExamDetail;
  onReload: () => void;
  onError: (m: string) => void;
  onNotice: (m: string) => void;
}> = ({ exam, onReload, onError, onNotice }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSaved = async ({ ids }: { saved: number; ids: string[] }) => {
    if (ids.length === 0) return;
    try {
      await api.post(`/teacher/exams/${exam.id}/questions/from-bank`, { bankIds: ids });
      onNotice(`${ids.length} AI question${ids.length === 1 ? '' : 's'} added to this exam. Review them above before publishing.`);
      setIsOpen(false);
      onReload();
    } catch (err) {
      // The questions are safely saved either way — say so, so the teacher
      // doesn't regenerate and end up with duplicates.
      onError(
        err instanceof ApiClientError
          ? `Questions were saved but could not be added to this exam: ${err.message}. Try generating them again.`
          : 'Questions were saved but could not be added to this exam. Try generating them again.',
      );
    }
  };

  return (
    <div className="portal-panel overflow-hidden">
      <div className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${isOpen ? 'border-b border-slate-100' : ''}`}>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Sparkles size={16} /></span>
          <div>
            <h3 className="font-display text-sm font-bold text-slate-800">Generate questions with AI</h3>
            <p className="mt-0.5 text-[11px] text-slate-400">Uses your school books for Class {exam.class_num} {exam.subject}.</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="h-9 self-start rounded-xl border border-indigo-200 px-3.5 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50 cursor-pointer sm:self-auto"
        >
          {isOpen ? 'Close' : 'Generate Questions'}
        </button>
      </div>

      {isOpen && (
        <div className="px-5 py-5">
          <AiQuestionGenerator
            scope={[{ classNum: exam.class_num, subjects: [exam.subject] }]}
            lockedTo={{ classNum: exam.class_num, subject: exam.subject }}
            savedMessage={(n) => `${n} question${n === 1 ? '' : 's'} saved and added to this exam.`}
            onSaved={handleSaved}
          />
        </div>
      )}
    </div>
  );
};

const PublishCard: React.FC<{
  exam: ExamDetail;
  mySections: MySections | null;
  onReload: () => void;
  onError: (m: string) => void;
  onNotice: (m: string) => void;
}> = ({ exam, mySections, onReload, onError, onNotice }) => {
  const eligibleSections = useMemo(
    () => (mySections?.sections ?? []).filter((s) => s.classNum === exam.class_num),
    [mySections, exam.class_num],
  );
  const [targets, setTargets] = useState<Record<string, { checked: boolean; startsAt: string; endsAt: string }>>(() =>
    Object.fromEntries(
      readPlannedSections(exam.id).map((sectionId) => [sectionId, { checked: true, startsAt: '', endsAt: '' }]),
    ),
  );
  // Most schools run the same paper, same window, across every section of a
  // class (7-A and 7-B sitting it together) — that's the default. A teacher
  // who actually needs staggered timings (7-A Monday, 7-B Wednesday) can
  // switch this off and set each section's window individually, same as
  // before.
  const [sameSchedule, setSameSchedule] = useState(true);
  const [sharedStartsAt, setSharedStartsAt] = useState('');
  const [sharedEndsAt, setSharedEndsAt] = useState('');
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [autoSubmitOnSwitch, setAutoSubmitOnSwitch] = useState(true);
  const [switchLimit, setSwitchLimit] = useState(3);
  const [isPublishing, setIsPublishing] = useState(false);

  const setTarget = (id: string, patch: Partial<{ checked: boolean; startsAt: string; endsAt: string }>) =>
    setTargets((prev) => {
      const current = prev[id] ?? { checked: false, startsAt: '', endsAt: '' };
      return { ...prev, [id]: { ...current, ...patch } };
    });

  const allSelected = eligibleSections.length > 0 && eligibleSections.every((s) => targets[s.classSectionId]?.checked);
  const toggleAllSections = (checked: boolean) =>
    setTargets((prev) => {
      const next = { ...prev };
      for (const s of eligibleSections) next[s.classSectionId] = { ...(next[s.classSectionId] ?? { checked: false, startsAt: '', endsAt: '' }), checked };
      return next;
    });

  const handlePublish = async () => {
    const chosen = eligibleSections.filter((s) => targets[s.classSectionId]?.checked);
    if (chosen.length === 0) {
      onError('Select at least one section to publish to.');
      return;
    }
    onError('');
    setIsPublishing(true);
    try {
      const result = await api.post<{ assignedCount: number }>(`/teacher/exams/${exam.id}/publish`, {
        assignTo: {
          mode: 'sections',
          sections: chosen.map((s) => ({
            sectionId: s.classSectionId,
            startsAt: toIso(sameSchedule ? sharedStartsAt : (targets[s.classSectionId]?.startsAt ?? '')),
            endsAt: toIso(sameSchedule ? sharedEndsAt : (targets[s.classSectionId]?.endsAt ?? '')),
          })),
        },
        randomizeQuestions,
        shuffleOptions,
        autoSubmitOnSwitch,
        switchLimit,
      });
      if (typeof window !== 'undefined') window.sessionStorage.removeItem(plannedSectionsKey(exam.id));
      onNotice(`Exam published to ${result.assignedCount} student${result.assignedCount === 1 ? '' : 's'} across ${chosen.length} section${chosen.length === 1 ? '' : 's'}.`);
      onReload();
    } catch (err) {
      onError(err instanceof ApiClientError ? err.message : 'Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="portal-panel overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Send size={15} /></span>
        <div>
          <h3 className="font-display text-sm font-bold text-slate-800">Publish exam</h3>
          <p className="mt-0.5 text-[11px] text-slate-400">Choose who receives the exam and when it will be available.</p>
        </div>
      </div>
      <div className="flex flex-col gap-4 px-5 py-5">
        <p className="text-xs leading-5 text-slate-500">
          {sameSchedule
            ? 'Publish the same exam, same window, to every section you check below — the common case when a school sits a class together.'
            : 'Each section gets its own window — 7-A can sit it Monday and 7-B Wednesday.'}
          {' '}Leave times empty for "open until closed".
        </p>

      {eligibleSections.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-3">You don't teach any Class {exam.class_num} sections.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={allSelected} onChange={(e) => toggleAllSections(e.target.checked)} className="accent-indigo-600" />
              <span className="text-xs font-bold text-slate-600">Select all {eligibleSections.length} section{eligibleSections.length === 1 ? '' : 's'}</span>
            </label>
            {eligibleSections.length > 1 && (
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input type="checkbox" checked={sameSchedule} onChange={(e) => setSameSchedule(e.target.checked)} className="accent-indigo-600" />
                Same schedule for every section
              </label>
            )}
          </div>

          {sameSchedule && (
            <div className="flex flex-wrap items-center gap-3 bg-indigo-50/40 border border-indigo-100 rounded-2xl p-3.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold">OPENS</span>
                <input type="datetime-local" value={sharedStartsAt} onChange={(e) => setSharedStartsAt(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] outline-none" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold">CLOSES</span>
                <input type="datetime-local" value={sharedEndsAt} onChange={(e) => setSharedEndsAt(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] outline-none" />
              </div>
              <span className="text-[10px] text-slate-400">Applies to every section checked below.</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {eligibleSections.map((s) => {
              const t = targets[s.classSectionId];
              return (
                <div key={s.classSectionId} className={`border rounded-2xl p-3.5 flex flex-wrap items-center gap-3 transition-all ${t?.checked ? 'border-indigo-300 bg-indigo-50/40' : 'border-slate-100'}`}>
                  <label className="flex items-center gap-2 cursor-pointer min-w-24">
                    <input type="checkbox" checked={t?.checked ?? false} onChange={(e) => setTarget(s.classSectionId, { checked: e.target.checked })} className="accent-indigo-600" />
                    <span className="text-xs font-bold text-slate-700">{s.classNum}-{s.section}</span>
                  </label>
                  {t?.checked && !sameSchedule && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold">OPENS</span>
                        <input type="datetime-local" value={t.startsAt} onChange={(e) => setTarget(s.classSectionId, { startsAt: e.target.value })}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] outline-none" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold">CLOSES</span>
                        <input type="datetime-local" value={t.endsAt} onChange={(e) => setTarget(s.classSectionId, { endsAt: e.target.value })}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] outline-none" />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4">
        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" checked={randomizeQuestions} onChange={(e) => setRandomizeQuestions(e.target.checked)} className="accent-indigo-600" /> Randomize question order
        </label>
        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" checked={shuffleOptions} onChange={(e) => setShuffleOptions(e.target.checked)} className="accent-indigo-600" /> Shuffle MCQ options
        </label>
        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" checked={autoSubmitOnSwitch} onChange={(e) => setAutoSubmitOnSwitch(e.target.checked)} className="accent-indigo-600" /> Auto-submit after
        </label>
        <input type="number" min={1} max={10} value={switchLimit} onChange={(e) => setSwitchLimit(Number(e.target.value))}
          className="w-16 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none" />
        <span className="text-xs text-slate-400">tab switches</span>
      </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-slate-400">Students will see the exam only after it is published.</p>
          <button onClick={() => void handlePublish()} disabled={isPublishing || exam.questions.length === 0}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">
            {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Publish exam
          </button>
        </div>
        {exam.questions.length === 0 && <p className="text-[10px] text-slate-400">Add at least one question before publishing.</p>}
      </div>
    </div>
  );
};
