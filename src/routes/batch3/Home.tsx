import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Flame, Star, Trophy, BookOpen, Compass, ChevronRight, MessageSquare, Clock, AlertTriangle, Play } from 'lucide-react';

export const Batch3Home: React.FC = () => {
  const navigate = useNavigate();
  const { studentName, studentAvatar, studentXP, studentStreak } = useApp();

  const subjects = [
    { name: 'Mathematics', progress: 58, color: 'bg-sky-500', current: 'Ch 6 Triangles' },
    { name: 'Science', progress: 72, color: 'bg-sky-600', current: 'Ch 4 Carbon Compounds' },
    { name: 'English', progress: 85, color: 'bg-cyan-500', current: 'Ch 8 Nelson Mandela' },
    { name: 'Social Science', progress: 61, color: 'bg-cyan-600', current: 'Ch 5 Nationalism in India' },
    { name: 'Hindi', progress: 90, color: 'bg-sky-400', current: 'Ch 3 Kabir ke Dohe' }
  ];

  const importantTopics = [
    { topic: 'Quadratic Equations Solver', freq: 5, color: 'text-red-500 bg-red-50 border-red-100' },
    { topic: 'Ray Optics Diagrams', freq: 4, color: 'text-orange-500 bg-orange-50 border-orange-100' },
    { topic: 'Chemical reactions & Balancing', freq: 5, color: 'text-red-500 bg-red-50 border-red-100' }
  ];

  return (
    <div className="flex flex-col gap-6 select-none anim-fade-up">
      {/* Board Exam Countdown Banner */}
      <div className="bg-gradient-to-r from-sky-400 via-sky-500 to-cyan-500 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg shadow-sky-500/10">
        <div>
          <h2 className="font-display font-extrabold text-3xl tracking-tight">
            273 Days to CBSE Boards!
          </h2>
          <p className="font-sans text-xs text-sky-100 font-medium mt-1">
            Target Exam Date: March 15, 2027 · Syllabus Readiness: 73.2%
          </p>
        </div>
        <div className="flex gap-3 select-none">
          <Link 
            to="/batch3/board-prep"
            className="py-3 px-6 rounded-2xl bg-white hover:bg-slate-50 text-sky-950 font-sans font-bold text-xs shadow-md transition-all"
          >
            Board Prep Zone
          </Link>
          <Link 
            to="/batch3/pomodoro"
            className="py-3 px-6 rounded-2xl bg-sky-600/30 border border-sky-400/30 hover:bg-sky-600/40 text-white font-sans font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <Play size={12} className="fill-white" />
            Start Pomodoro
          </Link>
        </div>
      </div>

      {/* Weak area alert */}
      {subjects.some(s => s.progress < 60) && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 text-xs text-red-800 animate-fade-up">
          <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Weak Areas Warning!</span>
            <p className="font-sans text-red-700 leading-normal mt-0.5">
              Your "Mathematics" syllabus is currently at 58% which is below the target 60%. Review topic weightage trends to boost score.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left col: Subjects checklist */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="bento-card border border-sky-100 bg-white p-5 flex flex-col gap-4">
            <span className="font-display font-bold text-sm text-slate-800">Your Board Syllabus</span>
            
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
                    {sub.progress < 60 ? (
                      <span className="badge pill-rose text-[9px] font-bold select-none">Weak</span>
                    ) : (
                      <span className="badge pill-sky text-[9px] font-bold select-none">Normal</span>
                    )}
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
                    to="/batch3/subjects"
                    className="mt-1 flex items-center justify-between text-[10px] font-bold text-sky-600 hover:text-sky-800 border-t border-slate-100 pt-2"
                  >
                    <span>Syllabus Checklist</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right col: important topics & mock exams */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Important topics today */}
          <div className="bento-card border border-sky-100 bg-white p-5 flex flex-col gap-4">
            <div>
              <span className="font-display font-bold text-xs text-slate-700 block">AI-Curated Important Topics</span>
              <p className="font-sans text-[10px] text-slate-400 mt-0.5">Frequent questions in CBSE boards</p>
            </div>
            
            <div className="flex flex-col gap-3 font-sans text-xs">
              {importantTopics.map((item, idx) => (
                <div 
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${item.color}`}
                >
                  <span className="font-bold truncate max-w-[150px]">{item.topic}</span>
                  {/* Frequency bars */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, bIdx) => (
                      <div 
                        key={bIdx}
                        className={`w-2.5 h-2.5 rounded-xs ${
                          bIdx < item.freq ? 'bg-red-500 animate-pulse' : 'bg-slate-200'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming mock */}
          <div className="bento-card border border-sky-100 bg-white p-5 flex flex-col gap-4">
            <span className="font-display font-bold text-xs text-slate-700">Practice Exam Countdown</span>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl text-xs select-none">
              <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-100 text-sky-500 flex items-center justify-center">
                <Clock size={16} />
              </div>
              <div>
                <span className="font-bold text-slate-700 block">Light Reflection Ch 10</span>
                <span className="text-slate-400 text-[10px] block mt-0.5">Scheduled for today</span>
              </div>
            </div>
            <Link 
              to="/batch3/exams"
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs rounded-xl text-center shadow-md transition-all"
            >
              Start Practice Quiz
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
