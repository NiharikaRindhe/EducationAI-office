import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Flame, Sparkles, Trophy, BookOpen, Award, CheckCircle, GraduationCap, School, ShieldCheck } from 'lucide-react';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ grades: 0, batches: 0, games: 0, ncert: 0 });

  // Animate stats counter on load
  useEffect(() => {
    const duration = 1500;
    const steps = 50;
    const stepTime = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setStats({
        grades: Math.min(Math.round((12 / steps) * currentStep), 12),
        batches: Math.min(Math.round((4 / steps) * currentStep), 4),
        games: Math.min(Math.round((16 / steps) * currentStep), 16),
        ncert: Math.min(Math.round((100 / steps) * currentStep), 100),
      });

      if (currentStep >= steps) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
  }, []);

  const batchesData = [
    {
      id: 1,
      name: 'Batch 1',
      grades: 'Class 1–4',
      tagline: 'Playful Learning',
      desc: 'High-energy, gamified environment focusing on foundational concepts, storytelling, and early-stage interactive mini-games.',
      color: 'amber',
      accentBg: 'bg-amber-500',
      textColor: 'text-amber-600',
      gradient: 'from-amber-400 to-orange-500',
      features: ['🎮 16 Mini Games', '📖 Illustrated Stories', '🎤 AI Show & Tell', '⭐ Star Quizzes'],
      stats: '16 Games Loaded',
      link: '/batch1/home'
    },
    {
      id: 2,
      name: 'Batch 2',
      grades: 'Class 5–8',
      tagline: 'Academic Foundations',
      desc: 'Structured, NCERT-focused roadmap helping middle schoolers master core sciences, history, and basic analytics with AI doubt solving.',
      color: 'indigo',
      accentBg: 'bg-indigo-600',
      textColor: 'text-indigo-600',
      gradient: 'from-indigo-500 to-violet-600',
      features: ['🤖 AI doubt solver chat', '📝 Chapter Notes manager', '🏆 Classroom Leaderboard', '🔖 PYQ Paper Hub'],
      stats: '50+ NCERT Chapters',
      link: '/batch2/home'
    },
    {
      id: 3,
      name: 'Batch 3',
      grades: 'Class 9–10',
      tagline: 'Board Readiness',
      desc: 'Rigorous preparation suite geared towards CBSE Board Exams, combining complex concept mapping, Pomodoro logging, and analytical prep.',
      color: 'sky',
      accentBg: 'bg-sky-500',
      textColor: 'text-sky-600',
      gradient: 'from-sky-400 to-cyan-500',
      features: ['📋 Board Prep countdown', '🗺️ Interactive Concept Maps', '🍅 Pomodoro Focus Timer', '⚡ CBSE HOTS Challenges'],
      stats: 'March 2026 Target Board',
      link: '/batch3/home'
    },
    {
      id: 4,
      name: 'Batch 4',
      grades: 'Class 11–12',
      tagline: 'Entrance & Career Paths',
      desc: 'Advanced "Pro Mode" workspace tailored for JEE & NEET aspirants, incorporating rank predictors, topic weightage models, and AI planners.',
      color: 'slate',
      accentBg: 'bg-purple-600',
      textColor: 'text-purple-600',
      gradient: 'from-slate-700 to-purple-600',
      features: ['🎯 JEE/NEET Stream switch', '📊 Rank Predictor model', '📅 AI Study Planner calendar', '🎓 Career Path recommendations'],
      stats: 'JEE/NEET Competitive Focus',
      link: '/batch4/home'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 bg-[#fcf8ff]">
      {/* 3 Floating blurred orbs in background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/10 w-[500px] h-[500px] rounded-full bg-indigo-200/30 blur-[100px] anim-float"></div>
        <div className="absolute top-2/3 right-1/10 w-[600px] h-[600px] rounded-full bg-purple-200/20 blur-[120px] anim-float" style={{ animationDelay: '-2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-amber-100/20 blur-[80px] anim-spin-slow"></div>
      </div>

      {/* Navigation bar */}
      <nav className="fixed top-0 inset-x-0 h-[68px] glass z-50 px-8 flex items-center justify-between shadow-xs border-b border-white/40 select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-display font-bold text-white text-lg">
            E
          </div>
          <span className="font-display font-bold text-lg text-slate-800">EduAI</span>
          <span className="badge pill-indigo ml-2">For Schools</span>
        </div>

        <div className="hidden md:flex items-center gap-8 font-sans text-sm font-semibold text-slate-500">
          <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
          <a href="#batches" className="hover:text-indigo-600 transition-colors">Batches</a>
          <Link to="/pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link>
          <Link to="/login" className="hover:text-indigo-600 transition-colors">Portals</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="font-sans text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">
            Explore
          </Link>
          <Link to="/register" className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-sans text-sm font-bold shadow-md shadow-indigo-500/10 hover:shadow-lg transition-all flex items-center gap-1.5">
            Get Started
            <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-[120px] pb-16 px-8 max-w-7xl mx-auto w-full flex flex-col items-center gap-16">
        <div className="text-center max-w-4xl flex flex-col items-center gap-6">
          {/* Announcement pill */}
          <div className="anim-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100/50 shadow-xs">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="text-xs font-semibold text-emerald-800">Now live for CBSE Schools across India</span>
            <ArrowRight size={12} className="text-emerald-800" />
          </div>

          {/* Title */}
          <h1 className="font-display font-extrabold text-5xl md:text-7xl text-slate-900 tracking-tight leading-[1.1] anim-fade-up" style={{ animationDelay: '0.1s' }}>
            The AI Platform for <br />
            <span className="relative">
              <span className="bg-gradient-to-r from-indigo-500 via-violet-600 to-purple-600 bg-clip-text text-transparent">Every Student,</span>
              <span className="absolute bottom-1.5 left-0 w-full h-2 bg-indigo-500/10 rounded-full -z-10"></span>
            </span> Every Grade.
          </h1>

          <p className="font-sans text-lg text-slate-500 max-w-2xl anim-fade-up" style={{ animationDelay: '0.2s' }}>
            An adaptive, B2B education system for Indian classrooms. Delivering gamified journeys for Class 1-4, rigorous NCERT studies for Class 5-10, and high-performance JEE/NEET analytics for Class 11-12.
          </p>

          {/* CTA Row */}
          <div className="flex items-center gap-4 mt-2 anim-fade-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/login" className="py-3.5 px-7 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold shadow-lg shadow-indigo-600/20 hover:shadow-xl transition-all flex items-center gap-2 hover:-translate-y-0.5">
              Explore the Platform
              <ArrowRight size={18} />
            </Link>
            <a href="#batches" className="py-3.5 px-7 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-sans font-bold transition-all hover:-translate-y-0.5">
              View All Batches
            </a>
          </div>
        </div>

        {/* Bento Preview Grid */}
        <div className="w-full grid grid-cols-12 gap-6 anim-fade-up" style={{ animationDelay: '0.4s' }}>
          {/* Streak Card */}
          <div className="bento-card col-span-12 md:col-span-4 flex flex-col justify-between gap-4 card-interactive select-none">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-xs text-slate-400">DAILY ENGAGEMENT</span>
              <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
                <Flame size={20} className="fill-amber-500" />
              </div>
            </div>
            <div>
              <h3 className="font-display font-extrabold text-3xl text-slate-800 mb-1">🔥 12 Days!</h3>
              <p className="font-sans text-xs text-slate-400">Streak count this month. Keep it going!</p>
            </div>
            <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-2xl">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400">{day}</span>
                  <div className={`w-3.5 h-3.5 rounded-full ${idx < 5 ? 'bg-amber-500 shadow-xs shadow-amber-500/20' : 'border-2 border-slate-200'}`}></div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Chat Card */}
          <div className="bento-card col-span-12 md:col-span-5 flex flex-col justify-between gap-4 card-interactive">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-xs text-slate-400">AI TUTOR ASSISTANT</span>
              <span className="badge pill-indigo">NCERT Ch.3</span>
            </div>
            {/* Mock chat conversation */}
            <div className="flex flex-col gap-3 font-sans text-xs my-1">
              <div className="self-end bg-indigo-600 text-white rounded-2xl p-2.5 rounded-tr-xs max-w-[85%] font-medium">
                How does Newton's second law apply in real life?
              </div>
              <div className="self-start bg-slate-50 border border-slate-100 text-slate-700 rounded-2xl p-2.5 rounded-tl-xs max-w-[85%] leading-relaxed">
                It explains why pushing an empty swing is easy, but pushing a heavy person needs a lot more force! \(F = ma\)
              </div>
            </div>
            <div className="w-full flex items-center justify-between p-1 px-3 bg-slate-100 rounded-xl text-slate-400 text-xs">
              <span>Ask about F=ma...</span>
              <span className="material-symbols-outlined text-sm">send</span>
            </div>
          </div>

          {/* Badges Card */}
          <div className="bento-card col-span-12 md:col-span-3 flex flex-col justify-between gap-4 card-interactive">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-xs text-slate-400">RECENT REWARDS</span>
              <Trophy size={18} className="text-amber-500" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-center select-none">
              {[
                { icon: '⭐', label: 'First Quiz', bg: 'bg-amber-50' },
                { icon: '🔥', label: '7-Day Streak', bg: 'bg-orange-50' },
                { icon: '🧠', label: 'Quiz Master', bg: 'bg-indigo-50' },
                { icon: '📸', label: 'Explorer', bg: 'bg-purple-50' },
              ].map((badge, idx) => (
                <div key={idx} className={`${badge.bg} p-2 rounded-xl border border-slate-100/50 flex flex-col items-center gap-1`}>
                  <span className="text-lg">{badge.icon}</span>
                  <span className="text-[9px] font-bold text-slate-600 whitespace-nowrap">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Progress Card */}
          <div className="bento-card col-span-12 md:col-span-6 flex flex-col justify-between gap-4 card-interactive">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-xs text-slate-400">STUDENT READINESS</span>
              <span className="text-xs font-bold text-indigo-600">Grade average: 81%</span>
            </div>
            <div className="flex flex-col gap-3.5 my-1">
              {[
                { name: 'Mathematics', value: 78, color: 'bg-indigo-500' },
                { name: 'Science & Tech', value: 64, color: 'bg-sky-500' },
                { name: 'English Literature', value: 91, color: 'bg-amber-500' }
              ].map((sub, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                    <span>{sub.name}</span>
                    <span>{sub.value}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${sub.color}`} style={{ width: `${sub.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Board Countdown Card */}
          <div className="bento-card col-span-12 md:col-span-6 flex flex-col justify-between gap-4 card-interactive">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-xs text-slate-400">BOARD EXAM TRACKER</span>
              <span className="badge pill-rose">Urgent</span>
            </div>
            <div className="flex justify-between items-center gap-4 my-1 select-none">
              <div>
                <h3 className="font-display font-extrabold text-4xl text-slate-800">87 Days</h3>
                <p className="font-sans text-xs text-slate-400">To CBSE Board Exam 2026</p>
              </div>
              <div className="text-right">
                <span className="font-display font-bold text-2xl text-rose-500">65%</span>
                <p className="font-sans text-xs text-slate-400">Syllabus Complete</p>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill bg-rose-500" style={{ width: '65%' }}></div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="w-full bg-gradient-to-r from-indigo-600 to-violet-700 rounded-3xl p-8 py-10 shadow-xl shadow-indigo-600/10 text-white flex flex-col md:flex-row justify-around gap-8 text-center select-none">
          {[
            { value: `${stats.grades}+`, label: 'Grade Levels' },
            { value: `${stats.batches}`, label: 'Learning Batches' },
            { value: `${stats.games}`, label: 'Interactive Games' },
            { value: `${stats.ncert}%`, label: 'NCERT Aligned' }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <span className="font-display font-extrabold text-4xl md:text-5xl">{item.value}</span>
              <span className="font-sans text-xs text-indigo-100 font-medium tracking-wide uppercase">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Batch Showcase Section */}
        <section id="batches" className="w-full pt-16 flex flex-col gap-12">
          <div className="text-center flex flex-col gap-2">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-900">One Platform. Four Worlds.</h2>
            <p className="font-sans text-slate-400 text-sm max-w-xl mx-auto">
              Tailored workspaces engineered with progressive maturity to grow with the student.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {batchesData.map((batch) => (
              <div key={batch.id} className="bento-card relative overflow-hidden group border border-slate-100 shadow-md card-interactive flex flex-col justify-between gap-6 p-8 min-h-[300px]">
                {/* Decorative gradient blob behind */}
                <div className={`absolute -right-20 -bottom-20 w-48 h-48 rounded-full ${batch.accentBg} opacity-5 group-hover:opacity-15 group-hover:scale-125 transition-all blur-3xl`}></div>

                <div className="flex justify-between items-start">
                  <div>
                    <span className={`badge pill-${batch.color} mb-3`}>{batch.name}</span>
                    <h3 className="font-display font-bold text-2xl text-slate-900">{batch.grades}</h3>
                    <p className={`font-sans font-semibold text-xs ${batch.textColor} mt-0.5`}>{batch.tagline}</p>
                  </div>
                  <span className="text-2xl select-none">{batch.id === 1 ? '🎮' : batch.id === 2 ? '💬' : batch.id === 3 ? '🗺️' : '🎯'}</span>
                </div>

                <p className="font-sans text-sm text-slate-500 leading-relaxed pr-6">{batch.desc}</p>

                <div className="flex flex-wrap gap-2.5">
                  {batch.features.map((feat, idx) => (
                    <span key={idx} className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-600">
                      {feat}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-2 select-none">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{batch.stats}</span>
                  <Link to={batch.link} className={`flex items-center gap-1.5 font-sans font-bold text-sm ${batch.textColor} group-hover:translate-x-1 transition-transform`}>
                    Enter Dashboard
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full pt-16 flex flex-col gap-12">
          <div className="text-center flex flex-col gap-2">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-900">Built for Every Learning Moment</h2>
            <p className="font-sans text-slate-400 text-sm max-w-xl mx-auto">
              Our advanced features combine AI capability with CBSE standards for optimal educational outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🤖', title: 'AI-Powered Tutoring', desc: 'Instant feedback, doubt-solving formulas, and step-by-step NCERT explanations available 24/7.' },
              { icon: '🎮', title: 'Gamified Learning', desc: 'Mini-quizzes, daily streaks, stars, and leaderboards built to encourage healthy competition.' },
              { icon: '📊', title: 'Smart Analytics', desc: 'In-depth dashboard metrics for parents and teachers. Spot at-risk students and gaps early.' },
              { icon: '🗺️', title: 'Concept Maps', desc: 'Visual node diagrams tracking mathematical and chemical connections across chapters.' },
              { icon: '🎯', title: 'Career Pathway', desc: 'Intelligent score evaluation mapping to ideal branches of engineering, medicine, and research.' },
              { icon: '📋', title: 'Board Exam Prep', desc: 'Countdown tracking, past board questions, marking schemes, and expert answer tips.' }
            ].map((feat, idx) => (
              <div key={idx} className="bento-card card-interactive border border-slate-100 flex flex-col gap-3 p-6 text-left">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100/30 flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform select-none">
                  {feat.icon}
                </div>
                <h4 className="font-display font-bold text-lg text-slate-800">{feat.title}</h4>
                <p className="font-sans text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust Section */}
        <section className="w-full pt-16">
          <div className="w-full bg-gradient-to-tr from-indigo-950 to-indigo-900 rounded-3xl p-10 md:p-14 text-white text-center flex flex-col items-center gap-8 relative overflow-hidden shadow-2xl">
            {/* Dotted design background */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>

            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-4xl shadow-lg select-none">
              🏫
            </div>

            <div className="max-w-2xl flex flex-col gap-3">
              <h2 className="font-display font-extrabold text-3xl md:text-4xl">Ready to transform your school?</h2>
              <p className="font-sans text-xs text-indigo-200 leading-relaxed">
                Connect with our academic directors to deploy EduAI in your CBSE classrooms. Integrate parent connections, teacher grade books, and student dashboards in a single day.
              </p>
            </div>

            <div className="flex items-center gap-4 z-10">
              <Link to="/register" className="py-3 px-6 rounded-xl bg-white hover:bg-slate-50 text-indigo-950 font-sans font-bold shadow-md shadow-white/5 transition-all cursor-pointer">
                Try the Platform →
              </Link>
              <button className="py-3 px-6 rounded-xl bg-indigo-500/10 border border-indigo-400/30 backdrop-blur-md hover:bg-indigo-500/20 text-white font-sans font-bold transition-all cursor-pointer">
                Schedule a Demo
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-auto bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-900 px-8">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-slate-900 pb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-display font-bold text-white text-md">
                E
              </div>
              <span className="font-display font-bold text-md text-white">EduAI</span>
            </div>

            <div className="flex flex-wrap gap-8 text-xs font-semibold">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#batches" className="hover:text-white transition-colors">Batches</a>
              <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
              <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] font-medium text-slate-500">
            <span>© {new Date().getFullYear()} EduAI Learning Pvt. Ltd. All rights reserved.</span>
            <div className="flex items-center gap-6">
              <Link to="/batch1/home" className="hover:text-slate-400">Class 1-4</Link>
              <Link to="/batch2/home" className="hover:text-slate-400">Class 5-8</Link>
              <Link to="/batch3/home" className="hover:text-slate-400">Class 9-10</Link>
              <Link to="/batch4/home" className="hover:text-slate-400">Class 11-12</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
