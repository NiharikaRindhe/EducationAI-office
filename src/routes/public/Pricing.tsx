import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Check } from 'lucide-react';

/**
 * One plan, everything included.
 *
 * There are deliberately no tiers here: a school that registers gets every
 * feature the platform has. Anything listed below must actually exist in the
 * product — this page is read as a commitment by schools that sign.
 */
const INCLUDED_FEATURES = [
  'Student portal for Classes 1 to 10',
  'AI doubt-solving tutor',
  'AI exam generator and assisted grading',
  'Virtual science labs — Physics, Chemistry, Biology',
  'Interactive learning games',
  'Teacher portal — exam builder, tasks and reports',
  'School admin portal — students, teachers, timetable and labs',
  'Leaderboards, badges and daily challenges',
  'Previous year question hub',
  'Reports and analytics',
  'School content upload',
  'School branding and school-code login',
  'Lab in-charge portal and support desk',
];

export const Pricing: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(prev => (prev === idx ? null : idx));
  };

  const faqData = [
    {
      q: 'What is included in the plan?',
      a: 'Everything. There are no tiers, add-ons or locked features — every school gets the complete platform from the day it is registered.'
    },
    {
      q: 'How does per-student pricing work?',
      a: 'We charge per student enrolled on the platform. The price covers every feature listed above, for every role — students, teachers, school admins and lab in-charges.'
    },
    {
      q: 'Can we try it before committing?',
      a: 'Yes. We run a full-term pilot with interested schools so you can see the platform working in your own computer lab before signing.'
    },
    {
      q: 'What do we need to run it in our computer lab?',
      a: 'A web browser. EduAI is built for shared school lab computers and teacher-controlled lab periods, so there is nothing to install on each machine.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 bg-[#fcf8ff]">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 h-[68px] bg-white border-b border-slate-100 z-50 px-8 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-display font-bold text-white text-lg">
            E
          </Link>
          <Link to="/" className="font-display font-bold text-lg text-slate-800">EduAI</Link>
        </div>

        <div className="hidden md:flex items-center gap-8 font-sans text-sm font-semibold text-slate-500">
          <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
          <Link to="/features" className="hover:text-indigo-600 transition-colors">Features</Link>
          <span className="text-indigo-600 font-bold">Pricing</span>
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

      {/* Main Content */}
      <main className="relative z-10 pt-[120px] pb-16 w-full flex flex-col items-center gap-12 max-w-6xl mx-auto px-4 sm:px-6 xl:px-8">
        <div className="text-center flex flex-col items-center gap-4">
          <span className="badge pill-indigo font-bold">ONE SIMPLE PLAN</span>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl text-slate-900 tracking-tight leading-[1.2]">
            One plan. <span className="text-indigo-600">Everything included.</span>
          </h1>
          <p className="font-sans text-slate-500 text-sm max-w-xl">
            No tiers and no locked features. Every school gets the complete platform, priced per student.
          </p>

          {/* Monthly/Annual Toggle */}
          <div className="flex items-center gap-3 mt-4 bg-slate-100 p-1.5 rounded-full select-none">
            <button
              onClick={() => setIsAnnual(false)}
              className={`py-2 px-5 rounded-full text-xs font-bold transition-all ${
                !isAnnual ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`py-2 px-5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                isAnnual ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Annual
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-[10px] font-black text-white leading-none">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Single Plan Card */}
        <section className="w-full max-w-2xl mt-4">
          <div className="bento-card border-2 border-indigo-500 flex flex-col p-6 sm:p-10 text-left bg-white relative">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-label-caps text-[10px] font-black tracking-wider px-3 py-1 rounded-full shadow-md">
              ALL FEATURES INCLUDED
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <h2 className="font-display font-bold text-2xl text-slate-800">School License</h2>
                <p className="font-sans text-sm text-slate-500 mt-1">
                  Full classroom deployment for your whole school.
                </p>
              </div>

              <div className="flex items-baseline gap-1.5 border-b border-slate-100 pb-5">
                <span className="font-display font-extrabold text-5xl text-indigo-600">
                  {isAnnual ? '₹119' : '₹149'}
                </span>
                <span className="font-sans text-sm text-slate-400">/ student / month</span>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 font-sans text-sm text-slate-600">
                {INCLUDED_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-9">
              <Link
                to="/register"
                className="flex-1 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-sm text-center block shadow-lg shadow-indigo-600/10 transition-all"
              >
                Get started
              </Link>
              <a
                href="mailto:contact@getmysolution.com"
                className="flex-1 py-3.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-sans font-bold text-sm text-center block transition-all"
              >
                Book a school demo
              </a>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full pt-12 max-w-3xl flex flex-col gap-8">
          <div className="text-center">
            <h2 className="font-display font-bold text-2xl text-slate-900">Frequently Asked Questions</h2>
            <p className="font-sans text-slate-400 text-xs mt-1">Have doubts? We have answers.</p>
          </div>

          <div className="flex flex-col gap-4">
            {faqData.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
                  <button
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between p-5 text-left font-display font-bold text-sm text-slate-800 cursor-pointer select-none"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={18} className={`text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 font-sans text-xs text-slate-500 leading-relaxed border-t border-slate-50/50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
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
