import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, BarChart3, Activity, Plus, Loader2, PenLine, CalendarClock, Ban, FlaskConical, ArrowRight, AlertTriangle, Radio, ClipboardCheck, Sparkles } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

interface TeachingSection {
  classSectionId: string;
  classNum: number;
  section: string;
  isClassTeacher: boolean;
}

interface MySections {
  sections: TeachingSection[];
}

interface ActiveSession {
  id: string;
  class_num: number;
  section: string;
}

interface PendingReview {
  exam_id: string;
  exam_title: string;
  pending_count: number;
}

interface DashboardStats {
  classesTaught: number[];
  totalStudents: number;
  tasksAssigned: number;
  examsCreated: number;
}

interface AtRiskStudent {
  id: string;
  fullName: string;
  classInfo: { class_num: number; section: string; streak: number; xp: number };
  risks: { type: string; label: string }[];
}

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [atRisk, setAtRisk] = useState<AtRiskStudent[] | null>(null);
  // Held separately from "still loading" — an unhandled fetch failure used to
  // leave stats/atRisk null forever, which looked identical to a permanent
  // loading spinner with no error and no way to retry.
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<DashboardStats>('/teacher/dashboard').then(setStats),
      api.get<AtRiskStudent[]>('/teacher/at-risk').then(setAtRisk),
    ]).catch((err) => setError(err instanceof Error ? err.message : 'Could not load your dashboard.'));
  }, []);

  const isLoading = !error && (!stats || !atRisk);

  const statCards = [
    {
      label: 'My Students',
      value: stats?.totalStudents.toString() ?? '—',
      hint: 'Across assigned sections',
      icon: Users,
      tone: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
      accent: 'bg-indigo-500',
    },
    {
      label: 'Classes Taught',
      value: stats?.classesTaught.join(', ') || '—',
      hint: 'Current class groups',
      icon: Activity,
      tone: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
      accent: 'bg-emerald-500',
    },
    {
      label: 'Exams Created',
      value: stats?.examsCreated.toString() ?? '—',
      hint: `${stats?.tasksAssigned ?? 0} tasks assigned`,
      icon: BarChart3,
      tone: 'bg-sky-50 text-sky-600 ring-sky-100',
      accent: 'bg-sky-500',
    },
    {
      label: 'Need Attention',
      value: atRisk ? String(atRisk.length) : '—',
      hint: 'Students currently flagged',
      icon: AlertTriangle,
      tone: 'bg-amber-50 text-amber-600 ring-amber-100',
      accent: 'bg-amber-500',
    },
  ];

  return (
    <div className="flex flex-col gap-5 select-none anim-fade-up">
      <section className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 px-6 py-5 text-white shadow-lg shadow-indigo-900/10">
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full border-[28px] border-white/10" aria-hidden="true" />
        <div className="relative flex items-center justify-between gap-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-100">
              <Sparkles size={13} /> Classroom command centre
            </div>
            <h2 className="font-display text-xl font-bold">Plan, teach and follow up from one place.</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-indigo-100">See today’s sessions, review student progress and take the next teaching action without leaving the dashboard.</p>
          </div>
          <div className="relative flex shrink-0 items-center gap-2">
            <Link to="/teacher/timetable" className="rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-white/20">
              View timetable
            </Link>
            <Link to="/teacher/create-exam" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 shadow-sm transition-transform hover:-translate-y-0.5">
              <Plus size={14} /> Create exam
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <span className={`absolute inset-x-0 top-0 h-1 ${card.accent}`} aria-hidden="true" />
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{card.label}</p>
                <p className="mt-2 truncate font-display text-2xl font-black text-slate-900">{isLoading ? '…' : card.value}</p>
                <p className="mt-1 truncate text-[11px] text-slate-400">{card.hint}</p>
              </div>
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${card.tone}`}>
                <card.icon size={19} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 items-start gap-5">
        <div className="col-span-8 flex flex-col gap-5">
          <ClassSignInCard />
          <TodayLabPeriodsStrip />

        <div className="bento-card border border-red-100 bg-white p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center select-none">
            <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center font-display font-bold text-[10px]">
                {atRisk?.length ?? 0}
              </span>
              Students Falling Behind
            </h3>
            <Link to="/teacher/students" className="text-xs font-bold text-indigo-600 hover:underline">
              See All Students
            </Link>
          </div>

          {error ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <AlertTriangle size={22} className="text-amber-500" strokeWidth={1.5} />
              <p className="text-[12px] font-semibold text-slate-600">Couldn't load this dashboard.</p>
              <p className="text-[11px] text-slate-400">{error}</p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300" /></div>
          ) : atRisk!.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No students flagged right now — nice work.</p>
          ) : (
            <div className="flex flex-col gap-3 font-sans text-xs">
              {atRisk!.map((stud) => (
                <div key={stud.id} className="p-3.5 bg-red-50/30 border border-red-100/50 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-white w-10 h-10 rounded-xl flex items-center justify-center border border-slate-100 select-none text-rose-600">
                      <AlertTriangle size={19} aria-hidden="true" />
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 block">{stud.fullName}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Class {stud.classInfo.class_num}-{stud.classInfo.section} · Streak: {stud.classInfo.streak}d
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 select-none">
                    <span className="badge pill-rose font-bold">{stud.risks.map((r) => r.label).join(' · ')}</span>
                    <button
                      onClick={() => navigate('/teacher/students')}
                      className="py-1 px-3 bg-red-600 hover:bg-red-700 text-white font-sans font-bold text-[10px] rounded-lg shadow-xs cursor-pointer transition-all"
                    >
                      View student
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>

        <aside className="col-span-4 flex flex-col gap-5">
        <NeedsGradingCard />

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><ClipboardCheck size={16} /></span>
            <div>
              <h3 className="font-display text-sm font-bold text-slate-800">Quick actions</h3>
              <p className="text-[11px] text-slate-400">Common teaching workflows</p>
            </div>
          </div>
          <div className="grid gap-2.5 select-none">
            <Link
              to="/teacher/create-exam"
              className="group flex w-full items-center justify-between rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/10 transition-all hover:bg-indigo-700"
            >
              <span className="flex items-center gap-2"><Plus size={14} /> Create exam</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/teacher/timetable"
              className="group flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 transition-all hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
            >
              <span className="flex items-center gap-2"><CalendarClock size={14} /> Open timetable</span>
              <ArrowRight size={14} className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500" />
            </Link>
          </div>
        </div>
        </aside>
      </div>
    </div>
  );
};

/* ── Today's lab periods strip ──────────────────────────────── */
interface Occurrence {
  periodNo: number;
  startsAt: string;
  endsAt: string;
  subject: string;
  classNum: number | null;
  sectionLabel: string | null;
  labName: string | null;
  status: 'scheduled' | 'cancelled' | 'rescheduled_out' | 'rescheduled_in';
}

const shortTime = (t: string) => t.slice(0, 5);
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const TodayLabPeriodsStrip: React.FC = () => {
  const [periods, setPeriods] = useState<Occurrence[] | null>(null);

  useEffect(() => {
    const today = todayStr();
    api.get<Occurrence[]>('/teacher/timetable/occurrences', { from: today, to: today })
      .then((rows) => setPeriods(rows.filter((r) => r.status !== 'rescheduled_out').sort((a, b) => a.periodNo - b.periodNo)))
      .catch(() => setPeriods([]));
  }, []);

  if (periods !== null && periods.length === 0) return null;

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><CalendarClock size={15} /></span>
            Today's lab periods
          </h3>
          <p className="ml-10 -mt-1 text-[11px] text-slate-400">Your practical sessions scheduled for today</p>
        </div>
        <Link to="/teacher/timetable" className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5">
          Full Timetable <ArrowRight size={12} />
        </Link>
      </div>
      {periods === null ? (
        <div className="flex justify-center py-5"><Loader2 size={14} className="animate-spin text-indigo-400" /></div>
      ) : (
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
          {periods.map((p, i) => (
            <div key={i} className={`min-w-0 rounded-xl border px-3.5 py-3 ${p.status === 'cancelled' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-gradient-to-br from-indigo-50/80 to-white border-indigo-100'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-indigo-400">P{p.periodNo} · {shortTime(p.startsAt)}–{shortTime(p.endsAt)}</span>
                {p.status === 'cancelled' && <Ban size={11} className="text-rose-400" />}
              </div>
              <span className={`block text-xs font-bold mt-0.5 truncate ${p.status === 'cancelled' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                Class {p.classNum}-{p.sectionLabel}
              </span>
              <span className="block text-[10px] text-slate-500 truncate">{p.subject}</span>
              {p.labName && (
                <span className="flex items-center gap-1 text-[10px] text-slate-400 truncate mt-0.5">
                  <FlaskConical size={10} /> {p.labName}
                </span>
              )}
              {/* Only lab periods route to the full Live Session page — its join
                  code/attendance register/raised-hands are built for a lab,
                  not a plain classroom period. Class 1-4 sign-in has its own
                  one-tap card above and doesn't need a period context. */}
              {p.status !== 'cancelled' && p.labName && (
                <Link to="/teacher/live-session" className="mt-1.5 inline-block text-[10px] font-bold text-indigo-600 hover:underline">
                  Start period
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Class 1-4 sign-in toggle ────────────────────────────────
 * Class 1-4 students can only log in with their PIN while a session is
 * active for their section (see Login.tsx). Starting one used to mean
 * opening the full lab-session form (subject/lab pickers, join code,
 * attendance register) — built for running an actual lab period, not for
 * "let my homeroom log in this morning." This gives a Class 1-4 class
 * teacher a single one-tap switch instead. It calls the exact same
 * start/end endpoints LiveSession.tsx uses, just without a subject or lab,
 * so nothing about session behavior changes — only how it's reached.
 * Teachers without a Class 1-4 homeroom section see nothing here.
 */
const ClassSignInCard: React.FC = () => {
  const [homeroom, setHomeroom] = useState<TeachingSection | null | undefined>(undefined);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [sections, active] = await Promise.all([
          api.get<MySections>('/teacher/my-sections'),
          api.get<ActiveSession | null>('/teacher/sessions/active'),
        ]);
        const c14 = sections.sections.find((s) => s.isClassTeacher && s.classNum >= 1 && s.classNum <= 4) ?? null;
        setHomeroom(c14);
        setSession(c14 && active && active.class_num === c14.classNum && active.section === c14.section ? active : null);
      } catch {
        setHomeroom(null);
      }
    })();
  }, []);

  const toggle = async () => {
    if (!homeroom) return;
    setBusy(true);
    setError('');
    try {
      if (session) {
        await api.post(`/teacher/sessions/${session.id}/end`);
        setSession(null);
      } else {
        const started = await api.post<ActiveSession>('/teacher/sessions/start', {
          classNum: homeroom.classNum,
          section: homeroom.section,
        });
        setSession(started);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not update class sign-in');
    } finally {
      setBusy(false);
    }
  };

  if (!homeroom) return null;

  return (
    <div className={`bento-card border p-5 flex items-center justify-between gap-4 flex-wrap ${
      session ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 bg-white'
    }`}>
      <div className="flex items-center gap-3">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${session ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
          <Radio size={16} />
        </span>
        <div>
          <h3 className="font-display font-bold text-xs text-slate-800">
            Class {homeroom.classNum}-{homeroom.section} sign-in
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {session
              ? 'Your students can log in with their PIN right now.'
              : 'Turn this on so your students can log in with their PIN.'}
          </p>
          {error && <p className="text-[11px] text-rose-600 mt-0.5">{error}</p>}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link to="/teacher/live-session" className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 hover:underline">
          Running a lab period instead?
        </Link>
        <button
          onClick={() => void toggle()}
          disabled={busy}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans font-bold text-xs transition-all cursor-pointer disabled:opacity-50 ${
            session ? 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : session ? 'Turn off' : 'Turn on'}
        </button>
      </div>
    </div>
  );
};

/* ── Needs Grading card ─────────────────────────────────────── */
const NeedsGradingCard: React.FC = () => {
  const [reviews, setReviews] = useState<PendingReview[] | null>(null);

  useEffect(() => {
    // Fetch submissions with pending subjective reviews
    api.get<PendingReview[]>('/teacher/pending-reviews')
      .then(setReviews)
      .catch(() => setReviews([]));
  }, []);

  const totalPending = (reviews ?? []).reduce((s, r) => s + r.pending_count, 0);

  return (
    <div className={`bento-card border p-5 flex flex-col gap-3 ${
      totalPending > 0 ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 bg-white'
    }`}>
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-xs text-slate-800 flex items-center gap-2">
          <PenLine size={14} className={totalPending > 0 ? 'text-amber-500' : 'text-slate-400'} />
          Needs Grading
        </h3>
        {totalPending > 0 && (
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-white">{totalPending} pending</span>
        )}
      </div>
      {reviews === null ? (
        <Loader2 size={14} className="animate-spin text-slate-300" />
      ) : reviews.length === 0 ? (
        <p className="text-xs text-slate-400">All submissions graded ✓</p>
      ) : (
        <div className="flex flex-col gap-2">
          {reviews.slice(0, 3).map(r => (
            <Link
              key={r.exam_id}
              to={`/teacher/exams/${r.exam_id}/review`}
              className="flex items-center justify-between text-xs bg-white border border-amber-100 rounded-xl px-3 py-2 hover:border-amber-300 transition-all"
            >
              <span className="font-semibold text-slate-700 truncate max-w-[150px]">{r.exam_title}</span>
              <span className="font-bold text-amber-600 shrink-0">{r.pending_count} left</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
