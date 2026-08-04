import React, { useEffect, Suspense, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Sidebar, NavItem } from '../../components/shared/Sidebar';
import { TopBar } from '../../components/shared/TopBar';

const LabLoading: React.FC = () => (
  <div className="h-full w-full flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-7 h-7 rounded-full border-2 border-sky-500/40 border-t-sky-500 animate-spin" />
      <p className="text-xs font-semibold text-slate-400">Loading lab…</p>
    </div>
  </div>
);

export const Batch3Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { batchId, currentClass, studentAvatar, studentName } = useApp();
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [labFocusMode, setLabFocusMode] = useState(false);

  useEffect(() => {
    if (currentClass < 9 || currentClass > 10) {
      navigate(`/batch${batchId}/home`, { replace: true });
    }
  }, [batchId, currentClass, navigate]);

  const navItems: NavItem[] = [
    { href: '/batch3/home', label: 'Home', iconName: 'home' },
    { href: '/batch3/subjects', label: 'Subjects', iconName: 'library_books' },
    { href: '/batch3/concept-map', label: 'Concept Map', iconName: 'schema' },
    { href: '/batch3/labs', label: 'Science Labs', iconName: 'science' },
    { href: '/batch3/board-prep', label: 'Board Prep', iconName: 'event_upcoming' },
    { href: '/batch3/chat', label: 'AI Doubt Tutor', iconName: 'chat' },
    { href: '/batch3/daily-challenges', label: 'Daily Challenges', iconName: 'electric_bolt' },
    { href: '/batch3/exams', label: 'Exams & Mocks', iconName: 'edit_document' },
    { href: '/batch3/tasks', label: 'My Tasks', iconName: 'assignment_turned_in' },
    { href: '/batch3/notes', label: 'Study Notes', iconName: 'sticky_note_2' },
    { href: '/batch3/pyq', label: 'Board PYQ Hub', iconName: 'bookmark' },
    { href: '/batch3/pomodoro', label: 'Pomodoro Timer', iconName: 'timer' },
    { href: '/batch3/streak', label: 'Streak', iconName: 'local_fire_department' },
    { href: '/batch3/profile', label: 'Profile', iconName: 'person' },
    { href: '/batch3/help', label: 'Report an Issue', iconName: 'confirmation_number' }
  ];

  const getHeaderDetails = () => {
    const path = location.pathname;
    // Labs first — their paths contain segments (/chemistry/teacher) that would
    // otherwise fall through to a dashboard match below.
    if (path === '/batch3/labs') return { title: 'Science Labs', sub: 'Interactive NCERT labs for Physics, Chemistry and Biology.' };
    if (path.includes('/labs/physics')) return { title: 'Physics Lab', sub: 'Motion, friction, sound, circuits and optics simulators.' };
    if (path.includes('/labs/chemistry')) return { title: 'Chemistry Lab', sub: 'Balance reactions, craft compounds, and run the free lab.' };
    if (path.includes('/labs/biology')) return { title: 'Biology Lab', sub: 'NCERT diagram hub, cell sandbox, and spatial recall quizzes.' };
    if (path.includes('/subjects')) return { title: 'Subjects & Units', sub: 'NCERT CBSE syllabus checklist with Board tags.' };
    if (path.includes('/concept-map')) return { title: 'Interactive Concept Maps', sub: 'Visualize logical connections between chapter topics.' };
    if (path.includes('/board-prep')) return { title: 'CBSE Board Prep Zone', sub: 'Syllabus weightage trends, past papers, and answer tips.' };
    if (path.includes('/chat')) return { title: 'AI Doubt Solver', sub: 'Step-by-step problem solver with LaTeX support.' };
    if (path.includes('/daily-challenges')) return { title: 'CBSE Daily Challenges', sub: 'Practice HOTS, Case Study, and Assertion & Reason questions.' };
    if (path.includes('/exams')) return { title: 'Practice Exams', sub: 'CBSE Board exam pattern mock tests.' };
    if (path.includes('/tasks')) return { title: 'My Tasks', sub: 'Complete work your teacher has assigned to earn XP.' };
    if (path.includes('/notes')) return { title: 'Board Study Notes', sub: 'Create notes and tag board topics.' };
    if (path.includes('/pyq')) return { title: 'Board PYQ Papers', sub: 'CBSE past year papers with examiner schemes.' };
    if (path.includes('/pomodoro')) return { title: 'Pomodoro Focus Timer', sub: 'Utilize 25/5 or 50/10 focus intervals to track study times.' };
    if (path.includes('/streak')) return { title: 'Streak tracker', sub: 'Streak calendar tied to board prep milestones.' };
    if (path.includes('/profile')) return { title: 'Syllabus Profile', sub: 'View board readiness progress levels.' };
    return { title: 'Board prep dashboard', sub: 'Ready to prepare for Class 10 Board Exams?' };
  };

  const header = getHeaderDetails();

  if (currentClass < 9 || currentClass > 10) return null;

  /* The science labs manage their own scrolling and internal panels, so they
     get a full-bleed content area pinned to the viewport height instead of the
     usual padded, max-width, page-scrolling <main>. */
  const isLabRoute = location.pathname.startsWith('/batch3/labs');
  const isLab = location.pathname.includes('/labs/');

  useEffect(() => {
    setNavCollapsed(isLabRoute);
    if (!isLabRoute) setLabFocusMode(false);
  }, [isLabRoute]);

  return (
    <div className={`flex bg-slate-50/50 ${isLab ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {/* Sidebar Navigation */}
      {!labFocusMode && (
        <Sidebar
          navItems={navItems}
          batchColor="sky"
          logoText="EduAI"
          logoIcon="auto_stories"
          collapsed={isLabRoute && navCollapsed}
          onCollapsedChange={isLabRoute ? setNavCollapsed : undefined}
        />
      )}

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header TopBar */}
        {!labFocusMode && (
          <TopBar
            greeting="Study Workspace,"
            userName={studentName}
            subtitle={header.sub}
            batchColor="sky"
            userAvatar={studentAvatar}
            profileHref="/batch3/profile"
            rightSlot={isLab ? (
              <div className="hidden items-center gap-2 lg:flex">
                <button
                  type="button"
                  onClick={() => setLabFocusMode(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
                >
                  <Maximize2 size={14} /> Focus mode
                </button>
              </div>
            ) : undefined}
          />
        )}

        {/* Dynamic page container */}
        {isLab ? (
          <main className="lab-embed relative flex-1 min-h-0 w-full overflow-hidden">
            {labFocusMode && (
              <button
                type="button"
                onClick={() => setLabFocusMode(false)}
                className="absolute left-4 top-4 z-[100] inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2 text-xs font-bold text-white shadow-xl backdrop-blur transition hover:bg-slate-800"
              >
                <Minimize2 size={14} /> Exit focus mode
              </button>
            )}
            <Suspense fallback={<LabLoading />}>
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
