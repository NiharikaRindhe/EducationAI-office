import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Eye, EyeOff, ArrowRight, Loader2, Award, Users, ShieldCheck, Flame, School } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useApp();
  
  const [role, setRole] = useState<'student' | 'teacher' | 'parent'>('student');
  const [schoolCode, setSchoolCode] = useState('EDU-9981');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate 1200ms loading spinner
    setTimeout(() => {
      setIsLoading(false);
      if (role === 'student') {
        // Log in as student with default class 3 (Batch 1)
        login('student', 3, 'Dev', '🦊');
        navigate('/batch1/home');
      } else if (role === 'teacher') {
        login('teacher');
        navigate('/teacher/dashboard');
      } else if (role === 'parent') {
        login('parent');
        navigate('/parent/dashboard');
      }
    }, 1200);
  };

  // Direct demo quick links handler
  const handleQuickDemo = (demoRole: 'student1' | 'student2' | 'student3' | 'student4' | 'teacher' | 'parent') => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (demoRole === 'student1') {
        login('student', 3, 'Dev', '🦊');
        navigate('/batch1/home');
      } else if (demoRole === 'student2') {
        login('student', 7, 'Aisha', '🦋');
        navigate('/batch2/home');
      } else if (demoRole === 'student3') {
        login('student', 9, 'Arjun', '🦁');
        navigate('/batch3/home');
      } else if (demoRole === 'student4') {
        login('student', 12, 'Sneha', '🦄');
        navigate('/batch4/home');
      } else if (demoRole === 'teacher') {
        login('teacher');
        navigate('/teacher/dashboard');
      } else if (demoRole === 'parent') {
        login('parent');
        navigate('/parent/dashboard');
      }
    }, 600);
  };

  // Role accents mapping
  const roleAccents = {
    student: {
      btnActive: 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20',
      textColor: 'text-indigo-600',
      borderFocus: 'focus:border-indigo-500 focus:ring-indigo-500/10',
      submitBtn: 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-600/10'
    },
    teacher: {
      btnActive: 'bg-gradient-to-r from-sky-400 to-cyan-500 text-white shadow-md shadow-sky-400/20',
      textColor: 'text-sky-600',
      borderFocus: 'focus:border-sky-500 focus:ring-sky-500/10',
      submitBtn: 'bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-500 hover:to-cyan-600 text-white shadow-lg shadow-sky-400/10'
    },
    parent: {
      btnActive: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20',
      textColor: 'text-emerald-600',
      borderFocus: 'focus:border-emerald-500 focus:ring-emerald-500/10',
      submitBtn: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/10'
    }
  };

  const accent = roleAccents[role];

  return (
    <div className="min-h-screen flex text-slate-800 bg-[#fcf8ff] font-sans">
      {/* Left panel (hidden on mobile, visible on desktop) */}
      <div className="hidden lg:flex w-[45%] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-12 flex-col justify-between relative overflow-hidden select-none">
        {/* Floating animated orb in background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-white/10 blur-[80px] anim-spin-slow"></div>
        
        {/* Top brand */}
        <div className="relative z-10 flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 px-5 rounded-2xl border border-white/15 w-fit">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-display font-bold text-indigo-600 text-md">
            E
          </div>
          <span className="font-display font-bold text-md text-white">EduAI</span>
        </div>

        {/* Middle stats & quotes */}
        <div className="relative z-10 flex flex-col gap-8 text-white my-auto">
          <div className="flex flex-col gap-2">
            <span className="text-indigo-200 font-label-caps text-[10px] tracking-widest font-black uppercase">TRUSTED NATIONWIDE</span>
            <h2 className="font-display font-extrabold text-3xl leading-snug">
              "Learning reimagined for <br />
              India's future."
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
            <div>
              <span className="font-display font-black text-2xl block">50K+</span>
              <span className="text-[10px] text-indigo-200 font-medium">Students Enrolled</span>
            </div>
            <div>
              <span className="font-display font-black text-2xl block">500+</span>
              <span className="text-[10px] text-indigo-200 font-medium">CBSE Partner Schools</span>
            </div>
            <div>
              <span className="font-display font-black text-2xl block">98%</span>
              <span className="text-[10px] text-indigo-200 font-medium">Satisfaction Rate</span>
            </div>
          </div>
        </div>

        {/* Bottom footer */}
        <div className="relative z-10 flex gap-2">
          {['AI-Powered', 'NCERT Aligned', 'For Schools'].map((tag, idx) => (
            <span key={idx} className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-white">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Right panel (Form & Demo cards) */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-[440px] flex flex-col gap-7">
          {/* Header */}
          <div className="text-center lg:text-left">
            <h1 className="font-display font-bold text-2xl text-slate-800">Welcome back</h1>
            <p className="font-sans text-xs text-slate-400 mt-1">Sign in to your EduAI account to continue learning</p>
          </div>

          {/* Role selector */}
          <div className="glass p-1 rounded-full flex items-center justify-between shadow-xs select-none">
            {([
              { key: 'student', label: '👨‍🎓 STUDENT' },
              { key: 'teacher', label: '👨‍🏫 TEACHER' },
              { key: 'parent', label: '👨‍👩‍👧 PARENT' }
            ] as const).map((r) => (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                className={`flex-1 py-2 rounded-full font-label-caps text-[10px] font-bold transition-all cursor-pointer ${
                  role === r.key 
                    ? roleAccents[r.key].btnActive 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {r.label.split(' ')[1]}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md shadow-slate-100/50">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* School Code */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-[9px] font-bold text-slate-400 ml-1">SCHOOL CODE</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">apartment</span>
                  <input
                    type="text"
                    required
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs outline-none transition-all ${accent.borderFocus}`}
                    placeholder="e.g. DPS-NOIDA-2024"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-[9px] font-bold text-slate-400 ml-1">EMAIL ADDRESS</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">mail</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs outline-none transition-all ${accent.borderFocus}`}
                    placeholder={role === 'student' ? 'student@eduai.com' : role === 'teacher' ? 'teacher@eduai.com' : 'parent@eduai.com'}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="font-label-caps text-[9px] font-bold text-slate-400">PASSWORD</label>
                  <span className={`font-label-caps text-[8px] font-bold ${accent.textColor} hover:underline cursor-pointer`}>FORGOT?</span>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs outline-none transition-all ${accent.borderFocus}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 mt-2 rounded-xl font-sans font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${accent.submitBtn} disabled:opacity-50`}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Demo Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="h-[1px] flex-1 bg-slate-200"></div>
              <span className="font-label-caps text-[9px] font-bold text-slate-400">OR DIRECT DEMO ENTER</span>
              <div className="h-[1px] flex-1 bg-slate-200"></div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center select-none font-sans">
              <button
                onClick={() => handleQuickDemo('student1')}
                className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 flex flex-col items-center gap-1 group hover:bg-amber-500/20 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-amber-500 text-xl group-hover:scale-110 transition-transform">child_care</span>
                <span className="font-label-caps text-[8px] font-bold text-amber-600">BATCH 1</span>
              </button>

              <button
                onClick={() => handleQuickDemo('student2')}
                className="bg-indigo-600/10 border border-indigo-600/20 rounded-xl p-2.5 flex flex-col items-center gap-1 group hover:bg-indigo-600/20 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-indigo-600 text-xl group-hover:scale-110 transition-transform">school</span>
                <span className="font-label-caps text-[8px] font-bold text-indigo-600">BATCH 2</span>
              </button>

              <button
                onClick={() => handleQuickDemo('student3')}
                className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-2.5 flex flex-col items-center gap-1 group hover:bg-sky-500/20 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sky-500 text-xl group-hover:scale-110 transition-transform">auto_stories</span>
                <span className="font-label-caps text-[8px] font-bold text-sky-500">BATCH 3</span>
              </button>

              <button
                onClick={() => handleQuickDemo('student4')}
                className="bg-purple-600/10 border border-purple-600/20 rounded-xl p-2.5 flex flex-col items-center gap-1 group hover:bg-purple-600/20 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-purple-600 text-xl group-hover:scale-110 transition-transform">calculate</span>
                <span className="font-label-caps text-[8px] font-bold text-purple-600">BATCH 4</span>
              </button>

              <button
                onClick={() => handleQuickDemo('teacher')}
                className="bg-indigo-600/10 border border-indigo-600/20 rounded-xl p-2.5 flex flex-col items-center gap-1 group hover:bg-indigo-600/20 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-indigo-600 text-xl group-hover:scale-110 transition-transform">dashboard_customize</span>
                <span className="font-label-caps text-[8px] font-bold text-indigo-600">FACULTY</span>
              </button>

              <button
                onClick={() => handleQuickDemo('parent')}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 flex flex-col items-center gap-1 group hover:bg-emerald-50/20 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-emerald-500 text-xl group-hover:scale-110 transition-transform">supervised_user_circle</span>
                <span className="font-label-caps text-[8px] font-bold text-emerald-600">PARENT</span>
              </button>
            </div>
          </div>

          {/* Footer register link */}
          <div className="text-center">
            <p className="font-sans text-xs text-slate-400">
              New here?{' '}
              <Link to="/register" className={`font-bold ${accent.textColor} hover:underline`}>
                Create account →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
