import React, { useEffect, Suspense } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { TopBar } from '../../components/shared/TopBar';

const ReaderLoading: React.FC = () => (
  <div className="h-full w-full flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-7 h-7 rounded-full border-2 border-indigo-500/40 border-t-indigo-500 animate-spin" />
      <p className="text-xs font-semibold text-slate-400">Loading…</p>
    </div>
  </div>
);

/**
 * Class 5–8 shell after the UI testing punch list:
 * left sidebar removed (#138); Home keeps Activities, Tutor and Exams (#122).
 */
export const Batch2Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { batchId, currentClass, studentAvatar, studentName, studentStreak } = useApp();
  const { hasFeature } = useAuth();

  useEffect(() => {
    if (currentClass < 5 || currentClass > 8) {
      navigate(`/batch${batchId}/home`, { replace: true });
    }
  }, [batchId, currentClass, navigate]);

  const tabs = [
    { href: '/batch2/home', label: 'Home' },
    { href: '/batch2/activities', label: 'Activities' },
    hasFeature('ai_tutor') ? { href: '/batch2/chat', label: 'Tutor' } : null,
    { href: '/batch2/exams', label: 'Exams' },
    hasFeature('pdf_simulator') ? { href: '/batch2/reader', label: 'Simulator' } : null,
  ].filter((t): t is { href: string; label: string } => t !== null);

  const getHeaderDetails = () => {
    const path = location.pathname;
    if (path.includes('/activities')) return { title: 'Activities', sub: 'Practice every subject in textbook chapter order.' };
    if (path.includes('/chat')) return { title: 'AI Doubt Solver', sub: 'Ask questions about your class books.' };
    if (path.includes('/exams')) return { title: 'Exams', sub: 'Papers your teacher assigned.' };
    if (path.includes('/reader')) return { title: 'PDF Simulator', sub: 'Interactive simulations from your textbooks.' };
    if (path.includes('/profile') || path.includes('/streak')) return { title: 'Profile', sub: 'Your account, streak and settings.' };
    return { title: 'Home', sub: 'Activities, tutor and exams.' };
  };

  const header = getHeaderDetails();
  // Full-bleed, chrome-suppressed shell for the reader — a standalone app
  // ported in whole, not a portal page. Same escape hatch as batch3's
  // isLab/.lab-embed; see .reader-embed in index.css.
  const isReader = location.pathname.includes('/reader');

  if (currentClass < 5 || currentClass > 8) return null;

  return (
    <div className={`flex flex-col bg-slate-50/50 ${isReader ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {!isReader && (
        <>
          <TopBar
            greeting="Welcome back,"
            userName={studentName}
            subtitle={header.sub}
            batchColor="indigo"
            userAvatar={studentAvatar}
            profileHref="/batch2/profile"
            rightSlot={
              <Link
                to="/batch2/streak"
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"
              >
                Streak {studentStreak}d
              </Link>
            }
          />
          <nav className="border-b border-slate-100 bg-white px-6 py-2 flex items-center gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const active = location.pathname === tab.href || (tab.href !== '/batch2/home' && location.pathname.startsWith(tab.href));
              return (
                <Link
                  key={tab.href}
                  to={tab.href}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                    active ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </>
      )}

      {isReader ? (
        <main className="reader-embed relative flex-1 min-h-0 w-full overflow-hidden font-sans text-slate-800">
          <Link
            to={`/batch${batchId}/home`}
            className="absolute left-4 top-4 z-[100] inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2 text-xs font-bold text-white backdrop-blur"
          >
            Back to home
          </Link>
          <Suspense fallback={<ReaderLoading />}>
            <Outlet />
          </Suspense>
        </main>
      ) : (
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      )}
    </div>
  );
};
