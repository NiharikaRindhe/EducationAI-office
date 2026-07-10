import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { TodayPanel } from '../../components/shared/TodayPanel';
import { LogOut } from 'lucide-react';
import { api } from '../../lib/api';

/**
 * Batch 1 Home — Island-map style with 5 huge picture tiles.
 *
 * Design (BATCH1_UI_CONTENT_PLAN §2.1):
 * - NO sidebar. Home IS the navigation: 5 big tiles.
 * - Mascot greeting + XP/streak as pictures.
 * - TodayPanel only when a live session is active.
 * - Pre-reader variant (Class 1–2): tiles show only pictures, no words.
 * - Early-reader variant (Class 3–4): tiles show picture + one word.
 * - Per-class identity: mascot + accent color per class (1→egg, 2→rabbit, 3→fox, 4→owl).
 */

interface HomeTile {
  emoji: string;
  label: string;
  href: string;
  color: string;
  hoverColor: string;
  shadowColor: string;
  delay: string;
}

const TILES: HomeTile[] = [
  { emoji: '📖', label: 'Stories',  href: '/batch1/stories',  color: 'bg-sky-400',     hoverColor: 'hover:bg-sky-500',     shadowColor: 'shadow-sky-400/30',     delay: '0ms' },
  { emoji: '🎮', label: 'Games',   href: '/batch1/games',    color: 'bg-emerald-400', hoverColor: 'hover:bg-emerald-500', shadowColor: 'shadow-emerald-400/30', delay: '50ms' },
  { emoji: '⭐', label: 'Quizzes', href: '/batch1/exams',    color: 'bg-amber-400',   hoverColor: 'hover:bg-amber-500',   shadowColor: 'shadow-amber-400/30',   delay: '100ms' },
  { emoji: '✅', label: 'Tasks',   href: '/batch1/tasks',    color: 'bg-violet-400',  hoverColor: 'hover:bg-violet-500',  shadowColor: 'shadow-violet-400/30',  delay: '150ms' },
  { emoji: '📚', label: 'Syllabus', href: '/batch1/syllabus', color: 'bg-orange-400',  hoverColor: 'hover:bg-orange-500',  shadowColor: 'shadow-orange-400/30',  delay: '200ms' },
  { emoji: '🏆', label: 'My Stuff', href: '/batch1/my-stuff', color: 'bg-rose-400',   hoverColor: 'hover:bg-rose-500',    shadowColor: 'shadow-rose-400/30',    delay: '250ms' },
];

interface ClassTheme {
  mascot: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  headerBg: string;
}

const getClassTheme = (classNum: number): ClassTheme => {
  switch (classNum) {
    case 1:
      return { mascot: '🐣', accentColor: 'yellow', gradientFrom: 'from-yellow-300', gradientTo: 'to-yellow-400', headerBg: 'bg-gradient-to-r from-yellow-300 via-yellow-50 to-yellow-300' };
    case 2:
      return { mascot: '🐰', accentColor: 'pink', gradientFrom: 'from-pink-300', gradientTo: 'to-pink-400', headerBg: 'bg-gradient-to-r from-pink-300 via-pink-50 to-pink-300' };
    case 3:
      return { mascot: '🦊', accentColor: 'orange', gradientFrom: 'from-orange-300', gradientTo: 'to-orange-400', headerBg: 'bg-gradient-to-r from-orange-300 via-orange-50 to-orange-300' };
    case 4:
      return { mascot: '🦉', accentColor: 'amber', gradientFrom: 'from-amber-400', gradientTo: 'to-amber-500', headerBg: 'bg-gradient-to-r from-amber-400 via-orange-50 to-amber-400' };
    default:
      return { mascot: '🦉', accentColor: 'amber', gradientFrom: 'from-amber-400', gradientTo: 'to-amber-500', headerBg: 'bg-gradient-to-r from-amber-400 via-orange-50 to-amber-400' };
  }
};

export const Batch1Home: React.FC = () => {
  const { studentName, studentAvatar, studentXP, studentStreak, currentClass } = useApp();
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Chrome variant: pre-reader (Class 1-2) vs early-reader (Class 3-4)
  const isPreReader = currentClass <= 2;
  const theme = getClassTheme(currentClass);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col gap-5 select-none anim-fade-up">
      {/* Header: mascot greeting + avatar + stats + logout */}
      <div className="flex items-center justify-between">
        {/* Left: avatar + greeting */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border-2 flex items-center justify-center text-3xl sm:text-4xl shadow-md select-none animate-[bounce_2s_ease-in-out_infinite] ${
            currentClass === 1 ? 'border-yellow-300' :
            currentClass === 2 ? 'border-pink-300' :
            currentClass === 3 ? 'border-orange-300' :
            'border-amber-300'
          }`}>
            {studentAvatar}
          </div>
          <div>
            <h1 className={`font-display font-black text-xl sm:text-2xl tracking-tight ${
              currentClass === 1 ? 'text-yellow-950' :
              currentClass === 2 ? 'text-pink-950' :
              currentClass === 3 ? 'text-orange-950' :
              'text-amber-950'
            }`}>
              {isPreReader ? `${theme.mascot} ${studentName}!` : `Hi ${studentName}!`}
            </h1>
            {!isPreReader && (
              <p className={`text-xs font-bold mt-0.5 ${
                currentClass === 1 ? 'text-yellow-700' :
                currentClass === 2 ? 'text-pink-700' :
                currentClass === 3 ? 'text-orange-700' :
                'text-amber-700'
              }`}>Ready to learn something fun? ✨</p>
            )}
          </div>
        </div>

        {/* Right: XP + streak chips + logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* XP chip */}
          <div className={`flex items-center gap-1.5 text-white rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-md ${
            currentClass === 1 ? 'bg-yellow-400 shadow-yellow-400/20' :
            currentClass === 2 ? 'bg-pink-400 shadow-pink-400/20' :
            currentClass === 3 ? 'bg-orange-400 shadow-orange-400/20' :
            'bg-amber-400 shadow-amber-400/20'
          }`}>
            <span className="text-lg sm:text-xl">⭐</span>
            <span className="font-display font-black text-sm sm:text-base">{studentXP.toLocaleString()}</span>
          </div>
          {/* Streak chip */}
          <div className="flex items-center gap-1.5 bg-orange-500 text-white rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-md shadow-orange-500/20">
            <span className="text-lg sm:text-xl">🔥</span>
            <span className="font-display font-black text-sm sm:text-base">{studentStreak}</span>
          </div>
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/80 hover:bg-red-50 border border-slate-200
                       flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* TodayPanel — shows live session, pending tasks, open exams */}
      <TodayPanel accent="amber" tasksHref="/batch1/tasks" examsHref="/batch1/exams" />

      {/* 5 GIANT PICTURE TILES — the island map */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5 mt-1">
        {TILES.map((tile) => (
          <Link
            key={tile.href}
            to={tile.href}
            className={`
              ${tile.color} ${tile.hoverColor} ${tile.shadowColor}
              rounded-3xl shadow-xl
              flex flex-col items-center justify-center gap-2 sm:gap-3
              min-h-[140px] sm:min-h-[180px]
              p-4 sm:p-6
              transition-all duration-200 ease-out
              hover:scale-[1.04] active:scale-[0.97]
              cursor-pointer select-none
            `}
            style={{ animationDelay: tile.delay }}
          >
            {/* Big emoji */}
            <span className="text-5xl sm:text-6xl drop-shadow-sm"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
              {tile.emoji}
            </span>
            {/* Label — hidden for pre-readers (Class 1-2) */}
            {!isPreReader && (
              <span className="font-display font-black text-white text-base sm:text-lg tracking-wide drop-shadow-sm">
                {tile.label}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Mascot tip — only for early readers */}
      {!isPreReader && (
        <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-amber-200/40 mt-1">
          <span className="text-3xl">🦉</span>
          <p className="text-xs text-amber-800 font-bold">
            Tap any picture to start! Collect stars ⭐ in every game.
          </p>
        </div>
      )}
    </div>
  );
};
