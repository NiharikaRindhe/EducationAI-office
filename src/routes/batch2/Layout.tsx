import React, { useEffect, Suspense } from 'react';
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
      <div className="w-7 h-7 rounded-full border-2 border-indigo-500/40 border-t-indigo-500 animate-spin" />
      <p className="text-xs font-semibold text-slate-400">Loading…</p>
    </div>
  </div>
);

export const Batch2Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { batchId, currentClass, studentAvatar, studentName } = useApp();
  const { hasFeature } = useAuth();

  useEffect(() => {
    if (currentClass < 5 || currentClass > 8) {
      navigate(`/batch${batchId}/home`, { replace: true });
    }
  }, [batchId, currentClass, navigate]);

  const navItems: NavItem[] = ([
    { href: '/batch2/home', label: 'Home', iconName: 'home' },
    { href: '/batch2/subjects', label: 'Subjects', iconName: 'library_books' },
    { href: '/batch2/chat', label: 'AI Doubt Tutor', iconName: 'chat', feature: 'ai_tutor' },
    ...(PDF_SIMULATOR_ENABLED
      ? [{ href: '/batch2/reader', label: 'PDF Simulator', iconName: 'auto_stories', feature: 'pdf_simulator' as const }]
      : []),
    { href: '/batch2/exams', label: 'Exams & Mocks', iconName: 'edit_document' },
    { href: '/batch2/tasks', label: 'My Tasks', iconName: 'assignment_turned_in' },
    { href: '/batch2/notes', label: 'Study Notes', iconName: 'sticky_note_2' },
    { href: '/batch2/pyq', label: 'PYQ Hub', iconName: 'bookmark', feature: 'pyq_hub' },
    { href: '/batch2/daily-challenges', label: 'Daily Challenges', iconName: 'electric_bolt' },
    { href: '/batch2/streak', label: 'Streak Tracker', iconName: 'local_fire_department' },
    { href: '/batch2/badges', label: 'My Badges', iconName: 'military_tech' },
    { href: '/batch2/profile', label: 'Profile', iconName: 'person' },
    { href: '/batch2/help', label: 'Report an Issue', iconName: 'confirmation_number' }
  ] as (NavItem & { feature?: FeatureKey })[])
    .filter((item) => !item.feature || hasFeature(item.feature));

  const getHeaderDetails = () => {
    const path = location.pathname;
    if (path.includes('/subjects')) return { title: 'Subjects & Chapters', sub: 'Complete your NCERT syllabus and take practice sets.' };
    if (path.includes('/chat')) return { title: 'AI Doubt Solver', sub: 'Ask questions about mathematics and science formulas!' };
    if (path.includes('/reader')) return { title: 'PDF Simulator', sub: 'Interactive simulations from your textbooks.' };
    if (path.includes('/exams')) return { title: 'Mock Exams', sub: 'Complete term exams and test your readiness.' };
    if (path.includes('/tasks')) return { title: 'My Tasks', sub: 'Complete work your teacher has assigned to earn XP.' };
    if (path.includes('/notes')) return { title: 'Study Notes Manager', sub: 'Organize and review your study notes.' };
    if (path.includes('/pyq')) return { title: 'PYQ Hub', sub: 'Attempt past board papers and review solutions.' };
    if (path.includes('/daily-challenges')) return { title: 'Daily Challenges', sub: 'Solve CBSE pattern questions to win double XP!' };
    if (path.includes('/streak')) return { title: 'Streak Tracker', sub: 'View daily activity records and heatmap milestones.' };
    if (path.includes('/badges')) return { title: 'Academic Badges', sub: 'Check unlocked achievements for subject toppers.' };
    if (path.includes('/profile')) return { title: 'Profile Settings', sub: 'Manage nickname and view performance analytics.' };
    return { title: 'Dashboard Home', sub: 'Ready to master your chapters today?' };
  };

  const header = getHeaderDetails();
  // Full-bleed, chrome-suppressed shell for the reader — a standalone app
  // ported in whole, not a portal page. Same escape hatch as batch3's
  // .lab-embed; see .reader-embed in index.css.
  const isReader = PDF_SIMULATOR_ENABLED && location.pathname.includes('/reader');

  if (currentClass < 5 || currentClass > 8) return null;

  return (
    <div className={`flex bg-slate-50/50 ${isReader ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {/* Sidebar Navigation */}
      {!isReader && (
        <Sidebar
          navItems={navItems}
          batchColor="indigo"
          logoText="EduAI"
        />
      )}

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header TopBar */}
        {!isReader && (
          <TopBar
            greeting="Welcome back,"
            userName={studentName}
            subtitle={header.sub}
            batchColor="indigo"
            userAvatar={studentAvatar}
            profileHref="/batch2/profile"
          />
        )}

        {/* Dynamic page container */}
        {isReader ? (
          <main className="reader-embed relative flex-1 min-h-0 w-full overflow-hidden font-sans text-slate-800">
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
          <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        )}
      </div>
    </div>
  );
};
