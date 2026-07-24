import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Loader2, ArrowLeft, Info } from 'lucide-react';
import { useAuth, friendlyAuthError } from '../../context/AuthContext';
import { api } from '../../lib/api';

interface RosterStudent {
  id: string;
  fullName: string;
  avatar: string;
}

type Mode = 'password' | 'pin-setup' | 'pin-roster' | 'pin-pad';

const REDIRECT_MESSAGES: Record<string, string> = {
  idle: "You were signed out after a period of inactivity — sign in again to continue.",
  'session-ended': 'Your teacher ended the class session, so you were signed out. Sign in again once class starts.',
  'token-expired': 'Your session expired — sign in again to continue.',
};

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, pinLogin } = useAuth();

  const [mode, setMode] = useState<Mode>('password');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // A mid-session 401 (lib/api.ts) can't navigate here with router state the
  // way idle/session-ended logout do — it just clears the user, and the
  // route guard lands here plainly. This flag is the one-shot substitute.
  const [sessionExpiredFlag] = useState(() => {
    const flagged = sessionStorage.getItem('eduai_login_reason');
    if (flagged) sessionStorage.removeItem('eduai_login_reason');
    return flagged;
  });
  const redirectReason = (location.state as { reason?: string } | null)?.reason ?? sessionExpiredFlag ?? undefined;
  const redirectMessage = redirectReason ? REDIRECT_MESSAGES[redirectReason] : undefined;

  // Password mode
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // PIN mode
  const [schoolCode, setSchoolCode] = useState('');
  const [classNum, setClassNum] = useState(1);
  const [section, setSection] = useState('A');
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<RosterStudent | null>(null);
  const [pin, setPin] = useState('');

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const redirectPath = await login(email, password);
      navigate(redirectPath);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const students = await api.get<RosterStudent[]>('/auth/pin-roster', { schoolCode, classNum, section });
      if (students.length === 0) {
        setError('No students found for that class right now — check with your teacher that class is live.');
      } else {
        setRoster(students);
        setMode('pin-roster');
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 4 && selectedStudent) {
      void submitPin(next);
    }
  };

  const submitPin = async (enteredPin: string) => {
    if (!selectedStudent) return;
    setError('');
    setIsLoading(true);
    try {
      const redirectPath = await pinLogin(schoolCode, selectedStudent.id, enteredPin);
      navigate(redirectPath);
    } catch (err) {
      setError(friendlyAuthError(err));
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const accent = {
    textColor: 'text-indigo-600',
    borderFocus: 'focus:border-indigo-500 focus:ring-indigo-500/10',
    submitBtn: 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-600/10'
  };

  return (
    <div className="min-h-screen flex text-slate-800 bg-[#fcf8ff] font-sans">
      {/* Left panel (hidden on mobile, visible on desktop) */}
      <div className="hidden lg:flex w-[45%] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-12 flex-col justify-between relative overflow-hidden select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-white/10 blur-[80px] anim-spin-slow"></div>

        <div className="relative z-10 flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 px-5 rounded-2xl border border-white/15 w-fit">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-display font-bold text-indigo-600 text-md">
            E
          </div>
          <span className="font-display font-bold text-md text-white">EduAI</span>
        </div>

        <div className="relative z-10 flex flex-col gap-8 text-white my-auto">
          <div className="flex flex-col gap-2">
            <span className="text-indigo-200 font-label-caps text-[10px] tracking-widest font-black uppercase">SCHOOL LAB PLATFORM</span>
            <h2 className="font-display font-extrabold text-3xl leading-snug">
              "Learning reimagined for <br />
              India's future."
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-8">
            <div>
              <span className="font-display font-black text-2xl block">One login</span>
              <span className="text-[10px] text-indigo-200 font-medium">Every batch auto-routes</span>
            </div>
            <div>
              <span className="font-display font-black text-2xl block">Class 1–4</span>
              <span className="text-[10px] text-indigo-200 font-medium">Name + PIN, no typing</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex gap-2">
          {['AI-Powered', 'NCERT Aligned', 'For Schools'].map((tag, idx) => (
            <span key={idx} className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-white">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Right panel (Form) */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-[440px] flex flex-col gap-7">
          <div className="text-center lg:text-left">
            <h1 className="font-display font-bold text-2xl text-slate-800">Welcome back</h1>
            <p className="font-sans text-xs text-slate-400 mt-1">Sign in to your EduAI account to continue learning</p>
          </div>

          {redirectMessage && !error && (
            <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
              <Info size={14} className="shrink-0" /> {redirectMessage}
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Mode toggle */}
          <div className="glass p-1 rounded-full flex items-center justify-between shadow-xs select-none">
            <button
              onClick={() => { setMode('password'); setError(''); }}
              className={`flex-1 py-2 rounded-full font-label-caps text-[10px] font-bold transition-all cursor-pointer ${
                mode === 'password' ? accent.submitBtn : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              SIGN IN
            </button>
            <button
              onClick={() => { setMode('pin-setup'); setError(''); }}
              className={`flex-1 py-2 rounded-full font-label-caps text-[10px] font-bold transition-all cursor-pointer ${
                mode.startsWith('pin') ? accent.submitBtn : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              CLASS 1–4 (PIN)
            </button>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md shadow-slate-100/50">
            {mode === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
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
                      placeholder="you@school.eduai.local"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[9px] font-bold text-slate-400 ml-1">PASSWORD</label>
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
            )}

            {mode === 'pin-setup' && (
              <form onSubmit={handleLoadRoster} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[9px] font-bold text-slate-400 ml-1">SCHOOL CODE</label>
                  <input
                    type="text"
                    required
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                    className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs outline-none transition-all ${accent.borderFocus}`}
                    placeholder="e.g. SPS-DELHI-01"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] font-bold text-slate-400 ml-1">CLASS</label>
                    <select
                      value={classNum}
                      onChange={(e) => setClassNum(Number(e.target.value))}
                      className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs outline-none transition-all ${accent.borderFocus}`}
                    >
                      {[1, 2, 3, 4].map((c) => <option key={c} value={c}>Class {c}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] font-bold text-slate-400 ml-1">SECTION</label>
                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs outline-none transition-all ${accent.borderFocus}`}
                    >
                      {['A', 'B', 'C', 'D'].map((s) => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 -mt-1">Only works while your teacher has started class.</p>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3.5 mt-2 rounded-xl font-sans font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${accent.submitBtn} disabled:opacity-50`}
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <>Find My Class <ArrowRight size={16} /></>}
                </button>
              </form>
            )}

            {mode === 'pin-roster' && (
              <div className="flex flex-col gap-4">
                <button onClick={() => setMode('pin-setup')} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-700 cursor-pointer">
                  <ArrowLeft size={14} /> BACK
                </button>
                <p className="font-label-caps text-[9px] font-bold text-slate-400">TAP YOUR NAME</p>
                <div className="grid grid-cols-3 gap-3">
                  {roster.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedStudent(s); setPin(''); setMode('pin-pad'); }}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer"
                    >
                      <span className="text-3xl">{s.avatar}</span>
                      <span className="font-sans text-[11px] font-bold text-slate-700 text-center leading-tight">{s.fullName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'pin-pad' && selectedStudent && (
              <div className="flex flex-col items-center gap-5">
                <button onClick={() => setMode('pin-roster')} className="self-start flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-700 cursor-pointer">
                  <ArrowLeft size={14} /> BACK
                </button>
                <span className="text-5xl">{selectedStudent.avatar}</span>
                <span className="font-display font-bold text-lg text-slate-800">{selectedStudent.fullName}</span>
                <p className="font-label-caps text-[9px] font-bold text-slate-400">ENTER YOUR 4-DIGIT PIN</p>

                <div className="flex gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center font-display font-bold text-lg ${
                        pin.length > i ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-300'
                      }`}
                    >
                      {pin.length > i ? '●' : ''}
                    </div>
                  ))}
                </div>

                {isLoading ? (
                  <Loader2 size={24} className="animate-spin text-indigo-500 my-3" />
                ) : (
                  <div className="grid grid-cols-3 gap-3 select-none">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((digit, idx) => (
                      digit === '' ? <div key={idx} /> : (
                        <button
                          key={idx}
                          onClick={() => digit === '⌫' ? setPin((p) => p.slice(0, -1)) : handlePinDigit(digit)}
                          className="w-14 h-14 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 font-display font-bold text-lg text-slate-700 transition-all cursor-pointer"
                        >
                          {digit}
                        </button>
                      )
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="font-sans text-xs text-slate-400">
              New school?{' '}
              <Link to="/register" className={`font-bold ${accent.textColor} hover:underline`}>
                Contact us to get set up →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
