import React from 'react';
import { Star, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
// Plain-JS engine ported verbatim; see src/lib/tracing/README.md
import {
  init, loadLetter,
  handlePointerDown, handlePointerMove, handlePointerUp,
  advanceStroke, resetCurrentStroke, resetLetter,
  getLetterAccuracy, getAllStrokeRenderProps,
  getState, subscribe, LETTERS,
} from '../../../lib/tracing/tracingEngine.js';
import { Button, Pic, StarRow, T } from '../ui';

/* The real letter-tracing game from EducationAI-Games-master's Grade 1
   "Tracing", running on that project's own engine — path sampling, stroke
   direction checks and accuracy thresholds are its code, copied unmodified
   into src/lib/tracing (see the README there).

   Only the presentation is this app's: Adventure Island styling, the Batch 1
   star contract, and a letter set driven by catalog params instead of the
   source's own hard-coded picker. The previous implementation was a 222-line
   lookalike that drew a path and eyeballed proximity; this one actually scores
   stroke order, direction and coverage the way the source intended. */

interface StrokeRenderProps {
  strokeId: string;
  pathD: string;
  guideOpacity: number;
  guideStroke: string;
  traceOpacity: number;
  traceStroke: string;
  dashArray: string;
  dashOffset: number;
  isActive: boolean;
  isCompleted: boolean;
  isUpcoming: boolean;
}

interface TracingGame {
  gameId: string;
  name: string;
  icon: string;
  /** Which letters this catalog row teaches. Falls back to a short starter set
   *  so a misconfigured row still gives a child something to trace. */
  params: { letters?: string[] };
}

interface Props {
  game: TracingGame;
  isPreReader: boolean;
  onFinish: (gameId: string, stars: number, score: number) => void;
}

/** Engine state we actually read. The store carries more; this is the subset. */
interface EngineSnapshot {
  currentStrokeIndex: number;
  letterData: { strokes: { id: string }[] } | null;
}

const FALLBACK_LETTERS = ['A', 'B', 'C', 'D', 'E'];

export const LetterTracingEngine: React.FC<Props> = ({ game, isPreReader, onFinish }) => {
  const svgRef = React.useRef<SVGSVGElement | null>(null);

  const letters = React.useMemo(() => {
    const wanted = (game.params.letters ?? FALLBACK_LETTERS)
      .map((l) => String(l).toUpperCase())
      // Only letters the engine actually has path data for — a typo in the
      // catalog must not hand a child a blank canvas.
      .filter((l) => Object.prototype.hasOwnProperty.call(LETTERS, l));
    return wanted.length > 0 ? wanted : FALLBACK_LETTERS;
  }, [game.params.letters]);

  const [index, setIndex] = React.useState(0);
  const [scores, setScores] = React.useState<number[]>([]);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  // Bumped on every engine notification to force a re-render; the engine owns
  // the real state, so this component deliberately holds none of it.
  const [, forceRender] = React.useReducer((n: number) => n + 1, 0);

  const currentLetter = letters[index] ?? FALLBACK_LETTERS[0];

  // Subscribe once. The engine is a module-level singleton, which is fine
  // because only one game is ever mounted at a time.
  React.useEffect(() => {
    const unsubscribe = subscribe(() => forceRender());
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, []);

  React.useEffect(() => {
    if (svgRef.current) init(svgRef.current);
    loadLetter(currentLetter);
  }, [currentLetter]);

  const snapshot = getState() as EngineSnapshot;
  const strokes: StrokeRenderProps[] = (getAllStrokeRenderProps() ?? []) as StrokeRenderProps[];
  const totalStrokes = snapshot.letterData?.strokes.length ?? 0;

  /** Pointer up ends the stroke; the engine decides whether it was good enough
   *  to advance, so this reads its verdict rather than judging the stroke. */
  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const result = handlePointerUp(e.nativeEvent);
    if (!result) return;

    // The engine judges the stroke; a failed one is redrawn, not advanced.
    if (!result.completed) {
      setFeedback(isPreReader ? '↺' : 'Keep trying…');
      window.setTimeout(() => setFeedback(null), 1200);
      resetCurrentStroke();
      return;
    }

    const advance = advanceStroke();
    if (!advance.letterDone) return;

    const accuracy = getLetterAccuracy();
    const overall = Math.round((accuracy?.overall ?? 0) * 100);
    const nextScores = [...scores, overall];
    setScores(nextScores);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });

    if (index + 1 < letters.length) {
      setFeedback(isPreReader ? '⭐' : 'Nice tracing!');
      window.setTimeout(() => {
        setFeedback(null);
        setIndex((i) => i + 1);
      }, 900);
      return;
    }

    // All letters done — convert mean accuracy to the Batch 1 star scale.
    const mean = nextScores.reduce((a, b) => a + b, 0) / nextScores.length;
    const stars = mean >= 85 ? 3 : mean >= 65 ? 2 : 1;
    setDone(true);
    onFinish(game.gameId, stars, Math.round(mean));
  };

  if (done) {
    const mean = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const stars = mean >= 85 ? 3 : mean >= 65 ? 2 : 1;
    return (
      <div className="flex flex-col items-center gap-3 py-10 anim-fade-up">
        <Pic emoji="🏆" name="nav-trophies" size={72} className="drop-shadow-[0_4px_6px_rgba(0,0,0,.18)]" />
        <StarRow earned={stars} size={32} />
        <p className="font-display text-xl font-black" style={{ color: T.ink.strong }}>
          {isPreReader ? 'Great tracing!' : `${mean}% accurate`}
        </p>
        <p className="text-sm font-medium" style={{ color: T.ink.muted }}>
          {letters.length} letter{letters.length === 1 ? '' : 's'} traced
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        {letters.map((l, i) => (
          <span
            key={l}
            className="flex h-8 w-8 items-center justify-center font-display text-sm font-black"
            style={{
              borderRadius: T.radius.sm,
              background: i < index ? '#EAFBF0' : i === index ? '#FFB100' : T.surface.sunk,
              color: i < index ? '#1B7F41' : i === index ? '#FFFFFF' : T.ink.faint,
            }}
          >
            {l}
          </span>
        ))}
      </div>

      <p className="font-display text-lg font-black" style={{ color: T.ink.strong }}>
        {isPreReader ? currentLetter : `Trace the letter ${currentLetter}`}
      </p>

      <div className="relative p-2" style={{ borderRadius: T.radius.md, background: T.surface.sunk, border: `2px solid ${T.surface.line}` }}>
        <svg
          ref={svgRef}
          viewBox="0 0 400 400"
          className="h-[320px] w-[320px] touch-none select-none"
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); handlePointerDown(e.nativeEvent); }}
          onPointerMove={(e) => handlePointerMove(e.nativeEvent)}
          onPointerUp={onPointerUp}
          onPointerCancel={(e) => handlePointerUp(e.nativeEvent)}
        >
          {strokes.filter(Boolean).map((s) => (
            <g key={s.strokeId}>
              {/* Guide: the letter shape a child follows. */}
              <path
                d={s.pathD}
                fill="none"
                stroke={s.guideStroke}
                strokeOpacity={s.guideOpacity}
                strokeWidth={26}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Trace: revealed by dash offset as the stroke is drawn. */}
              <path
                d={s.pathD}
                fill="none"
                stroke={s.traceStroke}
                strokeOpacity={s.traceOpacity}
                strokeWidth={18}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={s.dashArray}
                strokeDashoffset={s.dashOffset}
              />
            </g>
          ))}
        </svg>

        {feedback && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span
              className="font-display text-lg font-black text-white px-4 py-2"
              style={{ borderRadius: T.radius.sm, background: 'rgba(23,66,95,.85)' }}
            >
              {feedback}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button tone="quiet" onClick={() => { resetLetter(); setFeedback(null); }} className="text-xs px-4" icon={<RotateCcw size={13} />}>
          Try this letter again
        </Button>
        <span className="flex items-center gap-1 text-xs font-bold" style={{ color: T.ink.faint }}>
          <Star size={13} style={{ color: '#FFC400', fill: '#FFC400' }} />
          {snapshot.currentStrokeIndex + 1} / {Math.max(totalStrokes, 1)}
        </span>
      </div>
    </div>
  );
};
