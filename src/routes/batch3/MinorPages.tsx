import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Award, Flame, Search, ChevronRight, Check, Trophy, BookOpen, Clock, FileText, Plus, HelpCircle, Sparkles, MessageSquare, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

/* ----------------------------------------------------
   1. BATCH 3 SUBJECTS LIST (UNIT ACCORDION & WEAK ALERTS)
---------------------------------------------------- */
export const Batch3Subjects: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Maths' | 'Science' | 'English'>('Science');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({
    'Unit 1: Effects of Light': true,
    'Unit 2: Chemical Substances': false
  });

  const syllabus = {
    Science: [
      {
        title: 'Unit 1: Effects of Light',
        chapters: [
          { name: 'Chapter 10: Light Reflection & Refraction', status: 'In Progress', boardImportant: true, score: 70 },
          { name: 'Chapter 11: Human Eye & Colorful World', status: 'Completed', boardImportant: false, score: 92 }
        ]
      },
      {
        title: 'Unit 2: Chemical Substances',
        chapters: [
          { name: 'Chapter 1: Chemical Reactions & Equations', status: 'Completed', boardImportant: true, score: 85 },
          { name: 'Chapter 2: Acids, Bases and Salts', status: 'Not Started', boardImportant: false }
        ]
      }
    ],
    Maths: [
      {
        title: 'Unit 1: Geometry & Trigonometry',
        chapters: [
          { name: 'Chapter 6: Similar Triangles', status: 'In Progress', boardImportant: true, score: 58 },
          { name: 'Chapter 8: Introduction to Trigonometry', status: 'Completed', boardImportant: true, score: 80 }
        ]
      }
    ],
    English: [
      {
        title: 'Unit 1: Prose Readings',
        chapters: [
          { name: 'Chapter 1: A Letter to God', status: 'Completed', boardImportant: false, score: 95 }
        ]
      }
    ]
  };

  const currentUnits = syllabus[activeTab];

  const filteredUnits = searchQuery 
    ? currentUnits.map(u => ({
        ...u,
        chapters: u.chapters.filter(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()))
      })).filter(u => u.chapters.length > 0)
    : currentUnits;

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      {/* Top filters */}
      <div className="bg-white border border-slate-100 p-5 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs">
        <div className="flex gap-2">
          {(['Maths', 'Science', 'English'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-5 rounded-full font-sans text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl font-sans text-xs outline-none"
            placeholder="Search board chapters..."
          />
        </div>
      </div>

      {/* Weak area alerts */}
      {activeTab === 'Maths' && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-2.5 text-xs text-red-800">
          <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Maths score warning!</span>
            <p className="font-sans text-red-700 mt-0.5">Your similar triangles score is 58% which needs revision.</p>
          </div>
        </div>
      )}

      {/* Units accordions */}
      <div className="flex flex-col gap-4">
        {filteredUnits.map((unit, idx) => (
          <div key={idx} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
            <button
              onClick={() => setExpandedUnits(prev => ({ ...prev, [unit.title]: !prev[unit.title] }))}
              className="w-full py-4 px-5 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between font-display font-bold text-sm text-slate-700 cursor-pointer"
            >
              <span>{unit.title}</span>
              {expandedUnits[unit.title] !== false ? <ChevronRight size={16} className="rotate-90 transition-transform" /> : <ChevronRight size={16} />}
            </button>

            {expandedUnits[unit.title] !== false && (
              <div className="p-4 border-t border-slate-100 flex flex-col gap-3 font-sans text-xs">
                {unit.chapters.map((ch, cIdx) => (
                  <div key={cIdx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        ch.status === 'Completed' ? 'bg-emerald-500' : ch.status === 'In Progress' ? 'bg-amber-500' : 'bg-slate-300'
                      }`}></div>
                      <div>
                        <span className="font-sans font-bold text-xs text-slate-700 block">{ch.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400">Status: {ch.status}</span>
                          {ch.boardImportant && (
                            <span className="badge pill-sky text-[8px] font-black uppercase">⭐ Board Important</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {ch.score && (
                        <span className="badge pill-sky text-[9px] font-bold">Score: {ch.score}%</span>
                      )}
                      <button className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold cursor-pointer">
                        Practice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   2. BATCH 3 DUAL CHAT (LATEX MATHS ACCENT)
---------------------------------------------------- */

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  citation?: string;
}

export const Batch3Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'ai', text: "Hello! Ready for CBSE Board Prep doubts? Ask me about Light formulas or Maths equations. (Equation: \\(a^2 + b^2 = c^2\\))", citation: 'NCERT' }
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
        { id: Date.now().toString(), sender: 'ai', text: "Solving numerical step-by-step:\n\n\\(F = G \\frac{m_1 m_2}{d^2}\\)\n\nUnderstood? Let me know if you need concept maps!", citation: 'Science Ch 10' }
      ]);
    }, 1000);
  };

  return (
    <div className="bg-white border border-sky-100 rounded-3xl overflow-hidden shadow-md flex flex-col h-[calc(100vh-160px)] font-sans select-none anim-fade-up">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col gap-1 max-w-[80%] ${m.sender === 'student' ? 'self-end items-end' : 'self-start items-start'}`}>
            <div className={`p-4 rounded-2xl text-xs leading-relaxed ${m.sender === 'student' ? 'bg-sky-600 text-white rounded-tr-xs' : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-xs font-medium'}`} style={{ whiteSpace: 'pre-line' }}>
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
          className="flex-1 px-4 py-3 bg-white border border-slate-200 focus:border-sky-500 rounded-xl font-sans text-xs outline-none"
          placeholder="Ask AI Doubt Solver..."
        />
        <button onClick={handleSend} className="py-3 px-5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-sans font-bold text-xs cursor-pointer shadow-md">
          Send
        </button>
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   3. BATCH 3 DAILY CHALLENGES (CBSE STYLES)
---------------------------------------------------- */
export const Batch3DailyChallenges: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { type: 'HOTS', color: 'pill-rose', q: 'Explain why diamond is a non-conductor of electricity while graphite is a conductor.' },
          { type: 'Case Study', color: 'pill-amber', q: 'Read the paragraph about spherical mirror rays and deduce image position.' },
          { type: 'Assertion & Reason', color: 'pill-purple', q: 'Assertion: Convex mirror is used as rearview mirror. Reason: It forms virtual image.' },
          { type: 'Source-Based', color: 'pill-sky', q: 'Source: Paragraph on Thales similarity theorem. Solve sum.' }
        ].map((item, idx) => (
          <div key={idx} className="bento-card border border-sky-100 bg-white p-6 flex flex-col justify-between gap-5 card-interactive text-left">
            <div>
              <span className={`badge ${item.color} text-[8px] font-black uppercase`}>{item.type} Question</span>
              <p className="font-sans text-xs text-slate-600 leading-relaxed mt-3">{item.q}</p>
            </div>
            <button className="py-2 bg-sky-500 hover:bg-sky-600 text-white font-sans font-bold text-xs rounded-xl shadow-xs cursor-pointer">
              Attempt Challenge
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   4. BATCH 3 PRACTICE EXAMS (A/B/C/D SECTIONS)
---------------------------------------------------- */
export const Batch3Exams: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      <div className="bento-card border border-sky-100 bg-white p-5 text-left max-w-xl mx-auto flex flex-col gap-4">
        <span className="font-display font-bold text-xs text-slate-700">CBSE Mock Paper sections:</span>
        <div className="flex flex-col gap-2.5 text-xs font-semibold text-slate-600 leading-normal">
          <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
            <span>Section A (1-mark MCQs)</span>
            <span>20 Questions</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
            <span>Section B (2-mark Short Answer)</span>
            <span>5 Questions</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
            <span>Section C (3-mark Short Answer)</span>
            <span>6 Questions</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
            <span>Section D (5-mark Long Answer)</span>
            <span>4 Questions</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   5. BATCH 3 STUDY NOTES (BOARD TAGS)
---------------------------------------------------- */
export const Batch3Notes: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: 'Mirror formula steps', tag: '⭐ Board Important', content: 'Formula: 1/f = 1/v + 1/u. Magnification m = -v/u.' },
          { title: 'Nationalism in India dates', tag: 'History timeline', content: '1915: Gandhiji returns. 1919: Rowlatt Act. 1920: Non-Cooperation.' }
        ].map((item, idx) => (
          <div key={idx} className="bento-card border border-sky-100 bg-white p-6 flex flex-col justify-between gap-5 card-interactive text-left">
            <div>
              <div className="flex justify-between items-start">
                <span className="badge pill-sky text-[8px] font-black uppercase">{item.tag}</span>
              </div>
              <h4 className="font-display font-bold text-sm text-slate-800 mt-2.5">{item.title}</h4>
              <p className="font-sans text-xs text-slate-500 leading-relaxed mt-2">{item.content}</p>
            </div>
            <button className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold font-sans text-left mt-2 cursor-pointer">
              Edit Note
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   6. BATCH 3 BOARD PYQ HUB
---------------------------------------------------- */
export const Batch3Pyq: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      <div className="bento-card border border-sky-100 bg-white p-5 max-w-xl mx-auto text-left flex flex-col gap-4">
        <span className="font-display font-bold text-xs text-slate-700">Examiner Marking Schemes</span>
        <p className="font-sans text-xs text-slate-500 leading-relaxed">
          Unlock board papers with step-by-step marker points. Learn where to draw labels and write final units to ensure zero marks deduction.
        </p>
        <button className="py-2.5 px-5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-sans font-bold text-xs shadow-md transition-all cursor-pointer">
          Open PYQ Archives
        </button>
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   7. BATCH 3 STREAK TRACKER
---------------------------------------------------- */
export const Batch3Streak: React.FC = () => {
  const { studentStreak } = useApp();
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      <div className="bento-card border border-sky-100 bg-white p-5">
        <span className="font-display font-bold text-xs text-slate-700 block mb-3">Streak June Heatmap</span>
        <div className="grid grid-cols-7 gap-2.5 text-center">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
            <span key={d} className="text-[10px] font-black text-slate-400">{d}</span>
          ))}
          {days.map(d => {
            const active = d <= 12;
            return (
              <div key={d} className={`h-10 rounded-xl flex items-center justify-center text-xs font-bold ${active ? 'bg-sky-500 text-white' : 'bg-slate-50 border border-slate-100 text-slate-400'}`}>
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
   8. BATCH 3 PROFILE (READINESS GAUGES)
---------------------------------------------------- */
export const Batch3Profile: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto font-sans select-none anim-fade-up flex flex-col gap-6">
      <div className="bento-card border border-sky-100 bg-white p-6 md:p-8 text-center flex flex-col items-center gap-5">
        <span className="text-5xl select-none">🎯</span>
        <div>
          <h3 className="font-display font-extrabold text-lg text-slate-800">Board Readiness Index</h3>
          <p className="font-sans text-[10px] text-slate-400 mt-1">Calculated from mock and challenge completions</p>
        </div>

        {/* Circular SVG readiness indicator */}
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90">
            <circle cx="72" cy="72" r="32" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
            <circle cx="72" cy="72" r="32" fill="transparent" stroke="#0ea5e9" strokeWidth="8" strokeDasharray="201" strokeDashoffset="54" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center font-display font-black text-2xl text-slate-800">
            73%
          </div>
        </div>
      </div>
    </div>
  );
};
