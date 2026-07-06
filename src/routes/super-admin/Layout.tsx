import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, NavItem } from '../../components/shared/Sidebar';
import { TopBar } from '../../components/shared/TopBar';

export const SuperAdminLayout: React.FC = () => {
  const navItems: NavItem[] = [
    { href: '/super-admin/schools', label: 'Schools', iconName: 'apartment' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50/50">
      <Sidebar navItems={navItems} batchColor="superAdmin" logoText="EduAI" logoIcon="admin_panel_settings" />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar greeting="Welcome," subtitle="Manage every school on the EduAI platform." batchColor="superAdmin" profileHref="/super-admin/schools" />
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
