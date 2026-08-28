import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth, type FeatureKey } from '../../context/AuthContext';
import { Sidebar, NavItem } from '../../components/shared/Sidebar';
import { TopBar } from '../../components/shared/TopBar';

export const TeacherLayout: React.FC = () => {
  const location = useLocation();
  const { user, hasFeature } = useAuth();

  // Entries whose feature the school hasn't bought are dropped. Create Exam
  // stays — manual exam creation is core; only the AI generator inside it is
  // gated, so the page itself must remain reachable.
  // Sheet items #99 / #102 / #108 / #109 — removed from nav, routes blocked.
  // Live Session stays reachable from the dashboard strip so Batch 1 PIN login
  // can still be started.
  const LIVE_SESSIONS_NAV = false;
  const ASSIGN_TASKS_NAV = false;
  const QUESTION_BANK_NAV = false;
  const REPORTS_NAV = false;

  const navItems: NavItem[] = ([
    { href: '/teacher/dashboard', label: 'Dashboard', iconName: 'dashboard' },
    LIVE_SESSIONS_NAV ? { href: '/teacher/live-session', label: 'Live Session', iconName: 'cast_for_education' } : null,
    { href: '/teacher/timetable', label: 'Timetable', iconName: 'calendar_month' },
    { href: '/teacher/students', label: 'Students', iconName: 'people' },
    ASSIGN_TASKS_NAV ? { href: '/teacher/assign-tasks', label: 'Assign Tasks', iconName: 'assignment_add' } : null,
    { href: '/teacher/create-exam', label: 'Create Exam', iconName: 'edit_note' },
    QUESTION_BANK_NAV ? { href: '/teacher/question-bank', label: 'Question Bank', iconName: 'library_books' } : null,
    REPORTS_NAV ? { href: '/teacher/reports', label: 'Reports & Analytics', iconName: 'analytics', feature: 'reports_analytics' } : null,
    { href: '/teacher/tickets', label: 'Report an Issue', iconName: 'confirmation_number' }
  ] as (NavItem & { feature?: FeatureKey } | null)[])
    .filter((item): item is NavItem & { feature?: FeatureKey } => item !== null)
    .filter((item) => !item.feature || hasFeature(item.feature));

  const getHeaderDetails = () => {
    const path = location.pathname;
    if (path.includes('/live-session')) return { title: 'Live Session', sub: 'Start a lab period for one of your sections — students join and Batch 1 PIN login unlocks.' };
    if (path.includes('/timetable')) return { title: 'My Timetable', sub: 'Your weekly lab periods — reschedule or cancel if the lab is unavailable.' };
    if (path.includes('/students')) return { title: 'Students Directory', sub: 'Monitor student analytics, streaks, and drill down into individual profiles.' };
    if (path.includes('/assign-tasks')) return { title: 'Assign New Task', sub: 'Create assignments for your sections — the same task to many sections, or different ones per section.' };
    if (path.includes('/create-exam')) return { title: 'Exam Builder Workspace', sub: 'Build customized quizzes using question types or NCERT question banks.' };
    if (path.includes('/reports')) return { title: 'Class Analytics & Heatmaps', sub: 'Analyze class averages and export final report cards.' };
    return { title: 'Teacher Dashboard', sub: 'Tracking classroom engagement, mock scores, and homework progress.' };
  };

  const header = getHeaderDetails();

  return (
    <div className="min-h-screen flex bg-slate-50/50">
      {/* Sidebar Navigation */}
      <Sidebar
        navItems={navItems}
        batchColor="teacher"
        logoText="EduAI"
      />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header TopBar */}
        <TopBar
          greeting="Welcome,"
          userName={user?.full_name ?? 'Teacher'}
          subtitle={header.sub}
          batchColor="teacher"
          profileHref="/teacher/dashboard"
          showProfileLink={false}
        />

        {/* Dynamic page container */}
        <main className="flex-1 w-full overflow-y-auto p-5 lg:p-6 xl:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
