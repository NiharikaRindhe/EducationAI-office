import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

const POLL_MS = 15_000;

/** Batch 1 (Class 1-4) login only exists because a teacher's live session is
 *  active for that class/section — the PIN flow rotates in a real password
 *  behind the scenes, so the resulting session stays valid even after the
 *  teacher ends class. Without this, the next student to sit at the same
 *  lab PC could pick up where the previous one left off. Polls whether a
 *  session is still live and force-logs-out the moment it isn't. */
export const SessionEndWatcher: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const everSawActiveRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const active = await api.get<unknown | null>('/student/sessions/active');
        if (cancelled) return;
        if (active) {
          everSawActiveRef.current = true;
        } else if (everSawActiveRef.current) {
          logout();
          navigate('/login', { state: { reason: 'session-ended' }, replace: true });
        }
      } catch {
        /* transient poll failure — don't force a logout over a network blip */
      }
    };

    void check();
    const interval = window.setInterval(() => void check(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [logout, navigate]);

  return null;
};
