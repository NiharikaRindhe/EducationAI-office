import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Flame, Star, Trophy, BookOpen, Compass, ChevronRight, MessageSquare, Clock, Loader2, Zap, FileText } from 'lucide-react';
import { TodayPanel } from '../../components/shared/TodayPanel';
import { api } from '../../lib/api';

interface ExamListItem {
  id: string;
  title: string;
  subject: string;
  duration: number;
  state: 'upcoming' | 'open' | 'submitted' | 'closed';
  end_time?: string;
}

interface SubjectItem {
  name: string;
  progress: number;
  emoji?: string;
}

interface DailyChallengeItem {
  id: string;
  title: string;
  xp_reward: number;
  completed: boolean;
}

export const Batch3Home: React.FC = () => {
  const { studentName, studentXP, studentStreak } = useApp();

  const [exams, setExams] = useState<ExamListItem[] | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[] | null>(null);
  const [challenges, setChallenges] = useState<DailyChallengeItem[] | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    // 1. Exams
    api.get<ExamListItem[]>('/student/exams')
      .then(setExams)
      .catch(() => setExams([]));

    // 2. Subjects
    api.get<string[]>('/student/subjects')
      .then(res => {
        if (res.length > 0) {
          const mapped = res.map(name => {
            const mock = fallbackSubjects.find(m => m.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(m.name.toLowerCase()));
            return {
              name,
              progress: mock ? mock.progress : 75,
              emoji: mock ? mock.emoji : undefined
            };
          });
          setSubjects(mapped);
        } else {
          setSubjects(null);
        }
      })
      .catch(() => setSubjects(null));

    // 3. Daily challenges
    api.get<DailyChallengeItem[]>('/student/daily-challenges')
      .then(res => setChallenges(res.slice(0, 2)))
      .catch(() => setChallenges(null));

    // 4. Leaderboard rank
    api.get<{ myRank: number }>('/student/leaderboard', { batchId: 3, period: 'weekly' })
      .then(res => setMyRank(res.myRank))
      .catch(() => setMyRank(null));
  }, []);

  const openExams = (exams ?? []).filter(e => e.state === 'open');
  const nextExam = openExams[0];

  const fallbackSubjects = [
    { name: 'Mathematics', progress: 85, emoji: '📐' },
    { name: 'Science', progress: 78, emoji: '🔬' },
    { name: 'English', progress: 92, emoji: '📖' },
  ];

  const displaySubjects = subjects || fallbackSubjects;

  return (
    <div className="flex flex-col gap-6 select-none anim-fade-up">
      <TodayPanel accent="sky" tasksHref="/batch3/tasks" examsHref="/batch3/exams" />

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-sky-500 via-sky-600 to-cyan-600 rounded-3xl p-6 md:p-8 text-white flex justify-between items-center shadow-lg shadow-sky-600/10">
        <div>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight flex items-center gap-2">
            <span>Board Prep Room:</span>
            <span className="text-sky-100">{studentName}</span>
          </h2>
          <p className="font-sans text-xs text-sky-100 font-medium mt-1">
            Class 10 · Streak: {studentStreak} days. Focus on mock papers and PYQs to score full marks! 🎯
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

      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): Next Exam countdown & Subjects */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {/* Next Exam countdown */}
          <div className="bento-card border border-sky-100 bg-white p-5 flex flex-col gap-4 text-left">
            <div className="flex justify-between items-center">
              <span className="font-display font-bold text-sm text-slate-800">Next Active Exam</span>
              <span className="badge pill-sky text-[9px] font-bold uppercase">Active Board Mock</span>
            </div>

            {nextExam ? (
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-slate-800">{nextExam.title}</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{nextExam.subject} · {nextExam.duration} mins</p>
                  </div>
                </div>
                <Link
                  to="/batch3/exams"
                  className="w-full md:w-auto py-2.5 px-5 bg-sky-500 hover:bg-sky-600 text-white font-sans font-bold text-xs rounded-xl text-center transition-all cursor-pointer shadow-md shadow-sky-500/10"
                >
                  Attempt Paper
                </Link>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl text-center text-slate-400 text-xs font-semibold py-8">
                No active exams assigned right now. Check with your teacher!
              </div>
            )}
          </div>

          {/* Subjects horizontal list */}
          <div className="bento-card border border-sky-100 bg-white p-5 flex flex-col gap-4 text-left">
            <div className="flex justify-between items-center">
              <span className="font-display font-bold text-sm text-slate-800">NCERT Subjects</span>
              <Link to="/batch3/subjects" className="text-xs font-bold text-sky-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="flex flex-col gap-2.5">
              {displaySubjects.map((sub, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{sub.emoji ?? (sub.name.includes('Math') ? '📐' : sub.name.includes('Science') ? '🔬' : '📖')}</span>
                    <span className="font-bold text-slate-700">{sub.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 progress-bar h-1.5">
                        <div className="progress-fill bg-sky-500" style={{ width: `${sub.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">{sub.progress}%</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): daily challenges snippet & rank */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Daily challenges widget */}
          <div className="bento-card border border-sky-100 bg-white p-5 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="font-display font-bold text-xs text-slate-700">Daily Goals</span>
              <Link to="/batch3/daily-challenges" className="text-[10px] font-bold text-sky-600 hover:underline">
                Open Goals
              </Link>
            </div>

            <div className="flex flex-col gap-2 font-sans text-xs">
              {challenges === null ? (
                <div className="flex justify-center py-2"><Loader2 size={14} className="animate-spin text-sky-500" /></div>
              ) : challenges.length === 0 ? (
                <p className="text-[10px] text-slate-400">All caught up! 🎉</p>
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

          {/* Leaderboard rank chip */}
          <div className="bento-card border border-sky-100 bg-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-sky-500 flex items-center justify-center">
                <Trophy size={18} />
              </div>
              <div className="text-left">
                <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wide">Weekly Rank</span>
                <span className="font-display font-black text-xl text-slate-800 block mt-0.5">
                  {myRank !== null ? `#${myRank}` : 'Unranked'}
                </span>
              </div>
            </div>
            <Link
              to="/batch3/leaderboard"
              className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold transition-all"
            >
              Leaderboard
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
