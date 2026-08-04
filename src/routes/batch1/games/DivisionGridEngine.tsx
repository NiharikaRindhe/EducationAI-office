import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import confetti from 'canvas-confetti';

/* Ported from EducationAI-Games-master's Grade3 "MissingSide" (division as
   grid-row-building — "Division Detective") and restyled to this app's
   Adventure Island look — amber/emerald palette, font-display, rounded-3xl
   cards — instead of the source's own blue theme + standalone header.
   Class 3 gets exact division (params.hasRemainder=false); Class 4 gets
   the harder version with remainders, seeded as level 2 of the existing
   'division' skill so it unlocks after the equal-share game is 2-starred. */

interface DivisionGridGame {
  gameId: string;
  name: string;
  icon: string;
  params: { divisorMin?: number; divisorMax?: number; quotientMin?: number; quotientMax?: number; hasRemainder?: boolean };
}
interface DivisionGridEngineProps {
  game: DivisionGridGame;
  isPreReader: boolean;
  onFinish: (gameId: string, stars: number, score: number) => void;
}

const BLUE = { bg: '#3b82f6', light: '#dbeafe', text: '#1d4ed8' };
const ORANGE = { bg: '#f59e0b', light: '#fef3e2', text: '#b45309' };

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makePuzzle(divisorMin: number, divisorMax: number, quotientMin: number, quotientMax: number, hasRemainder: boolean) {
  const divisor = randInt(divisorMin, divisorMax);
  const quotient = randInt(quotientMin, quotientMax);
  const remainder = hasRemainder ? randInt(0, divisor - 1) : 0;
  const dividend = divisor * quotient + remainder;
  return { dividend, divisor, quotient, remainder };
}

function buildChoices(correct: number): number[] {
  const offsets = [-3, -2, -1, 1, 2, 3, 4, -4];
  const wrong = new Set<number>();
  for (const off of [...offsets].sort(() => Math.random() - 0.5)) {
    const w = correct + off;
    if (w > 0 && w !== correct) wrong.add(w);
    if (wrong.size === 3) break;
  }
  return [...wrong, correct].sort(() => Math.random() - 0.5);
}

function cellSize(divisor: number, rows: number) {
  const m = Math.max(divisor, rows);
  return m <= 9 ? 34 : m <= 12 ? 28 : 24;
}

function starsForDivision(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct >= total - 1) return 2;
  if (correct >= Math.ceil(total / 2)) return 1;
  return 0;
}

const TOTAL_ROUNDS = 4;
const BUFFER = 2;

export const DivisionGridEngine: React.FC<DivisionGridEngineProps> = ({ game, isPreReader, onFinish }) => {
  const { divisorMin = 2, divisorMax = 6, quotientMin = 2, quotientMax = 9, hasRemainder = false } = game.params;

  function newPuzzle() {
    return makePuzzle(divisorMin, divisorMax, quotientMin, quotientMax, hasRemainder);
  }

  const [round, setRound] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [puzzle, setPuzzle] = useState(newPuzzle);
  const [shadedRows, setShadedRows] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<'build' | 'answer'>('build');
  const [choices, setChoices] = useState<number[]>([]);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);

  const { dividend, divisor, quotient, remainder } = puzzle;
  const totalGridRows = quotient + BUFFER;
  const cs = cellSize(divisor, totalGridRows);

  useEffect(() => {
    const up = () => setDragging(false);
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, []);

  function clampRow(r: number) { return Math.max(0, Math.min(totalGridRows, r + 1)); }
  function cellDown(r: number) { setDragging(true); setShadedRows(clampRow(r)); }
  function cellEnter(r: number) { if (dragging) setShadedRows(clampRow(r)); }

  function confirmGrid() {
    if (shadedRows === 0) return;
    setChoices(buildChoices(quotient));
    setPhase('answer');
  }

  function handleSelect(choice: number) {
    if (result !== null) return;
    const ok = choice === quotient;
    setResult(ok ? 'correct' : 'wrong');
    if (ok) confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } });
    const newCorrect = correctCount + (ok ? 1 : 0);
    setCorrectCount(newCorrect);
    setTimeout(() => {
      if (round + 1 >= TOTAL_ROUNDS) {
        const earned = starsForDivision(newCorrect, TOTAL_ROUNDS);
        setFinished(true);
        onFinish(game.gameId, earned, newCorrect);
        if (earned >= 2) confetti({ particleCount: 80, spread: 60, colors: ['#f59e0b', '#22c55e', '#6366f1'] });
      } else {
        setRound((r) => r + 1);
        setPuzzle(newPuzzle());
        setShadedRows(0);
        setPhase('build');
        setResult(null);
      }
    }, ok ? 1400 : 1800);
  }

  function handlePlayAgain() {
    setRound(0);
    setCorrectCount(0);
    setFinished(false);
    setPuzzle(newPuzzle());
    setShadedRows(0);
    setPhase('build');
    setResult(null);
  }

  if (finished) {
    const earned = starsForDivision(correctCount, TOTAL_ROUNDS);
    return (
      <div className="flex flex-col items-center gap-5 py-10 anim-fade-up">
        <span className="text-6xl">🏆</span>
        <div className="flex gap-1">{[1, 2, 3].map((n) => (<Star key={n} size={32} className={n <= earned ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />))}</div>
        {!isPreReader && <p className="font-display font-bold text-slate-600 text-sm">{correctCount} / {TOTAL_ROUNDS} correct</p>}
        <button onClick={handlePlayAgain} className="bg-amber-400 hover:bg-amber-500 text-white font-display font-bold text-sm rounded-full px-8 py-3 shadow-md transition-all cursor-pointer" style={{ minHeight: 48, minWidth: 120 }}>
          🔄 {isPreReader ? '' : 'Play Again'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 max-w-lg mx-auto anim-fade-up">
      <div className="flex gap-2">
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
          <div key={i} className={`w-3.5 h-3.5 rounded-full transition-all ${i < round ? 'bg-emerald-400' : i === round ? 'bg-amber-400 scale-125' : 'bg-slate-200'}`} />
        ))}
      </div>

      <div className="w-full bg-amber-50/60 border border-amber-100 rounded-3xl px-6 py-4 text-center flex items-center justify-center gap-3">
        <span className="font-display font-black text-2xl" style={{ color: BLUE.text }}>{dividend}</span>
        <span className="text-slate-400 text-xl">÷</span>
        <span className="font-display font-black text-2xl" style={{ color: ORANGE.text }}>{divisor}</span>
        <span className="text-slate-400 text-xl">=</span>
        <span className="font-display font-black text-2xl text-slate-300">{result === 'correct' ? quotient : '?'}</span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-4 flex flex-col items-center gap-2" style={{ boxShadow: '0 4px 0 rgba(20,90,140,.08)' }}>
        {!isPreReader && <p className="text-xs text-slate-400 font-semibold">Drag to build rows of {divisor}</p>}
        <div style={{ display: 'flex', gap: 2 }} className="flex-col">
          {Array.from({ length: totalGridRows }, (_, r) => {
            const rowShaded = r < shadedRows;
            return (
              <div key={r} style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
                {Array.from({ length: divisor }, (_, c) => (
                  <div
                    key={`${r}-${c}`}
                    onPointerDown={() => cellDown(r)}
                    onPointerEnter={() => cellEnter(r)}
                    style={{ width: cs, height: cs, background: rowShaded ? BLUE.bg : '#e2e8f0', borderRadius: 4, cursor: phase === 'build' ? 'pointer' : 'default', userSelect: 'none' }}
                  />
                ))}
              </div>
            );
          })}
        </div>
        {shadedRows > 0 && (
          <div className="text-xs font-display font-bold px-3 py-1 rounded-full" style={{ background: BLUE.light, color: BLUE.text }}>
            {shadedRows} × {divisor} = {shadedRows * divisor}
          </div>
        )}
      </div>

      {phase === 'build' && (
        <button onClick={confirmGrid} disabled={shadedRows === 0} className="bg-amber-400 hover:bg-amber-500 text-white font-display font-bold px-8 py-3 rounded-full shadow-md transition-all disabled:bg-slate-200 disabled:text-slate-400">
          Confirm My Grid
        </button>
      )}

      {phase === 'answer' && (
        <div className="w-full flex flex-col items-center gap-4">
          {!isPreReader && <p className="text-xs font-bold text-slate-400">What's the missing side?</p>}
          <div className="flex gap-3 justify-center flex-wrap">
            {choices.map((c) => (
              <button key={c} onClick={() => handleSelect(c)} disabled={result !== null} className="w-16 h-16 rounded-2xl font-display font-black text-2xl shadow-sm transition-all active:scale-95 bg-white border-2 border-slate-200 hover:border-amber-300 text-slate-700 disabled:opacity-50">
                {c}
              </button>
            ))}
          </div>
          {result && (
            <div className={`w-full rounded-2xl px-6 py-4 font-display font-bold text-center anim-fade-up ${result === 'correct' ? 'bg-emerald-50 border-2 border-emerald-300 text-emerald-700' : 'bg-red-50 border-2 border-red-300 text-red-600'}`}>
              {result === 'correct'
                ? `🎉 ${dividend} ÷ ${divisor} = ${quotient}${remainder > 0 ? ` R${remainder}` : ''}`
                : `Not quite — it's ${quotient}${remainder > 0 ? ` R${remainder}` : ''}.`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
