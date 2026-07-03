import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface TopBarProps {
  greeting: string;
  userName?: string;
  subtitle: string;
  batchColor: 'amber' | 'indigo' | 'sky' | 'slate' | 'emerald' | 'teacher';
  notifCount?: number;
  userAvatar?: string;
  profileHref?: string;
  rightSlot?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({
  greeting,
  userName,
  subtitle,
  batchColor,
  notifCount = 2,
  userAvatar,
  profileHref = '/profile',
  rightSlot
}) => {
  const { studentXP, studentStreak } = useApp();

  const themeColors = {
    amber: 'text-amber-600',
    indigo: 'text-indigo-600',
    sky: 'text-sky-500',
    slate: 'text-purple-600',
    emerald: 'text-emerald-600',
    teacher: 'text-indigo-600'
  };

  const ringColors = {
    amber: 'focus:ring-amber-500/20 focus:border-amber-500',
    indigo: 'focus:ring-indigo-500/20 focus:border-indigo-500',
    sky: 'focus:ring-sky-500/20 focus:border-sky-500',
    slate: 'focus:ring-purple-500/20 focus:border-purple-500',
    emerald: 'focus:ring-emerald-500/20 focus:border-emerald-500',
    teacher: 'focus:ring-indigo-500/20 focus:border-indigo-500'
  };

  return (
    <header className="h-20 border-b border-slate-100 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Greetings */}
      <div>
        <h1 className="font-display font-bold text-xl text-slate-800 flex items-center gap-2">
          <span>{greeting}</span>
          {userName && <span className={`${themeColors[batchColor]}`}>{userName}!</span>}
        </h1>
        <p className="font-sans text-xs text-slate-400 font-medium">{subtitle}</p>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-6">
        {/* Streak / XP summary for student portals */}
        {batchColor !== 'teacher' && batchColor !== 'emerald' && !rightSlot && (
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-1.5 px-3 rounded-xl select-none">
            {/* Streak */}
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber-500 font-fill text-lg animate-pulse">local_fire_department</span>
              <span className="font-display font-bold text-xs text-slate-700">{studentStreak} Days</span>
            </div>
            <div className="w-[1px] h-4 bg-slate-200"></div>
            {/* XP */}
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-indigo-500 font-fill text-lg">workspace_premium</span>
              <span className="font-display font-bold text-xs text-slate-700">{studentXP} XP</span>
            </div>
          </div>
        )}

        {/* Custom right slot if provided */}
        {rightSlot}

        {/* Action icons */}
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <button className="w-10 h-10 rounded-xl hover:bg-slate-50 border border-slate-100 flex items-center justify-center relative cursor-pointer group transition-all">
            <span className="material-symbols-outlined text-slate-600 text-xl group-hover:scale-110 transition-transform">notifications</span>
            {notifCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {/* Profile Circle / Avatar Link */}
          {userAvatar ? (
            <Link 
              to={profileHref}
              className="w-10 h-10 rounded-xl hover:bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shadow-xs hover:scale-105 transition-all select-none cursor-pointer"
            >
              {userAvatar}
            </Link>
          ) : (
            <Link 
              to={profileHref}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shadow-xs transition-all cursor-pointer"
            >
              U
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
