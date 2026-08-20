import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Button, GameFinishScreen, GameOption, GameProgressDots, T } from '../ui';

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
  const [selected, setSelected] = useState<number | null>(null);
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
    setSelected(choice);
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
        setSelected(null);
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
    setSelected(null);
  }

  if (finished) {
    const earned = starsForSplit(correctCount, TOTAL_ROUNDS);
    return (
      <GameFinishScreen
        earned={earned}
        scoreLabel={isPreReader ? undefined : `${correctCount} of ${TOTAL_ROUNDS} correct`}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  const handleX = leftCols * (cs + 2) - 1;

  return (
    <div className="flex flex-col items-center gap-5 max-w-lg mx-auto anim-fade-up">
      <GameProgressDots total={TOTAL_ROUNDS} current={round} />

      <div className="w-full px-6 py-4 text-center" style={{ borderRadius: T.radius.md, background: T.surface.sunk }}>
        <p className="font-display font-black text-2xl" style={{ color: T.ink.strong }}>{cols} × {rows} = ?</p>
        {!isPreReader && <p className="text-xs mt-1" style={{ color: T.ink.faint }}>Split the grid to make it easier!</p>}
      </div>

      <div className="bg-white p-4 flex flex-col items-center gap-2" style={{ borderRadius: T.radius.md, boxShadow: T.shadow.card }}>
        <div className="flex items-center gap-1 text-sm font-display font-black">
          <span style={{ color: LEFT_COLOR.bg }}>{leftCols}</span>
          <span style={{ color: T.surface.line }}>+</span>
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
        <div className="flex-1 bg-white px-4 py-3 flex flex-col gap-0.5" style={{ borderRadius: T.radius.sm, border: `2px solid ${LEFT_COLOR.border}`, boxShadow: T.shadow.card }}>
          <span className="text-[9px] font-display font-black uppercase" style={{ color: LEFT_COLOR.bg }}>Left</span>
          <span className="font-display font-black text-lg" style={{ color: LEFT_COLOR.text }}>{leftCols} × {rows} = {leftProd}</span>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center font-black shrink-0" style={{ background: T.surface.sunk, color: T.ink.faint }}>+</div>
        <div className="flex-1 bg-white px-4 py-3 flex flex-col gap-0.5" style={{ borderRadius: T.radius.sm, border: `2px solid ${RIGHT_COLOR.border}`, boxShadow: T.shadow.card }}>
          <span className="text-[9px] font-display font-black uppercase" style={{ color: RIGHT_COLOR.bg }}>Right</span>
          <span className="font-display font-black text-lg" style={{ color: RIGHT_COLOR.text }}>{rightCols} × {rows} = {rightProd}</span>
        </div>
      </div>

      {phase === 'split' && (
        <Button tone="amber" onClick={confirmSplit}>Check Split</Button>
      )}

      {phase === 'answer' && (
        <div className="w-full flex flex-col items-center gap-4">
          <div className="flex gap-3 justify-center flex-wrap">
            {choices.map((c) => (
              <GameOption key={c} state={result !== null ? (c === product ? 'correct' : c === selected ? 'wrong' : 'dimmed') : 'idle'} disabled={result !== null} onClick={() => handleSelect(c)} className="text-2xl" style={{ width: 64, height: 64 }}>
                {c}
              </GameOption>
            ))}
          </div>
          {result && (
            <div
              className="w-full px-6 py-4 font-display font-bold text-center anim-fade-up"
              style={{ borderRadius: T.radius.sm, background: result === 'correct' ? '#EAFBF0' : '#FDEDEC', border: `2px solid ${result === 'correct' ? '#A8E8BC' : '#F5B3AD'}`, color: result === 'correct' ? '#1B7F41' : '#B23930' }}
            >
              {result === 'correct' ? `🎉 ${leftProd} + ${rightProd} = ${product}` : `Not quite — it's ${product}.`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
