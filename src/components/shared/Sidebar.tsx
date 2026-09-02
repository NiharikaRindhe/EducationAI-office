import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { schoolLogoUrl } from '../../lib/assets';
// Nav icons are Material Symbols now (NavItem.iconName), so the long lucide
// icon list this file used to carry is gone; only the chrome icons remain.
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  iconName: string; // Material symbol name
  children?: NavItem[];
}

interface SidebarProps {
  navItems: NavItem[];
  batchColor: 'amber' | 'indigo' | 'teal' | 'sky' | 'slate' | 'emerald' | 'teacher' | 'schoolAdmin' | 'superAdmin' | 'labIncharge';
  logoText: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  showStreak?: boolean;
}

const REAL_AUTH_PORTALS = new Set(['teacher', 'schoolAdmin', 'superAdmin', 'labIncharge']);

export const Sidebar: React.FC<SidebarProps> = ({
  navItems,
  batchColor,
  logoText,
  collapsed = false,
  onCollapsedChange,
  showStreak = true,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { studentName, studentAvatar, studentXP, studentStreak } = useApp();
  const { user, logout: authLogout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // A school's logo is uploaded content and lives in a public bucket — if the
  // object is missing or corrupt the <img> would render as a broken icon in
  // every page of the portal, so fall back to the lettered tile instead.
  const [failedLogoPath, setFailedLogoPath] = useState<string | null>(null);
  const school = user?.school ?? null;

  const brandName = school?.name ?? logoText;
  // EduAI stays visible under the school's name — this is their portal, but
  // it is not their product. No subtitle at all once there's no school to
  // attribute it to (item #35, UI testing pass Aug 24 2026 — the old
  // "K-12 PORTAL" fallback read as unfinished placeholder copy).
  const brandSubtitle = school ? 'Powered by EduAI' : '';
  const schoolLogoSrc = school?.logoPath && school.logoPath !== failedLogoPath ? schoolLogoUrl(school.logoPath) : null;

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
    teal: {
      sidebarBg: 'bg-white border-r border-slate-200 shadow-sm',
      activeItem: 'bg-teal-700 text-white shadow-md shadow-teal-700/15',
      hoverItem: 'hover:bg-teal-50 text-slate-700',
      textColor: 'text-slate-700',
      logoBg: 'bg-slate-900 text-white',
      accentColor: 'text-teal-700'
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
    },
    labIncharge: {
      sidebarBg: 'bg-white border-r border-teal-100 shadow-sm',
      activeItem: 'bg-teal-600 text-white shadow-md shadow-teal-600/20',
      hoverItem: 'hover:bg-teal-50 text-teal-900',
      textColor: 'text-slate-700',
      logoBg: 'bg-teal-600 text-white',
      accentColor: 'text-teal-600'
    }
  };

  const currentTheme = themeClasses[batchColor];

  const handleLogout = () => {
    authLogout();
    navigate('/login');
  };

  return (
    <aside className={`${collapsed ? 'w-[76px] px-3' : 'w-[76px] px-3 md:w-60 md:px-6'} relative shrink-0 h-screen sticky top-0 flex flex-col justify-between py-4 md:py-6 ${currentTheme.sidebarBg} select-none transition-[width,padding] duration-300 ease-out`}>
      {onCollapsedChange && (
        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          className="absolute -right-3 top-7 z-50 hidden h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-md transition hover:text-sky-600 md:flex"
        >
          {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
      )}
      {/* min-h-0 lets this flex child actually shrink inside the h-screen
          aside so overflow-y-auto scrolls just the nav list — without it the
          whole sidebar (including the footer/logout button) grew past the
          viewport instead. no-scrollbar keeps that internal scroll working
          on wheel/touch without showing a scrollbar track next to the nav. */}
      <div className={`flex flex-col gap-6 md:gap-8 overflow-y-auto no-scrollbar min-h-0 ${collapsed ? '' : 'md:pr-1'}`}>
        {/* Brand — the school's own identity when the user belongs to one,
            falling back to EduAI's for the Super Admin (no school) and for
            schools that haven't uploaded a logo yet. */}
        <Link
          to="/"
          className={`flex items-center ${collapsed ? 'justify-center' : 'justify-center md:justify-start md:gap-3'}`}
          title={brandName}
        >
          {schoolLogoSrc ? (
            <img
              src={schoolLogoSrc}
              alt={`${brandName} logo`}
              onError={() => setFailedLogoPath(school?.logoPath ?? null)}
              className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-200 shrink-0"
            />
          ) : (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-lg shrink-0 ${currentTheme.logoBg}`}>
              {brandName.charAt(0)}
            </div>
          )}
          <div className={collapsed ? 'hidden' : 'hidden min-w-0 md:block'}>
            {/* Real school names ("Springfield Public School") overflow a
                sidebar at the platform's own 18px wordmark size, so school
                branding wraps to two lines at a smaller size instead of
                truncating to something unrecognisable. */}
            <span
              className={`font-display font-bold text-slate-800 block leading-tight ${
                school ? 'text-[13px] line-clamp-2' : 'text-lg truncate'
              }`}
              title={brandName}
            >
              {brandName}
            </span>
            {brandSubtitle && (
              <span className="text-[10px] text-slate-400 font-label-caps tracking-wider block truncate mt-0.5">
                {brandSubtitle}
              </span>
            )}
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
                    title={item.label}
                    aria-label={item.label}
                    aria-expanded={isExpanded}
                    onClick={() => toggleSubnav(item.label)}
                    className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'justify-center px-2 md:justify-between md:px-4'} py-3 rounded-xl font-sans text-sm font-semibold transition-all cursor-pointer ${
                      isActive ? currentTheme.activeItem : currentTheme.hoverItem
                    }`}
                  >
                    <div className={`flex items-center ${collapsed ? '' : 'md:gap-3'}`}>
                      <span className="material-symbols-outlined text-lg">{item.iconName}</span>
                      {!collapsed && <span className="hidden md:inline">{item.label}</span>}
                    </div>
                    {!collapsed && <span className="hidden md:inline-flex">{isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>}
                  </button>
                ) : (
                  <Link
                    to={item.href}
                    title={item.label}
                    aria-label={item.label}
                    className={`flex items-center ${collapsed ? 'justify-center px-2' : 'justify-center px-2 md:justify-start md:gap-3 md:px-4'} py-3 rounded-xl font-sans text-sm font-semibold transition-all ${
                      isActive ? currentTheme.activeItem : currentTheme.hoverItem
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{item.iconName}</span>
                    {!collapsed && <span className="hidden md:inline">{item.label}</span>}
                  </Link>
                )}

                {/* Sub-navigation items */}
                {hasChildren && isExpanded && !collapsed && (
                  <div className="pl-8 mt-1.5 hidden flex-col gap-1 md:flex">
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
      <div className={`pt-4 border-t border-slate-200/50 flex flex-col gap-3 md:gap-4 ${collapsed ? 'items-center' : 'items-center md:items-stretch'}`}>
        {/* User preview for students */}
        {!REAL_AUTH_PORTALS.has(batchColor) && (
          <div className={`flex items-center justify-between rounded-2xl bg-white/50 border border-white/80 shadow-xs ${collapsed ? 'p-2' : 'p-2 md:p-2.5'}`} title={studentName}>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{studentAvatar}</span>
              <div className={`min-w-0 ${collapsed ? 'hidden' : 'hidden md:block'}`}>
                <span className="font-display font-bold text-xs text-slate-800 block truncate">{studentName}</span>
                <span className="text-[10px] text-slate-400 block font-label-caps tracking-wider">{studentXP} XP</span>
              </div>
            </div>
            {showStreak && <div className={`items-center gap-0.5 text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-100 ${collapsed ? 'hidden' : 'hidden md:flex'}`}>
              <span className="material-symbols-outlined text-xs font-fill">local_fire_department</span>
              <span className="text-[10px] font-bold">{studentStreak}d</span>
            </div>}
          </div>
        )}

        {/* User preview for teacher / school admin / super admin — real auth data */}
        {REAL_AUTH_PORTALS.has(batchColor) && (
          <div className={`flex items-center p-2 bg-slate-50 rounded-xl ${collapsed ? '' : 'md:gap-2.5'}`} title={user?.full_name ?? undefined}>
            <div className={`w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold text-sm ${currentTheme.logoBg}`}>
              {(user?.full_name ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className={`min-w-0 ${collapsed ? 'hidden' : 'hidden md:block'}`}>
              <span className="font-display font-semibold text-xs text-slate-800 block truncate">{user?.full_name ?? '—'}</span>
              <span className="text-[10px] text-slate-400 block font-label-caps">
                {batchColor === 'teacher'
                  ? 'Teacher'
                  : batchColor === 'schoolAdmin'
                    ? 'School Admin'
                    : batchColor === 'labIncharge'
                      ? 'Lab In-charge'
                      : 'Super Admin'}
              </span>
            </div>
          </div>
        )}

        {/* Log Out button */}
        <button
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
          className={`flex items-center py-2.5 rounded-xl font-sans text-sm font-semibold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer w-full ${collapsed ? 'justify-center px-2' : 'justify-center px-2 md:justify-start md:gap-3 md:px-4 md:text-left'}`}
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          {!collapsed && <span className="hidden md:inline">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
