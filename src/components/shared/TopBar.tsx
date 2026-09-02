import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, User as UserIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface TopBarProps {
  greeting: string;
  userName?: string;
  subtitle: string;
  batchColor: 'amber' | 'indigo' | 'teal' | 'sky' | 'slate' | 'emerald' | 'teacher' | 'schoolAdmin' | 'superAdmin' | 'labIncharge';
  userAvatar?: string;
  profileHref?: string;
  rightSlot?: React.ReactNode;
  /** Sheet item #110 — teacher portal has no Profile / Settings page. */
  showProfileLink?: boolean;
  showStreak?: boolean;
}

const NO_XP_STRIP_PORTALS = new Set(['teacher', 'emerald', 'schoolAdmin', 'superAdmin', 'labIncharge']);
const STUDENT_PORTALS = new Set(['amber', 'indigo', 'teal', 'sky']);

const ROLE_LABELS: Record<TopBarProps['batchColor'], string> = {
  amber: 'Student', indigo: 'Student', teal: 'Student', sky: 'Student', slate: 'Student', emerald: 'Student',
  teacher: 'Teacher', schoolAdmin: 'School Admin', superAdmin: 'Super Admin', labIncharge: 'Lab In-charge',
};

export const TopBar: React.FC<TopBarProps> = ({
  greeting,
  userName,
  subtitle,
  batchColor,
  userAvatar,
  profileHref = '/profile',
  rightSlot,
  showProfileLink = true,
  showStreak = true,
}) => {
  const { currentClass, studentXP, studentStreak } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Profile + Setting in one small dropdown, rather than a bare "U" tile
  // linking off to the portal's own dashboard (items #37/#38, UI testing
  // pass Aug 24 2026). Only the real-auth portals (no userAvatar) get this —
  // student portals already have a real emoji avatar and a real /profile page.
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  const themeColors = {
    amber: 'text-amber-600',
    indigo: 'text-indigo-600',
    teal: 'text-teal-700',
    sky: 'text-sky-500',
    slate: 'text-purple-600',
    emerald: 'text-emerald-600',
    teacher: 'text-indigo-600',
    schoolAdmin: 'text-rose-600',
    superAdmin: 'text-slate-800',
    labIncharge: 'text-teal-600'
  };

  const classBadgeColors: Partial<Record<TopBarProps['batchColor'], string>> = {
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-800',
    teal: 'border-teal-200 bg-teal-50 text-teal-800',
    sky: 'border-sky-200 bg-sky-50 text-sky-800',
  };

  return (
    <header className="min-h-20 border-b border-slate-100 bg-white/80 backdrop-blur-md px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sticky top-0 z-40">
      {/* Greetings */}
      <div className="min-w-0 flex-1">
        <h1 className="font-display font-bold text-base sm:text-xl text-slate-800 flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className={userName ? 'hidden sm:inline' : undefined}>{greeting}</span>
          {userName && <span className={`${themeColors[batchColor]} truncate`}>{userName}!</span>}
          {STUDENT_PORTALS.has(batchColor) && currentClass > 0 && (
            <span className={`ml-1 inline-flex shrink-0 items-center rounded-lg border px-2 py-1 font-sans text-[10px] font-extrabold uppercase tracking-wider sm:ml-2 sm:px-2.5 sm:text-[11px] ${classBadgeColors[batchColor] ?? 'border-slate-200 bg-slate-50 text-slate-700'}`}>
              Class {currentClass}
            </span>
          )}
        </h1>
        <p className="hidden sm:block font-sans text-xs text-slate-400 font-medium truncate">{subtitle}</p>
      </div>

      {/* Right controls */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-4 lg:gap-6">
        {/* Streak / XP summary for student portals */}
        {!NO_XP_STRIP_PORTALS.has(batchColor) && !rightSlot && (
          <div className="hidden lg:flex items-center gap-4 bg-slate-50 border border-slate-100 p-1.5 px-3 rounded-xl select-none">
            {/* Streak */}
            {showStreak && <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber-500 font-fill text-lg animate-pulse">local_fire_department</span>
              <span className="font-display font-bold text-xs text-slate-700">{studentStreak} Days</span>
            </div>}
            {showStreak && <div className="w-[1px] h-4 bg-slate-200"></div>}
            {/* XP */}
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-indigo-500 font-fill text-lg">workspace_premium</span>
              <span className="font-display font-bold text-xs text-slate-700">{studentXP} XP</span>
            </div>
          </div>
        )}

        {/* Custom right slot if provided */}
        {rightSlot}

        {/* Kiosk hygiene: always-visible logout for shared lab PCs — the next
            student must never inherit a session, and shouldn't have to hunt
            through the sidebar to sign out between periods. */}
        {STUDENT_PORTALS.has(batchColor) && (
          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 font-sans text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        )}

        {/* Action icons.
            A notification bell used to live here with a hardcoded unread count,
            so every user saw a permanent red dot that opened nothing. Removed
            until there is a real notifications feed to hang off it. */}
        <div className="flex items-center gap-3">
          {/* Profile Circle / Avatar Link */}
          {userAvatar ? (
            <Link
              to={profileHref}
              aria-label="Open profile"
              className="w-10 h-10 rounded-xl hover:bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shadow-xs hover:scale-105 transition-all select-none cursor-pointer"
            >
              {userAvatar}
            </Link>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Profile and settings"
                aria-expanded={menuOpen}
                className={`flex items-center gap-1.5 h-10 pl-1 pr-2 rounded-xl border transition-all cursor-pointer ${
                  menuOpen ? 'bg-slate-100 border-slate-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <span className={`w-8 h-8 rounded-lg text-white flex items-center justify-center shrink-0 ${themeColors[batchColor].replace('text-', 'bg-')}`}>
                  <UserIcon size={16} />
                </span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white border border-slate-100 rounded-2xl shadow-lg py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-slate-50">
                    <span className="block text-[13px] font-semibold text-slate-800 truncate">{user?.full_name ?? 'Account'}</span>
                    <span className="block text-[11px] text-slate-400">{ROLE_LABELS[batchColor]}</span>
                  </div>
                  {showProfileLink && (
                  <Link
                    to={profileHref}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <UserIcon size={14} /> Profile &amp; Settings
                  </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
