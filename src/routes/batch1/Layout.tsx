import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { SessionEndWatcher } from '../../components/shared/SessionEndWatcher';
import { LogOut } from 'lucide-react';
import { getClassTheme } from './theme';

/**
 * Batch 1 Layout — "Adventure Island" shell for ages 6–9.
 *
 * The whole batch lives inside one scene: sky gradient, a slowly spinning
 * sun, drifting clouds. Pages render on top of it. No sidebar, no topbar —
 * inner pages get one giant 🏠 button; Home IS the navigation.
 */
export const Batch1Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { batchId, currentClass, studentName, studentAvatar } = useApp();
  const { logout } = useAuth();

  useEffect(() => {
    if (currentClass < 1 || currentClass > 4) {
      navigate(`/batch${batchId}/home`, { replace: true });
    }
  }, [batchId, currentClass, navigate]);

  if (currentClass < 1 || currentClass > 4) return null;

  const theme = getClassTheme(currentClass);
  const isHome = location.pathname.endsWith('/home') || location.pathname === '/batch1' || location.pathname === '/batch1/';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(180deg,#5BC9FF 0%,#8ADAFF 34%,#C8F0FF 68%,#E9FAFF 100%)' }}
    >
      <SessionEndWatcher />

      {/* ── Scene: sun + clouds (behind everything) ── */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        {/* Sun */}
        <div
          className="absolute top-6 right-10 w-20 h-20 rounded-full animate-spin-slow"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #FFF6C9, #FFD93B 70%)',
            boxShadow: '0 0 60px 22px rgba(255,217,59,.45)',
          }}
        />
        {/* Clouds */}
        <div className="absolute top-16 left-0 cloud-drift">
          <div className="relative w-28 h-8 bg-white/90 rounded-full">
            <div className="absolute w-12 h-12 bg-white/90 rounded-full -top-6 left-4" />
            <div className="absolute w-9 h-9 bg-white/90 rounded-full -top-4 left-14" />
          </div>
        </div>
        <div className="absolute top-36 left-0 cloud-drift-rtl opacity-70">
          <div className="relative w-20 h-6 bg-white rounded-full">
            <div className="absolute w-9 h-9 bg-white rounded-full -top-4 left-3" />
            <div className="absolute w-7 h-7 bg-white rounded-full -top-3 left-10" />
          </div>
        </div>
        {/* Sparkles */}
        <span className="absolute anim-twinkle text-lg" style={{ top: 90, left: '22%' }}>✦</span>
        <span className="absolute anim-twinkle text-lg" style={{ top: 55, left: '55%', animationDelay: '1.2s' }}>✦</span>
        <span className="absolute anim-twinkle text-lg" style={{ top: 140, left: '78%', animationDelay: '.6s' }}>✦</span>
      </div>

      {/* ── Minimal header on inner pages: 🏠 + name + logout ── */}
      {!isHome && (
        <header className="relative z-10 flex items-center justify-between px-4 py-3 sm:px-6">
          <Link
            to="/batch1/home"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-white flex items-center justify-center
                       text-3xl sm:text-4xl transition-transform duration-150 hover:-translate-y-1 active:translate-y-1 select-none"
            style={{ boxShadow: '0 5px 0 rgba(20,90,140,.18)' }}
            aria-label="Go Home"
          >
            🏠
          </Link>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2"
              style={{ boxShadow: '0 4px 0 rgba(20,90,140,.14)' }}
            >
              <span className="text-2xl select-none">{studentAvatar || theme.mascot}</span>
              <span className="font-display font-black text-sm hidden sm:inline" style={{ color: '#17425F' }}>
                {studentName}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/70 hover:bg-white border-2 border-white/80
                         flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              aria-label="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
      )}

      {/* ── Page content ── */}
      <main className={`relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 ${isHome ? 'py-4' : 'py-2 pb-10'}`}>
        <Outlet />
      </main>
    </div>
  );
};
