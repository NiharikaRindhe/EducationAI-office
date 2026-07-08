import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Trash2, Loader2, AlertCircle, CheckCircle2, Send, Copy, Lock,
  FileText, Library, ClipboardCheck, Download, ArrowLeft,
} from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

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

interface ExamDetail extends ExamListRow {
  questions: QuestionRow[];
  assignedSections: { sectionId: string | null; label: string; startsAt: string | null; endsAt: string | null; studentCount: number }[];
}

interface BankQuestion {
  id: string;
  type: QuestionRow['type'];
  text: string;
  difficulty: string;
  marks: number;
  scope: string;
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

  return (
    <div className="flex flex-col gap-6">
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
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h2 className="font-display font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
              <FileText size={17} className="text-indigo-500" /> My Exams ({exams.length})
            </h2>
            {exams.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No exams yet — create your first one above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-400 font-label-caps text-[9px] border-b border-slate-100">
                      <th className="pb-2">Title</th><th className="pb-2">Class</th><th className="pb-2">Subject</th><th className="pb-2">Marks</th><th className="pb-2">Status</th><th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.map((e) => (
                      <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer" onClick={() => void openDetail(e.id)}>
                        <td className="py-2.5 font-semibold text-slate-700">{e.title}</td>
                        <td className="py-2.5">Class {e.class_num}</td>
                        <td className="py-2.5">{e.subject}</td>
                        <td className="py-2.5">{e.total_marks}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${STATUS_STYLES[e.status]}`}>{e.status}</span>
                        </td>
                        <td className="py-2.5 text-right text-indigo-500 font-bold">Open →</td>
                      </tr>
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
  onCreated: (examId: string) => void;
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
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (classNum === '' && classOptions.length > 0) setClassNum(classOptions[0]);
  }, [classOptions, classNum]);

  const subjects = classNum !== '' ? (mySections?.subjectsByClass[classNum] ?? []) : [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (classNum === '') return;
    setIsCreating(true);
    try {
      const exam = await api.post<{ id: string }>('/teacher/exams', { title, subject, classNum, durationMin });
      setTitle('');
      onCreated(exam.id);
    } catch (err) {
      onError(err instanceof ApiClientError ? err.message : 'Failed to create exam');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
      <div>
        <h2 className="font-display font-bold text-lg text-slate-800">New Exam</h2>
        <p className="text-xs text-slate-400 mt-0.5">Create a draft, add questions, then publish it to your sections — each section can get its own exam window.</p>
      </div>
      {classOptions.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">No sections are mapped to you yet — ask your School Admin to assign you on the Classes &amp; Sections page.</p>
      ) : (
        <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-3">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Exam title (e.g. Unit Test 1 — Nutrition)"
            className="flex-1 min-w-64 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-400" />
          <select value={classNum} onChange={(e) => { setClassNum(Number(e.target.value)); setSubject(''); }}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none">
            {classOptions.map((c) => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <select required value={subject} onChange={(e) => setSubject(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none">
            <option value="">Subject</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Minutes</label>
            <input type="number" min={5} max={240} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))}
              className="w-20 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none" />
          </div>
          <button type="submit" disabled={isCreating}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl px-4 py-2.5 transition-all cursor-pointer">
            {isCreating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Create Draft
          </button>
        </form>
      )}
    </div>
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

  const downloadAdmitCards = () =>
    run(async () => {
      const blob = await api.download(`/teacher/exams/${exam.id}/admit-cards`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admit-cards-${exam.title.replace(/\s+/g, '-').toLowerCase()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={onBack} className="mt-0.5 p-2 rounded-xl hover:bg-slate-100 text-slate-400 cursor-pointer"><ArrowLeft size={16} /></button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-lg text-slate-800">{exam.title}</h2>
              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${STATUS_STYLES[exam.status]}`}>{exam.status}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Class {exam.class_num} · {exam.subject} · {exam.duration_min} min · {exam.total_marks} marks · {exam.questions.length} question{exam.questions.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {exam.status !== 'draft' && (
            <>
              <Link to={`/teacher/exams/${exam.id}/review`}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl px-4 py-2.5 transition-all">
                <ClipboardCheck size={13} /> Review &amp; Results
              </Link>
              <button onClick={() => void downloadAdmitCards()} disabled={isBusy}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 px-3 py-2.5 rounded-xl cursor-pointer disabled:opacity-50">
                <Download size={13} /> Admit Cards
              </button>
            </>
          )}
          <button onClick={() => void handleDuplicate()} disabled={isBusy}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 px-3 py-2.5 rounded-xl cursor-pointer disabled:opacity-50">
            <Copy size={13} /> Duplicate (Set B)
          </button>
          {exam.status === 'published' && (
            <button onClick={() => void handleClose()} disabled={isBusy}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-2.5 rounded-xl cursor-pointer disabled:opacity-50">
              <Lock size={13} /> Close Exam
            </button>
          )}
        </div>
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

      {/* Questions */}
      <QuestionList exam={exam} isDraft={isDraft} onReload={onReload} onError={onError} />

      {isDraft && <AddQuestionCard examId={exam.id} onReload={onReload} onError={onError} />}
      {isDraft && <BankPicker exam={exam} onReload={onReload} onError={onError} />}
      {isDraft && <PublishCard exam={exam} mySections={mySections} onReload={onReload} onError={onError} onNotice={onNotice} />}
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
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <p className="text-xs text-slate-400 text-center py-4">No questions yet — add them below or pull from the question bank.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
      <h3 className="font-display font-bold text-sm text-slate-700">Questions</h3>
      {exam.questions.map((q, i) => (
        <div key={q.id} className="border border-slate-100 rounded-2xl p-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-700">
              <span className="text-slate-400 mr-1.5">Q{i + 1}.</span>{q.text}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">
              {QUESTION_TYPES.find((t) => t.value === q.type)?.label ?? q.type} · {q.marks} mark{q.marks === 1 ? '' : 's'}
            </p>
            {q.options && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {q.options.map((o) => (
                  <span key={o.id} className={`text-[10px] px-2 py-1 rounded-lg border ${o.isCorrect ? 'border-emerald-300 bg-emerald-50 text-emerald-700 font-bold' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
                    {o.text}
                  </span>
                ))}
              </div>
            )}
            {q.correct_answer && <p className="text-[10px] text-emerald-600 font-bold mt-1.5">Answer: {q.correct_answer}</p>}
          </div>
          {isDraft && (
            <button onClick={() => void remove(q.id)} className="p-2 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 cursor-pointer shrink-0">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
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
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
      <h3 className="font-display font-bold text-sm text-slate-700">Add a Question</h3>
      <form onSubmit={handleAdd} className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {QUESTION_TYPES.map((t) => (
            <button type="button" key={t.value} onClick={() => setType(t.value)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${type === t.value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <textarea required value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Question text"
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-400 resize-none" />

        {type === 'mcq' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {optionTexts.map((opt, i) => (
              <label key={i} className="flex items-center gap-2">
                <input type="radio" name="correct-option" checked={correctIndex === i} onChange={() => setCorrectIndex(i)} className="accent-emerald-600" />
                <input value={opt} onChange={(e) => setOptionTexts((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-400" />
              </label>
            ))}
            <p className="md:col-span-2 text-[10px] text-slate-400">Select the radio next to the correct option.</p>
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

        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-500">Marks</label>
          <input type="number" min={1} max={20} value={marks} onChange={(e) => setMarks(Number(e.target.value))}
            className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none" />
          <button type="submit" disabled={isAdding}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl px-4 py-2.5 transition-all cursor-pointer">
            {isAdding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add Question
          </button>
        </div>
      </form>
    </div>
  );
};

const BankPicker: React.FC<{ exam: ExamDetail; onReload: () => void; onError: (m: string) => void }> = ({ exam, onReload, onError }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [bank, setBank] = useState<BankQuestion[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  const load = async () => {
    setIsOpen(true);
    if (bank) return;
    try {
      setBank(await api.get<BankQuestion[]>('/teacher/question-bank', { classNum: exam.class_num, subject: exam.subject }));
    } catch (err) {
      onError(err instanceof ApiClientError ? err.message : 'Failed to load question bank');
    }
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const addSelected = async () => {
    setIsAdding(true);
    try {
      await api.post(`/teacher/exams/${exam.id}/questions/from-bank`, { bankIds: [...selected] });
      setSelected(new Set());
      onReload();
    } catch (err) {
      onError(err instanceof ApiClientError ? err.message : 'Failed to add from bank');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-sm text-slate-700 flex items-center gap-2">
          <Library size={15} className="text-indigo-500" /> Question Bank — Class {exam.class_num} {exam.subject}
        </h3>
        {!isOpen && (
          <button onClick={() => void load()} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-xl cursor-pointer">
            Browse Bank
          </button>
        )}
      </div>
      {isOpen && (
        bank === null ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin text-indigo-400" size={18} /></div>
        ) : bank.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No bank questions for this class + subject yet.</p>
        ) : (
          <>
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {bank.map((q) => (
                <label key={q.id} className={`flex items-start gap-2.5 border rounded-2xl p-3 cursor-pointer transition-all ${selected.has(q.id) ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'}`}>
                  <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggle(q.id)} className="mt-0.5 accent-indigo-600" />
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{q.text}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 uppercase font-bold">{q.type} · {q.difficulty} · {q.marks} mark{q.marks === 1 ? '' : 's'}</p>
                  </div>
                </label>
              ))}
            </div>
            {selected.size > 0 && (
              <button onClick={() => void addSelected()} disabled={isAdding}
                className="self-start flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl px-4 py-2.5 transition-all cursor-pointer">
                {isAdding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add {selected.size} Selected
              </button>
            )}
          </>
        )
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
  const [targets, setTargets] = useState<Record<string, { checked: boolean; startsAt: string; endsAt: string }>>({});
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
            startsAt: toIso(targets[s.classSectionId]?.startsAt ?? ''),
            endsAt: toIso(targets[s.classSectionId]?.endsAt ?? ''),
          })),
        },
        randomizeQuestions,
        shuffleOptions,
        autoSubmitOnSwitch,
        switchLimit,
      });
      onNotice(`Exam published to ${result.assignedCount} student${result.assignedCount === 1 ? '' : 's'}.`);
      onReload();
    } catch (err) {
      onError(err instanceof ApiClientError ? err.message : 'Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
      <div>
        <h3 className="font-display font-bold text-sm text-slate-700">Publish</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Each section gets its own window — 7-A can sit it Monday and 7-B Wednesday. Leave times empty for "open until closed".
        </p>
      </div>

      {eligibleSections.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-3">You don't teach any Class {exam.class_num} sections.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {eligibleSections.map((s) => {
            const t = targets[s.classSectionId];
            return (
              <div key={s.classSectionId} className={`border rounded-2xl p-3.5 flex flex-wrap items-center gap-3 transition-all ${t?.checked ? 'border-indigo-300 bg-indigo-50/40' : 'border-slate-100'}`}>
                <label className="flex items-center gap-2 cursor-pointer min-w-24">
                  <input type="checkbox" checked={t?.checked ?? false} onChange={(e) => setTarget(s.classSectionId, { checked: e.target.checked })} className="accent-indigo-600" />
                  <span className="text-xs font-bold text-slate-700">{s.classNum}-{s.section}</span>
                </label>
                {t?.checked && (
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

      <button onClick={() => void handlePublish()} disabled={isPublishing || exam.questions.length === 0}
        className="self-start flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl px-5 py-2.5 transition-all cursor-pointer">
        {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        Publish Exam
      </button>
      {exam.questions.length === 0 && <p className="text-[10px] text-slate-400 -mt-2">Add at least one question first.</p>}
    </div>
  );
};
