import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar, NavItem } from '../../components/shared/Sidebar';
import { TopBar } from '../../components/shared/TopBar';

export const LabInchargeLayout: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems: NavItem[] = [
    { href: '/lab-incharge/dashboard', label: 'Dashboard', iconName: 'dashboard' },
    { href: '/lab-incharge/students', label: 'Students', iconName: 'groups' },
    { href: '/lab-incharge/teachers', label: 'Teachers', iconName: 'school' },
  ];

  const getHeaderDetails = () => {
    const path = location.pathname;
    if (path.includes('/students')) return { title: 'Students', sub: 'Look up a student and reset their PIN or password.' };
    if (path.includes('/teachers')) return { title: 'Teachers', sub: "Reset a teacher's password if they're locked out." };
    return { title: 'Lab In-charge', sub: "Today's live sessions and quick login help — no grades or exams here." };
  };

  const header = getHeaderDetails();

  return (
    <div className="min-h-screen flex bg-slate-50/50">
      <Sidebar navItems={navItems} batchColor="labIncharge" logoText="EduAI" logoIcon="support_agent" />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          greeting="Welcome,"
          userName={user?.full_name ?? 'Lab In-charge'}
          subtitle={header.sub}
          batchColor="labIncharge"
          profileHref="/lab-incharge/dashboard"
        />
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
