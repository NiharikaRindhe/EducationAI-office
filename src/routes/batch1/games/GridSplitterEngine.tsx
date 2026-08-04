import React, { useState, useRef, useEffect } from 'react';
import { Star } from 'lucide-react';
import confetti from 'canvas-confetti';

/* Ported from EducationAI-Games-master's Grade3 "GridSplitter" (distributive
   property — drag a split line through a multiplication grid) and restyled
   to this app's Adventure Island look — amber/emerald palette, font-display,
   rounded-3xl cards — instead of the source's own blue theme + standalone
   header. Seeded as level 2 of the 'area' skill (area-builder is level 1),
   so it unlocks once area-builder is 2-starred. */

interface GridSplitterGame {
  gameId: string;
  name: string;
  icon: string;
  params: { minA?: number; maxA?: number; minB?: number; maxB?: number };
}
interface GridSplitterEngineProps {
  game: GridSplitterGame;
  isPreReader: boolean;
  onFinish: (gameId: string, stars: number, score: number) => void;
}

const LEFT_COLOR = { bg: '#3b82f6', border: '#93c5fd', text: '#1d4ed8' };
const RIGHT_COLOR = { bg: '#f59e0b', border: '#fcd9a8', text: '#b45309' };

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildChoices(correct: number): number[] {
  const offsets = [-20, -10, -5, -3, 3, 5, 10, 20];
  const wrong = new Set<number>();
  for (const off of [...offsets].sort(() => Math.random() - 0.5)) {
    const w = correct + off;
    if (w > 0 && w !== correct) wrong.add(w);
    if (wrong.size === 3) break;
  }
  return [...wrong, correct].sort(() => Math.random() - 0.5);
}

function cellSize(rows: number, cols: number) {
  const m = Math.max(rows, cols);
  return m <= 12 ? 26 : m <= 16 ? 20 : 16;
}

function starsForSplit(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct >= total - 1) return 2;
  if (correct >= Math.ceil(total / 2)) return 1;
  return 0;
}

const TOTAL_ROUNDS = 4;

export const GridSplitterEngine: React.FC<GridSplitterEngineProps> = ({ game, isPreReader, onFinish }) => {
  const { minA = 11, maxA = 19, minB = 2, maxB = 9 } = game.params;

  function newPuzzle() {
    return { cols: randInt(minA, maxA), rows: randInt(minB, maxB) };
  }

  const [round, setRound] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [puzzle, setPuzzle] = useState(newPuzzle);
  const [splitCol, setSplitCol] = useState<number | null>(null);
  const [phase, setPhase] = useState<'split' | 'answer'>('split');
  const [choices, setChoices] = useState<number[]>([]);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const { rows, cols } = puzzle;
  const product = rows * cols;
  const cs = cellSize(rows, cols);
  const leftCols = splitCol ?? Math.floor(cols / 2);
  const rightCols = cols - leftCols;
  const leftProd = rows * leftCols;
  const rightProd = rows * rightCols;

  function colFromEvent(clientX: number) {
    const grid = gridRef.current;
    if (!grid) return null;
    const rect = grid.getBoundingClientRect();
    const relX = clientX - rect.left;
    const col = Math.round(relX / (cs + 2));
    return Math.max(1, Math.min(cols - 1, col));
  }

  function onGridPointerMove(e: React.PointerEvent) {
    if (!isDragging.current) return;
    const col = colFromEvent(e.clientX);
    if (col !== null) setSplitCol(col);
  }

  useEffect(() => {
    const up = () => { isDragging.current = false; };
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, []);

  function confirmSplit() {
    setChoices(buildChoices(product));
    setPhase('answer');
  }

  function handleSelect(choice: number) {
    if (result !== null) return;
    const ok = choice === product;
    setResult(ok ? 'correct' : 'wrong');
    if (ok) confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } });
    const newCorrect = correctCount + (ok ? 1 : 0);
    setCorrectCount(newCorrect);
    setTimeout(() => {
      if (round + 1 >= TOTAL_ROUNDS) {
        const earned = starsForSplit(newCorrect, TOTAL_ROUNDS);
        setFinished(true);
        onFinish(game.gameId, earned, newCorrect);
        if (earned >= 2) confetti({ particleCount: 80, spread: 60, colors: ['#f59e0b', '#22c55e', '#6366f1'] });
      } else {
        setRound((r) => r + 1);
        setPuzzle(newPuzzle());
        setSplitCol(null);
        setPhase('split');
        setResult(null);
      }
    }, ok ? 1400 : 1800);
  }

  function handlePlayAgain() {
    setRound(0);
    setCorrectCount(0);
    setFinished(false);
    setPuzzle(newPuzzle());
    setSplitCol(null);
    setPhase('split');
    setResult(null);
  }

  if (finished) {
    const earned = starsForSplit(correctCount, TOTAL_ROUNDS);
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

  const handleX = leftCols * (cs + 2) - 1;

  return (
    <div className="flex flex-col items-center gap-5 max-w-lg mx-auto anim-fade-up">
      <div className="flex gap-2">
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
          <div key={i} className={`w-3.5 h-3.5 rounded-full transition-all ${i < round ? 'bg-emerald-400' : i === round ? 'bg-amber-400 scale-125' : 'bg-slate-200'}`} />
        ))}
      </div>

      <div className="w-full bg-amber-50/60 border border-amber-100 rounded-3xl px-6 py-4 text-center">
        <p className="font-display font-black text-2xl text-slate-700">{cols} × {rows} = ?</p>
        {!isPreReader && <p className="text-xs text-slate-400 mt-1">Split the grid to make it easier!</p>}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-4 flex flex-col items-center gap-2" style={{ boxShadow: '0 4px 0 rgba(20,90,140,.08)' }}>
        <div className="flex items-center gap-1 text-sm font-display font-black">
          <span style={{ color: LEFT_COLOR.bg }}>{leftCols}</span>
          <span className="text-slate-300">+</span>
          <span style={{ color: RIGHT_COLOR.bg }}>{rightCols}</span>
        </div>
        <div ref={gridRef} className="relative" style={{ userSelect: 'none' }} onPointerMove={onGridPointerMove}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cs}px)`, gap: 2 }}>
            {Array.from({ length: rows }, (_, r) =>
              Array.from({ length: cols }, (_, c) => {
                const isLeft = c < leftCols;
                return (
                  <div key={`${r}-${c}`} style={{ width: cs, height: cs, background: isLeft ? LEFT_COLOR.bg : RIGHT_COLOR.bg, borderRadius: 3, opacity: 0.85 }} />
                );
              }),
            )}
          </div>
          {phase === 'split' && (
            <div
              style={{ position: 'absolute', top: 0, left: handleX, width: 6, height: rows * (cs + 2) - 2, background: LEFT_COLOR.bg, borderRadius: 4, cursor: 'col-resize', boxShadow: '0 0 8px rgba(59,130,246,0.6)' }}
              onPointerDown={(e) => { e.preventDefault(); isDragging.current = true; }}
            >
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 20, height: 20, borderRadius: '50%', background: LEFT_COLOR.bg, border: '3px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }} />
            </div>
          )}
        </div>
      </div>

      <div className="w-full flex items-center gap-3">
        <div className="flex-1 bg-white rounded-2xl border-2 shadow-sm px-4 py-3 flex flex-col gap-0.5" style={{ borderColor: LEFT_COLOR.border }}>
          <span className="text-[9px] font-display font-black uppercase" style={{ color: LEFT_COLOR.bg }}>Left</span>
          <span className="font-display font-black text-lg" style={{ color: LEFT_COLOR.text }}>{leftCols} × {rows} = {leftProd}</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black shrink-0">+</div>
        <div className="flex-1 bg-white rounded-2xl border-2 shadow-sm px-4 py-3 flex flex-col gap-0.5" style={{ borderColor: RIGHT_COLOR.border }}>
          <span className="text-[9px] font-display font-black uppercase" style={{ color: RIGHT_COLOR.bg }}>Right</span>
          <span className="font-display font-black text-lg" style={{ color: RIGHT_COLOR.text }}>{rightCols} × {rows} = {rightProd}</span>
        </div>
      </div>

      {phase === 'split' && (
        <button onClick={confirmSplit} className="bg-amber-400 hover:bg-amber-500 text-white font-display font-bold px-8 py-3 rounded-full shadow-md transition-all">
          Check Split
        </button>
      )}

      {phase === 'answer' && (
        <div className="w-full flex flex-col items-center gap-4">
          <div className="flex gap-3 justify-center flex-wrap">
            {choices.map((c) => (
              <button key={c} onClick={() => handleSelect(c)} disabled={result !== null} className="w-16 h-16 rounded-2xl font-display font-black text-2xl shadow-sm transition-all active:scale-95 bg-white border-2 border-slate-200 hover:border-amber-300 text-slate-700 disabled:opacity-50">
                {c}
              </button>
            ))}
          </div>
          {result && (
            <div className={`w-full rounded-2xl px-6 py-4 font-display font-bold text-center anim-fade-up ${result === 'correct' ? 'bg-emerald-50 border-2 border-emerald-300 text-emerald-700' : 'bg-red-50 border-2 border-red-300 text-red-600'}`}>
              {result === 'correct' ? `🎉 ${leftProd} + ${rightProd} = ${product}` : `Not quite — it's ${product}.`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
