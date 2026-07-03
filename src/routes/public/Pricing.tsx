import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Check, X } from 'lucide-react';

export const Pricing: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(prev => (prev === idx ? null : idx));
  };

  const faqData = [
    {
      q: 'Is there a free trial available?',
      a: 'Yes, we offer a 14-day free trial for individual students and a full-term pilot program for schools interested in integrating the platform.'
    },
    {
      q: 'Can we switch plans at any time?',
      a: 'Absolutely. You can upgrade, downgrade, or cancel your student subscription at any time. For school integrations, adjustments can be made at the start of each academic term.'
    },
    {
      q: 'Does the application support offline access?',
      a: 'Yes! Story readings and offline-downloaded chapters can be accessed inside our desktop client without active internet connections, syncing progress once reconnected.'
    },
    {
      q: 'How does per-student pricing work for schools?',
      a: 'For the School plan, we charge per student enrolled on the platform. The license includes complete teacher dashboard access, student profiles, and weekly parent reports.'
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
      <main className="relative z-10 pt-[120px] pb-16 w-full flex flex-col items-center gap-12 max-w-6xl mx-auto px-8">
        <div className="text-center flex flex-col items-center gap-4">
          <span className="badge pill-indigo font-bold">SIMPLE PLANS</span>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl text-slate-900 tracking-tight leading-[1.2]">
            Predictable pricing <span className="text-indigo-600">for schools & homes.</span>
          </h1>
          <p className="font-sans text-slate-500 text-sm max-w-xl">
            Choose a plan that fits your classroom setup. All plans include standard NCERT curriculum coverage.
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
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-[9px] font-black text-white leading-none">
                SAVE 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mt-4">
          {/* Plan 1: Starter */}
          <div className="bento-card border border-slate-100 flex flex-col justify-between p-8 card-interactive text-left bg-white">
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-800">Starter</h3>
                <p className="font-sans text-xs text-slate-400">For individual students seeking homework assistance.</p>
              </div>
              <div className="flex items-baseline gap-1 border-b border-slate-100 pb-4">
                <span className="font-display font-extrabold text-4xl text-slate-800">
                  {isAnnual ? '₹249' : '₹299'}
                </span>
                <span className="font-sans text-xs text-slate-400">/ month</span>
              </div>
              <ul className="flex flex-col gap-3 font-sans text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Interactive Games (Batch 1-4)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>AI डाउट solver (100 responses/mo)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Weekly parent email reports</span>
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <X size={14} className="shrink-0" />
                  <span>Teacher dashboard linkage</span>
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <X size={14} className="shrink-0" />
                  <span>Custom exam builder access</span>
                </li>
              </ul>
            </div>
            <Link to="/register" className="mt-8 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-sans font-bold text-sm text-center block transition-all">
              Choose Starter
            </Link>
          </div>

          {/* Plan 2: School (Most Popular) */}
          <div className="bento-card border-2 border-indigo-500 flex flex-col justify-between p-8 card-interactive text-left bg-white relative">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-label-caps text-[9px] font-black tracking-wider px-3 py-1 rounded-full shadow-md">
              MOST POPULAR
            </div>
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-800">School License</h3>
                <p className="font-sans text-xs text-slate-400">Full classroom digital deployment (min 30 students).</p>
              </div>
              <div className="flex items-baseline gap-1 border-b border-slate-100 pb-4">
                <span className="font-display font-extrabold text-4xl text-indigo-600">
                  {isAnnual ? '₹119' : '₹149'}
                </span>
                <span className="font-sans text-xs text-slate-400">/ student / mo</span>
              </div>
              <ul className="flex flex-col gap-3 font-sans text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Complete Student dashboard access</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Unlimited AI doubt tutor chat</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Weekly WhatsApp parent reports</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Teacher Portal (Exam builder & reports)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>School code portal integration</span>
                </li>
              </ul>
            </div>
            <Link to="/register" className="mt-8 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-sm text-center block shadow-lg shadow-indigo-600/10 transition-all">
              Choose School
            </Link>
          </div>

          {/* Plan 3: Enterprise */}
          <div className="bento-card border border-slate-100 flex flex-col justify-between p-8 card-interactive text-left bg-white">
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-800">Enterprise</h3>
                <p className="font-sans text-xs text-slate-400">For large trust chains and multi-branch schools.</p>
              </div>
              <div className="flex items-baseline gap-1 border-b border-slate-100 pb-4">
                <span className="font-display font-extrabold text-4xl text-slate-800">Custom</span>
                <span className="font-sans text-xs text-slate-400">/ school chain</span>
              </div>
              <ul className="flex flex-col gap-3 font-sans text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>All School license features</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Dedicated database hosting</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Custom theme & branding</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Teacher orientation workshops</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>24/7 priority SLA support</span>
                </li>
              </ul>
            </div>
            <a href="mailto:support@eduai.com" className="mt-8 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-sans font-bold text-sm text-center block transition-all">
              Contact Sales
            </a>
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
                    className="w-full flex items-center justify-between p-5 text-left font-display font-bold text-sm text-slate-800 cursor-pointer select-none"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={18} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
