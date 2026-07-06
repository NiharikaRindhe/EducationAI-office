import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronDown, ChevronRight, LogOut,
  BookOpen, Trophy, Calendar, CheckSquare,
  Gamepad, Award, Camera, ShieldAlert,
  Users, ClipboardList, PenTool, BarChart3,
  HelpCircle, Sparkles, MessageSquare, Compass,
  BookMarked, Flame, Home, Clock, Layers
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  iconName: string; // Material symbol name
  children?: NavItem[];
}

interface SidebarProps {
  navItems: NavItem[];
  batchColor: 'amber' | 'indigo' | 'sky' | 'slate' | 'emerald' | 'teacher' | 'schoolAdmin' | 'superAdmin';
  logoText: string;
  logoIcon: string; // Material symbol name
}

const REAL_AUTH_PORTALS = new Set(['teacher', 'schoolAdmin', 'superAdmin']);

export const Sidebar: React.FC<SidebarProps> = ({ navItems, batchColor, logoText, logoIcon }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { studentName, studentAvatar, studentXP, studentStreak } = useApp();
  const { user, logout: authLogout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleSubnav = (label: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  // Color mapping based on theme
  const themeClasses = {
    amber: {
      sidebarBg: 'bg-gradient-to-b from-amber-50 to-orange-50 border-r border-amber-100',
      activeItem: 'bg-amber-500 text-white shadow-md shadow-amber-500/20',
      hoverItem: 'hover:bg-amber-100/50 text-amber-900',
      textColor: 'text-amber-900',
      logoBg: 'bg-amber-500 text-white',
      accentColor: 'text-amber-600'
    },
    indigo: {
      sidebarBg: 'bg-gradient-to-b from-indigo-50 to-violet-50 border-r border-indigo-100',
      activeItem: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20',
      hoverItem: 'hover:bg-indigo-100/50 text-indigo-900',
      textColor: 'text-indigo-900',
      logoBg: 'bg-indigo-600 text-white',
      accentColor: 'text-indigo-600'
    },
    sky: {
      sidebarBg: 'bg-gradient-to-b from-sky-50 to-cyan-50 border-r border-sky-100',
      activeItem: 'bg-sky-500 text-white shadow-md shadow-sky-500/20',
      hoverItem: 'hover:bg-sky-100/50 text-sky-950',
      textColor: 'text-sky-950',
      logoBg: 'bg-sky-500 text-white',
      accentColor: 'text-sky-500'
    },
    slate: {
      sidebarBg: 'bg-gradient-to-b from-slate-50 to-purple-50 border-r border-slate-200',
      activeItem: 'bg-purple-600 text-white shadow-md shadow-purple-600/20',
      hoverItem: 'hover:bg-purple-100/30 text-slate-800',
      textColor: 'text-slate-800',
      logoBg: 'bg-purple-600 text-white',
      accentColor: 'text-purple-600'
    },
    emerald: {
      sidebarBg: 'bg-white border-r border-emerald-100 shadow-sm',
      activeItem: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20',
      hoverItem: 'hover:bg-emerald-50 text-emerald-900',
      textColor: 'text-slate-700',
      logoBg: 'bg-emerald-600 text-white',
      accentColor: 'text-emerald-600'
    },
    teacher: {
      sidebarBg: 'bg-white border-r border-indigo-100 shadow-sm',
      activeItem: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20',
      hoverItem: 'hover:bg-indigo-50 text-indigo-900',
      textColor: 'text-slate-700',
      logoBg: 'bg-indigo-600 text-white',
      accentColor: 'text-indigo-600'
    },
    schoolAdmin: {
      sidebarBg: 'bg-white border-r border-rose-100 shadow-sm',
      activeItem: 'bg-rose-600 text-white shadow-md shadow-rose-600/20',
      hoverItem: 'hover:bg-rose-50 text-rose-900',
      textColor: 'text-slate-700',
      logoBg: 'bg-rose-600 text-white',
      accentColor: 'text-rose-600'
    },
    superAdmin: {
      sidebarBg: 'bg-white border-r border-slate-200 shadow-sm',
      activeItem: 'bg-slate-800 text-white shadow-md shadow-slate-800/20',
      hoverItem: 'hover:bg-slate-100 text-slate-900',
      textColor: 'text-slate-700',
      logoBg: 'bg-slate-800 text-white',
      accentColor: 'text-slate-800'
    }
  };

  const currentTheme = themeClasses[batchColor];

  const handleLogout = () => {
    authLogout();
    navigate('/login');
  };

  return (
    <aside className={`w-60 shrink-0 h-screen sticky top-0 flex flex-col justify-between p-6 ${currentTheme.sidebarBg} select-none`}>
      <div className="flex flex-col gap-8 overflow-y-auto pr-1">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-lg ${currentTheme.logoBg}`}>
            {logoText.charAt(0)}
          </div>
          <div>
            <span className="font-display font-bold text-lg text-slate-800 block leading-tight">{logoText}</span>
            <span className="text-[10px] text-slate-400 font-label-caps tracking-wider block">K-12 PORTAL</span>
          </div>
        </Link>

        {/* Navigation list */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = !!expandedItems[item.label];
            const isActive = location.pathname === item.href || 
                             (item.href !== '/' && location.pathname.startsWith(item.href));

            return (
              <div key={item.label} className="w-full">
                {hasChildren ? (
                  <button
                    onClick={() => toggleSubnav(item.label)}
                    className={`w-full flex items-center justify-between py-3 px-4 rounded-xl font-sans text-sm font-semibold transition-all cursor-pointer ${
                      isActive ? currentTheme.activeItem : currentTheme.hoverItem
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-lg">{item.iconName}</span>
                      <span>{item.label}</span>
                    </div>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                ) : (
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 py-3 px-4 rounded-xl font-sans text-sm font-semibold transition-all ${
                      isActive ? currentTheme.activeItem : currentTheme.hoverItem
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{item.iconName}</span>
                    <span>{item.label}</span>
                  </Link>
                )}

                {/* Sub-navigation items */}
                {hasChildren && isExpanded && (
                  <div className="pl-8 mt-1.5 flex flex-col gap-1">
                    {item.children?.map((sub) => {
                      const isSubActive = location.pathname === sub.href;
                      return (
                        <Link
                          key={sub.label}
                          to={sub.href}
                          className={`flex items-center gap-2.5 py-2 px-3 rounded-lg font-sans text-xs font-medium transition-all ${
                            isSubActive 
                              ? `${currentTheme.accentColor} bg-white/60 font-semibold shadow-xs` 
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">{sub.iconName}</span>
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer with Avatar & Log Out */}
      <div className="pt-4 border-t border-slate-200/50 flex flex-col gap-4">
        {/* User preview for students */}
        {!REAL_AUTH_PORTALS.has(batchColor) && (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/50 border border-white/80 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{studentAvatar}</span>
              <div className="min-w-0">
                <span className="font-display font-bold text-xs text-slate-800 block truncate">{studentName}</span>
                <span className="text-[10px] text-slate-400 block font-label-caps tracking-wider">{studentXP} XP</span>
              </div>
            </div>
            <div className="flex items-center gap-0.5 text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-100">
              <span className="material-symbols-outlined text-xs font-fill">local_fire_department</span>
              <span className="text-[10px] font-bold">{studentStreak}d</span>
            </div>
          </div>
        )}

        {/* User preview for teacher / school admin / super admin — real auth data */}
        {REAL_AUTH_PORTALS.has(batchColor) && (
          <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl">
            <div className={`w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold text-sm ${currentTheme.logoBg}`}>
              {(user?.full_name ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="font-display font-semibold text-xs text-slate-800 block truncate">{user?.full_name ?? '—'}</span>
              <span className="text-[10px] text-slate-400 block font-label-caps">
                {batchColor === 'teacher' ? 'Teacher' : batchColor === 'schoolAdmin' ? 'School Admin' : 'Super Admin'}
              </span>
            </div>
          </div>
        )}

        {/* Log Out button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 py-2.5 px-4 rounded-xl font-sans text-sm font-semibold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer w-full text-left"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
