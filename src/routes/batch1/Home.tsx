import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Flame, Star, Trophy, BookOpen, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export const Batch1Home: React.FC = () => {
  const navigate = useNavigate();
  const { studentName, studentAvatar, studentXP, studentStreak, assignedTasks } = useApp();

  // Get tasks for Batch 1
  const b1Tasks = assignedTasks.filter(t => t.batchId === 1 && t.status !== 'Completed').slice(0, 3);

  // Subject details
  const subjects = [
    { name: 'English Lit', progress: 85, color: 'bg-amber-500', count: '10/12 stories' },
    { name: 'Maths Play', progress: 68, color: 'bg-orange-500', count: '14/20 quizzes' },
    { name: 'Science Fun', progress: 54, color: 'bg-yellow-500', count: '5/9 chapters' },
    { name: 'EVS Explorer', progress: 90, color: 'bg-amber-600', count: '9/10 badges' }
  ];

  // XP level calculation
  const levelNum = Math.floor(studentXP / 1000) + 1;
  const currentLevelXP = studentXP % 1000;
  const levelProgressPercent = (currentLevelXP / 1000) * 100;

  return (
    <div className="flex flex-col gap-6 select-none anim-fade-up">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-amber-500/10">
        <div className="flex items-center gap-5">
          <div className="w-18 h-18 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-4xl shadow-sm">
            {studentAvatar}
          </div>
          <div>
            <h2 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight">
              Hello, {studentName}!
            </h2>
            <p className="font-sans text-xs text-amber-50 font-medium mt-1">
              You are doing great! Let's collect some more stars today. ⭐
            </p>
          </div>
        </div>

        {/* Level XP display */}
        <div className="w-full md:w-64 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs font-bold">
            <span>LEVEL {levelNum}</span>
            <span>{currentLevelXP} / 1000 XP</span>
          </div>
          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: `${levelProgressPercent}%` }}></div>
          </div>
          <span className="text-[10px] text-amber-100 font-semibold text-right block mt-0.5">
            {1000 - currentLevelXP} XP to Level {levelNum + 1}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Side: Today's Tasks & Subjects */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {/* Today's Tasks */}
          <div className="bento-card border border-amber-100/50 bg-white flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-lg text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">task_alt</span>
                Today's Homework
              </h3>
              <Link to="/batch1/tasks" className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-0.5">
                View All Tasks
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="flex flex-col gap-2.5">
              {b1Tasks.length > 0 ? (
                b1Tasks.map((t) => (
                  <div 
                    key={t.id}
                    className="p-3.5 px-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/50 hover:border-slate-200 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        t.status === 'In Progress' ? 'bg-amber-500' : 'bg-slate-300'
                      }`}></div>
                      <div>
                        <span className="font-sans font-bold text-xs text-slate-700 block">{t.title}</span>
                        <span className="text-[10px] font-semibold text-slate-400 font-label-caps block mt-0.5">
                          {t.subject} · Due {t.dueDate}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="badge pill-amber text-[10px] font-black">+{t.xp} XP</span>
                      <Link 
                        to={t.subject === 'English' ? '/batch1/stories' : t.subject === 'Maths' ? '/batch1/games' : '/batch1/tasks'}
                        className="p-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-sans font-bold text-[10px] rounded-lg shadow-xs"
                      >
                        Start
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center gap-2">
                  <span className="text-2xl">🎉</span>
                  <span className="font-sans font-bold text-xs text-slate-500">All tasks completed!</span>
                  <span className="text-[10px] text-slate-400">Great job for the day!</span>
                </div>
              )}
            </div>
          </div>

          {/* Subject Cards */}
          <div className="grid grid-cols-2 gap-4">
            {subjects.map((sub, idx) => (
              <div 
                key={idx}
                className="bento-card border border-amber-100/50 bg-white card-interactive flex flex-col justify-between gap-4 p-5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-display font-bold text-sm text-slate-800">{sub.name}</h4>
                    <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">{sub.count}</span>
                  </div>
                  <span className="text-xl select-none">
                    {sub.name.includes('English') ? '📖' : sub.name.includes('Maths') ? '🔢' : sub.name.includes('Science') ? '🔬' : '🌱'}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                    <span>Progress</span>
                    <span>{sub.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${sub.color}`} style={{ width: `${sub.progress}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: recommended widgets */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Daily Challenge card */}
          <div className="bento-card bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-100/60 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between select-none">
              <span className="font-label-caps text-[9px] font-black text-amber-700">RECOMMENDED</span>
              <Sparkles size={16} className="text-amber-500 animate-pulse" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-amber-950 mb-1">Weekly Adventure Story</h4>
              <p className="font-sans text-[11px] text-amber-800/80 leading-relaxed">
                Read "The Clever Monkey and the Crocodile" story, listen to the narrator, and collect ⭐ 3 stars.
              </p>
            </div>
            <Link 
              to="/batch1/stories"
              className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-sans font-bold text-xs rounded-xl text-center shadow-md shadow-amber-500/15"
            >
              Open Story Reader →
            </Link>
          </div>

          {/* 7-day streak calendar */}
          <div className="bento-card border border-amber-100/50 bg-white p-5 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="font-display font-bold text-xs text-slate-700">Streak Progress</span>
              <div className="flex items-center gap-0.5 text-amber-500 text-xs font-bold">
                <Flame size={14} className="fill-amber-500" />
                <span>{studentStreak}d</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center bg-slate-50 border border-slate-100 p-2 rounded-xl">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold text-slate-400">{day}</span>
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black ${
                    idx < 5 ? 'bg-amber-500 text-white' : 'border-2 border-slate-200 text-transparent'
                  }`}>
                    {idx < 5 ? '✓' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges recently earned */}
          <div className="bento-card border border-amber-100/50 bg-white p-5 flex flex-col gap-3">
            <span className="font-display font-bold text-xs text-slate-700">Recent Badges</span>
            <div className="flex gap-2.5 overflow-x-auto py-1">
              {[
                { icon: '🦁', label: 'Math Hero' },
                { icon: '⭐', label: 'Streak 7d' },
                { icon: '🚀', label: 'Space Quiz' }
              ].map((badge, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-100 p-2 px-3 rounded-xl flex flex-col items-center gap-1 shrink-0 text-center min-w-[70px]">
                  <span className="text-xl">{badge.icon}</span>
                  <span className="text-[8px] font-bold text-slate-500">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
