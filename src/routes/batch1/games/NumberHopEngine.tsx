import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Star } from 'lucide-react';
import confetti from 'canvas-confetti';

/* Ported from EducationAI-Games-master's Grade2 "Hopper" (number-line
   add/subtract/missing-addend) and restyled to this app's Adventure
   Island look — amber/emerald palette, font-display, rounded-3xl cards —
   instead of the source's own blue theme + standalone header/nav. */

interface NumberHopGame {
  gameId: string;
  name: string;
  icon: string;
  params: { startLevel?: number };
}

interface NumberHopEngineProps {
  game: NumberHopGame;
  isPreReader: boolean;
  onFinish: (gameId: string, stars: number, score: number) => void;
}

const LEVEL_CONFIGS = [
  { label: 'LEVEL 1', max: 20, types: ['add', 'sub'] as const },
  { label: 'LEVEL 2', max: 99, types: ['add', 'sub'] as const },
  { label: 'LEVEL 3', max: 99, types: ['missing'] as const },
];

type PuzzleType = 'add' | 'sub' | 'missing';
interface Puzzle {
  start: number;
  op: '+' | '-';
  b: number | null;
  target?: number;
  type: PuzzleType;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPuzzle(levelIdx: number): Puzzle {
  const cfg = LEVEL_CONFIGS[levelIdx];
  const type = cfg.types[Math.floor(Math.random() * cfg.types.length)];
  const max = cfg.max;

  if (type === 'add') {
    const start = randInt(1, max - 2);
    const b = randInt(2, max - start);
    return { start, op: '+', b, type: 'add' };
  }
  if (type === 'sub') {
    const start = randInt(3, max);
    const b = randInt(2, start - 1);
    return { start, op: '-', b, type: 'sub' };
  }
  const start = randInt(1, max - 2);
  const target = randInt(start + 2, max);
  return { start, op: '+', b: null, target, type: 'missing' };
}

function getTarget(puzzle: Puzzle): number {
  if (puzzle.type === 'missing') return puzzle.target!;
  return puzzle.op === '+' ? puzzle.start + puzzle.b! : puzzle.start - puzzle.b!;
}

function getRange(puzzle: Puzzle) {
  const target = getTarget(puzzle);
  const lo = Math.min(puzzle.start, target);
  const hi = Math.max(puzzle.start, target);
  const nlMin = Math.max(0, Math.floor(lo / 10) * 10 - 10);
  const nlMax = Math.ceil(hi / 10) * 10 + 10;
  return { nlMin, nlMax };
}

const ARC_COLORS = ['#F59E0B', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

function buildChoices(correctAnswer: number): number[] {
  const offsets = [-10, -5, -2, -1, 1, 2, 5, 10];
  const distractors = new Set<number>();
  const shuffled = [...offsets].sort(() => Math.random() - 0.5);
  for (const off of shuffled) {
    const wrong = correctAnswer + off;
    if (wrong > 0 && wrong !== correctAnswer) distractors.add(wrong);
    if (distractors.size === 3) break;
  }
  return [...distractors, correctAnswer].sort(() => Math.random() - 0.5);
}

function starsForHop(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct >= total - 1) return 2;
  if (correct >= Math.ceil(total / 2)) return 1;
  return 0;
}

const TOTAL_ROUNDS = 5;

export const NumberHopEngine: React.FC<NumberHopEngineProps> = ({ game, isPreReader, onFinish }) => {
  const levelIdx = Math.min(game.params.startLevel ?? 0, LEVEL_CONFIGS.length - 1);

  const [round, setRound] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [puzzle, setPuzzle] = useState<Puzzle>(() => randomPuzzle(levelIdx));
  const [hops, setHops] = useState<{ from: number; to: number; delta: number }[]>([]);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const target = getTarget(puzzle);
  const { nlMin, nlMax } = getRange(puzzle);
  const missingAddend = puzzle.type === 'missing' ? target - puzzle.start : null;
  const correctChoice = puzzle.type === 'missing' ? missingAddend! : target;

  /* Derived from the puzzle rather than mirrored into state via an effect —
     buildChoices shuffles, so memoize to keep the order stable across the
     re-renders that happen while answering the current round. */
  const choices = useMemo(() => buildChoices(correctChoice), [correctChoice]);

  const position = hops.reduce((acc, h) => acc + h.delta, puzzle.start);
  const hopTotal = hops.reduce((acc, h) => acc + h.delta, 0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    const PAD = 40;
    const lineY = H * 0.68;
    const span = W - PAD * 2;
    const range = nlMax - nlMin;
    const toX = (n: number) => PAD + ((n - nlMin) / range) * span;

    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PAD, lineY);
    ctx.lineTo(W - PAD, lineY);
    ctx.stroke();

    const tickStep = range <= 30 ? 5 : 10;
    for (let v = nlMin; v <= nlMax; v += tickStep) {
      const x = toX(v);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, lineY - 8);
      ctx.lineTo(x, lineY + 8);
      ctx.stroke();
      ctx.fillStyle = '#7BA2BC';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(v), x, lineY + 22);
    }

    hops.forEach((hop, idx) => {
      const color = ARC_COLORS[idx % ARC_COLORS.length];
      const x1 = toX(hop.from);
      const x2 = toX(hop.to);
      const midX = (x1 + x2) / 2;
      const arcH = -Math.min(Math.abs(x2 - x1) * 0.55, 60);
      const cpY = lineY + arcH;

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, lineY);
      ctx.quadraticCurveTo(midX, cpY, x2, lineY);
      ctx.stroke();

      const angle = Math.atan2(lineY - cpY, x2 - midX);
      const aLen = 8;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x2, lineY);
      ctx.lineTo(x2 - aLen * Math.cos(angle - 0.4), lineY - aLen * Math.sin(angle - 0.4));
      ctx.lineTo(x2 - aLen * Math.cos(angle + 0.4), lineY - aLen * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = color;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText((hop.delta > 0 ? '+' : '') + hop.delta, midX, cpY - 6);
    });

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(toX(puzzle.start), lineY, 6, 0, Math.PI * 2);
    ctx.fill();

    if (puzzle.type === 'missing') {
      const tx = toX(target);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(tx, lineY - 18);
      ctx.lineTo(tx, lineY + 18);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', tx, lineY - 24);
    }

    const px = toX(position);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(px, lineY + 12, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = checked ? (correct ? '#10b981' : '#ef4444') : '#F59E0B';
    ctx.beginPath();
    ctx.arc(px, lineY - 16, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(position), px, lineY - 12);
  }, [hops, position, puzzle, target, checked, correct, nlMin, nlMax]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = 130;
      draw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [draw]);

  function hop(delta: number) {
    if (checked) return;
    const next = position + delta;
    if (next < nlMin || next > nlMax) return;
    setHops((prev) => [...prev, { from: position, to: next, delta }]);
  }

  function undo() {
    setHops((prev) => prev.slice(0, -1));
  }

  function advance(wasCorrect: boolean, correctSoFar: number) {
    if (round + 1 >= TOTAL_ROUNDS) {
      setTimeout(() => {
        const earned = starsForHop(correctSoFar, TOTAL_ROUNDS);
        setFinished(true);
        onFinish(game.gameId, earned, correctSoFar);
        if (earned >= 2) confetti({ particleCount: 80, spread: 60, colors: ['#f59e0b', '#22c55e', '#6366f1'] });
      }, wasCorrect ? 1200 : 1600);
    } else {
      setTimeout(() => {
        setRound((r) => r + 1);
        setPuzzle(randomPuzzle(levelIdx));
        setHops([]);
        setChecked(false);
        setCorrect(false);
        setSelectedAnswer(null);
      }, wasCorrect ? 1200 : 1600);
    }
  }

  function handleSelectAnswer(choice: number) {
    if (checked) return;
    setSelectedAnswer(choice);
    const isCorrect = choice === correctChoice;
    setCorrect(isCorrect);
    setChecked(true);
    if (isCorrect) confetti({ particleCount: 25, spread: 30, origin: { y: 0.7 } });
    const newCorrect = correctCount + (isCorrect ? 1 : 0);
    setCorrectCount(newCorrect);
    advance(isCorrect, newCorrect);
  }

  function handlePlayAgain() {
    setRound(0);
    setCorrectCount(0);
    setFinished(false);
    setPuzzle(randomPuzzle(levelIdx));
    setHops([]);
    setChecked(false);
    setCorrect(false);
    setSelectedAnswer(null);
  }

  if (finished) {
    const earned = starsForHop(correctCount, TOTAL_ROUNDS);
    return (
      <div className="flex flex-col items-center gap-5 py-10 anim-fade-up">
        <span className="text-6xl">🏆</span>
        <div className="flex gap-1">
          {[1, 2, 3].map((n) => (
            <Star key={n} size={32} className={n <= earned ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
          ))}
        </div>
        {!isPreReader && (
          <p className="font-display font-bold text-slate-600 text-sm">
            {correctCount} / {TOTAL_ROUNDS} correct
          </p>
        )}
        <button
          onClick={handlePlayAgain}
          className="bg-amber-400 hover:bg-amber-500 text-white font-display font-bold text-sm rounded-full px-8 py-3 shadow-md transition-all cursor-pointer"
          style={{ minHeight: 48, minWidth: 120 }}
        >
          🔄 {isPreReader ? '' : 'Play Again'}
        </button>
      </div>
    );
  }

  const blankDisplay = selectedAnswer !== null ? selectedAnswer : '__';
  const problemStr =
    puzzle.type === 'missing'
      ? `${puzzle.start} + ${blankDisplay} = ${target}`
      : `${puzzle.start} ${puzzle.op} ${puzzle.b} = ${selectedAnswer !== null ? selectedAnswer : '?'}`;

  return (
    <div className="flex flex-col items-center gap-5 max-w-lg mx-auto anim-fade-up">
      {/* Progress dots */}
      <div className="flex gap-2">
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full transition-all ${
              i < round ? 'bg-emerald-400' : i === round ? 'bg-amber-400 scale-125' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Problem card */}
      <div className="w-full bg-amber-50/60 border border-amber-100 rounded-3xl px-6 py-4 text-center">
        {!isPreReader && <p className="text-xs font-black text-amber-500 tracking-widest mb-1">{LEVEL_CONFIGS[levelIdx].label}</p>}
        <p className="font-display font-black text-2xl text-slate-700">{problemStr}</p>
      </div>

      {/* Number line canvas */}
      <div className="w-full bg-white rounded-2xl border border-slate-100 px-2 py-3" style={{ boxShadow: '0 4px 0 rgba(20,90,140,.08)' }}>
        <canvas ref={canvasRef} className="w-full" style={{ height: 130 }} />
      </div>

      {/* Hop controls */}
      <div className="flex justify-center gap-3">
        <button onClick={() => hop(-10)} className="w-16 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-display font-black text-sm active:scale-95 transition-all">-10</button>
        <button onClick={() => hop(-1)} className="w-16 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-display font-black text-sm active:scale-95 transition-all">-1</button>
        <button
          onClick={undo}
          disabled={hops.length === 0}
          className={`w-16 h-14 rounded-2xl font-display font-black text-xs transition-all ${
            hops.length > 0 ? 'bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 active:scale-95' : 'bg-slate-50 text-slate-300 cursor-not-allowed'
          }`}
        >
          ↺
        </button>
        <button onClick={() => hop(+1)} className="w-16 h-14 rounded-2xl bg-amber-300 hover:bg-amber-400 text-white font-display font-black text-sm active:scale-95 transition-all">+1</button>
        <button onClick={() => hop(+10)} className="w-16 h-14 rounded-2xl bg-amber-400 hover:bg-amber-500 text-white font-display font-black text-sm active:scale-95 transition-all">+10</button>
      </div>

      {/* Answer choices */}
      {!checked && (
        <div className="w-full flex flex-col items-center gap-3">
          <p className="text-xs font-bold text-slate-400 text-center">
            {hops.length === 0
              ? 'Hop the frog, then pick your answer.'
              : puzzle.type === 'missing'
                ? `You hopped ${hopTotal > 0 ? '+' : ''}${hopTotal} so far. What is the missing number?`
                : `You landed on ${position}. What is the answer?`}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            {choices.map((c) => (
              <button
                key={c}
                onClick={() => handleSelectAnswer(c)}
                className="w-16 h-16 rounded-2xl font-display font-black text-2xl shadow-sm transition-all active:scale-95 bg-white border-2 border-slate-200 hover:border-amber-300 text-slate-700"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {checked && (
        <div
          className={`w-full rounded-2xl px-6 py-4 font-display font-bold text-center anim-fade-up ${
            correct ? 'bg-emerald-50 border-2 border-emerald-300 text-emerald-700' : 'bg-red-50 border-2 border-red-300 text-red-600'
          }`}
        >
          {correct ? '🎉 Correct!' : `Not quite — the answer is ${puzzle.type === 'missing' ? missingAddend : target}.`}
        </div>
      )}
    </div>
  );
};
