import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Beaker, Clock3, Files, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { TodayPanel } from '../../components/shared/TodayPanel';
import { api } from '../../lib/api';

interface ExamListItem { id: string; title: string; subject: string; duration: number; state: 'upcoming' | 'open' | 'submitted' | 'closed'; }
const dayLabel = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

export const Batch3Home: React.FC = () => {
  const { studentName, currentClass } = useApp();
  const { hasFeature } = useAuth();
  const [exams, setExams] = useState<ExamListItem[] | null>(null);
  useEffect(() => { api.get<ExamListItem[]>('/student/exams').then(setExams).catch(() => setExams([])); }, []);
  const nextExam = (exams ?? []).find((exam) => exam.state === 'open');
  const resources = [
    ...(hasFeature('virtual_labs') ? [{ to: '/batch3/labs', label: 'Science labs', detail: 'Run interactive experiments', icon: Beaker }] : []),
    { to: '/batch3/pyq', label: 'Past papers', detail: 'Review previous-year questions', icon: Files },
  ];

  return (
    <div className="flex flex-col gap-6 select-none anim-fade-up">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900 px-6 py-7 text-white shadow-xl shadow-slate-900/10 md:px-8 md:py-9">
        <div className="absolute right-0 top-0 h-full w-2/5 opacity-20" aria-hidden="true" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.14) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div className="max-w-2xl"><p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300">{dayLabel} · Class {currentClass}</p><h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">Your exam workspace.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Welcome back, {studentName}. Prioritise today’s paper, then strengthen one topic at a time.</p></div>
          <Link to="/batch3/exams" className="inline-flex w-fit items-center gap-2 rounded-xl bg-teal-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 transition hover:bg-teal-300">View exams <ArrowRight size={14} /></Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Priority</p><h2 className="mt-1 font-display text-lg font-bold text-slate-900">Next open exam</h2></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Clock3 size={18} /></span></div>
          {exams === null ? <div className="mt-6 flex items-center gap-2 text-xs text-slate-400"><Loader2 size={14} className="animate-spin" /> Checking assignments…</div> : nextExam ? (
            <div className="mt-5 flex flex-col gap-4 rounded-xl border border-teal-100 bg-teal-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-display text-sm font-bold text-slate-900">{nextExam.title}</p><p className="mt-1 text-[11px] text-slate-500">{nextExam.subject} · {nextExam.duration} minutes</p></div><Link to="/batch3/exams" className="inline-flex w-fit items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-[11px] font-bold text-white hover:bg-teal-800">Attempt now <ArrowRight size={12} /></Link></div>
          ) : <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-xs text-slate-500">No exam is open right now. Use the time for a focused revision session.</div>}
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-white shadow-sm md:p-6"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Study principle</p><p className="mt-4 font-display text-lg font-bold leading-7">Accuracy first.<br />Speed follows.</p><p className="mt-3 text-[11px] leading-5 text-slate-400">Review your method after every mock—not only the final score.</p></div>
      </section>

      <section>
        <div className="mb-3"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Study tools</p><h2 className="mt-1 font-display text-xl font-bold text-slate-900">Continue your preparation</h2></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {resources.map((item) => <Link key={item.to} to={item.to} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-teal-50 group-hover:text-teal-700"><item.icon size={18} /></span><ArrowRight size={15} className="text-slate-300 group-hover:text-teal-600" /></div><h3 className="mt-4 font-display text-sm font-bold text-slate-900">{item.label}</h3><p className="mt-1 text-[11px] text-slate-500">{item.detail}</p></Link>)}
        </div>
      </section>
      <TodayPanel accent="teal" examsHref="/batch3/exams" hideTasks />
    </div>
  );
};
