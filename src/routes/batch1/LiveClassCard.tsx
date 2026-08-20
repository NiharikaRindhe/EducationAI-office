import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight, Clock, Hand, Loader2, Radio } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { Button, Card, Pic, T } from './ui';
import { getClassTheme } from './theme';
import { useApp } from '../../context/AppContext';

/**
 * "Your class is starting" — the Batch 1 live-session card.
 *
 * Batch 2 and 3 share `TodayPanel`, which stacks the live session, a pending
 * task list, an open exam list and today's timetable into one dense block.
 * That panel is right for a thirteen-year-old and wrong here: on the Class 1–4
 * home screen it filled the top 40% of the first screen with rows like
 * "P4 English 15:00–16:00 · lab1 · Mr. Rao" and "Open Exams — Nothing open
 * right now", none of which a six-year-old can read, and it pushed the six
 * things they CAN use below the fold.
 *
 * This card does the one thing that is genuinely urgent at this age — join the
 * teacher who is live right now — and does it big. Task and exam counts moved
 * onto the Home tiles as badges, where a number on a picture communicates the
 * same thing without a sentence.
 */

interface ActiveSession {
  id: string;
  subject: string | null;
  started_at: string;
  teacher_profiles: { user_profiles: { full_name: string } | { full_name: string }[] } | null;
}

const teacherName = (s: ActiveSession): string => {
  const up = s.teacher_profiles?.user_profiles;
  if (!up) return 'your teacher';
  return Array.isArray(up) ? (up[0]?.full_name ?? 'your teacher') : up.full_name;
};

export const LiveClassCard: React.FC = () => {
  const { currentClass } = useApp();
  const theme = getClassTheme(currentClass);
  const [session, setSession] = useState<ActiveSession | null | undefined>(undefined);
  const [hasJoined, setHasJoined] = useState(false);
  const [raisedHand, setRaisedHand] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  // A lab period can pull children from more than one section, so the
  // "your section is live" lookup will not find it for everyone in the room.
  // The teacher reads a code out and the class types it in.
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isJoiningByCode, setIsJoiningByCode] = useState(false);
  const pollRef = useRef<number | null>(null);

  const pollSession = useCallback(async () => {
    try {
      const active = await api.get<ActiveSession | null>('/student/sessions/active');
      setSession(active);
      if (!active) setHasJoined(false);
    } catch {
      /* transient poll failure — keep showing the last known state */
    }
  }, []);

  useEffect(() => {
    void pollSession();
    pollRef.current = window.setInterval(() => void pollSession(), 15000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [pollSession]);

  const handleJoin = async () => {
    if (!session) return;
    setIsJoining(true);
    try {
      const participant = await api.post<{ raised_hand: boolean }>('/student/sessions/join', { sessionId: session.id });
      setHasJoined(true);
      setRaisedHand(participant.raised_hand);
    } catch {
      setHasJoined(false);
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setCodeError('');
    setIsJoiningByCode(true);
    try {
      await api.post('/student/sessions/join-by-code', { code: trimmed });
      setCode('');
      await pollSession();
      setHasJoined(true);
    } catch (err) {
      setCodeError(err instanceof ApiClientError ? err.message : 'That code did not work. Ask your teacher.');
    } finally {
      setIsJoiningByCode(false);
    }
  };

  const handleRaiseHand = async () => {
    if (!session) return;
    const next = !raisedHand;
    setRaisedHand(next);
    try {
      await api.patch(`/student/sessions/${session.id}/raise-hand`, { raised: next });
    } catch {
      setRaisedHand(!next); // put the hand back down if the teacher never heard
    }
  };

  /* Still loading, or nothing live: show the code box only. A child with no
     live class should not see an empty "no class" banner taking up the screen. */
  if (!session) {
    return (
      <Card className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Pic emoji="🧑‍🏫" size={40} />
          <div className="min-w-0">
            <p className="font-display font-black text-base" style={{ color: T.ink.strong }}>
              No class right now
            </p>
            <p className="text-xs font-semibold" style={{ color: T.ink.muted }}>
              If your teacher gave you a code, type it here.
            </p>
          </div>
        </div>
        <form onSubmit={handleJoinByCode} className="flex items-center gap-2 shrink-0">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CODE"
            aria-label="Class code from your teacher"
            maxLength={10}
            className="font-display font-black text-lg tracking-[.2em] text-center bg-white outline-none
                       focus:ring-4 focus:ring-sky-200"
            style={{
              width: 150, height: 56, borderRadius: T.radius.sm,
              border: `2px solid ${codeError ? '#F8A0A0' : T.surface.line}`, color: T.ink.strong,
            }}
          />
          <Button tone="secondary" disabled={!code.trim() || isJoiningByCode}>
            {isJoiningByCode ? <Loader2 size={20} className="animate-spin" /> : 'Go'}
          </Button>
        </form>
        {codeError && (
          <p className="text-xs font-bold text-red-500 sm:hidden">{codeError}</p>
        )}
      </Card>
    );
  }

  /* Live now. This is the loudest thing on the page by design. Tinted with
     the child's own class colour (green for Class 1, purple for Class 3, …)
     rather than a fixed brand colour, so the banner still carries the same
     per-class identity as the avatar ring and class pill in the header. */
  const soft = `color-mix(in srgb, ${theme.accent} 16%, white)`;
  const softer = `color-mix(in srgb, ${theme.accent} 26%, white)`;

  return (
    <div
      className="relative overflow-hidden px-5 py-4 sm:px-7 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-4"
      style={{
        borderRadius: 26,
        background: `linear-gradient(100deg, ${soft} 0%, ${softer} 100%)`,
        boxShadow: '0 10px 26px rgba(20,90,140,.10)',
      }}
    >
      <span
        className="relative flex items-center justify-center shrink-0"
        style={{ width: 54, height: 54, borderRadius: 16, background: 'rgba(255,255,255,.85)' }}
      >
        <Radio size={26} style={{ color: theme.accentDark }} className="animate-pulse" />
      </span>

      <div className="relative flex-1 min-w-0">
        <p className="flex items-center gap-1.5 font-display font-black text-xl sm:text-2xl leading-tight" style={{ color: theme.accentDark }}>
          <span aria-hidden="true">✨</span>
          Your class is live!
        </p>
        <p className="font-bold text-sm mt-0.5 truncate" style={{ color: T.ink.strong }}>
          {session.subject ? `${session.subject} with ` : 'With '}{teacherName(session)}
        </p>
        <p className="flex items-center gap-1.5 font-bold text-xs mt-1" style={{ color: T.ink.muted }}>
          <Clock size={13} />
          Started {startedAtLabel(session.started_at)}
        </p>
      </div>

      {/* A mascot to wave the child in. Bigger than before, and shown from
          `md` up rather than only `lg` — sized in responsive steps (not one
          fixed px value) so it stays proportionate rather than either
          crowding a mid-size screen or looking small on a wide one. The
          banner's own `overflow-hidden` is the backstop against clipping. */}
      <Pic
        emoji={theme.mascot}
        name="live-banner-robot"
        size={260}
        className="relative hidden md:block shrink-0 anim-bob drop-shadow-[0_6px_6px_rgba(0,0,0,.2)] md:!w-44 md:!h-44 lg:!w-44 lg:!h-44 xl:!w-44 xl:!h-44"
      />

      <div className="relative flex items-center gap-2.5 shrink-0">
        {!hasJoined ? (
          <button
            type="button"
            onClick={handleJoin}
            disabled={isJoining}
            className="inline-flex items-center gap-2 text-white font-display font-black text-base sm:text-lg px-7
                       transition-transform duration-100 active:translate-y-[3px] cursor-pointer disabled:opacity-60"
            style={{
              minHeight: 60, borderRadius: 999,
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`,
              boxShadow: `0 4px 0 ${theme.accentDark}`,
            }}
          >
            {isJoining ? <Loader2 size={20} className="animate-spin" /> : (<>Join now <ChevronRight size={20} strokeWidth={3} /></>)}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleRaiseHand}
            aria-pressed={raisedHand}
            className="inline-flex items-center gap-2 font-display font-black text-base px-6
                       transition-transform duration-100 active:translate-y-[3px] cursor-pointer"
            style={{
              minHeight: 60, borderRadius: 999,
              background: raisedHand ? '#FFC400' : '#FFFFFF',
              color: raisedHand ? '#7A5200' : theme.accentDark,
              boxShadow: `0 4px 0 ${raisedHand ? '#D79E00' : 'rgba(20,90,140,.14)'}`,
            }}
          >
            <Hand size={20} />
            {raisedHand ? 'Hand up!' : 'Raise hand'}
          </button>
        )}
      </div>
    </div>
  );
};

/** A day a child can read, e.g. "10:30 AM" — never a raw timestamp. There is
 *  no scheduled end time on `ActiveSession`, so unlike the mockup this shows
 *  only when the class started rather than guessing an end time. */
const startedAtLabel = (iso: string): string =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

