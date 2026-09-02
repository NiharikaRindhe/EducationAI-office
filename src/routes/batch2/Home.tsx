import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Bot, ClipboardCheck, Compass, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { TodayPanel } from '../../components/shared/TodayPanel';
import { activitiesForClass } from '../../data/activities';

const dayLabel = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long', day: 'numeric', month: 'long',
}).format(new Date());

export const Batch2Home: React.FC = () => {
  const { studentName, currentClass } = useApp();
  const { hasFeature } = useAuth();
  const classActivities = activitiesForClass(currentClass);
  const shortcuts = [
    { to: '/batch2/activities', label: 'Chapter activities', description: `${classActivities.length} guided practices for Class ${currentClass}`, icon: Compass, iconClass: 'bg-sky-50 text-sky-700' },
    ...(hasFeature('ai_tutor') ? [{ to: '/batch2/chat', label: 'Doubt tutor', description: 'Get help using your school books', icon: Bot, iconClass: 'bg-cyan-50 text-cyan-700' }] : []),
    { to: '/batch2/exams', label: 'Exams & mocks', description: 'View assigned papers and results', icon: ClipboardCheck, iconClass: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <div className="flex flex-col gap-6 select-none anim-fade-up">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900 px-6 py-7 text-white shadow-xl shadow-slate-900/10 md:px-8 md:py-9">
        <div className="absolute inset-y-0 right-0 hidden w-[38%] border-l border-white/10 bg-sky-500/10 md:block" aria-hidden="true" />
        <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full border-[24px] border-sky-400/15" aria-hidden="true" />
        <div className="relative max-w-2xl">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300">{dayLabel} · Class {currentClass}</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">Good to see you, {studentName}.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Pick up where you left off, practise a chapter, or ask for help when a concept feels difficult.</p>
          <Link to="/batch2/activities" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 transition hover:bg-sky-300">Start learning <ArrowRight size={14} /></Link>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-700">Your workspace</p><h2 className="mt-1 font-display text-xl font-bold text-slate-900">What would you like to do?</h2></div>
          <span className="hidden text-xs text-slate-400 sm:block">Focused tools for Classes 5–8</span>
        </div>
        <div className={`grid gap-3 ${shortcuts.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {shortcuts.map((item) => (
            <Link key={item.to} to={item.to} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-4"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconClass}`}><item.icon size={20} /></span><ArrowRight size={16} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-sky-600" /></div>
              <h3 className="mt-5 font-display text-sm font-bold text-slate-900">{item.label}</h3><p className="mt-1 text-[11px] leading-5 text-slate-500">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <TodayPanel accent="sky" examsHref="/batch2/exams" hideTasks />
        <aside className="rounded-2xl border border-sky-100 bg-sky-50/60 p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm"><BookOpen size={17} /></span>
          <h3 className="mt-4 font-display text-sm font-bold text-slate-900">A simple study rhythm</h3>
          <p className="mt-2 text-[11px] leading-5 text-slate-600">Learn one idea, practise it, then explain it in your own words. Small sessions add up.</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-sky-700"><Sparkles size={12} /> Keep it consistent</div>
        </aside>
      </section>
    </div>
  );
};
