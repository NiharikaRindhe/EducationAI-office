import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Check } from 'lucide-react';

export const Features: React.FC = () => {
  const featuresList = [
    {
      icon: '🤖',
      title: 'AI-Powered Learning',
      gradient: 'from-indigo-500 to-violet-600',
      pills: ['Smart Recommendations', 'Gap Analysis', 'Adaptive Quizzes'],
      desc: 'Our neural student engines track daily responses to target weak concept areas and suggest quick revision reading pages.'
    },
    {
      icon: '📚',
      title: 'NCERT-Aligned Content',
      gradient: 'from-sky-400 to-cyan-500',
      pills: ['Chapter-wise Coverage', 'Board Exam Focus', 'PYQ Bank'],
      desc: 'All study material is synchronized with the latest NCERT textbooks, matching CBSE guidelines for Class 1 through Class 12.'
    },
    {
      icon: '🏆',
      title: 'Gamified Motivation',
      gradient: 'from-amber-400 to-orange-500',
      pills: ['Daily Streaks', 'Leaderboards', 'Achievement Badges'],
      desc: 'Transform tedious homework into playful milestones. Students earn XP, unlock stars, and collect custom avatar badges.'
    },
    {
      icon: '📊',
      title: 'Real-time Analytics',
      gradient: 'from-emerald-400 to-teal-500',
      pills: ['Live Dashboards', 'Heatmaps', 'Export Reports'],
      desc: 'Teachers view class heatmap reports to check student progress. Parents receive daily whatsapp notifications on completed work.'
    },
    {
      icon: '🎯',
      title: 'Board Exam Readiness',
      gradient: 'from-rose-500 to-pink-600',
      pills: ['Board Countdown', 'PYQ Papers', 'Concept Maps'],
      desc: 'Class 9–10 students prepare with past-year papers, chapter concept maps, Pomodoro focus sessions, and a live countdown to boards.'
    },
    {
      icon: '🏫',
      title: 'Live Lab Sessions',
      gradient: 'from-violet-500 to-purple-600',
      pills: ['One-tap PIN Login', 'Raise Hand', 'Session Control'],
      desc: 'Teachers start a class session and the whole lab logs in — Class 1–4 with just a name and PIN. Sessions end centrally so no account is left open.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 bg-white">
      {/* Navbar (Fixed, White) */}
      <nav className="fixed top-0 inset-x-0 h-[68px] bg-white border-b border-slate-100 z-50 px-8 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-display font-bold text-white text-lg">
            E
          </Link>
          <Link to="/" className="font-display font-bold text-lg text-slate-800">EduAI</Link>
        </div>

        <div className="hidden md:flex items-center gap-8 font-sans text-sm font-semibold text-slate-500">
          <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
          <a href="#details" className="text-indigo-600 font-bold">Features</a>
          <Link to="/pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link>
          <Link to="/login" className="hover:text-indigo-600 transition-colors">Portals</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="font-sans text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
            Login
          </Link>
          <Link to="/register" className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-sm font-bold shadow-md shadow-indigo-500/10 transition-all flex items-center gap-1">
            Get Started
            <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-[120px] pb-16 w-full flex flex-col items-center gap-16">
        <div className="text-center max-w-4xl px-8 flex flex-col items-center gap-5">
          <span className="badge pill-indigo font-bold">EDUAI PLATFORM FEATURES</span>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl text-slate-900 tracking-tight leading-[1.2]">
            Features built for <span className="text-indigo-600">Indian classrooms.</span>
          </h1>
          <p className="font-sans text-slate-500 text-md max-w-xl">
            A comprehensive suite of tools designed to reduce teacher workload and maximize student learning efficiency.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="w-[90%] max-w-5xl bg-gradient-to-r from-indigo-600 to-violet-700 rounded-3xl p-6 py-8 shadow-xl shadow-indigo-600/10 text-white flex justify-around gap-6 text-center select-none">
          {[
            { value: '50,000+', label: 'Active Students' },
            { value: '98%', label: 'CBSE Coverage' },
            { value: '500+', label: 'Schools Partnered' },
            { value: '4.8★', label: 'Play Store Rating' }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col gap-0.5">
              <span className="font-display font-extrabold text-2xl md:text-3xl">{item.value}</span>
              <span className="font-sans text-[10px] text-indigo-100 font-semibold uppercase tracking-wider">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Grid Features */}
        <section id="details" className="w-[90%] max-w-6xl px-4 grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
          {featuresList.map((feat, idx) => (
            <div key={idx} className="bento-card border border-slate-100 flex flex-col justify-between gap-5 p-7 card-interactive text-left">
              <div className="flex flex-col gap-3.5">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${feat.gradient} text-white flex items-center justify-center text-xl shadow-md select-none`}>
                  {feat.icon}
                </div>
                <h3 className="font-display font-bold text-lg text-slate-800">{feat.title}</h3>
                <p className="font-sans text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>

              {/* Pills container */}
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                {feat.pills.map((pill, pIdx) => (
                  <span key={pIdx} className="text-[10px] font-semibold px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 whitespace-nowrap">
                    {pill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* CTA Banner */}
        <section className="w-[90%] max-w-5xl px-4 pt-12">
          <div className="bg-gradient-to-tr from-indigo-900 to-indigo-800 rounded-3xl p-10 text-white text-center flex flex-col items-center gap-6 relative overflow-hidden shadow-xl">
            <h2 className="font-display font-bold text-2xl md:text-3xl">Ready to transform your school?</h2>
            <p className="font-sans text-xs text-indigo-200 max-w-md">
              Connect with our academic directors to deploy EduAI in your CBSE classrooms. Integrate parent connections and student dashboards in a single day.
            </p>
            <div className="flex gap-4">
              <Link to="/register" className="py-2.5 px-5 rounded-xl bg-white hover:bg-slate-50 text-indigo-950 font-sans font-bold text-sm shadow-md transition-all">
                Start Free Trial
              </Link>
              <button className="py-2.5 px-5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 hover:bg-indigo-500/30 text-white font-sans font-bold text-sm transition-all">
                Talk to Us
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-slate-950 text-slate-500 py-10 border-t border-slate-900 px-8 text-center text-xs">
        <p>© {new Date().getFullYear()} EduAI Learning Pvt. Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
};
