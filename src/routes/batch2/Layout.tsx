import React, { useEffect, Suspense, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
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

const ReaderLoading: React.FC = () => (
  <div className="h-full w-full flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-7 h-7 rounded-full border-2 border-sky-500/40 border-t-sky-500 animate-spin" />
      <p className="text-xs font-semibold text-slate-400">Loading…</p>
    </div>
  </div>
);

export const Batch2Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { batchId, currentClass, studentAvatar, studentName } = useApp();
  const { hasFeature } = useAuth();
  const [readerNavExpanded, setReaderNavExpanded] = useState(false);

  useEffect(() => {
    if (currentClass < 5 || currentClass > 8) {
      navigate(`/batch${batchId}/home`, { replace: true });
    }
  }, [batchId, currentClass, navigate]);

  const navItems: NavItem[] = ([
    { href: '/batch2/home', label: 'Home', iconName: 'home' },
    { href: '/batch2/activities', label: 'Activities', iconName: 'extension' },
    { href: '/batch2/chat', label: 'AI Doubt Tutor', iconName: 'chat', feature: 'ai_tutor' },
    ...(PDF_SIMULATOR_ENABLED
      ? [{ href: '/batch2/reader', label: 'PDF Simulator', iconName: 'auto_stories', feature: 'pdf_simulator' as const }]
      : []),
    { href: '/batch2/exams', label: 'Exams & Mocks', iconName: 'edit_document' },
    { href: '/batch2/profile', label: 'Profile & Streak', iconName: 'person' }
  ] as (NavItem & { feature?: FeatureKey })[])
    .filter((item) => !item.feature || hasFeature(item.feature));

  const getHeaderDetails = () => {
    const path = location.pathname;
    if (path.includes('/activities')) return { title: 'Activities', sub: 'Practice chapters through focused learning activities.' };
    if (path.includes('/chat')) return { title: 'AI Doubt Tutor', sub: 'Ask questions from your class textbooks and get source-backed explanations.' };
    if (path.includes('/reader')) return { title: 'PDF Simulator', sub: 'Interactive simulations from your textbooks.' };
    if (path.includes('/exams')) return { title: 'Mock Exams', sub: 'Complete term exams and test your readiness.' };
    if (path.includes('/profile')) return { title: 'Profile & Streak', sub: 'Edit your avatar and review your lab attendance streak.' };
    return { title: 'Dashboard Home', sub: 'Ready to master your chapters today?' };
  };

  const header = getHeaderDetails();
  // Full-bleed, chrome-suppressed shell for the reader — a standalone app
  // ported in whole, not a portal page. Same escape hatch as batch3's
  // .lab-embed; see .reader-embed in index.css.
  const isReader = PDF_SIMULATOR_ENABLED && location.pathname.includes('/reader');

  if (currentClass < 5 || currentClass > 8) return null;

  return (
    <div className={`flex bg-[#f4f8fb] ${isReader ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        navItems={navItems}
        batchColor="sky"
        logoText="EduAI"
        collapsed={isReader && !readerNavExpanded}
        onCollapsedChange={isReader ? (nextCollapsed) => setReaderNavExpanded(!nextCollapsed) : undefined}
      />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header TopBar */}
        {!isReader && (
          <TopBar
            greeting="Welcome back,"
            userName={studentName}
            subtitle={header.sub}
            batchColor="sky"
            userAvatar={studentAvatar}
            profileHref="/batch2/profile"
          />
        )}

        {/* Dynamic page container */}
        {isReader ? (
          <main className="reader-embed relative flex-1 min-h-0 w-full overflow-hidden font-sans text-slate-800" data-batch="2">
            <Link
              to="/batch2/home"
              className="absolute left-4 top-4 z-[100] inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2 text-xs font-bold text-white backdrop-blur"
            >
              Back to home
            </Link>
            <Suspense fallback={<ReaderLoading />}>
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
