import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { GameFinishScreen, GameOption, GameProgressDots, T } from '../ui';

/* Ported from EducationAI-Games-master's Grade2 "Distance" (number-line
   distance finder) and restyled to this app's Adventure Island look —
   amber/emerald palette, font-display, rounded-3xl cards — instead of the
   source's own blue theme + standalone header/level-tabs (difficulty now
   comes from the seeded params.min/max, matching this class's range). */

interface NumberDistanceGame {
  gameId: string;
  name: string;
  icon: string;
  params: { min?: number; max?: number };
}
interface NumberLineDistanceEngineProps {
  game: NumberDistanceGame;
  isPreReader: boolean;
  onFinish: (gameId: string, stars: number, score: number) => void;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPair(min: number, max: number): { from: number; to: number } {
  const a = randInt(min, max);
  let b = randInt(min, max);
  while (b === a || Math.abs(b - a) < 2) b = randInt(min, max);
  return { from: Math.min(a, b), to: Math.max(a, b) };
}

function getRange(pair: { from: number; to: number }) {
  const nlMin = Math.max(0, Math.floor(pair.from / 10) * 10 - 10);
  const nlMax = Math.ceil(pair.to / 10) * 10 + 10;
  return { nlMin, nlMax };
}

function buildChoices(correct: number): number[] {
  const offsets = [-10, -5, -2, -1, 1, 2, 5, 10];
  const wrong = new Set<number>();
  for (const off of [...offsets].sort(() => Math.random() - 0.5)) {
    const w = correct + off;
    if (w > 0 && w !== correct) wrong.add(w);
    if (wrong.size === 3) break;
  }
  return [...wrong, correct].sort(() => Math.random() - 0.5);
}

function starsForDistance(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct >= total - 1) return 2;
  if (correct >= Math.ceil(total / 2)) return 1;
  return 0;
}

const TOTAL_ROUNDS = 5;

export const NumberLineDistanceEngine: React.FC<NumberLineDistanceEngineProps> = ({ game, isPreReader, onFinish }) => {
  const min = game.params.min ?? 1;
  const max = game.params.max ?? 20;

  const [round, setRound] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [pair, setPair] = useState(() => randomPair(min, max));
  const [hops, setHops] = useState<{ from: number; to: number; delta: number }[]>([]);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [finished, setFinished] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const correctDist = pair.to - pair.from;
  const { nlMin, nlMax } = getRange(pair);
  const choices = useMemo(() => buildChoices(correctDist), [correctDist]);

  const position = hops.reduce((acc, h) => acc + h.delta, pair.from);

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
      const colors = ['#F59E0B', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];
      const color = colors[idx % colors.length];
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
      ctx.fillStyle = color;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText((hop.delta > 0 ? '+' : '') + hop.delta, midX, cpY - 6);
    });

    // FROM pin (green)
    const fx = toX(pair.from);
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(fx, lineY - 18, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(pair.from), fx, lineY - 14);
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(fx, lineY, 4, 0, Math.PI * 2);
    ctx.fill();

    // TO pin (red)
    const tx = toX(pair.to);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(tx, lineY - 18, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(pair.to), tx, lineY - 14);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(tx, lineY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Frog marker (current hop position)
    const px = toX(position);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(px, lineY + 12, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = checked ? (correct ? '#10b981' : '#ef4444') : '#F59E0B';
    ctx.beginPath();
    ctx.arc(px, lineY - 40, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '16px sans-serif';
    ctx.fillText('🐸', px, lineY - 36);
  }, [hops, position, pair, checked, correct, nlMin, nlMax]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = 140;
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
    if (checked) return;
    setHops((prev) => prev.slice(0, -1));
  }

  function advance(wasCorrect: boolean, correctSoFar: number) {
    if (round + 1 >= TOTAL_ROUNDS) {
      setTimeout(() => {
        const earned = starsForDistance(correctSoFar, TOTAL_ROUNDS);
        setFinished(true);
        onFinish(game.gameId, earned, correctSoFar);
        if (earned >= 2) confetti({ particleCount: 80, spread: 60, colors: ['#f59e0b', '#22c55e', '#6366f1'] });
      }, wasCorrect ? 1200 : 1600);
    } else {
      setTimeout(() => {
        setRound((r) => r + 1);
        setPair(randomPair(min, max));
        setHops([]);
        setChecked(false);
        setCorrect(false);
      }, wasCorrect ? 1200 : 1600);
    }
  }

  function handleSelect(choice: number) {
    if (checked) return;
    const isCorrect = choice === correctDist;
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
    setPair(randomPair(min, max));
    setHops([]);
    setChecked(false);
    setCorrect(false);
  }

  if (finished) {
    const earned = starsForDistance(correctCount, TOTAL_ROUNDS);
    return (
      <GameFinishScreen
        earned={earned}
        scoreLabel={isPreReader ? undefined : `${correctCount} of ${TOTAL_ROUNDS} correct`}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 max-w-lg mx-auto anim-fade-up">
      <GameProgressDots total={TOTAL_ROUNDS} current={round} />

      <div className="w-full px-6 py-4 text-center" style={{ borderRadius: T.radius.md, background: T.surface.sunk }}>
        <p className="font-display font-black text-xl" style={{ color: T.ink.strong }}>
          🐸 {!isPreReader ? 'How far ' : ''}{pair.from} → {pair.to}?
        </p>
      </div>

      <div className="w-full bg-white px-2 py-3" style={{ borderRadius: T.radius.sm, boxShadow: T.shadow.card }}>
        <canvas ref={canvasRef} className="w-full" style={{ height: 140 }} />
      </div>

      <div className="flex justify-center gap-3 flex-wrap">
        <GameOption onClick={() => hop(-10)} className="text-sm" style={{ width: 64, height: 56, minHeight: 56 }}>-10</GameOption>
        <GameOption onClick={() => hop(-1)} className="text-sm" style={{ width: 64, height: 56, minHeight: 56 }}>-1</GameOption>
        <button
          type="button"
          onClick={undo}
          disabled={hops.length === 0}
          aria-label="Undo last hop"
          className="font-display font-black text-xs transition-all"
          style={{
            width: 64, height: 56, borderRadius: T.radius.sm,
            background: hops.length > 0 ? '#FDEDEC' : T.surface.sunk,
            border: `2px solid ${hops.length > 0 ? '#F5B3AD' : T.surface.line}`,
            color: hops.length > 0 ? '#B23930' : T.ink.faint,
          }}
        >
          ↺
        </button>
        <GameOption onClick={() => hop(1)} className="text-sm" style={{ width: 64, height: 56, minHeight: 56, background: '#FFD53E', color: '#7A5200', border: 'none', boxShadow: '0 3px 0 #DB9A00' }}>+1</GameOption>
        <GameOption onClick={() => hop(10)} className="text-sm" style={{ width: 64, height: 56, minHeight: 56, background: '#FFB100', color: '#FFFFFF', border: 'none', boxShadow: '0 3px 0 #DB9A00' }}>+10</GameOption>
      </div>

      {!checked && (
        <div className="w-full flex flex-col items-center gap-3">
          <p className="text-xs font-bold text-center" style={{ color: T.ink.faint }}>
            {isPreReader ? 'Hop, then pick! 🐸' : 'Hop the frog to explore, then pick the distance.'}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            {choices.map((c) => (
              <GameOption key={c} onClick={() => handleSelect(c)} className="text-2xl" style={{ width: 64, height: 64 }}>
                {c}
              </GameOption>
            ))}
          </div>
        </div>
      )}

      {checked && (
        <div
          className="w-full px-6 py-4 font-display font-bold text-center anim-fade-up"
          style={{ borderRadius: T.radius.sm, background: correct ? '#EAFBF0' : '#FDEDEC', border: `2px solid ${correct ? '#A8E8BC' : '#F5B3AD'}`, color: correct ? '#1B7F41' : '#B23930' }}
        >
          {correct ? '🎉 Correct!' : `Not quite — the distance is ${correctDist}.`}
        </div>
      )}
    </div>
  );
};
