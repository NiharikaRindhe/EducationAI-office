import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar, NavItem } from '../../components/shared/Sidebar';
import { TopBar } from '../../components/shared/TopBar';

export const TeacherLayout: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems: NavItem[] = [
    { href: '/teacher/dashboard', label: 'Dashboard', iconName: 'dashboard' },
    { href: '/teacher/live-session', label: 'Live Session', iconName: 'cast_for_education' },
    { href: '/teacher/students', label: 'Students', iconName: 'people' },
    { href: '/teacher/assign-tasks', label: 'Assign Tasks', iconName: 'assignment_add' },
    { href: '/teacher/create-exam', label: 'Create Exam', iconName: 'edit_note' },
    { href: '/teacher/reports', label: 'Reports & Analytics', iconName: 'analytics' }
  ];

  const getHeaderDetails = () => {
    const path = location.pathname;
    if (path.includes('/live-session')) return { title: 'Live Session', sub: 'Start a lab period for one of your sections — students join and Batch 1 PIN login unlocks.' };
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
        logoIcon="dashboard_customize"
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
        />

        {/* Dynamic page container */}
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
