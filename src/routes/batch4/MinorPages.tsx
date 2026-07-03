import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Award, Flame, Search, ChevronRight, Check, Trophy, BookOpen, Clock, FileText, Plus, HelpCircle, Sparkles, MessageSquare, AlertTriangle } from 'lucide-react';

/* ----------------------------------------------------
   1. BATCH 4 SUBJECTS
---------------------------------------------------- */
export const Batch4Subjects: React.FC = () => {
  const { currentStream } = useApp();
  const subjects = currentStream === 'JEE' ? ['Physics', 'Chemistry', 'Maths'] : ['Physics', 'Chemistry', 'Biology'];

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subjects.map((sub, idx) => (
          <div key={idx} className="bento-card border border-purple-100 bg-white p-6 flex flex-col justify-between gap-5 card-interactive text-left">
            <div>
              <span className="text-3xl bg-slate-50 border border-slate-100 p-2.5 rounded-2xl block w-fit">
                {sub === 'Physics' ? '⚡' : sub === 'Chemistry' ? '🧪' : sub === 'Biology' ? '🧬' : '📐'}
              </span>
              <h4 className="font-display font-bold text-sm text-slate-800 mt-4">{sub} Syllabus</h4>
              <p className="font-sans text-[11px] text-slate-400 leading-relaxed mt-1">
                Advanced Class 11-12 NCERT units and JEE/NEET competitive board items.
              </p>
            </div>
            <button className="py-2 bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs rounded-xl shadow-xs cursor-pointer">
              Open Syllabus Checklist
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   2. BATCH 4 CHAT (FORMULA ACCENT)
---------------------------------------------------- */
interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  citation?: string;
}

export const Batch4Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'ai', text: "Hello! Ready for competitive JEE/NEET prep doubts? Ask me about organic reaction mechanisms or electromagnetic equations.", citation: 'JEE Prep' }
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const handleSend = () => {
    if (!inputMsg.trim()) return;
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), sender: 'student', text: inputMsg }
    ]);
    setInputMsg('');

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), sender: 'ai', text: "Step-by-step resolution:\n\n\\(E = -13.6 \\frac{Z^2}{n^2} \\text{ eV}\\)\n\nUnderstood? Let me know if you need weightage trends!", citation: 'Chemistry Ch 2' }
      ]);
    }, 1000);
  };

  return (
    <div className="bg-white border border-purple-100 rounded-3xl overflow-hidden shadow-md flex flex-col h-[calc(100vh-160px)] font-sans select-none anim-fade-up">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col gap-1 max-w-[80%] ${m.sender === 'student' ? 'self-end items-end' : 'self-start items-start'}`}>
            <div className={`p-4 rounded-2xl text-xs leading-relaxed ${m.sender === 'student' ? 'bg-purple-600 text-white rounded-tr-xs' : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-xs font-medium'}`} style={{ whiteSpace: 'pre-line' }}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          className="flex-1 px-4 py-3 bg-white border border-slate-200 focus:border-purple-500 rounded-xl font-sans text-xs outline-none"
          placeholder="Ask AI Doubt Solver..."
        />
        <button onClick={handleSend} className="py-3 px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-sans font-bold text-xs cursor-pointer shadow-md">
          Send
        </button>
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   3. BATCH 4 CONCEPT MAP
---------------------------------------------------- */
export const Batch4ConceptMap: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      <div className="bento-card border border-purple-100 bg-white p-5 max-w-xl mx-auto text-left flex flex-col gap-4">
        <span className="font-display font-bold text-xs text-slate-700">Advanced Node Graph Explorer</span>
        <p className="font-sans text-xs text-slate-500 leading-relaxed">
          Map multi-level connections across organic pathways or thermodynamics formulas. Check definitions by clicking on interactive concept bubbles.
        </p>
        <button className="py-2.5 px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-sans font-bold text-xs shadow-md transition-all cursor-pointer">
          Open Visual Graph
        </button>
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   4. BATCH 4 MOCK EXAMS
---------------------------------------------------- */
export const Batch4Exams: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      <div className="bento-card border border-purple-100 bg-white p-5 text-left max-w-xl mx-auto flex flex-col gap-4">
        <span className="font-display font-bold text-xs text-slate-700">JEE / NEET Sectional Mocks</span>
        <div className="flex flex-col gap-2.5 text-xs font-semibold text-slate-600 leading-normal">
          <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
            <span>Section A (Single Option Correct)</span>
            <span>20 Questions</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
            <span>Section B (Numerical Value Type)</span>
            <span>10 Questions (Attempt 5)</span>
          </div>
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex justify-between">
            <span>Marking Scheme</span>
            <span className="font-bold">+4 Correct / -1 Negative</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   5. BATCH 4 STUDY NOTES
---------------------------------------------------- */
export const Batch4Notes: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: 'Electrodynamics core formulas', content: 'Force F = qE. Gauss Law flux = Q/epsilon.' },
          { title: 'Organic reactions list', content: 'Aldol Condensation, Cannizzaro Reaction, Wurtz Reaction.' }
        ].map((item, idx) => (
          <div key={idx} className="bento-card border border-purple-100 bg-white p-6 flex flex-col justify-between gap-5 card-interactive text-left">
            <div>
              <h4 className="font-display font-bold text-sm text-slate-800">{item.title}</h4>
              <p className="font-sans text-xs text-slate-500 leading-relaxed mt-2.5">{item.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   6. BATCH 4 PYQ HUB
---------------------------------------------------- */
export const Batch4Pyq: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      <div className="bento-card border border-purple-100 bg-white p-5 max-w-xl mx-auto text-left flex flex-col gap-4">
        <span className="font-display font-bold text-xs text-slate-700">JEE / NEET Past Year archives</span>
        <p className="font-sans text-xs text-slate-500 leading-relaxed">
          Access complete papers from 2019 to 2024. View official answer key solutions and step-by-step marking trends.
        </p>
        <button className="py-2.5 px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-sans font-bold text-xs shadow-md transition-all cursor-pointer">
          Open PYQ Papers Archive
        </button>
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   7. BATCH 4 POMODORO FOCUS TIMER
---------------------------------------------------- */
export const Batch4Pomodoro: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      <div className="bento-card border border-purple-100 bg-white p-5 max-w-xl mx-auto text-left flex flex-col gap-4">
        <span className="font-display font-bold text-xs text-slate-700">Recommended Entrance Presets</span>
        <p className="font-sans text-xs text-slate-500 leading-relaxed">
          For higher-level exam preps, we recommend using a 50-minute study focus interval followed by a 10-minute break to match sectional mock schedules.
        </p>
        <button className="py-2.5 px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-sans font-bold text-xs shadow-md transition-all cursor-pointer">
          Load 50/10 Focus Timer
        </button>
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   8. BATCH 4 STREAK TRACKER
---------------------------------------------------- */
export const Batch4Streak: React.FC = () => {
  const { studentStreak } = useApp();
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      <div className="bento-card border border-purple-100 bg-white p-5">
        <span className="font-display font-bold text-xs text-slate-700 block mb-3">Streak June Heatmap</span>
        <div className="grid grid-cols-7 gap-2.5 text-center">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
            <span key={d} className="text-[10px] font-black text-slate-400">{d}</span>
          ))}
          {days.map(d => {
            const active = d <= 12;
            return (
              <div key={d} className={`h-10 rounded-xl flex items-center justify-center text-xs font-bold ${active ? 'bg-purple-600 text-white' : 'bg-slate-50 border border-slate-100 text-slate-400'}`}>
                {d}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   9. BATCH 4 TOPIC WEIGHTAGE TRENDS
---------------------------------------------------- */
export const Batch4Weightage: React.FC = () => {
  const { currentStream } = useApp();
  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      <div className="bento-card border border-purple-100 bg-white p-5 max-w-xl mx-auto text-left flex flex-col gap-4">
        <span className="font-display font-bold text-xs text-slate-700">Must-Do Chapter Flags ({currentStream})</span>
        <p className="font-sans text-xs text-slate-500 leading-relaxed">
          These chapters appeared in competitive exams during all of 2022, 2023, and 2024. We recommend allocating high priority focus hours here.
        </p>
        <div className="flex flex-col gap-2 text-xs font-bold text-purple-700">
          <div className="p-3 bg-purple-50 rounded-xl flex justify-between">
            <span>Physics: Electrostatics & Potential</span>
            <span>★ Must Do (12% weightage)</span>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl flex justify-between">
            <span>Chemistry: Organic Carbon compounds</span>
            <span>★ Must Do (10% weightage)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   10. BATCH 4 PROFILE
---------------------------------------------------- */
export const Batch4Profile: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto font-sans select-none anim-fade-up flex flex-col gap-6">
      <div className="bento-card border border-purple-100 bg-white p-6 md:p-8 text-center flex flex-col items-center gap-5">
        <span className="text-5xl select-none">🎯</span>
        <div>
          <h3 className="font-display font-extrabold text-lg text-slate-800">JEE/NEET Prep Index</h3>
          <p className="font-sans text-[10px] text-slate-400 mt-1">Calculated from mock and challenge completions</p>
        </div>

        {/* Circular SVG readiness indicator */}
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90">
            <circle cx="72" cy="72" r="32" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
            <circle cx="72" cy="72" r="32" fill="transparent" stroke="#8b5cf6" strokeWidth="8" strokeDasharray="201" strokeDashoffset="44" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center font-display font-black text-2xl text-slate-800">
            78%
          </div>
        </div>
      </div>
    </div>
  );
};
