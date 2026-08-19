import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { SessionEndWatcher } from '../../components/shared/SessionEndWatcher';
import { LogOut, Home as HomeIcon, User, ChevronDown, Trophy } from 'lucide-react';
import { getClassTheme } from './theme';
import { Pic, IconButton, T } from './ui';
import { Scene } from './Scene';

/**
 * Batch 1 shell — the frame around every Class 1–4 screen.
 *
 *  1. ONE HEADER, EVERY PAGE. Home used to draw its own header (avatar, stars,
 *     streak, exit) while inner pages drew a different one — so the child's
 *     stars vanished the moment they opened a game and the exit button moved.
 *     The header lives here now; only its leftmost slot changes, holding a
 *     greeting on Home and a Home button elsewhere.
 *
 *  2. THE PAGE SITS IN A FRAME, ON A SCENE. Content used to float directly on
 *     a flat gradient, which is why a short page read as an unfinished screen
 *     with a lot of leftover sky. The scene (hills, school, trees, clouds) is
 *     the world; the frame is the paper laid on top of it, so a page holding
 *     only two cards still looks like a finished place.
 *
 *  3. LOG OUT LIVES BEHIND A MENU. It sat as a bare icon beside the stars, one
 *     mis-tap from ending a six-year-old's session in the middle of a lesson.
 */
export const Batch1Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { batchId, currentClass, studentName, studentAvatar, studentXP, studentStreak } = useApp();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (currentClass < 1 || currentClass > 4) {
      navigate(`/batch${batchId}/home`, { replace: true });
    }
  }, [batchId, currentClass, navigate]);

  // Close on an outside tap — children tap away rather than press Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [menuOpen]);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  if (currentClass < 1 || currentClass > 4) return null;

  const theme = getClassTheme(currentClass);
  const isHome =
    location.pathname.endsWith('/home') ||
    location.pathname === '/batch1' ||
    location.pathname === '/batch1/';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      <SessionEndWatcher />
      <Scene />

      <div className="relative z-10 flex-1 flex flex-col w-full max-w-[1560px] mx-auto px-3 sm:px-6 py-3 sm:py-5">
        {/* The frame: everything the child interacts with sits on this sheet. */}
        <div
          className="flex-1 flex flex-col bg-white/78 px-3 sm:px-6 lg:px-8 py-4 sm:py-5"
          style={{
            borderRadius: 34,
            border: '1px solid rgba(255,255,255,.85)',
            boxShadow: '0 18px 44px rgba(24,86,132,.16), inset 0 2px 0 rgba(255,255,255,.9)',
          }}
        >
          {/* ── Header ── */}
          <header className="flex items-center gap-3 mb-4">
            {isHome ? (
              <div className="flex items-center gap-3 min-w-0">
                {/* The child's own face, ringed in their class colour. */}
                <span
                  className="relative flex items-center justify-center shrink-0 rounded-full"
                  style={{
                    width: 62, height: 62,
                    background: '#FFFFFF',
                    border: `4px solid ${theme.accent}`,
                    boxShadow: `0 3px 0 ${theme.accentDark}`,
                  }}
                >
                  <Pic emoji={studentAvatar || theme.mascot} size={36} />
                </span>
                <span className="min-w-0">
                  <span
                    className="block font-display font-black text-xl sm:text-2xl leading-tight truncate"
                    style={{ color: T.ink.strong }}
                  >
                    Hi {studentName}!
                  </span>
                  <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold" style={{ color: T.ink.muted }}>
                    Class {currentClass} · {theme.teamName}
                    <Pic emoji={theme.mascot} size={16} />
                  </span>
                </span>
              </div>
            ) : (
              <IconButton to="/batch1/home" label="Go to Home">
                <HomeIcon size={22} />
              </IconButton>
            )}

            <div className="flex-1" />

            <div className="flex items-center gap-2 sm:gap-3">
              <HeaderStat emoji="⭐" label="Stars" value={studentXP.toLocaleString()} />
              <div className="hidden sm:block">
                <HeaderStat
                  emoji="🔥"
                  label="Streak"
                  value={`${studentStreak} ${studentStreak === 1 ? 'day' : 'days'}`}
                />
              </div>

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Your account"
                  className="flex items-center gap-1 bg-white px-3 transition-transform duration-100 active:translate-y-[2px] cursor-pointer"
                  style={{
                    height: 56, borderRadius: 999,
                    border: `2px solid ${T.surface.line}`,
                    boxShadow: '0 3px 0 rgba(20,90,140,.10)',
                    color: T.ink.muted,
                  }}
                >
                  <User size={22} />
                  <ChevronDown size={16} className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[64px] w-56 bg-white p-2 z-50 anim-fade-up"
                    style={{
                      borderRadius: T.radius.md,
                      boxShadow: '0 14px 34px rgba(24,86,132,.22)',
                      border: `1px solid ${T.surface.line}`,
                    }}
                  >
                    <Link
                      to="/batch1/my-stuff"
                      role="menuitem"
                      className="flex items-center gap-3 px-3 py-3 font-display font-black text-sm hover:bg-slate-50"
                      style={{ borderRadius: T.radius.sm, color: T.ink.strong }}
                    >
                      <Trophy size={19} className="text-amber-500" />
                      My Trophies
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-3 font-display font-black text-sm hover:bg-rose-50 cursor-pointer"
                      style={{ borderRadius: T.radius.sm, color: '#D2453F' }}
                    >
                      <LogOut size={19} />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* ── Page content ── */}
          <main className="flex-1 flex flex-col">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

/** Stars / streak. Wider than a plain chip so the label reads as a word rather
 *  than an all-caps abbreviation a six-year-old has to decode. */
const HeaderStat: React.FC<{ emoji: string; label: string; value: React.ReactNode }> = ({ emoji, label, value }) => (
  <div
    className="flex items-center gap-2.5 bg-white px-3.5 sm:px-4"
    style={{
      height: 56, borderRadius: T.radius.md,
      border: `2px solid ${T.surface.line}`,
      boxShadow: '0 3px 0 rgba(20,90,140,.10)',
    }}
  >
    <Pic emoji={emoji} size={26} />
    <span className="leading-none">
      <span className="block text-[11px] font-bold mb-1" style={{ color: T.ink.muted }}>{label}</span>
      <span className="block font-display font-black text-base" style={{ color: T.ink.strong }}>{value}</span>
    </span>
  </div>
);
