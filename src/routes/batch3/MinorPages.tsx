import React, { useState } from 'react';
import { Search, ChevronRight, Zap, Flame, User, FileText, AlertTriangle } from 'lucide-react';
import { ExamCenter } from '../../components/shared/ExamCenter';
import { ChatCenter } from '../../components/shared/ChatCenter';
import { NotesView } from '../../components/shared/NotesView';
import { ChallengeList } from '../../components/shared/ChallengeList';
import { PyqBrowser } from '../../components/shared/PyqBrowser';
import { StreakCalendar } from '../../components/shared/StreakCalendar';
import { ProfileCard } from '../../components/shared/ProfileCard';

/* ─────────────────────────────────────────────────────────
   1. BATCH 3 SUBJECTS LIST (UNIT ACCORDION & WEAK ALERTS)
───────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────
   2. BATCH 3 AI DOUBT SOLVER — real RAG chat, sky-themed
───────────────────────────────────────────────────────── */
export const Batch3Chat: React.FC = () => <ChatCenter accent="sky" />;

/* ─────────────────────────────────────────────────────────
   3. BATCH 3 DAILY CHALLENGES (CBSE STYLES)
───────────────────────────────────────────────────────── */
export const Batch3DailyChallenges: React.FC = () => (
  <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
    {/* Page Header — sky themed */}
    <div className="bg-gradient-to-r from-sky-500 to-cyan-500 rounded-3xl p-6 text-white flex items-center justify-between shadow-lg shadow-sky-500/20">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center">
          <Zap size={22} className="text-white" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-xl tracking-tight">
            Daily Challenges
          </h1>
          <p className="font-sans text-[11px] text-sky-100 mt-0.5">
            CBSE-pattern HOTS, Case Studies & Assertion-Reason questions
          </p>
        </div>
      </div>
      <span className="bg-white/20 border border-white/20 text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wide">
        Board Prep
      </span>
    </div>

    {/* ChallengeList component — dense mode for Batch 3 */}
    <ChallengeList accent="sky" dense />
  </div>
);

/* ─────────────────────────────────────────────────────────
   4. BATCH 3 PRACTICE EXAMS (A/B/C/D SECTIONS)
───────────────────────────────────────────────────────── */
export const Batch3Exams: React.FC = () => <ExamCenter accent="sky" />;

/* ─────────────────────────────────────────────────────────
   5. BATCH 3 STUDY NOTES (BOARD TAGS)
───────────────────────────────────────────────────────── */
export const Batch3Notes: React.FC = () => <NotesView accent="sky" />;

/* ─────────────────────────────────────────────────────────
   6. BATCH 3 BOARD PYQ HUB
───────────────────────────────────────────────────────── */
export const Batch3Pyq: React.FC = () => (
  <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
    {/* Board Prep Banner */}
    <div className="bg-gradient-to-r from-sky-500 to-cyan-500 rounded-3xl p-6 text-white flex items-start gap-4 shadow-lg shadow-sky-500/20">
      <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center shrink-0">
        <FileText size={22} className="text-white" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="font-display font-extrabold text-xl tracking-tight">Board PYQ Archives</h1>
          <span className="bg-white/20 border border-white/20 text-white text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wide">
            Marking Scheme ✓
          </span>
        </div>
        <p className="font-sans text-[12px] text-sky-100 leading-relaxed">
          Includes step-by-step examiner marking schemes. Learn where to place labels, write final units,
          and how to present answers to score full marks in CBSE board exams.
        </p>
      </div>
    </div>

    {/* PyqBrowser component with rubric for Batch 3 */}
    <PyqBrowser accent="sky" showRubric />
  </div>
);

/* ─────────────────────────────────────────────────────────
   7. BATCH 3 STREAK TRACKER
───────────────────────────────────────────────────────── */
export const Batch3Streak: React.FC = () => (
  <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
    {/* Page Header */}
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-sky-100 border border-sky-200 text-sky-600 flex items-center justify-center">
        <Flame size={20} />
      </div>
      <div>
        <h1 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
          Learning Streak
        </h1>
        <p className="font-sans text-[11px] text-slate-400 mt-0.5">
          Consistency is key to CBSE board success — keep your streak going!
        </p>
      </div>
    </div>

    {/* StreakCalendar with percent view for Batch 3 */}
    <StreakCalendar accent="sky" showPercent />
  </div>
);

/* ─────────────────────────────────────────────────────────
   8. BATCH 3 PROFILE (with Exam History)
───────────────────────────────────────────────────────── */
export const Batch3Profile: React.FC = () => (
  <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
    {/* Page Header */}
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-sky-100 border border-sky-200 text-sky-600 flex items-center justify-center">
        <User size={20} />
      </div>
      <div>
        <h1 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
          My Profile
        </h1>
        <p className="font-sans text-[11px] text-slate-400 mt-0.5">
          Board readiness index, exam history, and profile settings
        </p>
      </div>
    </div>

    {/* ProfileCard with exam history for Batch 3 */}
    <ProfileCard accent="sky" showExamHistory />
  </div>
);
