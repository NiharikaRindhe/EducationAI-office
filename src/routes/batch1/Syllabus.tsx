import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { Loader2 } from 'lucide-react';
import { getClassTheme } from './theme';

/**
 * "My Journey" — the syllabus as a winding island trail (Candy-Crush map).
 * Every NCERT chapter is a level node: gold = done, green pulsing = you are
 * here (mascot stands on it), white = playable ahead, grey = no games yet.
 * A treasure chest waits at the end of the book. Tapping a playable node
 * deep-links into that chapter's games.
 */

interface ChapterGame {
  gameId: string;
  name: string;
  stars: number;
  bestScore: number | null;
}

interface CurriculumChapter {
  chapterRef: string;
  subject: string;
  chapterNum: number;
  title: string;
  games: ChapterGame[];
  stars: number;
  completed: boolean;
}

/* Track geometry */
const TRACK_W = 620;
const STEP_Y = 155;
const TOP_PAD = 80;
const X_LEFT = 150;
const X_RIGHT = 470;

const SUBJECT_EMOJI = (s: string) => {
  const l = s.toLowerCase();
  if (l.includes('math')) return '📐';
  if (l.includes('english')) return '📖';
  return '🌍';
};

export const Batch1Syllabus: React.FC = () => {
  const navigate = useNavigate();
  const { currentClass } = useApp();
  const [chapters, setChapters] = useState<CurriculumChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState<string>('');

  const isPreReader = currentClass <= 2;
  const theme = getClassTheme(currentClass);

  useEffect(() => {
    let cancelled = false;
    api.get<CurriculumChapter[]>('/student/curriculum')
      .then((res) => {
        if (cancelled) return;
        setChapters(res);
        const subjects = Array.from(new Set(res.map((c) => c.subject)));
        setActiveSubject(subjects.includes('Mathematics') ? 'Mathematics' : (subjects[0] ?? ''));
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const subjects = useMemo(() => Array.from(new Set(chapters.map((c) => c.subject))), [chapters]);
  const trail = useMemo(
    () => chapters.filter((c) => c.subject === activeSubject).sort((a, b) => a.chapterNum - b.chapterNum),
    [chapters, activeSubject],
  );

  // "You are here" = the first chapter with games that isn't completed yet.
  const currentIdx = useMemo(() => {
    const idx = trail.findIndex((c) => c.games.length > 0 && !c.completed);
    return idx === -1 ? trail.length - 1 : idx;
  }, [trail]);

  const doneCount = trail.filter((c) => c.completed).length;

  /* Node positions: zig-zag down the track */
  const nodes = trail.map((ch, i) => ({
    ch,
    x: i % 2 === 0 ? X_LEFT : X_RIGHT,
    y: TOP_PAD + i * STEP_Y,
  }));
  const trackH = TOP_PAD + Math.max(nodes.length, 1) * STEP_Y + 90;

  /* Smooth S-curve path through the nodes (+ a last hop to the treasure) */
  const treasure = { x: nodes.length % 2 === 0 ? X_LEFT : X_RIGHT, y: TOP_PAD + nodes.length * STEP_Y };
  const pathD = useMemo(() => {
    const pts = [...nodes.map((n) => ({ x: n.x, y: n.y })), treasure];
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const midY = (p0.y + p1.y) / 2;
      d += ` C ${p0.x} ${midY}, ${p1.x} ${midY}, ${p1.x} ${p1.y}`;
    }
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trail]);

  const openChapter = (ch: CurriculumChapter) => {
    if (ch.games.length === 0) return;
    navigate(`/batch1/games?chapter=${ch.chapterRef}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-white" size={40} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 select-none anim-fade-up">
      {/* Title card */}
      <div
        className="bg-white rounded-3xl px-6 py-4 flex items-center gap-4"
        style={{ boxShadow: '0 6px 0 rgba(20,90,140,.14)' }}
      >
        <span className="text-4xl">{SUBJECT_EMOJI(activeSubject)}</span>
        <div className="flex-1">
          <h1 className="font-display font-black text-xl sm:text-2xl leading-tight" style={{ color: '#17425F' }}>
            {isPreReader ? 'My Journey' : `${activeSubject} Island`}
          </h1>
          {!isPreReader && (
            <p className="text-[11px] font-black tracking-widest" style={{ color: '#6FA3C0' }}>
              CLASS {currentClass} · {doneCount} OF {trail.length} CHAPTERS DONE
            </p>
          )}
        </div>
        <span className="text-3xl anim-bob">{theme.mascot}</span>
      </div>

      {/* Subject tabs */}
      {subjects.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {subjects.map((s) => {
            const active = s === activeSubject;
            return (
              <button
                key={s}
                onClick={() => setActiveSubject(s)}
                className="flex items-center gap-2 rounded-2xl px-5 py-3 font-display font-black text-sm cursor-pointer
                           transition-transform hover:-translate-y-0.5 active:translate-y-0.5 whitespace-nowrap"
                style={active
                  ? { background: theme.accent, color: '#fff', boxShadow: `0 5px 0 ${theme.accentDark}` }
                  : { background: '#fff', color: '#17425F', boxShadow: '0 5px 0 rgba(20,90,140,.14)' }}
              >
                <span className="text-lg">{SUBJECT_EMOJI(s)}</span>
                {!isPreReader && <span>{s}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* The trail */}
      {trail.length === 0 ? (
        <div className="bg-white/80 rounded-3xl p-12 text-center flex flex-col items-center gap-3"
             style={{ boxShadow: '0 6px 0 rgba(20,90,140,.12)' }}>
          <span className="text-5xl">{theme.mascot}</span>
          <span className="font-display font-black text-base" style={{ color: '#17425F' }}>New adventures coming soon!</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="relative mx-auto" style={{ width: TRACK_W, height: trackH }}>
            {/* Path */}
            <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${TRACK_W} ${trackH}`} fill="none" aria-hidden="true">
              <path d={pathD} stroke="#FFFFFF" strokeWidth={26} strokeLinecap="round" opacity={0.75} />
              <path d={pathD} stroke="#FFC800" strokeWidth={8} strokeLinecap="round" strokeDasharray="2 22" />
            </svg>

            {/* Nodes */}
            {nodes.map(({ ch, x, y }, i) => {
              const isCurrent = i === currentIdx && ch.games.length > 0 && !ch.completed;
              const isDone = ch.completed;
              const playable = ch.games.length > 0;
              const labelLeft = x === X_LEFT ? x + 64 : undefined;
              const labelRight = x === X_RIGHT ? TRACK_W - x + 64 : undefined;

              return (
                <React.Fragment key={ch.chapterRef}>
                  <button
                    onClick={() => openChapter(ch)}
                    disabled={!playable}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center
                               ${playable ? 'cursor-pointer transition-transform hover:scale-110 active:scale-95' : 'cursor-default'}`}
                    style={{ left: x, top: y, width: isCurrent ? 96 : 80, height: isCurrent ? 96 : 80 }}
                    aria-label={`Chapter ${ch.chapterNum}: ${ch.title}`}
                  >
                    {isCurrent && (
                      <>
                        <span className="absolute -top-[74px] text-4xl anim-bob-big pointer-events-none"
                              style={{ filter: 'drop-shadow(0 4px 4px rgba(0,0,0,.18))' }}>
                          {theme.mascot}
                        </span>
                        <span className="absolute -top-[102px] whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-black tracking-widest text-white pointer-events-none"
                              style={{ background: '#17425F' }}>
                          YOU ARE HERE
                        </span>
                      </>
                    )}
                    <span
                      className={`rounded-full flex items-center justify-center font-display font-black text-white
                                  ${isCurrent ? 'w-[88px] h-[88px] text-3xl anim-pulse-ring' : 'w-[72px] h-[72px] text-2xl'}`}
                      style={
                        isDone
                          ? { background: 'linear-gradient(180deg,#FFD53E,#FFB300)', boxShadow: '0 6px 0 #D89700, 0 10px 18px rgba(255,179,0,.4)' }
                          : isCurrent
                            ? { background: 'linear-gradient(180deg,#74DE22,#55C400)', boxShadow: '0 7px 0 #3F9C00, 0 12px 22px rgba(85,196,0,.45)' }
                            : playable
                              ? { background: '#fff', color: theme.accent, boxShadow: '0 6px 0 rgba(20,90,140,.18)' }
                              : { background: 'linear-gradient(180deg,#DDE9F2,#C3D5E2)', boxShadow: '0 6px 0 #A8BDCC', color: '#8CA6B8' }
                      }
                    >
                      {playable ? ch.chapterNum : '🔒'}
                    </span>
                    {playable && (
                      <span className="absolute -bottom-1.5 text-[13px] tracking-wider pointer-events-none"
                            style={{ textShadow: '0 1px 2px rgba(0,0,0,.2)' }}>
                        {'⭐'.repeat(ch.stars)}{'☆'.repeat(Math.max(0, 3 - ch.stars))}
                      </span>
                    )}
                  </button>

                  {/* Chapter label card beside the node */}
                  {!isPreReader && (
                    <div
                      className="absolute -translate-y-1/2 bg-white rounded-2xl px-4 py-2 max-w-[210px] pointer-events-none"
                      style={{
                        top: y,
                        ...(labelLeft !== undefined ? { left: labelLeft } : { right: labelRight }),
                        boxShadow: '0 4px 0 rgba(20,90,140,.14)',
                      }}
                    >
                      <b className="block text-[13px] font-display font-black leading-tight" style={{ color: '#17425F' }}>
                        {ch.title}
                      </b>
                      <span className="text-[10px] font-black tracking-wider" style={{ color: '#7BA2BC' }}>
                        {isDone ? 'DONE!' : playable
                          ? `${ch.games.length} ${ch.games.length === 1 ? 'GAME' : 'GAMES'}`
                          : 'COMING SOON'}
                      </span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Treasure at the end of the book */}
            <span
              className="absolute -translate-x-1/2 -translate-y-1/2 text-6xl anim-wiggle"
              style={{ left: treasure.x, top: treasure.y, filter: 'drop-shadow(0 5px 6px rgba(0,0,0,.22))' }}
              aria-label="Treasure — finish every chapter!"
            >
              🎁
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
