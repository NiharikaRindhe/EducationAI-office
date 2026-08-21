import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { Loader2 } from 'lucide-react';
import { getClassTheme } from './theme';
import { EmptyState, PageHeader, Pic, StarRow } from './ui';

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

/* Track geometry — wide enough to feel like a real map on lab monitors */
const TRACK_W = 900;
const STEP_Y = 155;
const TOP_PAD = 175;   // clears the "YOU ARE HERE" pin above node 1
const X_LEFT = 220;
const X_RIGHT = 680;

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
  // A failed fetch used to leave `chapters` as `[]`, which rendered the exact
  // same "your teacher hasn't opened any chapters yet" EmptyState as a real
  // empty class — held separately so a genuine API failure looks different.
  const [loadError, setLoadError] = useState(false);

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
      .catch(() => {
        if (cancelled) return;
        setLoadError(true);
        setLoading(false);
      });
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
      {/* The progress line was hidden from Class 1-2, leaving them a bare title
          bar. It is the one sentence on this page that says why the map exists,
          and a child who cannot read it is sitting next to a teacher who can. */}
      <PageHeader
        emoji={SUBJECT_EMOJI(activeSubject)}
        title="My Journey"
        hint={`${activeSubject} · ${doneCount} of ${trail.length} chapters done`}
        right={<Pic emoji={theme.mascot} size={40} className="anim-bob hidden sm:block" />}
      />

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
                <Pic emoji={SUBJECT_EMOJI(s)} size={22} />
                <span>{s}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* The trail */}
      {loadError ? (
        <EmptyState
          emoji="😅"
          title="Uh-oh, the map won't load!"
          body="Something went wrong. Ask a grown-up to try again."
          action={{ label: 'Go and play', to: '/batch1/games' }}
        />
      ) : trail.length === 0 ? (
        <EmptyState
          emoji={theme.mascot}
          title="Nothing on the map yet!"
          body="Your chapters will show up here once your teacher opens them."
          action={{ label: 'Go and play', to: '/batch1/games' }}
        />
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
                      {playable ? ch.chapterNum : <Pic emoji="🔒" size={28} alt="Locked" />}
                    </span>
                    {playable && (
                      <span className="absolute -bottom-2 pointer-events-none">
                        <StarRow earned={ch.stars} size={14} />
                      </span>
                    )}
                  </button>

                  {/* Chapter label card beside the node.

                      This used to render only for Class 3-4. For Class 1-2 the
                      map was seven numbered circles joined by a dotted line and
                      nothing else — no chapter names anywhere on the screen, so
                      there was no way to tell node 3 from node 5 or to know
                      what tapping one would open. */}
                  {(
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
              className="absolute -translate-x-1/2 -translate-y-1/2 anim-wiggle"
              style={{ left: treasure.x, top: treasure.y, filter: 'drop-shadow(0 5px 6px rgba(0,0,0,.22))' }}
            >
              <Pic emoji="🎁" size={72} alt="Treasure — finish every chapter!" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
