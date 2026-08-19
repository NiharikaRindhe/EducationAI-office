import React, { useState, useEffect } from 'react';
import { Star, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';

/* Ported from EducationAI-Games-master's Grade3 "AreaBuilder" (drag-to-shade
   area-as-multiplication) and restyled to this app's Adventure Island look —
   amber/emerald palette, font-display, rounded-3xl cards — instead of the
   source's own blue theme + standalone header/level-tabs. Class 3 gets
   single-region grids (params.decompose=false); Class 4 gets the harder
   decomposed multi-region version (params.decompose=true). */

interface AreaBuilderGame {
  gameId: string;
  name: string;
  icon: string;
  params: { rowMin?: number; rowMax?: number; colMin?: number; colMax?: number; decompose?: boolean };
}
interface AreaBuilderEngineProps {
  game: AreaBuilderGame;
  isPreReader: boolean;
  onFinish: (gameId: string, stars: number, score: number) => void;
}

const REGION_COLORS = [
  { bg: '#F59E0B', light: '#FEF3E2', text: '#B45309' },
  { bg: '#10b981', light: '#DCFCE7', text: '#15803D' },
  { bg: '#3b82f6', light: '#DBEAFE', text: '#1D4ED8' },
  { bg: '#8b5cf6', light: '#F3E8FF', text: '#7E22CE' },
];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface Region { rows: number; cols: number; product: number; colorIdx: number }

function decompose(rows: number, cols: number, allow: boolean): Region[] {
  if (!allow || (rows < 10 && cols < 10)) return [{ rows, cols, product: rows * cols, colorIdx: 0 }];
  const rSplit = rows >= 10 ? [10, rows - 10] : [rows];
  const cSplit = cols >= 10 ? [10, cols - 10] : [cols];
  const regions: Region[] = [];
  let colorIdx = 0;
  for (const r of rSplit) {
    for (const c of cSplit) {
      if (r > 0 && c > 0) {
        regions.push({ rows: r, cols: c, product: r * c, colorIdx });
        colorIdx++;
      }
    }
  }
  return regions;
}

function buildChoices(correct: number): number[] {
  const offsets = [-20, -10, -5, -2, 2, 5, 10, 20];
  const wrong = new Set<number>();
  for (const off of [...offsets].sort(() => Math.random() - 0.5)) {
    const w = correct + off;
    if (w > 0 && w !== correct) wrong.add(w);
    if (wrong.size === 3) break;
  }
  return [...wrong, correct].sort(() => Math.random() - 0.5);
}

function cellSize(rows: number, cols: number) {
  return Math.max(rows, cols) <= 9 ? 34 : 28;
}

function starsForArea(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct >= total - 1) return 2;
  if (correct >= Math.ceil(total / 2)) return 1;
  return 0;
}

const TOTAL_ROUNDS = 4;
const BUFFER = 2;

const DragGrid: React.FC<{ targetRows: number; targetCols: number; colorIdx: number; onComplete: (ok: boolean) => void }> = ({ targetRows, targetCols, colorIdx, onComplete }) => {
  const [shadedRows, setShadedRows] = useState(0);
  const [shadedCols, setShadedCols] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const color = REGION_COLORS[colorIdx];
  const cs = cellSize(targetRows, targetCols);
  const totalRows = targetRows + BUFFER;
  const totalCols = targetCols + BUFFER;

  useEffect(() => {
    const up = () => setDragging(false);
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, []);

  function cellDown(r: number, c: number) {
    if (done) return;
    setDragging(true);
    setShadedRows(r + 1);
    setShadedCols(c + 1);
  }
  function cellEnter(r: number, c: number) {
    if (!dragging || done) return;
    setShadedRows(r + 1);
    setShadedCols(c + 1);
  }

  const exact = shadedRows === targetRows && shadedCols === targetCols;

  function confirm() {
    if (exact) { setDone(true); onComplete(true); } else { onComplete(false); }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs font-bold text-slate-500 text-center">
        Shade <span className="font-display font-black" style={{ color: color.bg }}>{targetRows} × {targetCols}</span>
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${totalCols}, ${cs}px)`, gap: 2, cursor: 'crosshair' }}>
        {Array.from({ length: totalRows }, (_, r) =>
          Array.from({ length: totalCols }, (_, c) => {
            const shaded = r < shadedRows && c < shadedCols;
            return (
              <div
                key={`${r}-${c}`}
                onPointerDown={() => cellDown(r, c)}
                onPointerEnter={() => cellEnter(r, c)}
                style={{
                  width: cs, height: cs, background: shaded ? color.bg : '#e2e8f0', borderRadius: 4,
                  transition: 'background 0.08s', userSelect: 'none',
                }}
              />
            );
          }),
        )}
      </div>
      <div className={`text-xs font-bold px-3 py-1 rounded-full ${exact ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400'}`}>
        {shadedRows > 0 ? `${shadedRows} × ${shadedCols} = ${shadedRows * shadedCols}` : 'Drag to shade'}
      </div>
      {!done && (
        <button
          onClick={confirm}
          disabled={shadedRows === 0}
          className="px-5 py-2 rounded-full font-display font-bold text-sm text-white shadow-md disabled:bg-slate-200 disabled:text-slate-400"
          style={shadedRows > 0 ? { background: color.bg } : {}}
        >
          Confirm
        </button>
      )}
      {done && <div className="text-sm font-display font-bold text-emerald-600">✅ Done!</div>}
    </div>
  );
};

export const AreaBuilderEngine: React.FC<AreaBuilderEngineProps> = ({ game, isPreReader, onFinish }) => {
  const { rowMin = 2, rowMax = 9, colMin = 2, colMax = 9, decompose: allowDecompose = false } = game.params;

  function newPuzzle() {
    return { rows: randInt(rowMin, rowMax), cols: randInt(colMin, colMax) };
  }

  const [round, setRound] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [puzzle, setPuzzle] = useState(newPuzzle);
  const [phase, setPhase] = useState<'intro' | 'build' | 'answer'>('intro');
  const [currentRegion, setCurrentRegion] = useState(0);
  const [badRegion, setBadRegion] = useState(false);
  const [choices, setChoices] = useState<number[]>([]);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);

  const regions = decompose(puzzle.rows, puzzle.cols, allowDecompose);
  const product = puzzle.rows * puzzle.cols;

  function handleRegionComplete(success: boolean) {
    if (!success) { setBadRegion(true); return; }
    setBadRegion(false);
    if (currentRegion + 1 >= regions.length) {
      setChoices(buildChoices(product));
      setPhase('answer');
    } else {
      setCurrentRegion((r) => r + 1);
    }
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
        const earned = starsForArea(newCorrect, TOTAL_ROUNDS);
        setFinished(true);
        onFinish(game.gameId, earned, newCorrect);
        if (earned >= 2) confetti({ particleCount: 80, spread: 60, colors: ['#f59e0b', '#22c55e', '#6366f1'] });
      } else {
        setRound((r) => r + 1);
        setPuzzle(newPuzzle());
        setPhase('intro');
        setCurrentRegion(0);
        setBadRegion(false);
        setResult(null);
      }
    }, ok ? 1400 : 1800);
  }

  function handlePlayAgain() {
    setRound(0);
    setCorrectCount(0);
    setFinished(false);
    setPuzzle(newPuzzle());
    setPhase('intro');
    setCurrentRegion(0);
    setBadRegion(false);
    setResult(null);
  }

  if (finished) {
    const earned = starsForArea(correctCount, TOTAL_ROUNDS);
    return (
      <div className="flex flex-col items-center gap-5 py-10 anim-fade-up">
        <span className="text-6xl">🏆</span>
        <div className="flex gap-1">
          {[1, 2, 3].map((n) => (<Star key={n} size={32} className={n <= earned ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />))}
        </div>
        {!isPreReader && <p className="font-display font-bold text-slate-600 text-sm">{correctCount} / {TOTAL_ROUNDS} correct</p>}
        <button onClick={handlePlayAgain} className="bg-amber-400 hover:bg-amber-500 text-white font-display font-bold text-sm rounded-full px-8 py-3 shadow-md transition-all cursor-pointer" style={{ minHeight: 48, minWidth: 120 }}>
          🔄 Play Again
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

      <div className="w-full bg-amber-50/60 border border-amber-100 rounded-3xl px-6 py-4 text-center">
        <p className="font-display font-black text-2xl text-slate-700">🟦 {puzzle.rows} × {puzzle.cols} = ?</p>
      </div>

      {phase === 'intro' && (
        <div className="flex flex-col items-center gap-4 py-4">
          <p className="text-slate-500 font-semibold text-sm text-center max-w-xs">
            {isPreReader ? 'Shade the grid! 🟦' : regions.length > 1
              ? `Build ${regions.length} colored grids to find the area!`
              : `Drag to shade ${puzzle.rows} rows × ${puzzle.cols} columns.`}
          </p>
          <button
            onClick={() => setPhase('build')}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-white font-display font-bold px-8 py-3 rounded-full shadow-md transition-all"
          >
            Start <ChevronRight size={18} />
          </button>
        </div>
      )}

      {phase === 'build' && (
        <div className="flex flex-col items-center gap-3 w-full">
          {regions.length > 1 && (
            <div className="flex gap-2">
              {regions.map((reg, i) => {
                const color = REGION_COLORS[reg.colorIdx];
                const done = i < currentRegion;
                return (
                  <div key={i} className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-display font-black border-2" style={{ background: done ? color.bg : color.light, borderColor: color.bg, color: done ? 'white' : color.text }}>
                    {done ? '✓' : i + 1}
                  </div>
                );
              })}
            </div>
          )}
          {badRegion && (
            <div className="bg-red-50 border border-red-300 text-red-600 rounded-2xl px-4 py-2 text-xs font-semibold text-center">
              ❌ Try {regions[currentRegion].rows} × {regions[currentRegion].cols} again
            </div>
          )}
          <div className="bg-white rounded-3xl border border-slate-100 p-4" style={{ boxShadow: '0 4px 0 rgba(20,90,140,.08)' }}>
            <DragGrid
              key={`${currentRegion}-${puzzle.rows}-${puzzle.cols}`}
              targetRows={regions[currentRegion].rows}
              targetCols={regions[currentRegion].cols}
              colorIdx={regions[currentRegion].colorIdx}
              onComplete={handleRegionComplete}
            />
          </div>
        </div>
      )}

      {phase === 'answer' && (
        <div className="w-full flex flex-col items-center gap-4">
          {regions.length > 1 && (
            <p className="text-sm font-display font-bold text-slate-500 text-center">
              {regions.map((r) => r.product).join(' + ')} = ?
            </p>
          )}
          <div className="flex gap-3 justify-center flex-wrap">
            {choices.map((c) => (
              <button
                key={c}
                onClick={() => handleSelect(c)}
                disabled={result !== null}
                className="w-16 h-16 rounded-2xl font-display font-black text-2xl shadow-sm transition-all active:scale-95 bg-white border-2 border-slate-200 hover:border-amber-300 text-slate-700 disabled:opacity-50"
              >
                {c}
              </button>
            ))}
          </div>
          {result && (
            <div className={`w-full rounded-2xl px-6 py-4 font-display font-bold text-center anim-fade-up ${result === 'correct' ? 'bg-emerald-50 border-2 border-emerald-300 text-emerald-700' : 'bg-red-50 border-2 border-red-300 text-red-600'}`}>
              {result === 'correct' ? '🎉 Correct!' : `Not quite — it's ${product}.`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
