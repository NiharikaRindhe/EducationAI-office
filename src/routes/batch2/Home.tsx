import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Flame, Star, Trophy, BookOpen, Compass, ChevronRight, MessageSquare, Clock } from 'lucide-react';

export const Batch2Home: React.FC = () => {
  const navigate = useNavigate();
  const { studentName, studentAvatar, studentXP, studentStreak } = useApp();

  const subjects = [
    { name: 'Mathematics', progress: 78, color: 'bg-indigo-600', current: 'Ch 4 Linear Equations' },
    { name: 'Science', progress: 64, color: 'bg-indigo-500', current: 'Ch 5 Cell Structure' },
    { name: 'English', progress: 91, color: 'bg-violet-500', current: 'Ch 6 Novel: The Lost Key' },
    { name: 'Social Science', progress: 83, color: 'bg-purple-600', current: 'Ch 3 French Revolution' }
  ];

  const leaderboardTop3 = [
    { rank: 1, name: 'Aisha', xp: 4890, avatar: '🦋', change: 'up' },
    { rank: 2, name: 'Dev (You)', xp: studentXP, avatar: studentAvatar, change: 'same' },
    { rank: 3, name: 'Arjun', xp: 3820, avatar: '🦁', change: 'down' }
  ];

  return (
    <div className="flex flex-col gap-6 select-none anim-fade-up">
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
              {subjects.map((sub, idx) => (
                <div 
                  key={idx}
                  className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col justify-between gap-4 card-interactive"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display font-bold text-sm text-slate-800">{sub.name}</h4>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">{sub.current}</span>
                    </div>
                    <span className="text-xl">
                      {sub.name.includes('Math') ? '📐' : sub.name.includes('Science') ? '🔬' : sub.name.includes('English') ? '📖' : '🗺️'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                      <span>Completion</span>
                      <span>{sub.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className={`progress-fill ${sub.color}`} style={{ width: `${sub.progress}%` }}></div>
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

        {/* Right column: leaderboard, exam tracker & chat snippet */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Upcoming Exam Card */}
          <div className="bento-card border border-indigo-100 bg-white p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="font-display font-bold text-xs text-slate-700">Upcoming Test</span>
              <span className="badge pill-rose text-[9px] font-bold">CBSE Pattern</span>
            </div>
            
            <div className="flex items-center gap-3.5 select-none bg-slate-50 border border-slate-100 p-3 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center">
                <Clock size={18} />
              </div>
              <div>
                <span className="font-sans font-bold text-xs text-slate-700 block">Term Algebra Quiz</span>
                <span className="text-[9px] text-slate-400 font-medium block mt-0.5">Duration: 30 mins · Class 7</span>
              </div>
            </div>

            <Link 
              to="/batch2/exams"
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs rounded-xl text-center shadow-md shadow-indigo-600/10"
            >
              Enter Exam Room
            </Link>
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
              {leaderboardTop3.map((usr) => (
                <div 
                  key={usr.rank}
                  className={`p-2 px-3 rounded-xl flex items-center justify-between border ${
                    usr.name.includes('You') 
                      ? 'bg-indigo-50/50 border-indigo-100/50 font-bold' 
                      : 'bg-slate-50/50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-display font-black text-slate-400 w-4 block text-center">#{usr.rank}</span>
                    <span className="text-lg">{usr.avatar}</span>
                    <span className="text-slate-700 truncate max-w-[100px]">{usr.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px]">
                    <span>{usr.xp} XP</span>
                    <span className={usr.change === 'up' ? 'text-emerald-500' : usr.change === 'down' ? 'text-red-500' : 'text-slate-400'}>
                      {usr.change === 'up' ? '▲' : usr.change === 'down' ? '▼' : '●'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
