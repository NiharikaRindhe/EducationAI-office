import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Building2, KeyRound, Users } from 'lucide-react';

/**
 * EduAI is a B2B school platform — there is no self-serve signup.
 * Accounts are provisioned by the school: the Super Admin creates the
 * school + its admin, and the School Admin imports teachers and students.
 * This page explains that honestly and points visitors to the right door.
 */
export const Register: React.FC = () => {
  const steps = [
    {
      icon: Building2,
      title: 'Your school gets onboarded',
      body: 'The EduAI team sets up your school on the platform and hands your administrator their login.',
    },
    {
      icon: Users,
      title: 'Your admin creates every account',
      body: 'Teachers and students are imported in bulk from your school records — no forms to fill in.',
    },
    {
      icon: KeyRound,
      title: 'You receive your credentials',
      body: 'Teachers get an email + password. Students in Class 1–4 sign in with their name and a 4-digit PIN; older students get a password slip from school.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcf8ff] font-sans p-8">
      <div className="w-full max-w-[560px] flex flex-col gap-8">
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-display font-bold text-white text-xl shadow-lg shadow-indigo-600/20">
            E
          </div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Accounts come from your school</h1>
          <p className="text-sm text-slate-500 max-w-[420px] leading-relaxed">
            EduAI is set up for your whole school at once, so there's nothing to register here. Here's how you get access:
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <step.icon size={18} />
              </div>
              <div>
                <h2 className="font-display font-bold text-sm text-slate-800">{step.title}</h2>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-indigo-600/15">
          <div>
            <h2 className="font-display font-bold text-base">Want EduAI at your school?</h2>
            <p className="text-xs text-indigo-100 mt-1">Write to us and we'll get your school set up.</p>
          </div>
          <a
            href="mailto:contact@getmysolution.com"
            className="shrink-0 bg-white text-indigo-600 font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-indigo-50 transition-colors"
          >
            Contact us <ArrowRight size={14} />
          </a>
        </div>

        <div className="text-center">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft size={14} /> Already have credentials? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
