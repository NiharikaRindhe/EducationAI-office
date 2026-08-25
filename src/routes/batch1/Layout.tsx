import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { SessionEndWatcher } from '../../components/shared/SessionEndWatcher';
import { LogOut, Home as HomeIcon, Bell, GraduationCap, User } from 'lucide-react';
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
        {/* The frame.

            Home does NOT get one: its five tiles are already self-contained
            coloured cards, and laying a translucent white sheet over the clay
            landscape milked the colour out of the one illustration the screen
            is built around. There, content sits directly on the scene.

            Every inner page keeps the sheet — Quizzes, Tasks, Journey and the
            game engines put dense text and small controls on screen, and those
            need an opaque surface to stay legible over the hills. */}
        <div
          className={`flex-1 flex flex-col px-3 sm:px-6 lg:px-8 py-4 sm:py-5 ${isHome ? '' : 'bg-white/80'}`}
          style={
            isHome
              ? undefined
              : {
                  borderRadius: 34,
                  border: '1px solid rgba(255,255,255,.85)',
                  boxShadow: '0 18px 44px rgba(24,86,132,.16), inset 0 2px 0 rgba(255,255,255,.9)',
                }
          }
        >
          {/* ── Header ── */}
          <header className="flex items-center gap-3 mb-4">
            {isHome ? (
              <div className="flex items-center gap-3.5 min-w-0">
                {/* The child's own face, ringed softly in their class colour. */}
                <span
                  className="relative flex items-center justify-center shrink-0 rounded-full bg-white"
                  style={{
                    width: 62, height: 62,
                    boxShadow: `0 0 0 3px color-mix(in srgb, ${theme.accent} 55%, white), 0 4px 10px rgba(20,90,140,.14)`,
                  }}
                >
                  <Pic emoji={studentAvatar || theme.mascot} size={36} />
                </span>
                <span className="min-w-0">
                  <span
                    className="flex items-center gap-1.5 font-display font-black text-xl sm:text-2xl leading-tight truncate"
                    style={{ color: '#123A56', textShadow: '0 1px 0 rgba(255,255,255,.55)' }}
                  >
                    Hi {studentName}!
                    <span aria-hidden="true" className="anim-wiggle inline-block origin-bottom-right">👋</span>
                  </span>
                  <span className="block text-xs sm:text-sm font-bold mb-1.5" style={{ color: '#2C5876' }}>
                    Let&rsquo;s learn something new today!
                  </span>
                  {/* Class pill — tinted to the class's own colour, so Class 3's
                      purple and Class 1's green stay visible identity, not just
                      a number, while matching the mockup's pill shape. */}
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 font-display font-black text-xs text-white"
                    style={{ borderRadius: 999, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})` }}
                  >
                    <GraduationCap size={14} />
                    Class {currentClass}
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
              <HeaderStat emoji="⭐" label="Stars" value={studentXP.toLocaleString()} chipBg="#FFF3D6" />
              <div className="hidden sm:block">
                <HeaderStat
                  emoji="🔥"
                  label="Streak"
                  value={`${studentStreak} ${studentStreak === 1 ? 'day' : 'days'}`}
                  chipBg="#FFE7D6"
                />
              </div>

              {/* This app has no notification system — this button is the same
                  account menu (My Trophies / Log out) as before, just given the
                  bell shape the mockup's header uses in this corner. A real
                  notification feed would be separate work. */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Your account"
                  className="flex items-center justify-center bg-white transition-transform duration-100 active:translate-y-[2px] anim-squish-tap cursor-pointer"
                  style={{
                    width: 52, height: 52, borderRadius: '50%',
                    boxShadow: '0 3px 10px rgba(20,90,140,.14)',
                    color: T.ink.muted,
                  }}
                >
                  <Bell size={22} />
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
                      <User size={19} />
                      Profile
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
 *  than an all-caps abbreviation a six-year-old has to decode. The icon sits
 *  in its own tinted chip (`chipBg`) rather than bare, matching the mockup's
 *  softer, flatter stat pills. */
const HeaderStat: React.FC<{ emoji: string; label: string; value: React.ReactNode; chipBg: string }> = ({ emoji, label, value, chipBg }) => (
  <div
    className="flex items-center gap-2.5 bg-white pl-2.5 pr-4 sm:pr-5"
    style={{ height: 56, borderRadius: T.radius.md, boxShadow: '0 3px 10px rgba(20,90,140,.08)' }}
  >
    <span className="flex items-center justify-center shrink-0" style={{ width: 38, height: 38, borderRadius: T.radius.sm, background: chipBg }}>
      <Pic emoji={emoji} size={22} />
    </span>
    <span className="leading-none">
      <span className="block text-[11px] font-bold mb-1" style={{ color: T.ink.muted }}>{label}</span>
      <span className="block font-display font-black text-base" style={{ color: T.ink.strong }}>{value}</span>
    </span>
  </div>
);
