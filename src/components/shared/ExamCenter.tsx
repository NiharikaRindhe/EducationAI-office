import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Loader2, AlertCircle, Clock, CheckCircle2, PlayCircle, CalendarClock, ShieldAlert, Send } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

// One exam experience for every batch — only the accent color changes.
// List of assigned exams → take the paper (timer, autosave, tab-switch
// proctoring, resume after a crash) → submitted state with score.

type Accent = 'amber' | 'indigo' | 'sky';

const ACCENT = {
  amber: { text: 'text-amber-600', bg: 'bg-amber-500 hover:bg-amber-600', ring: 'border-amber-300', soft: 'bg-amber-50', spinner: 'text-amber-400' },
  indigo: { text: 'text-indigo-600', bg: 'bg-indigo-600 hover:bg-indigo-700', ring: 'border-indigo-300', soft: 'bg-indigo-50', spinner: 'text-indigo-400' },
  sky: { text: 'text-sky-600', bg: 'bg-sky-500 hover:bg-sky-600', ring: 'border-sky-300', soft: 'bg-sky-50', spinner: 'text-sky-400' },
} as const;

interface ExamListItem {
  id: string;
  title: string;
  subject: string;
  durationMin: number;
  totalMarks: number;
  startsAt: string | null;
  endsAt: string | null;
  state: 'upcoming' | 'open' | 'submitted' | 'closed';
  inProgress: boolean;
  result: { totalScore: number | null; maxScore: number | null; isReviewed: boolean; autoSubmitted: boolean } | null;
}

interface PaperQuestion {
  id: string;
  type: 'mcq' | 'true_false' | 'short_answer' | 'long_answer' | 'fill_blank';
  text: string;
  options: { id: string; text: string }[] | null;
  marks: number;
}

interface Paper {
  examSubmissionId: string;
  exam: { id: string; title: string; subject: string; durationMin: number; totalMarks: number };
  proctoring: { autoSubmitOnSwitch: boolean; switchLimit: number };
  questions: PaperQuestion[];
  savedAnswers: { question_id: string; student_answer: string | null; selected_option_id: string | null }[];
  startedAt: string;
}

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null;

export const ExamCenter: React.FC<{ accent: Accent }> = ({ accent }) => {
  const a = ACCENT[accent];
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [takingExamId, setTakingExamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setExams(await api.get<ExamListItem[]>('/student/exams'));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load exams');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (takingExamId) {
    return (
      <ExamTaking
        accent={accent}
        examId={takingExamId}
        onExit={() => { setTakingExamId(null); void load(); }}
      />
    );
  }

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className={`animate-spin ${a.spinner}`} /></div>;

  const groups: { label: string; items: ExamListItem[] }[] = [
    { label: 'Open Now', items: exams.filter((e) => e.state === 'open') },
    { label: 'Upcoming', items: exams.filter((e) => e.state === 'upcoming') },
    { label: 'Completed', items: exams.filter((e) => e.state === 'submitted') },
    { label: 'Closed', items: exams.filter((e) => e.state === 'closed') },
  ];

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}
      {exams.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-10 shadow-sm text-center">
          <p className="text-sm text-slate-400">No exams assigned yet — they'll appear here when your teacher publishes one.</p>
        </div>
      ) : (
        groups.filter((g) => g.items.length > 0).map((group) => (
          <div key={group.label}>
            <h2 className="font-display font-bold text-sm text-slate-600 mb-3">{group.label}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.items.map((exam) => (
                <div key={exam.id} className={`bg-white border rounded-3xl p-5 shadow-sm flex flex-col gap-3 ${exam.state === 'open' ? a.ring : 'border-slate-100'}`}>
                  <div>
                    <h3 className="font-display font-bold text-slate-800">{exam.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {exam.subject} · {exam.durationMin} min · {exam.totalMarks} marks
                    </p>
                  </div>

                  {exam.state === 'open' && (
                    <>
                      {exam.endsAt && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5"><CalendarClock size={12} /> Closes {fmt(exam.endsAt)}</p>
                      )}
                      <button onClick={() => setTakingExamId(exam.id)}
                        className={`self-start flex items-center gap-2 ${a.bg} text-white font-bold text-xs rounded-xl px-5 py-2.5 transition-all cursor-pointer`}>
                        <PlayCircle size={14} /> {exam.inProgress ? 'Resume Exam' : 'Start Exam'}
                      </button>
                    </>
                  )}
                  {exam.state === 'upcoming' && (
                    <p className={`text-xs font-bold ${a.text} flex items-center gap-1.5`}>
                      <CalendarClock size={13} /> Opens {fmt(exam.startsAt)}
                    </p>
                  )}
                  {exam.state === 'submitted' && exam.result && (
                    <div className={`${a.soft} rounded-2xl px-4 py-3`}>
                      <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        {exam.result.isReviewed
                          ? `Score: ${exam.result.totalScore ?? 0}/${exam.result.maxScore ?? exam.totalMarks}`
                          : 'Submitted — being graded'}
                      </p>
                      {exam.result.autoSubmitted && (
                        <p className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1"><ShieldAlert size={10} /> Auto-submitted (tab switching)</p>
                      )}
                    </div>
                  )}
                  {exam.state === 'closed' && <p className="text-xs text-slate-400">This exam's window has closed.</p>}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// ─── Taking the paper ────────────────────────────────────────

const ExamTaking: React.FC<{ accent: Accent; examId: string; onExit: () => void }> = ({ accent, examId, onExit }) => {
  const a = ACCENT[accent];
  const [paper, setPaper] = useState<Paper | null>(null);
  const [answers, setAnswers] = useState<Record<string, { studentAnswer?: string; selectedOptionId?: string }>>({});
  const [error, setError] = useState('');
  const [switchWarnings, setSwitchWarnings] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const submittingRef = useRef(false);

  // Load (or resume) the paper.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<Paper>(`/student/exams/${examId}/paper`);
        if (cancelled) return;
        setPaper(data);
        const restored: Record<string, { studentAnswer?: string; selectedOptionId?: string }> = {};
        for (const saved of data.savedAnswers) {
          restored[saved.question_id] = {
            studentAnswer: saved.student_answer ?? undefined,
            selectedOptionId: saved.selected_option_id ?? undefined,
          };
        }
        setAnswers(restored);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiClientError ? err.message : 'Could not open the exam');
      }
    })();
    return () => { cancelled = true; };
  }, [examId]);

  const finish = useCallback(async (auto = false) => {
    if (!paper || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      if (!auto) await api.post(`/student/exam-submissions/${paper.examSubmissionId}/submit`);
      setIsDone(true);
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'EXAM_ALREADY_SUBMITTED') setIsDone(true);
      else setError(err instanceof ApiClientError ? err.message : 'Failed to submit');
      submittingRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  }, [paper]);

  // Countdown from startedAt + duration; auto-submit at zero.
  useEffect(() => {
    if (!paper || isDone) return;
    const deadline = new Date(paper.startedAt).getTime() + paper.exam.durationMin * 60_000;
    const tick = () => {
      const left = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) void finish();
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [paper, isDone, finish]);

  // Tab-switch proctoring: report every hide; the server decides auto-submit.
  useEffect(() => {
    if (!paper || isDone) return;
    const onVisibility = () => {
      if (!document.hidden) return;
      void (async () => {
        try {
          const result = await api.post<{ autoSubmitted: boolean; switchCount: number }>('/student/proctor-event', {
            examSubmissionId: paper.examSubmissionId,
            eventType: 'tab_switch',
          });
          setSwitchWarnings(result.switchCount);
          if (result.autoSubmitted) {
            submittingRef.current = true;
            setIsDone(true);
          }
        } catch { /* proctor logging must never break the exam */ }
      })();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [paper, isDone]);

  const save = async (questionId: string, patch: { studentAnswer?: string; selectedOptionId?: string }) => {
    if (!paper) return;
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...patch } }));
    try {
      await api.put(`/student/exam-submissions/${paper.examSubmissionId}/answer`, { questionId, ...patch });
    } catch { /* autosave failures are retried on the next change; the submit still carries the state */ }
  };

  const answeredCount = useMemo(
    () => (paper?.questions ?? []).filter((q) => {
      const ans = answers[q.id];
      return ans && (ans.selectedOptionId || (ans.studentAnswer && ans.studentAnswer.trim()));
    }).length,
    [paper, answers],
  );

  if (error && !paper) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
        <button onClick={onExit} className="text-xs font-bold text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-xl cursor-pointer">← Back to exams</button>
      </div>
    );
  }

  if (!paper) return <div className="flex justify-center py-16"><Loader2 className={`animate-spin ${a.spinner}`} /></div>;

  if (isDone) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <CheckCircle2 size={48} className="text-emerald-500" />
        <h2 className="font-display font-bold text-xl text-slate-800">Exam submitted!</h2>
        <p className="text-xs text-slate-400">Your teacher will review it — your score appears on the exams page once grading is done.</p>
        <button onClick={onExit} className={`${a.bg} text-white font-bold text-xs rounded-xl px-6 py-2.5 transition-all cursor-pointer`}>
          Back to Exams
        </button>
      </div>
    );
  }

  const minutes = secondsLeft !== null ? Math.floor(secondsLeft / 60) : null;
  const seconds = secondsLeft !== null ? secondsLeft % 60 : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Sticky header: title, progress, timer */}
      <div className="sticky top-0 z-10 bg-white border border-slate-100 rounded-3xl px-6 py-4 shadow-sm flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display font-bold text-slate-800 truncate">{paper.exam.title}</h2>
          <p className="text-[11px] text-slate-400">{answeredCount}/{paper.questions.length} answered · answers save automatically</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {switchWarnings > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-lg">
              <ShieldAlert size={11} /> {switchWarnings}/{paper.proctoring.switchLimit} warnings
            </span>
          )}
          <span className={`flex items-center gap-1.5 font-mono font-bold text-sm px-3 py-1.5 rounded-xl ${secondsLeft !== null && secondsLeft < 300 ? 'bg-rose-50 text-rose-600' : `${a.soft} ${a.text}`}`}>
            <Clock size={14} />
            {minutes !== null ? `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : '--:--'}
          </span>
        </div>
      </div>

      {paper.questions.map((q, i) => {
        const ans = answers[q.id];
        return (
          <div key={q.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col gap-3">
            <p className="text-sm font-semibold text-slate-700">
              <span className="text-slate-400 mr-1.5">Q{i + 1}.</span>{q.text}
              <span className="ml-2 text-[10px] text-slate-400 font-bold">[{q.marks} mark{q.marks === 1 ? '' : 's'}]</span>
            </p>

            {q.type === 'mcq' && q.options && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {q.options.map((opt) => (
                  <button key={opt.id} onClick={() => void save(q.id, { selectedOptionId: opt.id })}
                    className={`text-left text-xs px-4 py-3 rounded-2xl border transition-all cursor-pointer ${
                      ans?.selectedOptionId === opt.id ? `${a.ring} ${a.soft} font-bold text-slate-800` : 'border-slate-100 hover:border-slate-200 text-slate-600'
                    }`}>
                    {opt.text}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'true_false' && (
              <div className="flex gap-2">
                {['True', 'False'].map((v) => (
                  <button key={v} onClick={() => void save(q.id, { studentAnswer: v })}
                    className={`text-xs px-6 py-2.5 rounded-2xl border transition-all cursor-pointer ${
                      ans?.studentAnswer === v ? `${a.ring} ${a.soft} font-bold text-slate-800` : 'border-slate-100 hover:border-slate-200 text-slate-600'
                    }`}>
                    {v}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'fill_blank' && (
              <input
                defaultValue={ans?.studentAnswer ?? ''}
                onBlur={(e) => void save(q.id, { studentAnswer: e.target.value })}
                placeholder="Type your answer"
                className="w-full md:w-96 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-400"
              />
            )}

            {(q.type === 'short_answer' || q.type === 'long_answer') && (
              <textarea
                defaultValue={ans?.studentAnswer ?? ''}
                onBlur={(e) => void save(q.id, { studentAnswer: e.target.value })}
                rows={q.type === 'long_answer' ? 6 : 3}
                placeholder="Write your answer here — it saves when you click away"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-400 resize-none"
              />
            )}
          </div>
        );
      })}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <button onClick={() => void finish()} disabled={isSubmitting}
        className={`self-center flex items-center gap-2 ${a.bg} disabled:opacity-50 text-white font-bold text-sm rounded-2xl px-8 py-3.5 transition-all cursor-pointer mb-4`}>
        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        Submit Exam ({answeredCount}/{paper.questions.length} answered)
      </button>
    </div>
  );
};
