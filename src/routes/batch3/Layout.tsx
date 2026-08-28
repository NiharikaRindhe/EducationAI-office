import React, { useEffect, Suspense, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth, type FeatureKey } from '../../context/AuthContext';
import { Sidebar, NavItem } from '../../components/shared/Sidebar';
import { TopBar } from '../../components/shared/TopBar';

// Re-enabled (Aug 26 2026) — was disabled per user request Aug 25 2026 after
// an unrelated Sidebar regression; that fix, an entitlement-backfill bug fix,
// worker reliability fixes, and a real-streaming restoration for the chat
// tutor all landed since. See App.tsx (route wiring) and worker.ts
// (startSimWorker) for the other two flags this was gated behind.
const PDF_SIMULATOR_ENABLED = true;

const LabLoading: React.FC = () => (
  <div className="h-full w-full flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-7 h-7 rounded-full border-2 border-sky-500/40 border-t-sky-500 animate-spin" />
      <p className="text-xs font-semibold text-slate-400">Loading…</p>
    </div>
  </div>
);

export const Batch3Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { batchId, currentClass, studentAvatar, studentName } = useApp();
  const { hasFeature } = useAuth();
  const [navCollapsed, setNavCollapsed] = useState(true);
  const [focusModePath, setFocusModePath] = useState<string | null>(null);

  useEffect(() => {
    if (currentClass < 9 || currentClass > 10) {
      navigate(`/batch${batchId}/home`, { replace: true });
    }
  }, [batchId, currentClass, navigate]);

  // Nav entries for features the school hasn't bought are dropped rather than
  // shown disabled — a student shouldn't be advertised their school's billing.
  // This is presentation only; each route's API is gated independently.
  const navItems: NavItem[] = ([
    { href: '/batch3/home', label: 'Home', iconName: 'home' },
    { href: '/batch3/labs', label: 'Science Labs', iconName: 'science', feature: 'virtual_labs' },
    ...(PDF_SIMULATOR_ENABLED
      ? [{ href: '/batch3/reader', label: 'PDF Simulator', iconName: 'auto_stories', feature: 'pdf_simulator' as const }]
      : []),
    { href: '/batch3/chat', label: 'AI Doubt Tutor', iconName: 'chat', feature: 'ai_tutor' },
    { href: '/batch3/exams', label: 'Exams & Mocks', iconName: 'edit_document' },
    { href: '/batch3/pyq', label: 'Board PYQ Hub', iconName: 'bookmark', feature: 'pyq_hub' },
    { href: '/batch3/profile', label: 'Profile & Streak', iconName: 'person' }
  ] as (NavItem & { feature?: FeatureKey })[])
    .filter((item) => !item.feature || hasFeature(item.feature));

  const getHeaderDetails = () => {
    const path = location.pathname;
    // Labs first — their paths contain segments (/chemistry/teacher) that would
    // otherwise fall through to a dashboard match below.
    if (path === '/batch3/labs') return { title: 'Science Labs', sub: 'Interactive NCERT labs for Physics, Chemistry and Biology.' };
    if (path.includes('/labs/physics')) return { title: 'Physics Lab', sub: 'Motion, friction, sound, circuits and optics simulators.' };
    if (path.includes('/labs/chemistry')) return { title: 'Chemistry Lab', sub: 'Balance reactions, craft compounds, and run the free lab.' };
    if (path.includes('/labs/biology')) return { title: 'Biology Lab', sub: 'NCERT diagram hub, cell sandbox, and spatial recall quizzes.' };
    if (path.includes('/reader')) return { title: 'PDF Simulator', sub: 'Interactive simulations from your textbooks.' };
    if (path.includes('/chat')) return { title: 'AI Doubt Solver', sub: 'Step-by-step problem solver with LaTeX support.' };
    if (path.includes('/exams')) return { title: 'Practice Exams', sub: 'CBSE Board exam pattern mock tests.' };
    if (path.includes('/pyq')) return { title: 'Board PYQ Papers', sub: 'CBSE past year papers with examiner schemes.' };
    if (path.includes('/profile')) return { title: 'Profile & Streak', sub: 'Edit your avatar and review your lab attendance streak.' };
    return { title: 'Board prep dashboard', sub: 'Ready to prepare for Class 10 Board Exams?' };
  };

  const header = getHeaderDetails();

  /* The science labs and the PDF Simulator reader manage their own scrolling
     and internal panels, so they get a full-bleed content area pinned to the
     viewport height instead of the usual padded, max-width, page-scrolling
     <main> — same treatment for both, since the reader is a standalone app
     ported in whole, just like the labs. */
  const isLabRoute = location.pathname.startsWith('/batch3/labs');
  const isReaderRoute = PDF_SIMULATOR_ENABLED && location.pathname.startsWith('/batch3/reader');
  const isLab = location.pathname.includes('/labs/');
  const isImmersive = isLab || isReaderRoute;
  // Focus mode belongs to the exact immersive route that enabled it. Route
  // changes automatically restore the portal chrome without a state-reset
  // effect or a one-frame flash of hidden navigation.
  const isFocusMode = isImmersive && focusModePath === location.pathname;

  if (currentClass < 9 || currentClass > 10) return null;

  return (
    <div className={`flex bg-slate-50/50 ${isImmersive ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {/* Sidebar Navigation */}
      {!isFocusMode && (
        <Sidebar
          navItems={navItems}
          batchColor="sky"
          logoText="EduAI"
          collapsed={(isLabRoute || isReaderRoute) && navCollapsed}
          onCollapsedChange={(isLabRoute || isReaderRoute) ? setNavCollapsed : undefined}
        />
      )}

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header TopBar */}
        {!isFocusMode && (
          <TopBar
            greeting="Study Workspace,"
            userName={studentName}
            subtitle={header.sub}
            batchColor="sky"
            userAvatar={studentAvatar}
            profileHref="/batch3/profile"
            rightSlot={isImmersive ? (
              <div className="hidden items-center gap-2 lg:flex">
                <button
                  type="button"
                  onClick={() => setFocusModePath(location.pathname)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
                >
                  <Maximize2 size={14} /> Focus mode
                </button>
              </div>
            ) : undefined}
          />
        )}

        {/* Dynamic page container */}
        {isImmersive ? (
          <main className={`${isLab ? 'lab-embed' : 'reader-embed'} relative flex-1 min-h-0 w-full overflow-hidden font-sans text-slate-800`}>
            {isFocusMode && (
              // Same corner "Focus mode" enters from (top-right, via the
              // TopBar's rightSlot above) — the TopBar is hidden while focus
              // mode is on, so this floats in its place, but the control
              // shouldn't jump corners just because its container changed (#139).
              <button
                type="button"
                onClick={() => setFocusModePath(null)}
                className="absolute right-4 top-4 z-[100] inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2 text-xs font-bold text-white shadow-xl backdrop-blur transition hover:bg-slate-800"
              >
                <Minimize2 size={14} /> Exit focus mode
              </button>
            )}
            <Suspense fallback={<LabLoading />}>
              <Outlet />
            </Suspense>
          </main>
        ) : (
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        )}
      </div>
    </div>
  );
};
