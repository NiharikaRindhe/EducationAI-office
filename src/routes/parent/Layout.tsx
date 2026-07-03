import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Sidebar, NavItem } from '../../components/shared/Sidebar';
import { TopBar } from '../../components/shared/TopBar';

export const ParentLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, logout } = useApp();

  useEffect(() => {
    if (userRole !== 'parent') {
      if (userRole === 'student') navigate('/batch1/home');
      else if (userRole === 'teacher') navigate('/teacher/dashboard');
      else navigate('/login');
    }
  }, [userRole, navigate]);

  const navItems: NavItem[] = [
    { href: '/parent/dashboard', label: 'Dashboard', iconName: 'dashboard' },
    { href: '/parent/child-progress', label: 'Child\'s Progress', iconName: 'trending_up' },
    { href: '/parent/reports', label: 'Report Cards', iconName: 'assignment_turned_in' }
  ];

  const getHeaderDetails = () => {
    const path = location.pathname;
    if (path.includes('/child-progress')) return { title: 'Child\'s Progress', sub: 'Review subject grades, exam history, and teacher feedback.' };
    if (path.includes('/reports')) return { title: 'AI Report Cards', sub: 'Generate weekly AI summaries and share metrics to family WhatsApp groups.' };
    return { title: 'Parent Portal', sub: 'Tracking your child\'s learning journey, streaks, and syllabus checklists.' };
  };

  const header = getHeaderDetails();

  if (userRole !== 'parent') return null;

  return (
    <div className="min-h-screen flex bg-slate-50/50">
      {/* Sidebar Navigation */}
      <Sidebar 
        navItems={navItems}
        batchColor="emerald"
        logoText="EduAI"
        logoIcon="supervised_user_circle"
      />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header TopBar */}
        <TopBar 
          greeting="Welcome,"
          userName="Parent"
          subtitle={header.sub}
          batchColor="emerald"
          profileHref="/parent/dashboard"
        />

        {/* Dynamic page container */}
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
