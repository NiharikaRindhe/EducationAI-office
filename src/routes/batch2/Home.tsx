import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Loader2, ChevronRight, AlertTriangle } from 'lucide-react';
import { TodayPanel } from '../../components/shared/TodayPanel';
import { api } from '../../lib/api';
import { SUBJECT_ORDER, activitiesForClass, practicePath } from '../../data/activities';

interface SyllabusSubject {
  subject: string;
  chapters: { chapterNum: number; title: string | null }[];
  hasBook: boolean;
  averageScore: number | null;
  examsTaken: number;
}

interface DailyChallengeItem {
  id: string;
  title: string;
  xp_reward: number;
  completed: boolean;
}

const SUBJECT_ICON: Record<string, string> = {
  Mathematics: '📐',
  Science: '🔬',
  English: '📖',
  'Social Science': '🗺️',
  'World Around Us': '🌍',
};

export const Batch2Home: React.FC = () => {
  const { studentName, studentXP, studentStreak, currentClass } = useApp();
  const classActivities = activitiesForClass(currentClass);
  const activitySubjects = SUBJECT_ORDER
    .map((subject) => ({
      subject,
      count: classActivities.filter((a) => a.subject === subject).length,
    }))
    .filter((row) => row.count > 0);

  const [subjects, setSubjects] = useState<SyllabusSubject[] | null>(null);
  const [challenges, setChallenges] = useState<DailyChallengeItem[] | null>(null);
  // Held separately from "still loading" (challenges === null) on purpose — a
  // fetch failure used to leave challenges null forever, which rendered the
  // same spinner as a request that just hasn't returned yet.
  const [challengesError, setChallengesError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Real syllabus — chapters come from the school's indexed books, and
    //    the only progress number shown is a measured exam average. This card
    //    used to fall back to invented completion percentages (78%, 64%…)
    //    when the API was empty, which is worse than showing nothing.
    api.get<{ subjects: SyllabusSubject[] }>('/student/syllabus')
      .then(res => setSubjects(res.subjects))
      .catch(() => setSubjects([]));

    // 2. Daily challenges (top 3)
    api.get<DailyChallengeItem[]>('/student/daily-challenges')
      .then(res => setChallenges(res.slice(0, 3)))
      .catch((err: unknown) => setChallengesError(err instanceof Error ? err.message : 'Could not load daily challenges.'));
  }, []);

  return (
    <div className="flex flex-col gap-6 select-none anim-fade-up">
      <TodayPanel accent="indigo" tasksHref="/batch2/tasks" examsHref="/batch2/exams" />

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 rounded-3xl p-6 md:p-8 text-white flex justify-between items-center shadow-lg shadow-indigo-600/10">
        <div>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight flex items-center gap-2">
            <span>Study Room:</span>
            <span className="text-indigo-100">{studentName}</span>
          </h2>
          <p className="font-sans text-xs text-indigo-100 font-medium mt-1">
            Class {currentClass} · Streak: {studentStreak} days. Let's finish your assigned NCERT chapters! 📚
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-3 px-5 rounded-2xl border border-white/10 text-xs font-bold font-display">
          <div className="flex items-center gap-1.5 border-r border-white/20 pr-4">
            <span className="text-amber-400">🔥</span>
            <span>{studentStreak} Days</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-yellow-400">⚡</span>
            <span>{studentXP} XP</span>
          </div>
        </div>
      </div>

      {activitySubjects.length > 0 && (
        <div className="bento-card border border-indigo-100 bg-white p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-display font-bold text-sm text-slate-800">Activities</span>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Class {currentClass} chapter practice · {classActivities.length} activities
              </p>
            </div>
            <Link to="/batch2/activities" className="text-xs font-bold text-indigo-600 hover:underline">
              Open all
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {activitySubjects.map((row) => (
              <Link
                key={row.subject}
                to={practicePath('/batch2/activities', row.subject)}
                className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 card-interactive"
              >
                <span className="text-xl">{SUBJECT_ICON[row.subject] ?? '📘'}</span>
                <h4 className="font-display font-bold text-sm text-slate-800 mt-2">{row.subject}</h4>
                <span className="text-[10px] text-slate-400 font-medium">
                  {row.count} chapter{row.count === 1 ? '' : 's'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left column: Subjects progress */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="bento-card border border-indigo-100 bg-white p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="font-display font-bold text-sm text-slate-800">Your NCERT Syllabus</span>
              <div className="flex gap-3">
                <Link to="/batch2/activities" className="text-xs font-bold text-indigo-600 hover:underline">
                  Activities
                </Link>
                <Link to="/batch2/subjects" className="text-xs font-bold text-indigo-600 hover:underline">
                  View Syllabus
                </Link>
              </div>
            </div>

            {subjects === null ? (
              <div className="flex justify-center py-6"><Loader2 size={16} className="animate-spin text-indigo-500" /></div>
            ) : subjects.length === 0 ? (
              <p className="text-[11px] text-slate-400 py-2">
                No subjects are set up for your class yet — check with your class teacher.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjects.map((sub) => (
                  <div
                    key={sub.subject}
                    className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col justify-between gap-4 card-interactive"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-display font-bold text-sm text-slate-800">{sub.subject}</h4>
                        <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                          {sub.hasBook
                            ? `${sub.chapters.length} chapter${sub.chapters.length === 1 ? '' : 's'} available`
                            : 'Book not uploaded yet'}
                        </span>
                      </div>
                      <span className="text-xl">
                        {sub.subject.includes('Math') ? '📐' : sub.subject.includes('Science') ? '🔬' : sub.subject.includes('English') ? '📖' : '🗺️'}
                      </span>
                    </div>

                    {/* Only a measured value is drawn — no bar when unmeasured */}
                    {sub.examsTaken > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                          <span>Exam average</span>
                          <span>{sub.averageScore}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill bg-indigo-600" style={{ width: `${sub.averageScore}%` }}></div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">No exams submitted yet</span>
                    )}

                    <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-2">
                      <Link
                        to="/batch2/subjects"
                        className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        <span>Open chapters</span>
                        <ChevronRight size={14} />
                      </Link>
                      <Link
                        to={practicePath('/batch2/activities', sub.subject)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        Practice
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: daily challenges */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Daily challenges mini-widget */}
          <div className="bento-card border border-indigo-100 bg-white p-5 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="font-display font-bold text-xs text-slate-700">Daily Challenges</span>
              <Link to="/batch2/daily-challenges" className="text-[10px] font-bold text-indigo-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="flex flex-col gap-2 font-sans text-xs">
              {challengesError ? (
                <p className="flex items-start gap-1.5 text-[10px] font-semibold text-rose-600">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" /> {challengesError}
                </p>
              ) : challenges === null ? (
                <div className="flex justify-center py-2"><Loader2 size={14} className="animate-spin text-indigo-500" /></div>
              ) : challenges.length === 0 ? (
                <p className="text-[10px] text-slate-400">All caught up for today! 🎉</p>
              ) : (
                challenges.map(ch => (
                  <div key={ch.id} className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-2 h-2 rounded-full ${ch.completed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className={`truncate ${ch.completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>
                        {ch.title}
                      </span>
                    </div>
                    <span className="shrink-0 text-[8px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                      +{ch.xp_reward} XP
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
