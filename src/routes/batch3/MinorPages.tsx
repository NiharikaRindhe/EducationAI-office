import React from 'react';
import { FileText, User } from 'lucide-react';
import { ExamCenter } from '../../components/shared/ExamCenter';
import { ChatCenter } from '../../components/shared/ChatCenter';
import { PyqBrowser } from '../../components/shared/PyqBrowser';
import { ProfileCard } from '../../components/shared/ProfileCard';

export const Batch3Chat: React.FC = () => <ChatCenter accent="teal" />;

export const Batch3Exams: React.FC = () => <ExamCenter accent="teal" />;

export const Batch3Pyq: React.FC = () => (
  <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
    <div className="flex items-start gap-4 rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-lg shadow-slate-900/10">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/20">
        <FileText size={22} />
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h1 className="font-display text-xl font-extrabold tracking-tight">Board PYQ Archives</h1>
          <span className="rounded-lg border border-white/20 bg-white/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide">Marking Scheme ✓</span>
        </div>
        <p className="text-[12px] leading-relaxed text-slate-300">Includes step-by-step examiner marking schemes. Learn how to present answers to score full marks in CBSE board exams.</p>
      </div>
    </div>
    <PyqBrowser accent="teal" showRubric />
  </div>
);

export const Batch3Profile: React.FC = () => (
  <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-teal-200 bg-teal-100 text-teal-700"><User size={20} /></div>
      <div>
        <h1 className="font-display text-lg font-extrabold tracking-tight text-slate-900">My Profile</h1>
        <p className="mt-0.5 text-[11px] text-slate-400">Board readiness, exam history, and profile settings</p>
      </div>
    </div>
    <ProfileCard accent="teal" showExamHistory />
  </div>
);
