import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, Trophy, ClipboardCheck, Bot, ShieldAlert } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

interface SubmissionRow {
  id: string;
  student_id: string;
  submitted_at: string;
  total_score: number | null;
  max_score: number | null;
  is_reviewed: boolean;
  auto_submitted: boolean;
  student_profiles: { user_profiles: { full_name: string } | { full_name: string }[] } | null;
}

interface AnswerRow {
  id: string;
  student_answer: string | null;
  selected_option_id: string | null;
  is_correct: boolean | null;
  auto_score: number | null;
  ai_score: number | null;
  ai_feedback: string | null;
  ai_covered_points: string[] | null;
  ai_missing_points: string[] | null;
  final_score: number | null;
  teacher_note: string | null;
  questions: { text: string; type: string; marks: number; rubric: string | null } | { text: string; type: string; marks: number; rubric: string | null }[] | null;
}

interface SubmissionDetail {
  submission: SubmissionRow;
  answers: AnswerRow[];
}

interface MeritRow {
  rank: number;
  studentId: string;
  fullName: string;
  totalScore: number | null;
  maxScore: number | null;
  percentage: number;
  isReviewed: boolean;
  passed: boolean;
}

const studentName = (s: SubmissionRow): string => {
  const up = s.student_profiles?.user_profiles;
  if (!up) return 'Student';
  return Array.isArray(up) ? (up[0]?.full_name ?? 'Student') : up.full_name;
};

const questionOf = (a: AnswerRow) => (Array.isArray(a.questions) ? a.questions[0] : a.questions);

export const TeacherExamReview: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const [tab, setTab] = useState<'submissions' | 'merit'>('submissions');
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [merit, setMerit] = useState<MeritRow[] | null>(null);
  const [cutoff, setCutoff] = useState(33);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadSubmissions = useCallback(async () => {
    if (!examId) return;
    setIsLoading(true);
    try {
      setSubmissions(await api.get<SubmissionRow[]>(`/teacher/exams/${examId}/submissions`));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  }, [examId]);

  useEffect(() => { void loadSubmissions(); }, [loadSubmissions]);

  const openDetail = async (submissionId: string) => {
    setError('');
    try {
      setDetail(await api.get<SubmissionDetail>(`/teacher/exams/${examId}/submissions/${submissionId}`));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to open submission');
    }
  };

  const loadMerit = async (cutoffPct: number) => {
    setError('');
    try {
      setMerit(await api.get<MeritRow[]>(`/teacher/exams/${examId}/merit-list`, { cutoffPct }));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load merit list');
    }
  };

  const saveScore = async (answerId: string, finalScore: number, teacherNote: string) => {
    setError('');
    try {
      await api.put(`/teacher/exams/${examId}/answers/${answerId}/score`, {
        finalScore,
        teacherNote: teacherNote || undefined,
      });
      setNotice('Score saved.');
      if (detail) await openDetail(detail.submission.id);
      await loadSubmissions();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to save score');
    }
  };

  const pendingReview = submissions.filter((s) => !s.is_reviewed).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link to="/teacher/create-exam" className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600">
          <ArrowLeft size={14} /> Back to Exams
        </Link>
        <div className="flex gap-2">
          <button onClick={() => setTab('submissions')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${tab === 'submissions' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            <ClipboardCheck size={13} /> Submissions {pendingReview > 0 && <span className="bg-amber-400 text-amber-900 rounded-md px-1.5">{pendingReview}</span>}
          </button>
          <button onClick={() => { setTab('merit'); if (!merit) void loadMerit(cutoff); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${tab === 'merit' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            <Trophy size={13} /> Merit List
          </button>
        </div>
      </div>

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

      {tab === 'submissions' && (
        detail ? (
          <SubmissionReview detail={detail} onBack={() => setDetail(null)} onSave={saveScore} />
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h2 className="font-display font-bold text-lg text-slate-800 mb-4">Submissions ({submissions.length})</h2>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-400" /></div>
            ) : submissions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No submissions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-400 font-label-caps text-[9px] border-b border-slate-100">
                      <th className="pb-2">Student</th><th className="pb-2">Submitted</th><th className="pb-2">Score</th><th className="pb-2">Review</th><th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => (
                      <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer" onClick={() => void openDetail(s.id)}>
                        <td className="py-2.5 font-semibold text-slate-700">
                          {studentName(s)}
                          {s.auto_submitted && (
                            <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">
                              <ShieldAlert size={9} /> AUTO-SUBMITTED
                            </span>
                          )}
                        </td>
                        <td className="py-2.5">{new Date(s.submitted_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="py-2.5 font-bold">{s.total_score ?? '—'}/{s.max_score ?? '—'}</td>
                        <td className="py-2.5">
                          {s.is_reviewed
                            ? <span className="text-emerald-600 font-bold">Complete</span>
                            : <span className="text-amber-600 font-bold">Needs review</span>}
                        </td>
                        <td className="py-2.5 text-right text-indigo-500 font-bold">Open →</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      )}

      {tab === 'merit' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-slate-800">Merit List</h2>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Pass cutoff %</label>
              <input type="number" min={0} max={100} value={cutoff} onChange={(e) => setCutoff(Number(e.target.value))}
                className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none" />
              <button onClick={() => void loadMerit(cutoff)} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-xl cursor-pointer">
                Apply
              </button>
              <button onClick={() => window.print()} className="text-xs font-bold text-slate-500 hover:bg-slate-100 px-3 py-2 rounded-xl cursor-pointer">
                Print
              </button>
            </div>
          </div>
          {merit === null ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-400" /></div>
          ) : merit.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No graded submissions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-400 font-label-caps text-[9px] border-b border-slate-100">
                    <th className="pb-2">Rank</th><th className="pb-2">Student</th><th className="pb-2">Score</th><th className="pb-2">%</th><th className="pb-2">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {merit.map((r) => (
                    <tr key={r.studentId} className="border-b border-slate-50">
                      <td className="py-2.5 font-display font-bold text-slate-800">
                        {r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : `#${r.rank}`}
                      </td>
                      <td className="py-2.5 font-semibold text-slate-700">
                        {r.fullName}
                        {!r.isReviewed && <span className="ml-2 text-[9px] font-bold text-amber-500">PENDING REVIEW</span>}
                      </td>
                      <td className="py-2.5">{r.totalScore ?? 0}/{r.maxScore ?? 0}</td>
                      <td className="py-2.5 font-bold">{r.percentage}%</td>
                      <td className="py-2.5">
                        {r.passed ? <span className="text-emerald-600 font-bold">PASS</span> : <span className="text-rose-500 font-bold">FAIL</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── One submission: answer-by-answer review ─────────────────

const SubmissionReview: React.FC<{
  detail: SubmissionDetail;
  onBack: () => void;
  onSave: (answerId: string, finalScore: number, note: string) => Promise<void>;
}> = ({ detail, onBack, onSave }) => {
  const name = studentName(detail.submission);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 cursor-pointer"><ArrowLeft size={16} /></button>
          <div>
            <h2 className="font-display font-bold text-lg text-slate-800">{name}</h2>
            <p className="text-xs text-slate-400">
              Score {detail.submission.total_score ?? '—'}/{detail.submission.max_score ?? '—'}
              {detail.submission.is_reviewed ? ' · fully reviewed' : ' · review pending'}
            </p>
          </div>
        </div>
      </div>

      {detail.answers.map((a, i) => {
        const q = questionOf(a);
        const isObjective = q?.type === 'mcq' || q?.type === 'true_false' || q?.type === 'fill_blank';
        return (
          <div key={a.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col gap-2.5">
            <p className="text-xs font-semibold text-slate-700">
              <span className="text-slate-400 mr-1.5">Q{i + 1}.</span>{q?.text}
              <span className="ml-2 text-[10px] text-slate-400 font-bold uppercase">{q?.type} · {q?.marks} mark{(q?.marks ?? 1) === 1 ? '' : 's'}</span>
            </p>
            <div className="bg-slate-50 rounded-xl px-3.5 py-2.5 text-xs text-slate-700">
              <span className="text-[9px] font-label-caps text-slate-400 tracking-wider block mb-1">STUDENT'S ANSWER</span>
              {a.student_answer ?? (a.selected_option_id ? `Option "${a.selected_option_id.toUpperCase()}"` : <span className="text-slate-400">Not answered</span>)}
            </div>

            {isObjective ? (
              <p className="text-xs font-bold">
                {a.is_correct === true && <span className="text-emerald-600">✓ Correct — {a.auto_score} mark{Number(a.auto_score) === 1 ? '' : 's'} (auto-graded)</span>}
                {a.is_correct === false && <span className="text-rose-500">✗ Incorrect — 0 marks (auto-graded)</span>}
                {a.is_correct === null && <span className="text-slate-400">Not auto-gradable</span>}
              </p>
            ) : (
              <SubjectiveScorer answer={a} maxMarks={q?.marks ?? 1} onSave={onSave} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const SubjectiveScorer: React.FC<{
  answer: AnswerRow;
  maxMarks: number;
  onSave: (answerId: string, finalScore: number, note: string) => Promise<void>;
}> = ({ answer, maxMarks, onSave }) => {
  const [score, setScore] = useState<string>(answer.final_score !== null ? String(answer.final_score) : answer.ai_score !== null ? String(answer.ai_score) : '');
  const [note, setNote] = useState(answer.teacher_note ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const value = Number(score);
    if (Number.isNaN(value) || value < 0 || value > maxMarks) return;
    setIsSaving(true);
    try {
      await onSave(answer.id, value, note);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      {answer.ai_score !== null && (
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl px-3.5 py-2.5">
          <p className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
            <Bot size={13} /> AI suggested: {answer.ai_score}/{maxMarks}
          </p>
          {answer.ai_feedback && <p className="text-[11px] text-indigo-600/80 mt-1">{answer.ai_feedback}</p>}
          {(answer.ai_covered_points?.length ?? 0) > 0 && (
            <p className="text-[10px] text-emerald-600 mt-1">Covered: {answer.ai_covered_points!.join('; ')}</p>
          )}
          {(answer.ai_missing_points?.length ?? 0) > 0 && (
            <p className="text-[10px] text-rose-500 mt-0.5">Missing: {answer.ai_missing_points!.join('; ')}</p>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="text-xs text-slate-500 font-bold">Final score</label>
        <input type="number" min={0} max={maxMarks} step={0.5} value={score} onChange={(e) => setScore(e.target.value)}
          className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-400" />
        <span className="text-xs text-slate-400">/ {maxMarks}</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note to the audit log (optional)"
          className="flex-1 min-w-48 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-400" />
        <button onClick={() => void handleSave()} disabled={isSaving || score === ''}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl px-4 py-2 transition-all cursor-pointer">
          {isSaving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
          {answer.final_score !== null ? 'Update' : 'Confirm'}
        </button>
        {answer.final_score !== null && <span className="text-[10px] font-bold text-emerald-600">✓ Finalized: {answer.final_score}</span>}
      </div>
    </div>
  );
};
