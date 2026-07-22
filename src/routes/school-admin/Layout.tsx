import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, NavItem } from '../../components/shared/Sidebar';
import { TopBar } from '../../components/shared/TopBar';

export const SchoolAdminLayout: React.FC = () => {
  const location = useLocation();

  const navItems: NavItem[] = [
    { href: '/school-admin/dashboard', label: 'Dashboard', iconName: 'dashboard' },
    { href: '/school-admin/classes', label: 'Classes & Sections', iconName: 'view_module' },
    { href: '/school-admin/students', label: 'Students', iconName: 'groups' },
    { href: '/school-admin/teachers', label: 'Teachers', iconName: 'school' },
    { href: '/school-admin/labs', label: 'Labs', iconName: 'science' },
    { href: '/school-admin/timetable', label: 'Timetable', iconName: 'calendar_month' },
    { href: '/school-admin/lab-incharges', label: 'Lab In-charges', iconName: 'support_agent' },
    { href: '/school-admin/feature-toggles', label: 'Feature Toggles', iconName: 'toggle_on' },
    { href: '/school-admin/principal-report', label: 'Principal Report', iconName: 'summarize' },
    { href: '/school-admin/promotion', label: 'Promotion Wizard', iconName: 'trending_up' },
    { href: '/school-admin/tickets', label: 'Support Tickets', iconName: 'confirmation_number' },
  ];

  const getHeaderDetails = () => {
    const path = location.pathname;
    if (path.includes('/classes')) return { title: 'Classes & Sections', sub: 'Define sections, assign class teachers and subject teachers.' };
    if (path.includes('/students')) return { title: 'Students', sub: 'Import students, print login slips, manage accounts.' };
    if (path.includes('/teachers')) return { title: 'Teachers', sub: 'Add teachers, reset passwords, then map them to sections on the Classes page.' };
    if (path.includes('/labs')) return { title: 'Labs', sub: 'Register your computer labs — the timetable schedules sections into these.' };
    if (path.includes('/timetable')) return { title: 'Timetable', sub: 'Build the weekly lab-period grid per section.' };
    if (path.includes('/lab-incharges')) return { title: 'Lab In-charges', sub: 'Add lab in-charges who can reset logins without touching grades.' };
    if (path.includes('/tickets')) return { title: 'Support Tickets', sub: 'Resolve reported issues, or escalate to the Super Admin.' };
    return { title: 'School Admin', sub: 'Set up and manage your school on EduAI.' };
  };

  const header = getHeaderDetails();

  return (
    <div className="min-h-screen flex bg-slate-50/50">
      <Sidebar navItems={navItems} batchColor="schoolAdmin" logoText="EduAI" logoIcon="apartment" />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar greeting="Welcome," subtitle={header.sub} batchColor="schoolAdmin" profileHref="/school-admin/dashboard" />
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
