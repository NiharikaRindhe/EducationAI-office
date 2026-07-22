import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Flame, Star, Trophy, BookOpen, Compass, ChevronRight, MessageSquare, Clock, Loader2, Zap, Award } from 'lucide-react';
import { TodayPanel } from '../../components/shared/TodayPanel';
import { api } from '../../lib/api';

interface SubjectProgress {
  name: string;
  emoji?: string;
  progress: number;
  current_chapter?: string;
}

interface LeaderboardUser {
  rank: number;
  fullName: string;
  avatar: string;
  xp: number;
}

interface DailyChallengeItem {
  id: string;
  title: string;
  xp_reward: number;
  completed: boolean;
}

export const Batch2Home: React.FC = () => {
  const navigate = useNavigate();
  const { studentName, studentAvatar, studentXP, studentStreak } = useApp();

  const [subjects, setSubjects] = useState<SubjectProgress[] | null>(null);
  const [challenges, setChallenges] = useState<DailyChallengeItem[] | null>(null);
  const [leaderboard, setLeaderboard] = useState<{ top3: LeaderboardUser[]; myRank: number } | null>(null);

  // Fallbacks if API is empty or fails
  const mockSubjects: SubjectProgress[] = [
    { name: 'Mathematics', progress: 78, current_chapter: 'Ch 4 Linear Equations', emoji: '📐' },
    { name: 'Science', progress: 64, current_chapter: 'Ch 5 Cell Structure', emoji: '🔬' },
    { name: 'English', progress: 91, current_chapter: 'Ch 6 Novel: The Lost Key', emoji: '📖' },
    { name: 'Social Science', progress: 83, current_chapter: 'Ch 3 French Revolution', emoji: '🗺️' }
  ];

  const mockLeaderboard = [
    { rank: 1, fullName: 'Aisha', xp: 4890, avatar: '🦋' },
    { rank: 2, fullName: `${studentName} (You)`, xp: studentXP, avatar: studentAvatar },
    { rank: 3, fullName: 'Arjun', xp: 3820, avatar: '🦁' }
  ];

  useEffect(() => {
    // 1. Subjects progress
    api.get<string[]>('/student/subjects')
      .then(res => {
        if (res.length > 0) {
          const mapped = res.map(name => {
            const mock = mockSubjects.find(m => m.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(m.name.toLowerCase()));
            return {
              name,
              progress: mock ? mock.progress : 50,
              current_chapter: mock ? mock.current_chapter : 'Explore Topics',
              emoji: mock ? mock.emoji : undefined
            };
          });
          setSubjects(mapped);
        } else {
          setSubjects(null);
        }
      })
      .catch(() => setSubjects(null));

    // 2. Daily challenges (top 3)
    api.get<DailyChallengeItem[]>('/student/daily-challenges')
      .then(res => setChallenges(res.slice(0, 3)))
      .catch(() => setChallenges(null));

    // 3. Leaderboard
    api.get<{ users: { rank: number; full_name: string; avatar: string; xp: number }[]; myRank: number }>('/student/leaderboard', { batchId: 2, period: 'weekly' })
      .then(res => {
        const top3 = res.users.slice(0, 3).map(u => ({
          rank: u.rank,
          fullName: u.full_name,
          avatar: u.avatar,
          xp: u.xp
        }));
        setLeaderboard({ top3, myRank: res.myRank });
      })
      .catch(() => setLeaderboard(null));
  }, [studentName, studentAvatar, studentXP]);

  const displaySubjects = subjects || mockSubjects;
  const displayLeaderboard = leaderboard?.top3 || mockLeaderboard;

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
            Class 7 · Streak: {studentStreak} days. Let's finish your assigned NCERT chapters! 📚
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

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left column: Subjects progress */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="bento-card border border-indigo-100 bg-white p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="font-display font-bold text-sm text-slate-800">Your NCERT Syllabus</span>
              <Link to="/batch2/subjects" className="text-xs font-bold text-indigo-600 hover:underline">
                View Syllabus
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displaySubjects.map((sub, idx) => (
                <div 
                  key={idx}
                  className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col justify-between gap-4 card-interactive"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display font-bold text-sm text-slate-800">{sub.name}</h4>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">{sub.current_chapter ?? 'Explore Topics'}</span>
                    </div>
                    <span className="text-xl">
                      {sub.emoji ?? (sub.name.includes('Math') ? '📐' : sub.name.includes('Science') ? '🔬' : sub.name.includes('English') ? '📖' : '🗺️')}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                      <span>Completion</span>
                      <span>{sub.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className={`progress-fill bg-indigo-600`} style={{ width: `${sub.progress}%` }}></div>
                    </div>
                  </div>

                  <Link 
                    to="/batch2/subjects"
                    className="mt-1 flex items-center justify-between text-[10px] font-bold text-indigo-600 hover:text-indigo-800 border-t border-slate-100 pt-2"
                  >
                    <span>Continue Chapter</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: daily challenges & leaderboard */}
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
              {challenges === null ? (
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

          {/* Leaderboard snippet */}
          <div className="bento-card border border-indigo-100 bg-white p-5 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="font-display font-bold text-xs text-slate-700">Leaderboard Podium</span>
              <Link to="/batch2/leaderboard" className="text-[10px] font-bold text-indigo-600 hover:underline">
                View Full Rank
              </Link>
            </div>

            <div className="flex flex-col gap-2 font-sans text-xs">
              {displayLeaderboard.map((usr) => (
                <div 
                  key={usr.rank}
                  className={`p-2 px-3 rounded-xl flex items-center justify-between border ${
                    usr.fullName.includes('You') || usr.fullName.toLowerCase().includes(studentName.toLowerCase())
                      ? 'bg-indigo-50/50 border-indigo-100/50 font-bold' 
                      : 'bg-slate-50/50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-display font-black text-slate-400 w-4 block text-center">#{usr.rank}</span>
                    <span className="text-lg">{usr.avatar}</span>
                    <span className="text-slate-700 truncate max-w-[100px]">{usr.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px]">
                    <span>{usr.xp} XP</span>
                  </div>
                </div>
              ))}
              {leaderboard && leaderboard.myRank > 3 && (
                <div className="p-2 px-3 rounded-xl bg-indigo-50/30 border border-indigo-100 text-center font-bold text-[10px] text-indigo-600">
                  Your Current Rank: #{leaderboard.myRank}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
