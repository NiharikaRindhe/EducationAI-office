import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, NavItem } from '../../components/shared/Sidebar';
import { TopBar } from '../../components/shared/TopBar';
import { useAuth } from '../../context/AuthContext';

// Kept intact and reversible, just off the nav and blocked at the route level
// in App.tsx (see the comment there for the sheet items behind each one):
// Labs (#58), Lab In-charges (#65), Feature Toggles (#66 — same "every school
// gets every feature" call as Super Admin's #10), School Branding (#67 — its
// logo upload moved into Profile & Settings), Principal Report (#68).
const LABS_ENABLED = false;
const LAB_INCHARGES_ENABLED = false;
const FEATURE_TOGGLES_ENABLED = false;
const BRANDING_ENABLED = false;
const PRINCIPAL_REPORT_ENABLED = false;

export const SchoolAdminLayout: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems: NavItem[] = [
    { href: '/school-admin/dashboard', label: 'Dashboard', iconName: 'dashboard' },
    { href: '/school-admin/classes', label: 'Classes & Sections', iconName: 'view_module' },
    { href: '/school-admin/students', label: 'Students', iconName: 'groups' },
    { href: '/school-admin/teachers', label: 'Teachers', iconName: 'school' },
    LABS_ENABLED ? { href: '/school-admin/labs', label: 'Labs', iconName: 'science' } : null,
    { href: '/school-admin/timetable', label: 'Timetable', iconName: 'calendar_month' },
    { href: '/school-admin/content', label: 'Content Library', iconName: 'menu_book' },
    LAB_INCHARGES_ENABLED ? { href: '/school-admin/lab-incharges', label: 'Lab In-charges', iconName: 'support_agent' } : null,
    FEATURE_TOGGLES_ENABLED ? { href: '/school-admin/feature-toggles', label: 'Feature Toggles', iconName: 'toggle_on' } : null,
    BRANDING_ENABLED ? { href: '/school-admin/branding', label: 'School Branding', iconName: 'image' } : null,
    PRINCIPAL_REPORT_ENABLED ? { href: '/school-admin/principal-report', label: 'Principal Report', iconName: 'summarize' } : null,
    // Sheet item #69 restored (Aug 25 2026, user request) — the only feature
    // that actually handles new Class 1 intake / mid-school promotion /
    // Class 10 pass-out, so hiding it left no way to run a real academic
    // year rollover at all. Route unblocked in App.tsx to match.
    { href: '/school-admin/promotion', label: 'Academic Year Rollover', iconName: 'event_upcoming' },
    { href: '/school-admin/tickets', label: 'Support Tickets', iconName: 'confirmation_number' },
  ].filter((item): item is NavItem => item !== null);

  const getHeaderDetails = () => {
    const path = location.pathname;
    if (path.includes('/classes')) return { title: 'Classes & Sections', sub: 'Define sections, assign class teachers and subject teachers.' };
    if (path.includes('/students')) return { title: 'Students', sub: 'Import students, print login slips, manage accounts.' };
    if (path.includes('/teachers')) return { title: 'Teachers', sub: 'Add teachers, reset passwords, then map them to sections on the Classes page.' };
    if (path.includes('/timetable')) return { title: 'Timetable', sub: 'Build the weekly lab-period grid per section.' };
    if (path.includes('/content')) return { title: 'Content Library', sub: "Upload supplementary books for your school's own AI tutor." };
    if (path.includes('/tickets')) return { title: 'Support Tickets', sub: 'Resolve reported issues, or escalate to the Super Admin.' };
    if (path.includes('/promotion')) return { title: 'Academic Year Rollover', sub: 'Promote every class, pass out Class 10, and open the new intake — once per academic year.' };
    if (path.includes('/profile')) return { title: 'Profile & Settings', sub: 'Your account, password and school branding.' };
    return { title: 'School Admin', sub: 'Set up and manage your school on EduAI.' };
  };

  const header = getHeaderDetails();

  return (
    <div className="min-h-screen flex bg-slate-50/50">
      <Sidebar navItems={navItems} batchColor="schoolAdmin" logoText="EduAI" />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar greeting="Welcome," userName={user?.full_name ?? 'School Admin'} subtitle={header.sub} batchColor="schoolAdmin" profileHref="/school-admin/profile" />
        <main className="flex-1 w-full overflow-y-auto p-5 lg:p-6 xl:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
