import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { TodayPanel } from '../../components/shared/TodayPanel';
import { LogOut } from 'lucide-react';
import { getClassTheme } from './theme';

/**
 * Batch 1 Home — "Adventure Island".
 *
 * A scene, not a menu: the mascot greets the child in a speech bubble,
 * XP/streak are shiny HUD chips, and six glossy 3D tiles bob gently and
 * physically press down on tap. Pre-readers (Class 1–2) see pictures only;
 * early readers (3–4) get one word under each picture.
 */

interface Tile {
  emoji: string;
  label: string;
  href: string;
  from: string;
  to: string;
  shadow: string;
}

const TILES: Tile[] = [
  { emoji: '📖', label: 'Stories', href: '/batch1/stories', from: '#3FC0FF', to: '#1CA5F1', shadow: '#0E86CC' },
  { emoji: '🎮', label: 'Games', href: '/batch1/games', from: '#74DE22', to: '#55C400', shadow: '#3F9C00' },
  { emoji: '⭐', label: 'Quizzes', href: '/batch1/exams', from: '#FFD53E', to: '#FFBB00', shadow: '#DB9A00' },
  { emoji: '✅', label: 'Tasks', href: '/batch1/tasks', from: '#B678FF', to: '#9A4DF6', shadow: '#7C31D6' },
  { emoji: '🗺️', label: 'My Journey', href: '/batch1/syllabus', from: '#22D6C4', to: '#00BCAA', shadow: '#00988A' },
  { emoji: '🏆', label: 'My Stuff', href: '/batch1/my-stuff', from: '#FF8FC0', to: '#FF62A5', shadow: '#E2418B' },
];

export const Batch1Home: React.FC = () => {
  const { studentName, studentAvatar, studentXP, studentStreak, currentClass } = useApp();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const isPreReader = currentClass <= 2;
  const theme = getClassTheme(currentClass);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col gap-5 select-none anim-fade-up relative pb-16">
      {/* ── HUD: mascot + speech bubble | chips + exit ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-end gap-3">
          <div
            className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center text-5xl anim-bob-big"
            style={{ boxShadow: '0 8px 0 rgba(20,90,140,.18)' }}
          >
            {studentAvatar || theme.mascot}
          </div>
          <div
            className="relative bg-white rounded-2xl px-5 py-3 max-w-xs"
            style={{ boxShadow: '0 6px 0 rgba(20,90,140,.14)' }}
          >
            <span
              className="absolute -left-2 bottom-4 w-0 h-0 border-8 border-transparent border-r-white"
              aria-hidden="true"
            />
            <div className="font-display font-black text-lg leading-tight" style={{ color: '#17425F' }}>
              {isPreReader ? `${theme.mascot} ${studentName}!` : `Hi ${studentName}! Ready to play?`}
            </div>
            <div className="text-xs font-bold" style={{ color: '#7BA2BC' }}>
              Class {currentClass} · {theme.teamName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5"
            style={{ boxShadow: '0 5px 0 rgba(20,90,140,.16)' }}
          >
            <span className="text-xl">⭐</span>
            <span>
              <span className="block text-[9px] font-black tracking-widest leading-none" style={{ color: '#8FB4CB' }}>STARS</span>
              <span className="font-display font-black text-lg leading-tight" style={{ color: '#17425F' }}>
                {studentXP.toLocaleString()}
              </span>
            </span>
          </div>
          <div
            className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5"
            style={{ boxShadow: '0 5px 0 rgba(20,90,140,.16)' }}
          >
            <span className="text-xl">🔥</span>
            <span>
              <span className="block text-[9px] font-black tracking-widest leading-none" style={{ color: '#8FB4CB' }}>STREAK</span>
              <span className="font-display font-black text-lg leading-tight" style={{ color: '#17425F' }}>
                {studentStreak}
              </span>
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-white/60 hover:bg-white border-2 border-white/80 rounded-2xl
                       px-3.5 py-3 font-bold text-sm cursor-pointer transition-colors"
            style={{ color: '#3E6B87' }}
            aria-label="Log out"
          >
            <LogOut size={16} />
            {!isPreReader && <span>Exit</span>}
          </button>
        </div>
      </div>

      {/* ── Live session / today ── */}
      <TodayPanel accent="sky" tasksHref="/batch1/tasks" examsHref="/batch1/exams" />

      {/* ── The island: six glossy tiles ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 lg:gap-7 relative z-10">
        {TILES.map((tile, i) => (
          <Link
            key={tile.href}
            to={tile.href}
            className="relative rounded-[30px] min-h-[150px] sm:min-h-[180px] lg:min-h-[210px] xl:min-h-[230px]
                       flex flex-col items-center justify-center gap-2
                       overflow-hidden cursor-pointer select-none transition-transform duration-150
                       hover:-translate-y-1.5 hover:scale-[1.02] active:translate-y-1"
            style={{
              background: `linear-gradient(180deg, ${tile.from}, ${tile.to})`,
              boxShadow: `0 8px 0 ${tile.shadow}, 0 16px 26px ${tile.to}59`,
            }}
          >
            {/* glossy top light */}
            <span
              className="absolute top-0 left-0 right-0 h-[46%] pointer-events-none"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,.34), rgba(255,255,255,0))', borderRadius: '30px 30px 60% 60%' }}
              aria-hidden="true"
            />
            <span
              className="text-6xl lg:text-7xl anim-bob"
              style={{ filter: 'drop-shadow(0 4px 4px rgba(0,0,0,.18))', animationDelay: `${(i % 3) * 0.4}s` }}
            >
              {tile.emoji}
            </span>
            {!isPreReader && (
              <span className="font-display font-black text-lg lg:text-xl text-white tracking-wide" style={{ textShadow: '0 2px 3px rgba(0,0,0,.22)' }}>
                {tile.label}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* ── Green hill — spans the whole viewport, not just the column ── */}
      <div
        className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-screen h-32 pointer-events-none"
        style={{ background: 'linear-gradient(180deg,#8FE06A,#6FCB47)', borderRadius: '50% 50% 0 0' }}
        aria-hidden="true"
      />
    </div>
  );
};
