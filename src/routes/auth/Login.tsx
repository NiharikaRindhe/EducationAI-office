import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye, EyeOff, ArrowRight, Loader2, ArrowLeft, Info, Mail, LockKeyhole,
  KeyRound, Presentation, Sparkles, Check,
} from 'lucide-react';
import { useAuth, friendlyAuthError } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { getRememberedClass, rememberClass, forgetClass } from '../../lib/pinDevice';

interface RosterStudent {
  id: string;
  fullName: string;
  avatar: string;
}

type Mode = 'password' | 'pin-setup' | 'pin-roster' | 'pin-pad';
type LoginPortal = 'student-pin' | 'student-email' | 'staff';

// Palette taken from the public landing page (index.css, .edu-landing) so this
// screen reads as the same product: ink navy, warm cream, the brand violet and
// the two learning-path colours the pathway cards already use.
const INK = '#17233c';
const PATH_YOUNG = '#ff6b35'; // Classes 1-4 — "Young Explorers" on the landing page
const PATH_SENIOR = '#6657e8'; // Classes 5-10 — the brand violet

const PORTAL_COPY: Record<LoginPortal, { title: string; eyebrow: string; description: string }> = {
  'student-pin': { title: 'Classroom sign in', eyebrow: 'Classes 1–4 · teacher assisted', description: 'Set up once by the teacher — after that children just pick their name.' },
  'student-email': { title: 'Student sign in', eyebrow: 'Classes 5–10', description: 'Use the school email address and password issued to you.' },
  staff: { title: 'Staff sign in', eyebrow: 'School staff access', description: 'Teachers and school administrators sign in with their issued work email and password.' },
};

/** One accent per portal, so colour carries meaning on this page — orange for
 *  the youngest learners, the brand violet for seniors, ink for staff —
 *  instead of the unrelated sky/indigo/rose mix this page used before. */
const ACCENT: Record<LoginPortal, { color: string; soft: string; ring: string }> = {
  'student-pin': { color: PATH_YOUNG, soft: '#fff2ea', ring: '#ff6b3526' },
  'student-email': { color: PATH_SENIOR, soft: '#f0eeff', ring: '#6657e826' },
  staff: { color: INK, soft: '#eef1f6', ring: '#17233c1f' },
};

const STUDENT_OPTIONS = [
  { value: 'student-pin' as const, label: 'Classes 1–4', hint: 'Pick your name, then your PIN', icon: KeyRound },
  { value: 'student-email' as const, label: 'Classes 5–10', hint: 'School email and password', icon: Mail },
];

const REDIRECT_MESSAGES: Record<string, string> = {
  idle: 'You were signed out after a period of inactivity — sign in again to continue.',
  'session-ended': 'Your teacher ended the class session, so you were signed out. Sign in again once class starts.',
  'token-expired': 'Your session expired — sign in again to continue.',
};

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, pinLogin } = useAuth();

  const [mode, setMode] = useState<Mode>(() => (getRememberedClass() ? 'pin-setup' : 'password'));
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

  // PIN mode — seeded from whatever class this shared device was last set up
  // for, so a returning Class 1-4 student skips straight past the
  // school-code/class/section step (see lib/pinDevice.ts).
  const remembered = getRememberedClass();
  const [portal, setPortal] = useState<LoginPortal>(() => (remembered ? 'student-pin' : 'staff'));
  const [schoolCode, setSchoolCode] = useState(remembered?.schoolCode ?? '');
  const [classNum, setClassNum] = useState(remembered?.classNum ?? 1);
  const [section, setSection] = useState(remembered?.section ?? 'A');
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<RosterStudent | null>(null);
  const [pin, setPin] = useState('');
  const [deviceSetupDone, setDeviceSetupDone] = useState(() => remembered !== null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // Trimmed because these credentials are pasted from a printed slip or an
      // email far more often than typed, and a stray trailing space otherwise
      // reads back as "invalid email or password".
      const redirectPath = await login(email.trim(), password.trim());
      navigate(redirectPath);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoster = async () => {
    setError('');
    setIsLoading(true);
    try {
      const students = await api.get<RosterStudent[]>('/auth/pin-roster', { schoolCode, classNum, section });
      if (students.length === 0) {
        setError('No students found for that class right now — check with your teacher that class is live.');
      } else {
        setRoster(students);
        setMode('pin-roster');
        // Remembers the *classroom*, not the child — see lib/pinDevice.ts.
        // Next time this device loads the login page it skips straight here.
        rememberClass({ schoolCode, classNum, section });
        setDeviceSetupDone(true);
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadRoster = (e: React.FormEvent) => {
    e.preventDefault();
    void loadRoster();
  };

  // A device already set up for a class jumps straight to the roster fetch
  // instead of making a Class 1-4 student wait through the setup form.
  useEffect(() => {
    if (deviceSetupDone) void loadRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleForgetDevice = () => {
    forgetClass();
    setSchoolCode('');
    setClassNum(1);
    setSection('A');
    setRoster([]);
    setError('');
    setDeviceSetupDone(false);
    setMode('pin-setup');
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

  const selectPortal = (nextPortal: LoginPortal) => {
    setPortal(nextPortal);
    setError('');
    setSelectedStudent(null);
    setPin('');
    setMode(nextPortal === 'student-pin' ? 'pin-setup' : 'password');
  };

  const accent = ACCENT[portal];
  const inputClass =
    'h-11 w-full rounded-xl border border-[#e2e0d8] bg-white px-4 font-sans text-sm text-[#17233c] outline-none transition-all placeholder:text-[#b3b7c0] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-ring)]';
  const submitClass =
    'flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#17233c] font-sans text-sm font-bold text-white shadow-[0_8px_22px_#17233c26] transition-all hover:bg-[#253656] disabled:opacity-50 disabled:hover:bg-[#17233c]';

  return (
    <div
      className="flex h-screen overflow-hidden bg-[#fbfaf6] font-sans text-[#17233c]"
      style={{ ['--accent' as string]: accent.color, ['--accent-ring' as string]: accent.ring }}
    >
      {/* ── Brand panel (desktop only) ─────────────────────────── */}
      <div className="relative hidden w-[38%] max-w-[560px] flex-col justify-between overflow-hidden bg-[#17233c] p-12 select-none lg:flex xl:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 -top-24 h-[380px] w-[380px] rounded-full opacity-[0.1] blur-[60px]"
          style={{ background: PATH_SENIOR }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-24 h-[300px] w-[300px] rounded-full bg-[#dfff70] opacity-[0.08] blur-[60px]"
        />

        <Link to="/" className="relative z-10 flex w-fit items-center gap-2.5 no-underline">
          <span className="grid h-[34px] w-[34px] -rotate-[5deg] place-items-center rounded-[11px] bg-white text-[#17233c]">
            <Sparkles size={17} />
          </span>
          <span className="font-display text-[21px] font-extrabold text-white">EduAI</span>
          <span className="rounded-full bg-white/10 px-2 py-[5px] text-[10px] font-bold uppercase tracking-[0.08em] text-[#b8c4da]">
            for schools
          </span>
        </Link>

        <div className="relative z-10 my-auto">
          <p className="flex items-center gap-2.5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#8e9db8]">
            <span className="h-2 w-2 rounded-full bg-[#29ad72] shadow-[0_0_0_5px_#29ad7220]" />
            Secure school access
          </p>
          <h2 className="mt-6 max-w-[420px] font-display text-[42px] font-bold leading-[1.05] tracking-[-0.045em] text-white">
            One school.
            <br />
            Every role.
            <br />
            <span className="relative inline-block">
              <span aria-hidden className="absolute bottom-0.5 left-0.5 right-0 h-1.5 -rotate-[1deg] bg-[#dfff70]" />
              <span className="relative">One sign in.</span>
            </span>
          </h2>
          <p className="mt-6 max-w-[380px] text-sm leading-7 text-[#aab4c7]">
            Choose how you learn or teach. Every account opens straight into the workspace built for it.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-x-5 gap-y-2.5">
          {['NCERT aligned', 'Classes 1–10', 'Teacher controlled'].map((item) => (
            <span key={item} className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8e9db8]">
              <Check size={13} className="text-[#dfff70]" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Form panel ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-4 sm:px-6 sm:py-3 lg:px-8">
        <div className="flex w-full max-w-[520px] flex-col gap-3">
          <Link to="/" className="flex items-center gap-2.5 no-underline lg:hidden">
            <span className="grid h-8 w-8 -rotate-[5deg] place-items-center rounded-[10px] bg-[#17233c] text-white">
              <Sparkles size={16} />
            </span>
            <span className="font-display text-[19px] font-extrabold text-[#17233c]">EduAI</span>
          </Link>

          <h1 className="font-display text-[24px] font-bold leading-none tracking-[-0.04em] text-[#17233c]">
            Sign in
          </h1>

          {redirectMessage && !error && (
            <div className="flex items-center gap-2 rounded-xl border border-[#dcd8ff] bg-[#f4f2ff] px-4 py-3 text-xs font-medium text-[#5044b8]">
              <Info size={14} className="shrink-0" /> {redirectMessage}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-[#f4cfc4] bg-[#fdf1ed] px-4 py-3 text-xs font-medium text-[#b4432a]">
              {error}
            </div>
          )}

          {/* Students get two equal tiles under one heading, staff a single
              wide row under theirs. The old layout put students in a tab AND
              a thin sub-row of text links, so the two groups never read as
              two groups. */}
          <div className="flex flex-col gap-3">
            <section>
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8b93a5]">
                I&rsquo;m a student
              </p>
              <div className="grid grid-cols-2 gap-3">
                {STUDENT_OPTIONS.map(({ value, label, hint, icon: Icon }) => {
                  const active = portal === value;
                  const tone = ACCENT[value];
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => selectPortal(value)}
                      aria-pressed={active}
                      className={`relative cursor-pointer overflow-hidden rounded-2xl border bg-white p-3 text-left transition-all ${
                        active
                          ? 'border-transparent'
                          : 'border-[#e7e5df] hover:border-[#d5d2c8] hover:shadow-[0_6px_18px_#17233c0a]'
                      }`}
                      style={active ? { boxShadow: `0 0 0 2px ${tone.color}, 0 10px 28px #17233c14` } : undefined}
                    >
                      <span
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-[5px] transition-opacity"
                        style={{ background: tone.color, opacity: active ? 1 : 0 }}
                      />
                      <span
                        className="grid h-8 w-8 place-items-center rounded-[10px] transition-colors"
                        style={{
                          background: active ? tone.soft : '#f5f4f0',
                          color: active ? tone.color : '#9aa1af',
                        }}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="mt-2.5 block font-display text-[14px] font-bold tracking-[-0.02em] text-[#17233c]">
                        {label}
                      </span>
                      <span className="mt-0.5 block text-[10.5px] font-medium leading-[14px] text-[#8b93a5]">
                        {hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8b93a5]">
                School staff
              </p>
              <button
                type="button"
                onClick={() => selectPortal('staff')}
                aria-pressed={portal === 'staff'}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-all ${
                  portal === 'staff'
                    ? 'border-[#17233c] bg-[#17233c] shadow-[0_10px_26px_#17233c26]'
                    : 'border-[#e7e5df] bg-white hover:border-[#d5d2c8] hover:shadow-[0_6px_18px_#17233c0a]'
                }`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-[10px] transition-colors ${
                    portal === 'staff' ? 'bg-white/10 text-white' : 'bg-[#f5f4f0] text-[#9aa1af]'
                  }`}
                >
                  <Presentation size={16} />
                </span>
                <span className="min-w-0">
                  <span
                    className={`block font-display text-[14px] font-bold tracking-[-0.02em] ${
                      portal === 'staff' ? 'text-white' : 'text-[#17233c]'
                    }`}
                  >
                    Teachers &amp; administrators
                  </span>
                  <span
                    className={`mt-0.5 block text-[10.5px] font-medium leading-[14px] ${
                      portal === 'staff' ? 'text-[#aab4c7]' : 'text-[#8b93a5]'
                    }`}
                  >
                    Work email and password
                  </span>
                </span>
              </button>
            </section>
          </div>

          <div className="rounded-[20px] border border-[#e7e5df] bg-white p-5 shadow-[0_10px_35px_#17233c0d]">
            <div className="mb-3.5 border-b border-[#f0efe9] pb-3.5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em]" style={{ color: accent.color }}>
                {PORTAL_COPY[portal].eyebrow}
              </p>
              <h2 className="mt-1 font-display text-[19px] font-bold tracking-[-0.025em] text-[#17233c]">
                {PORTAL_COPY[portal].title}
              </h2>
              <p className="mt-1 text-[11.5px] leading-[18px] text-[#667085]">{PORTAL_COPY[portal].description}</p>
            </div>

            {mode === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#4a5468]">Email address</label>
                  <div className="relative">
                    <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a8adb8]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className={`${inputClass} pl-11`}
                      placeholder="name@school.eduai.local"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#4a5468]">Password</label>
                  <div className="relative">
                    <LockKeyhole size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a8adb8]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className={`${inputClass} pl-11 pr-12`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-[#a8adb8] transition-colors hover:text-[#17233c]"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={submitClass}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in securely
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {mode === 'pin-setup' && (
              <form onSubmit={handleLoadRoster} className="flex flex-col gap-3">
                {!deviceSetupDone && (
                  <div className="flex gap-3 rounded-xl border border-[#ffddcb] bg-[#fff6f1] px-3.5 py-2.5">
                    <Presentation size={17} className="mt-0.5 shrink-0 text-[#ff6b35]" />
                    <div>
                      <p className="text-[11px] font-bold text-[#8f3d15]">Teacher setup — required once</p>
                      <p className="mt-0.5 text-[10.5px] leading-[15px] text-[#a55a33]">
                        A teacher enters the classroom details once on this device.
                      </p>
                    </div>
                  </div>
                )}
                {deviceSetupDone && (
                  <div className="flex flex-col gap-2 rounded-xl border border-[#e7e5df] bg-[#faf9f5] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[11px] text-[#667085]">
                      This computer is set up for{' '}
                      <strong className="font-bold text-[#17233c]">
                        Class {classNum}-{section}
                      </strong>
                      .
                    </p>
                    <button
                      type="button"
                      onClick={handleForgetDevice}
                      className="cursor-pointer self-start text-[11px] font-bold text-[#ff6b35] hover:underline sm:self-auto"
                    >
                      Change class
                    </button>
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#4a5468]">School code</label>
                  <input
                    type="text"
                    required
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                    autoComplete="off"
                    className={inputClass}
                    placeholder="e.g. SPS-DELHI-01"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[#4a5468]">Class</label>
                    <select value={classNum} onChange={(e) => setClassNum(Number(e.target.value))} className={inputClass}>
                      {[1, 2, 3, 4].map((c) => (
                        <option key={c} value={c}>
                          Class {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[#4a5468]">Section</label>
                    <select value={section} onChange={(e) => setSection(e.target.value)} className={inputClass}>
                      {['A', 'B', 'C', 'D'].map((s) => (
                        <option key={s} value={s}>
                          Section {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="-mt-1 text-[10.5px] leading-[15px] text-[#9aa1af]">
                  PIN sign-in is available only while the teacher&rsquo;s classroom session is active.
                </p>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={submitClass}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Finding class…
                    </>
                  ) : (
                    <>
                      Continue to student list <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {mode === 'pin-roster' && (
              <div>
                <button
                  onClick={() => setMode('pin-setup')}
                  className="mb-4 flex cursor-pointer items-center gap-1.5 text-[11px] font-bold text-[#667085] transition-colors hover:text-[#ff6b35]"
                >
                  <ArrowLeft size={14} /> Change class
                </button>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-[15px] font-bold text-[#17233c]">Choose your name</p>
                    <p className="mt-0.5 text-[11px] text-[#8b93a5]">
                      Class {classNum}-{section}
                    </p>
                  </div>
                  <span className="rounded-lg bg-[#f5f4f0] px-2.5 py-1 text-[10px] font-bold text-[#667085]">
                    {roster.length} student{roster.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="grid max-h-[248px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
                  {roster.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedStudent(s);
                        setPin('');
                        setMode('pin-pad');
                      }}
                      className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-[#e7e5df] bg-white p-3 transition-all hover:border-[#ffb996] hover:bg-[#fff6f1] hover:shadow-[0_6px_18px_#ff6b3518]"
                    >
                      <span className="text-3xl">{s.avatar}</span>
                      <span className="text-center font-sans text-[11px] font-bold leading-tight text-[#3c4557]">
                        {s.fullName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'pin-pad' && selectedStudent && (
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setMode('pin-roster')}
                  className="mb-4 flex cursor-pointer items-center gap-1.5 self-start text-[11px] font-bold text-[#667085] transition-colors hover:text-[#ff6b35]"
                >
                  <ArrowLeft size={14} /> Student list
                </button>
                <span className="text-4xl">{selectedStudent.avatar}</span>
                <span className="mt-2 font-display text-lg font-bold text-[#17233c]">{selectedStudent.fullName}</span>
                <p className="mt-1 text-[11px] text-[#8b93a5]">Enter your unique four-digit classroom PIN</p>

                <div className="my-4 flex gap-2.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border font-display text-base font-bold transition-colors ${
                        pin.length > i
                          ? 'border-[#ffb996] bg-[#fff2ea] text-[#ff6b35]'
                          : 'border-[#e7e5df] bg-white text-[#c9ccd4]'
                      }`}
                    >
                      {pin.length > i ? '●' : ''}
                    </div>
                  ))}
                </div>

                {isLoading ? (
                  <div className="flex h-[188px] items-center justify-center">
                    <Loader2 size={26} className="animate-spin text-[#ff6b35]" />
                  </div>
                ) : (
                  <div className="grid select-none grid-cols-3 gap-2.5">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((digit, idx) =>
                      digit === '' ? (
                        <div key={idx} />
                      ) : (
                        <button
                          key={idx}
                          onClick={() => (digit === '⌫' ? setPin((p) => p.slice(0, -1)) : handlePinDigit(digit))}
                          className="h-12 w-[58px] cursor-pointer rounded-xl border border-[#e7e5df] bg-white font-display text-lg font-bold text-[#3c4557] transition-all hover:border-[#ffb996] hover:bg-[#fff6f1] active:scale-95"
                        >
                          {digit}
                        </button>
                      ),
                    )}
                  </div>
                )}
                <p className="mt-4 text-center text-[10px] leading-4 text-[#9aa1af]">
                  Each student has a different PIN. Keep your PIN private.
                </p>
              </div>
            )}
          </div>

          <p className="border-t border-[#e7e4dc] pt-3 text-center font-sans text-[11.5px] text-[#8b93a5]">
            New school?{' '}
            <Link to="/register" className="font-bold text-[#6657e8] hover:underline">
              Contact us to get set up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
