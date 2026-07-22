import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, BarChart3, ClipboardList, Activity, Plus, Loader2, PenLine, BookOpen, CalendarClock, Ban, FlaskConical, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';

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

  useEffect(() => {
    void api.get<DashboardStats>('/teacher/dashboard').then(setStats);
    void api.get<AtRiskStudent[]>('/teacher/at-risk').then(setAtRisk);
  }, []);

  const isLoading = !stats || !atRisk;

  return (
    <div className="grid grid-cols-12 gap-6 select-none anim-fade-up">
      <div className="col-span-12">
        <TodayLabPeriodsStrip />
      </div>

      {/* 4 Stat Cards */}
      <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'My Students', val: stats?.totalStudents.toString() ?? '—', icon: <Users size={20} />, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
          { label: 'Classes Taught', val: stats?.classesTaught.join(', ') || '—', icon: <Activity size={20} />, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Exams Created', val: stats?.examsCreated.toString() ?? '—', icon: <BarChart3 size={20} />, color: 'text-sky-600 bg-sky-50 border-sky-100' },
          { label: 'Tasks Assigned', val: stats?.tasksAssigned.toString() ?? '—', icon: <ClipboardList size={20} />, color: 'text-amber-600 bg-amber-50 border-amber-100' }
        ].map((card, idx) => (
          <div key={idx} className={`bento-card border p-5 flex items-center justify-between bg-white ${card.color}`}>
            <div>
              <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wide">{card.label}</span>
              <h4 className="font-display font-black text-2xl text-slate-800 mt-1">{isLoading ? '…' : card.val}</h4>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Left Column: at risk panel */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
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

          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300" /></div>
          ) : atRisk.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No students flagged right now — nice work.</p>
          ) : (
            <div className="flex flex-col gap-3 font-sans text-xs">
              {atRisk.map((stud) => (
                <div key={stud.id} className="p-3.5 bg-red-50/30 border border-red-100/50 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl bg-white w-10 h-10 rounded-xl flex items-center justify-center border border-slate-100 select-none">
                      ⚠️
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
                      onClick={() => navigate('/teacher/assign-tasks')}
                      className="py-1 px-3 bg-red-600 hover:bg-red-700 text-white font-sans font-bold text-[10px] rounded-lg shadow-xs cursor-pointer transition-all"
                    >
                      Assign Task
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Quick Actions + Needs Grading */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        {/* Needs Grading card */}
        <NeedsGradingCard />

        <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4 text-left">
          <span className="font-display font-bold text-xs text-slate-700">Quick Actions</span>

          <div className="flex flex-col gap-3 select-none">
            <Link
              to="/teacher/assign-tasks"
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs text-center shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus size={14} />
              Assign New Task
            </Link>
            <Link
              to="/teacher/create-exam"
              className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-sans font-bold text-xs text-center transition-all"
            >
              Create Mock Exam
            </Link>
            <Link
              to="/teacher/reports"
              className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-sans font-bold text-xs text-center transition-all"
            >
              View Class Reports
            </Link>
            <Link
              to="/teacher/question-bank"
              className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-sans font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5"
            >
              <BookOpen size={13} />
              Question Bank
            </Link>
          </div>
        </div>
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
    <div className="bento-card border border-indigo-100 bg-white p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-xs text-slate-700 flex items-center gap-2">
          <CalendarClock size={15} className="text-indigo-500" /> Today's Lab Periods
        </h3>
        <Link to="/teacher/timetable" className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5">
          Full Timetable <ArrowRight size={12} />
        </Link>
      </div>
      {periods === null ? (
        <div className="flex justify-center py-2"><Loader2 size={14} className="animate-spin text-indigo-400" /></div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {periods.map((p, i) => (
            <div key={i} className={`shrink-0 min-w-44 rounded-xl border px-3.5 py-2.5 ${p.status === 'cancelled' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-indigo-50/50 border-indigo-100'}`}>
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
            </div>
          ))}
        </div>
      )}
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
