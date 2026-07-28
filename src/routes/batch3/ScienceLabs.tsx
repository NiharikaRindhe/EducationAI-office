import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Atom, Beaker, BookOpenCheck, BrainCircuit, Dna, FlaskConical,
  Gauge, Microscope, Orbit, Sparkles, Waves,
} from 'lucide-react';

const subjects = [
  {
    title: 'Physics Lab',
    description: 'Test motion, forces, waves, circuits and optics with measurable, repeatable simulations.',
    href: '/batch3/labs/physics',
    icon: <Orbit size={25} />,
    tone: 'from-blue-600 to-cyan-500',
    soft: 'bg-blue-50 text-blue-700',
    experiments: ['Projectile motion', 'Friction', 'Sound waves', 'Circuits & optics'],
  },
  {
    title: 'Chemistry Lab',
    description: 'Explore elements, build compounds and understand reactions through guided experimentation.',
    href: '/batch3/labs/chemistry',
    icon: <FlaskConical size={25} />,
    tone: 'from-violet-600 to-fuchsia-500',
    soft: 'bg-violet-50 text-violet-700',
    experiments: ['Reaction lab', 'Periodic table', 'Formula builder', 'Atomic models'],
  },
  {
    title: 'Biology Lab',
    description: 'Study cells and NCERT diagrams with interactive models, labels and recall practice.',
    href: '/batch3/labs/biology',
    icon: <Dna size={25} />,
    tone: 'from-emerald-600 to-teal-500',
    soft: 'bg-emerald-50 text-emerald-700',
    experiments: ['Animal cell', 'Plant cell', 'Diagram hub', 'Cell sandbox'],
  },
];

const quickLabs = [
  { label: 'Motion simulator', href: '/batch3/labs/physics/motion', icon: <Gauge size={18} />, meta: 'Physics' },
  { label: 'Sound wave tank', href: '/batch3/labs/physics/sound', icon: <Waves size={18} />, meta: 'Physics' },
  { label: 'Periodic table', href: '/batch3/labs/chemistry/periodic-table', icon: <Atom size={18} />, meta: 'Chemistry' },
  { label: 'Diagram hub', href: '/batch3/labs/biology/diagram-hub', icon: <Microscope size={18} />, meta: 'Biology' },
];

export const Batch3ScienceLabs: React.FC = () => (
  <div className="flex flex-col gap-6">
    <section className="relative overflow-hidden rounded-[28px] bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 md:px-9">
      <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-violet-500/20 blur-2xl" />
      <div className="relative z-10 max-w-2xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-cyan-200">
          <Sparkles size={13} /> Class 9–10 Science Studio
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Learn science by doing it.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
          Run safe virtual experiments, change one variable at a time and connect every observation to the NCERT concept behind it.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold text-slate-300">
          <span className="inline-flex items-center gap-1.5"><BrainCircuit size={15} className="text-cyan-300" /> Interactive simulations</span>
          <span className="inline-flex items-center gap-1.5"><BookOpenCheck size={15} className="text-cyan-300" /> NCERT aligned</span>
          <span className="inline-flex items-center gap-1.5"><Beaker size={15} className="text-cyan-300" /> Instant observations</span>
        </div>
      </div>
    </section>

    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {subjects.map((subject) => (
        <Link key={subject.title} to={subject.href} className="group portal-panel flex flex-col p-5 transition duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${subject.soft}`}>{subject.icon}</div>
          <h2 className="mt-5 text-lg font-bold text-slate-900">{subject.title}</h2>
          <p className="mt-2 min-h-12 text-[13px] leading-5 text-slate-500">{subject.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {subject.experiments.map((experiment) => (
              <span key={experiment} className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-500">{experiment}</span>
            ))}
          </div>
          <div className={`mt-5 flex items-center justify-between rounded-xl bg-gradient-to-r px-4 py-3 text-sm font-bold text-white ${subject.tone}`}>
            Open lab <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      ))}
    </div>

    <section className="portal-panel">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-[15px] font-bold text-slate-900">Quick launch</h2>
        <p className="mt-1 text-xs text-slate-400">Continue directly into a focused experiment.</p>
      </div>
      <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        {quickLabs.map((lab) => (
          <Link key={lab.label} to={lab.href} className="group flex items-center gap-3 p-4 transition hover:bg-slate-50">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">{lab.icon}</div>
            <div>
              <p className="text-[13px] font-bold text-slate-800">{lab.label}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{lab.meta}</p>
            </div>
            <ArrowRight size={14} className="ml-auto text-slate-300 transition group-hover:translate-x-1 group-hover:text-sky-500" />
          </Link>
        ))}
      </div>
    </section>
  </div>
);
