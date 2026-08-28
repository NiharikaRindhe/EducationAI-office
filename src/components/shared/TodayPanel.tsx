import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Radio, Hand, Loader2, ArrowRight, ClipboardList, FileEdit, MonitorSmartphone, Ban, CalendarClock, AlertTriangle } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

// The first real answer to "what should I do this period?" — surfaces the
// live session join button (previously unreachable from the student UI at
// all), plus a preview of pending tasks and open exams. Sits at the top of
// every batch's Home page.

type Accent = 'amber' | 'indigo' | 'sky';

const ACCENT = {
  amber: { bg: 'bg-amber-500 hover:bg-amber-600', soft: 'bg-amber-50 border-amber-200 text-amber-700', ring: 'text-amber-500', spinner: 'text-amber-400' },
  indigo: { bg: 'bg-indigo-600 hover:bg-indigo-700', soft: 'bg-indigo-50 border-indigo-200 text-indigo-700', ring: 'text-indigo-500', spinner: 'text-indigo-400' },
  sky: { bg: 'bg-sky-500 hover:bg-sky-600', soft: 'bg-sky-50 border-sky-200 text-sky-700', ring: 'text-sky-500', spinner: 'text-sky-400' },
} as const;

interface ActiveSession {
  id: string;
  subject: string | null;
  started_at: string;
  teacher_profiles: { user_profiles: { full_name: string } | { full_name: string }[] } | null;
}

interface TaskAssignment {
  id: string;
  status: 'not_started' | 'in_progress' | 'in_review' | 'completed';
  tasks: { title: string; subject: string };
}

interface ExamListItem {
  id: string;
  title: string;
  subject: string;
  state: 'upcoming' | 'open' | 'submitted' | 'closed';
}

interface Occurrence {
  date: string;
  periodNo: number;
  startsAt: string;
  endsAt: string;
  subject: string;
  teacherName: string | null;
  labName: string | null;
  status: 'scheduled' | 'cancelled' | 'rescheduled_out' | 'rescheduled_in';
  reason?: string | null;
  movedTo?: { date: string; periodNo: number } | null;
  movedFrom?: string | null;
}

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const shortTime = (t: string) => t.slice(0, 5);

const teacherName = (s: ActiveSession): string => {
  const up = s.teacher_profiles?.user_profiles;
  if (!up) return 'your teacher';
  return Array.isArray(up) ? (up[0]?.full_name ?? 'your teacher') : up.full_name;
};

export const TodayPanel: React.FC<{ accent: Accent; tasksHref?: string; examsHref: string; hideTasks?: boolean }> = ({ accent, tasksHref, examsHref, hideTasks = false }) => {
  const a = ACCENT[accent];
  const [session, setSession] = useState<ActiveSession | null | undefined>(undefined);
  const [hasJoined, setHasJoined] = useState(false);
  const [raisedHand, setRaisedHand] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  // Joining a lab session by code. Needed because a lab period can draw
  // students from more than one section, so the automatic "your section is
  // live" lookup above will not find it for everyone in the room.
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isJoiningByCode, setIsJoiningByCode] = useState(false);
  const [tasks, setTasks] = useState<TaskAssignment[] | null>(null);
  const [exams, setExams] = useState<ExamListItem[] | null>(null);
  const [periods, setPeriods] = useState<Occurrence[] | null>(null);
  // Held separately from "still loading" (tasks/exams === null) on purpose —
  // a fetch failure used to leave the data null forever, which rendered the
  // exact same spinner as a request that just hasn't returned yet.
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [examsError, setExamsError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const pollSession = useCallback(async () => {
    try {
      const active = await api.get<ActiveSession | null>('/student/sessions/active');
      setSession(active);
      if (!active) setHasJoined(false);
    } catch {
      /* transient poll failure — keep last known state */
    }
  }, []);

  useEffect(() => {
    void pollSession();
    if (!hideTasks) {
    void (async () => {
      try {
        setTasks(await api.get<TaskAssignment[]>('/student/tasks'));
      } catch (err) {
        setTasksError(err instanceof Error ? err.message : 'Could not load tasks.');
      }
    })();
    }
    void (async () => {
      try {
        setExams(await api.get<ExamListItem[]>('/student/exams'));
      } catch (err) {
        setExamsError(err instanceof Error ? err.message : 'Could not load exams.');
      }
    })();
    void (async () => {
      try {
        const today = todayStr();
        setPeriods(await api.get<Occurrence[]>('/student/timetable/occurrences', { from: today, to: today }));
      } catch { setPeriods([]); }
    })();

    pollRef.current = window.setInterval(() => void pollSession(), 15_000);
    return () => { if (pollRef.current !== null) window.clearInterval(pollRef.current); };
  }, [pollSession]);

  const handleJoin = async () => {
    if (!session) return;
    setIsJoining(true);
    try {
      const participant = await api.post<{ raised_hand: boolean }>('/student/sessions/join', { sessionId: session.id });
      setHasJoined(true);
      setRaisedHand(participant.raised_hand);
    } catch (err) {
      if (err instanceof ApiClientError) setHasJoined(false);
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setCodeError('');
    setIsJoiningByCode(true);
    try {
      await api.post('/student/sessions/join-by-code', { code: trimmed });
      setCode('');
      // Re-poll rather than trusting the response: this makes the banner and
      // the hand-raise button come from one source of truth.
      await pollSession();
      setHasJoined(true);
    } catch (err) {
      setCodeError(err instanceof ApiClientError ? err.message : 'Could not join that session');
    } finally {
      setIsJoiningByCode(false);
    }
  };

  const toggleHand = async () => {
    if (!session) return;
    const next = !raisedHand;
    setRaisedHand(next);
    try {
      await api.patch(`/student/sessions/${session.id}/raise-hand`, { raised: next });
    } catch {
      setRaisedHand(!next); // revert on failure
    }
  };

  const pendingTasks = (tasks ?? []).filter((t) => t.status !== 'completed').slice(0, 3);
  const openExams = (exams ?? []).filter((e) => e.state === 'open');

  const todaysPeriods = (periods ?? []).filter((p) => p.status !== 'rescheduled_out');

  return (
    <div className="flex flex-col gap-4">
      {/* Today's lab periods — driven by the school's timetable, including any rescheduling */}
      {periods !== null && todaysPeriods.length > 0 && (
        <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-3">
          <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
            <CalendarClock size={15} className={a.ring} /> Today's Lab Periods
          </h3>
          <div className="flex flex-col gap-2">
            {todaysPeriods.map((p, i) => (
              <div
                key={i}
                className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 border ${
                  p.status === 'cancelled' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-display font-black text-slate-400 text-xs w-6 text-center shrink-0">P{p.periodNo}</span>
                  <div className="min-w-0">
                    <span className={`block text-xs font-bold truncate ${p.status === 'cancelled' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {p.subject}
                    </span>
                    <span className="block text-[10px] text-slate-400 truncate">
                      {shortTime(p.startsAt)}–{shortTime(p.endsAt)}
                      {p.labName ? ` · ${p.labName}` : ''}
                      {p.teacherName ? ` · ${p.teacherName}` : ''}
                    </span>
                  </div>
                </div>
                {p.status === 'cancelled' ? (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full shrink-0">
                    <Ban size={10} /> Cancelled
                  </span>
                ) : p.status === 'rescheduled_in' ? (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-full shrink-0">
                    <MonitorSmartphone size={10} /> Moved here
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lab session code entry. Only shown when nothing is already live for
          this student's own section — if their class is live, the banner below
          is the shorter path and two join controls would just confuse. */}
      {session === null && (
        <form onSubmit={handleJoinByCode} className="rounded-3xl border border-slate-100 bg-white p-5 flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-sm text-slate-800">In a lab right now?</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Type the session code your teacher has on the board to join.
            </p>
            {codeError && <p className="text-[11px] font-semibold text-rose-600 mt-1">{codeError}</p>}
          </div>
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setCodeError(''); }}
            placeholder="ABC123"
            maxLength={8}
            aria-label="Session code"
            className="w-32 rounded-xl border border-slate-200 px-3 py-2.5 text-center font-mono text-lg font-bold tracking-[0.15em] text-slate-800 outline-none uppercase placeholder:text-slate-300 placeholder:tracking-normal placeholder:text-sm focus:border-indigo-400"
          />
          <button
            type="submit"
            disabled={isJoiningByCode || !code.trim()}
            className={`flex items-center gap-2 ${a.bg} disabled:opacity-40 text-white font-bold text-xs rounded-xl px-5 py-2.5 transition-all cursor-pointer shrink-0`}
          >
            {isJoiningByCode ? <Loader2 size={14} className="animate-spin" /> : <Radio size={14} />} Join
          </button>
        </form>
      )}

      {/* Live session banner */}
      {session && (
        <div className={`rounded-3xl p-5 border flex items-center justify-between gap-4 ${a.soft}`}>
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <div>
              <p className="font-display font-bold text-sm">
                Class is live now{session.subject ? ` — ${session.subject}` : ''}
              </p>
              <p className="text-[11px] opacity-70">with {teacherName(session)}</p>
            </div>
          </div>
          {!hasJoined ? (
            <button onClick={() => void handleJoin()} disabled={isJoining}
              className={`flex items-center gap-2 ${a.bg} disabled:opacity-50 text-white font-bold text-xs rounded-xl px-5 py-2.5 transition-all cursor-pointer shrink-0`}>
              {isJoining ? <Loader2 size={14} className="animate-spin" /> : <Radio size={14} />} Join Class
            </button>
          ) : (
            <button onClick={() => void toggleHand()}
              className={`flex items-center gap-2 font-bold text-xs rounded-xl px-5 py-2.5 transition-all cursor-pointer shrink-0 ${
                raisedHand ? 'bg-amber-400 text-amber-950' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}>
              <Hand size={14} /> {raisedHand ? "Hand Raised — I'm Stuck" : 'Raise Hand'}
            </button>
          )}
        </div>
      )}

      <div className={`grid grid-cols-1 ${hideTasks ? '' : 'md:grid-cols-2'} gap-4`}>
        {/* Tasks preview */}
        {!hideTasks && tasksHref && (
        <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
              <ClipboardList size={15} className={a.ring} /> Pending Tasks
            </h3>
            <Link to={tasksHref} className="text-[11px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-0.5">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          {tasksError ? (
            <p className="flex items-start gap-1.5 text-[11px] font-semibold text-rose-600">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" /> {tasksError}
            </p>
          ) : tasks === null ? (
            <Loader2 size={14} className={`animate-spin ${a.spinner}`} />
          ) : pendingTasks.length === 0 ? (
            <p className="text-xs text-slate-400">All caught up — no pending tasks.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {pendingTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-2 bg-slate-50 rounded-xl px-3 py-2">
                  <span className="text-xs font-semibold text-slate-700 truncate">{t.tasks.title}</span>
                  <span className="text-[9px] font-bold text-slate-400 shrink-0">{t.tasks.subject}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Exams preview */}
        <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
              <FileEdit size={15} className={a.ring} /> Open Exams
            </h3>
            <Link to={examsHref} className="text-[11px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-0.5">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          {examsError ? (
            <p className="flex items-start gap-1.5 text-[11px] font-semibold text-rose-600">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" /> {examsError}
            </p>
          ) : exams === null ? (
            <Loader2 size={14} className={`animate-spin ${a.spinner}`} />
          ) : openExams.length === 0 ? (
            <p className="text-xs text-slate-400">Nothing open right now.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {openExams.slice(0, 3).map((e) => (
                <Link key={e.id} to={examsHref} className="flex items-center justify-between gap-2 bg-slate-50 hover:bg-slate-100 rounded-xl px-3 py-2 transition-all">
                  <span className="text-xs font-semibold text-slate-700 truncate">{e.title}</span>
                  <span className="text-[9px] font-bold text-slate-400 shrink-0">{e.subject}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
