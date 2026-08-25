import React, { useEffect, Suspense } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { TopBar } from '../../components/shared/TopBar';

const LabLoading: React.FC = () => (
  <div className="h-full w-full flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-7 h-7 rounded-full border-2 border-sky-500/40 border-t-sky-500 animate-spin" />
      <p className="text-xs font-semibold text-slate-400">Loading lab…</p>
    </div>
  </div>
);

/**
 * Class 9–10 shell after the UI testing punch list: leftover modules off
 * the nav, labs run without a left sidebar (#145).
 */
export const Batch3Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { batchId, currentClass, studentAvatar, studentName, studentStreak } = useApp();
  const { hasFeature } = useAuth();

  useEffect(() => {
    if (currentClass < 9 || currentClass > 10) {
      navigate(`/batch${batchId}/home`, { replace: true });
    }
  }, [batchId, currentClass, navigate]);

  const tabs = [
    { href: '/batch3/home', label: 'Home' },
    hasFeature('virtual_labs') ? { href: '/batch3/labs', label: 'Labs' } : null,
    { href: '/batch3/exams', label: 'Exams' },
    hasFeature('ai_tutor') ? { href: '/batch3/chat', label: 'Tutor' } : null,
    hasFeature('pyq_hub') ? { href: '/batch3/pyq', label: 'PYQ' } : null,
    hasFeature('pdf_simulator') ? { href: '/batch3/reader', label: 'Simulator' } : null,
  ].filter((t): t is { href: string; label: string } => t !== null);

  const getHeaderDetails = () => {
    const path = location.pathname;
    if (path === '/batch3/labs') return { title: 'Science Labs', sub: 'Physics, Chemistry and Biology labs.' };
    if (path.includes('/labs/physics')) return { title: 'Physics Lab', sub: 'Motion, friction, sound, circuits and optics.' };
    if (path.includes('/labs/chemistry')) return { title: 'Chemistry Lab', sub: 'Balance reactions and run the free lab.' };
    if (path.includes('/labs/biology')) return { title: 'Biology Lab', sub: 'NCERT diagrams and cell sandbox.' };
    if (path.includes('/chat')) return { title: 'AI Doubt Solver', sub: 'Step-by-step help from your books.' };
    if (path.includes('/exams')) return { title: 'Exams', sub: 'Papers your teacher assigned.' };
    if (path.includes('/pyq')) return { title: 'Board PYQ Papers', sub: 'Past year papers with examiner schemes.' };
    if (path.includes('/reader')) return { title: 'PDF Simulator', sub: 'Interactive simulations from your textbooks.' };
    if (path.includes('/profile') || path.includes('/streak')) return { title: 'Profile', sub: 'Account, streak and settings.' };
    return { title: 'Home', sub: 'Exams and labs for board year.' };
  };

  const header = getHeaderDetails();
  const isLabRoute = location.pathname.startsWith('/batch3/labs');
  const isLab = location.pathname.includes('/labs/');
  const isReader = location.pathname.includes('/reader');
  // Full-bleed, chrome-suppressed shell — same escape hatch for both: a
  // lab and the PDF simulator reader are both standalone apps ported in
  // whole, not portal pages. See .lab-embed / .reader-embed in index.css.
  const isImmersive = isLab || isReader;

  if (currentClass < 9 || currentClass > 10) return null;

  return (
    <div className={`flex flex-col bg-slate-50/50 ${isImmersive ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {!isImmersive && (
        <>
          <TopBar
            greeting="Study Workspace,"
            userName={studentName}
            subtitle={header.sub}
            batchColor="sky"
            userAvatar={studentAvatar}
            profileHref="/batch3/profile"
            rightSlot={
              <Link
                to="/batch3/streak"
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"
              >
                Streak {studentStreak}d
              </Link>
            }
          />
          <nav className="border-b border-slate-100 bg-white px-6 py-2 flex items-center gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const active = location.pathname === tab.href || (tab.href !== '/batch3/home' && location.pathname.startsWith(tab.href));
              return (
                <Link
                  key={tab.href}
                  to={tab.href}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                    active ? 'bg-sky-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </>
      )}

      {isImmersive ? (
        <main className={`${isLab ? 'lab-embed' : 'reader-embed'} relative flex-1 min-h-0 w-full overflow-hidden font-sans text-slate-800`}>
          <Link
            to={isLab ? '/batch3/labs' : `/batch${batchId}/home`}
            className="absolute left-4 top-4 z-[100] inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2 text-xs font-bold text-white backdrop-blur"
          >
            {isLab ? 'Back to labs' : 'Back to home'}
          </Link>
          <Suspense fallback={<LabLoading />}>
            <Outlet />
          </Suspense>
        </main>
      ) : isLabRoute ? (
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      ) : (
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      )}
    </div>
  );
};
