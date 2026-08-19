import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight, Hand, Loader2, Radio } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { Button, Card, Pic, T } from './ui';

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

export const LiveClassCard: React.FC<{ mascot: string }> = ({ mascot }) => {
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

  /* Live now. This is the loudest thing on the page by design. */
  return (
    <div
      className="relative overflow-hidden px-5 py-4 sm:px-7 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-4"
      style={{
        borderRadius: 26,
        background: 'linear-gradient(100deg,#7BD94A 0%,#4FC93F 55%,#2FBE6A 100%)',
        boxShadow: '0 6px 0 #34A32F, 0 18px 32px rgba(79,201,63,.30)',
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{ height: '48%', background: 'linear-gradient(180deg, rgba(255,255,255,.24), rgba(255,255,255,0))' }}
      />
      {/* Sparkles around the mascot, as in the design. */}
      <span aria-hidden="true" className="absolute text-white/70 text-lg select-none" style={{ top: 14, right: '30%' }}>✦</span>
      <span aria-hidden="true" className="absolute text-white/50 text-sm select-none" style={{ bottom: 16, right: '26%' }}>✦</span>
      <span aria-hidden="true" className="absolute text-white/60 text-xs select-none" style={{ top: 30, right: '21%' }}>✦</span>

      <span
        className="relative flex items-center justify-center shrink-0"
        style={{ width: 58, height: 58, borderRadius: 18, background: 'rgba(255,255,255,.95)' }}
      >
        <Radio size={30} className="text-emerald-600 animate-pulse" />
      </span>

      <div className="relative flex-1 min-w-0">
        <p
          className="font-display font-black text-xl sm:text-2xl text-white leading-tight"
          style={{ textShadow: '0 2px 3px rgba(0,0,0,.18)' }}
        >
          Your class is live now!
        </p>
        <p className="font-bold text-sm text-white/90 truncate">
          {session.subject ? `${session.subject} with ` : 'With '}{teacherName(session)}
        </p>
      </div>

      {/* The class mascot, waving the child in. Hidden on narrow screens so it
          never squeezes the one control that matters. */}
      <Pic
        emoji={mascot}
        size={76}
        className="relative hidden lg:block shrink-0 anim-bob drop-shadow-[0_4px_6px_rgba(0,0,0,.25)]"
      />

      <div className="relative flex items-center gap-2.5 shrink-0">
        {!hasJoined ? (
          <button
            type="button"
            onClick={handleJoin}
            disabled={isJoining}
            className="inline-flex items-center gap-2 bg-white font-display font-black text-base sm:text-lg px-7
                       transition-transform duration-100 active:translate-y-[3px] cursor-pointer disabled:opacity-60"
            style={{ minHeight: 60, borderRadius: 999, color: '#2C8F27', boxShadow: '0 4px 0 #CFE6CB' }}
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
              color: raisedHand ? '#7A5200' : '#2C8F27',
              boxShadow: `0 4px 0 ${raisedHand ? '#D79E00' : '#CFE6CB'}`,
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
