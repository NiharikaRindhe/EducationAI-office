import React from 'react';
import { Zap, Flame, User, FileText } from 'lucide-react';
import { SyllabusView } from '../../components/shared/SyllabusView';
import { ExamCenter } from '../../components/shared/ExamCenter';
import { ChatCenter } from '../../components/shared/ChatCenter';
import { NotesView } from '../../components/shared/NotesView';
import { ChallengeList } from '../../components/shared/ChallengeList';
import { PyqBrowser } from '../../components/shared/PyqBrowser';
import { StreakCalendar } from '../../components/shared/StreakCalendar';
import { ProfileCard } from '../../components/shared/ProfileCard';

/* ─────────────────────────────────────────────────────────
   1. BATCH 3 SYLLABUS — real chapters from the school's books
   Previously a hardcoded unit/chapter tree with invented scores and
   invented "Board Important" stars. Now shared with Batch 2 via
   SyllabusView, backed by GET /student/syllabus.
───────────────────────────────────────────────────────── */
export const Batch3Subjects: React.FC = () => (
  <SyllabusView accent="sky" chatHref="/batch3/chat" />
);

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
    <section aria-labelledby="batch3-streak-heading" className="flex flex-col gap-3">
      <div>
        <h2 id="batch3-streak-heading" className="font-display font-bold text-base text-slate-800">Attendance streak</h2>
        <p className="text-xs text-slate-400 mt-0.5">Your recent active lab days and longest streak.</p>
      </div>
      <StreakCalendar accent="sky" variant="calendar" />
    </section>
  </div>
);
