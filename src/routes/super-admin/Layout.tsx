import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, NavItem } from '../../components/shared/Sidebar';
import { TopBar } from '../../components/shared/TopBar';

export const SuperAdminLayout: React.FC = () => {
  // Cross-school student browsing removed from the Super Admin nav entirely
  // (UI feedback Aug 24 2026): a Super Admin has no legitimate reason to see
  // students' XP/streak/activity data across every school, and even a
  // search-gated version of that view was judged too much exposure to
  // leave reachable. The route itself now redirects to Overview — see
  // App.tsx — rather than just being unlinked, so it can't be reached by
  // typing the URL either. Student.tsx and its API are left in place
  // (reversible) in case a narrower, audited lookup tool is wanted later
  // for support/ticket-solving (sheet item #2, still open).
  const navItems: NavItem[] = [
    { href: '/super-admin/overview', label: 'Overview', iconName: 'dashboard' },
    { href: '/super-admin/schools', label: 'Schools', iconName: 'apartment' },
    { href: '/super-admin/content', label: 'Content Portal', iconName: 'upload_file' },
    { href: '/super-admin/ai-console', label: 'AI Console', iconName: 'smart_toy' },
    { href: '/super-admin/tickets', label: 'Support Tickets', iconName: 'confirmation_number' },
    { href: '/super-admin/audit-log', label: 'Audit Log', iconName: 'history' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50/50">
      <Sidebar navItems={navItems} batchColor="superAdmin" logoText="EduAI" />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar greeting="Welcome," subtitle="Manage every school on the EduAI platform." batchColor="superAdmin" profileHref="/super-admin/profile" />
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
