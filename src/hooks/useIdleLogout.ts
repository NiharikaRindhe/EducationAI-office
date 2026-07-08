import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const;

/** Shared lab PCs must not stay logged in for the next student — after
 *  `timeoutMs` of no interaction, log out and bounce to /login with a
 *  reason so the next person sees a clean slate instead of someone else's session. */
export function useIdleLogout(timeoutMs: number, enabled = true) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const reset = () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        logout();
        navigate('/login', { state: { reason: 'idle' }, replace: true });
      }, timeoutMs);
    };

    reset();
    for (const event of ACTIVITY_EVENTS) window.addEventListener(event, reset, { passive: true });

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, reset);
    };
  }, [timeoutMs, enabled, logout, navigate]);
}
