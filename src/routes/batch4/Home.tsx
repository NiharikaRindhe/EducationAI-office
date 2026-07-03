import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Flame, Star, Trophy, BookOpen, Compass, ChevronRight, MessageSquare, Clock, AlertTriangle, Play } from 'lucide-react';

export const Batch4Home: React.FC = () => {
  const navigate = useNavigate();
  const { studentName, studentAvatar, studentXP, studentStreak, currentStream } = useApp();

  // Redirect if not onboarded
  useEffect(() => {
    const onboarded = localStorage.getItem('batch4_onboarded');
    if (!onboarded) {
      navigate('/batch4/onboarding');
    }
  }, [navigate]);

  const jeeSubjects = [
    { name: 'Physics', progress: 75, color: 'bg-purple-600', current: 'Ch 5 Electrodynamics' },
    { name: 'Chemistry', progress: 62, color: 'bg-indigo-600', current: 'Ch 4 Organic chemistry' },
    { name: 'Mathematics', progress: 84, color: 'bg-slate-700', current: 'Ch 7 Integrals' }
  ];

  const neetSubjects = [
    { name: 'Physics', progress: 75, color: 'bg-purple-600', current: 'Ch 5 Electrodynamics' },
    { name: 'Chemistry', progress: 62, color: 'bg-indigo-600', current: 'Ch 4 Organic chemistry' },
    { name: 'Biology', progress: 91, color: 'bg-emerald-600', current: 'Ch 9 Genetics' }
  ];

  const subjects = currentStream === 'JEE' ? jeeSubjects : neetSubjects;

  return (
    <div className="flex flex-col gap-6 select-none anim-fade-up">
      {/* Top Welcome Panel */}
      <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-purple-800 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg shadow-purple-900/10">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-display font-extrabold text-2xl tracking-tight">
              Study Room: {studentName}
            </h2>
            <span className="badge pill-purple border-white/20 bg-white/10 text-white font-black">
              {currentStream} STREAM
            </span>
          </div>
          <p className="font-sans text-xs text-purple-200 mt-1">
            Target: 2027 Entrance Exam · Average Readiness: 78.4%
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
        
        {/* Left col: Subjects checklists */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="bento-card border border-purple-100 bg-white p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="font-display font-bold text-sm text-slate-800">Your Entrance Syllabus</span>
              <Link to="/batch4/jee-neet-prep" className="text-xs font-bold text-purple-600 hover:underline">
                View Entrance Hub
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {subjects.map((sub, idx) => (
                <div 
                  key={idx}
                  className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col justify-between gap-4 card-interactive text-left"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display font-bold text-xs text-slate-800">{sub.name}</h4>
                      <span className="text-[9px] text-slate-400 font-medium mt-0.5 block truncate max-w-[120px]">{sub.current}</span>
                    </div>
                    <span className="text-lg">
                      {sub.name === 'Physics' ? '⚡' : sub.name === 'Chemistry' ? '🧪' : sub.name === 'Biology' ? '🧬' : '📐'}
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
                    to="/batch4/subjects"
                    className="mt-1 flex items-center justify-between text-[9px] font-bold text-purple-600 hover:text-purple-800 border-t border-slate-100 pt-2"
                  >
                    <span>Syllabus Checklist</span>
                    <ChevronRight size={12} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right col: rank predictor & planner widgets */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Readiness Gauge */}
          <div className="bento-card border border-purple-100 bg-white p-5 text-center flex flex-col items-center gap-4">
            <span className="font-display font-bold text-xs text-slate-700 block">Overall Entrance Readiness</span>
            
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="28" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                <circle cx="64" cy="64" r="28" fill="transparent" stroke="#8b5cf6" strokeWidth="6" strokeDasharray="175" strokeDashoffset="40" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center font-display font-black text-xl text-slate-800">
                77%
              </div>
            </div>
          </div>

          {/* Rank predictor widget */}
          <div className="bento-card border border-purple-100 bg-white p-5 flex flex-col gap-4 text-left">
            <div>
              <span className="font-display font-bold text-xs text-slate-700 block">Rank Predictor Model</span>
              <p className="font-sans text-[10px] text-slate-400 mt-0.5">Based on latest test averages</p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs font-bold text-slate-700 select-none">
              <span>Predicted AIR</span>
              <span className="text-purple-600 font-display font-black">1,200 – 1,800</span>
            </div>
            
            <Link 
              to="/batch4/jee-neet-prep"
              className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs rounded-xl text-center shadow-md shadow-purple-600/10"
            >
              Analyze Percentile Cutoffs
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
