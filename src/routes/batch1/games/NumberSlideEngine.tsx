import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button, StarRow, T } from '../ui';

/* Ported from EducationAI-Games-master's Grade4 "NumberArrange" sliding
   number puzzle and restyled to this app's Adventure Island look —
   amber/emerald palette, font-display, rounded cards — instead of the
   source's own blue theme + standalone header/size-picker page. */

interface NumberSlideGame {
  gameId: string;
  name: string;
  icon: string;
  params: { startSize?: number };
}

interface NumberSlideEngineProps {
  game: NumberSlideGame;
  isPreReader: boolean;
  onFinish: (gameId: string, stars: number, score: number) => void;
}

function buildSolved(n: number): number[] {
  const total = n * n;
  return Array.from({ length: total }, (_, i) => (i < total - 1 ? i + 1 : 0));
}

function isSolvable(tiles: number[], n: number): boolean {
  const arr = tiles.filter((t) => t !== 0);
  let inv = 0;
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] > arr[j]) inv++;
    }
  }
  const blankRow = Math.floor(tiles.indexOf(0) / n);
  if (n % 2 === 1) return inv % 2 === 0;
  return blankRow % 2 === 0 ? inv % 2 === 1 : inv % 2 === 0;
}

function shuffle(n: number): number[] {
  const arr = buildSolved(n);
  do {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  } while (!isSolvable(arr, n) || JSON.stringify(arr) === JSON.stringify(buildSolved(n)));
  return arr;
}

function checkWin(tiles: number[], n: number): boolean {
  return tiles.every((v, i) => v === buildSolved(n)[i]);
}

function starsForSlide(moves: number, size: number): number {
  const cells = size * size;
  if (moves <= cells * 3) return 3;
  if (moves <= cells * 5) return 2;
  return 1;
}

const SIZES = [3, 4, 5];

export const NumberSlideEngine: React.FC<NumberSlideEngineProps> = ({ game, isPreReader, onFinish }) => {
  const [size, setSize] = useState(Math.min(Math.max(game.params.startSize ?? 3, 3), 5));
  const [tiles, setTiles] = useState<number[]>(() => shuffle(size));
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [reported, setReported] = useState(false);
  const shineRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [shineIdx, setShineIdx] = useState(-1);
  const [shine, setShine] = useState(false);

  const startGame = useCallback((n: number) => {
    clearTimeout(shineRef.current);
    setSize(n);
    setTiles(shuffle(n));
    setMoves(0);
    setWon(false);
    setReported(false);
    setShine(false);
    setShineIdx(-1);
  }, []);

  const triggerShine = useCallback((n: number) => {
    setShine(true);
    function runWave(remaining: number) {
      setShineIdx(remaining);
      if (remaining >= 0) {
        shineRef.current = setTimeout(() => runWave(remaining - 1), 110);
      } else {
        shineRef.current = setTimeout(() => runWave(2 * n - 2), 700);
      }
    }
    runWave(2 * n - 2);
  }, []);

  const handleTileClick = useCallback(
    (idx: number) => {
      if (won) return;
      const n = size;
      const blankIdx = tiles.indexOf(0);
      const row = Math.floor(idx / n);
      const col = idx % n;
      const bRow = Math.floor(blankIdx / n);
      const bCol = blankIdx % n;
      const adjacent = (row === bRow && Math.abs(col - bCol) === 1) || (col === bCol && Math.abs(row - bRow) === 1);
      if (!adjacent) return;

      const next = [...tiles];
      [next[idx], next[blankIdx]] = [next[blankIdx], next[idx]];
      setTiles(next);
      const nextMoves = moves + 1;
      setMoves(nextMoves);

      if (checkWin(next, n)) {
        setWon(true);
        shineRef.current = setTimeout(() => triggerShine(n), 200);
        if (!reported) {
          setReported(true);
          const earned = starsForSlide(nextMoves, n);
          confetti({ particleCount: 80, spread: 60, colors: ['#f59e0b', '#22c55e', '#6366f1'] });
          onFinish(game.gameId, earned, nextMoves);
        }
      }
    },
    [tiles, won, size, moves, reported, triggerShine, game.gameId, onFinish],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (won) return;
      const n = size;
      const blankIdx = tiles.indexOf(0);
      const bRow = Math.floor(blankIdx / n);
      const bCol = blankIdx % n;
      let target = -1;
      if (e.key === 'ArrowRight' && bCol > 0) target = blankIdx - 1;
      if (e.key === 'ArrowLeft' && bCol < n - 1) target = blankIdx + 1;
      if (e.key === 'ArrowDown' && bRow > 0) target = blankIdx - n;
      if (e.key === 'ArrowUp' && bRow < n - 1) target = blankIdx + n;
      if (target !== -1) {
        e.preventDefault();
        handleTileClick(target);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tiles, won, size, handleTileClick]);

  const total = size * size - 1;
  const diagOf = (idx: number) => {
    const row = Math.floor(idx / size);
    const col = idx % size;
    return size - 1 - row + (size - 1 - col);
  };
  const tileSize = size === 3 ? 84 : size === 4 ? 68 : 54;
  const fontSize = size === 3 ? 26 : size === 4 ? 20 : 16;

  return (
    <div className="flex flex-col items-center gap-5 anim-fade-up">
      {/* Size selector */}
      <div className="flex items-center gap-2">
        {SIZES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => startGame(s)}
            className="py-1.5 px-4 font-display font-black text-xs transition-colors"
            style={{
              borderRadius: 999,
              border: `2px solid ${s === size ? '#FFB100' : T.surface.line}`,
              background: s === size ? '#FFB100' : '#FFFFFF',
              color: s === size ? '#FFFFFF' : T.ink.muted,
            }}
          >
            {s}×{s}
          </button>
        ))}
      </div>

      {!isPreReader && (
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center px-5 py-2 min-w-[80px]" style={{ borderRadius: T.radius.sm, background: T.surface.sunk }}>
            <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: T.ink.faint }}>Moves</span>
            <span className="text-xl font-display font-black" style={{ color: T.ink.strong }}>{moves}</span>
          </div>
          <div className="flex flex-col items-center px-5 py-2 min-w-[80px]" style={{ borderRadius: T.radius.sm, background: T.surface.sunk }}>
            <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: T.ink.faint }}>Goal</span>
            <span className="text-xl font-display font-black" style={{ color: T.ink.strong }}>1–{total}</span>
          </div>
        </div>
      )}

      {won && (
        <div className="flex flex-col items-center gap-3 px-6 py-4 anim-fade-up" style={{ borderRadius: T.radius.sm, background: '#EAFBF0', border: '2px solid #A8E8BC' }}>
          <StarRow earned={starsForSlide(moves, size)} size={26} />
          <p className="font-display font-bold text-sm" style={{ color: '#1B7F41' }}>🎉 Solved in {moves} moves!</p>
        </div>
      )}

      <div
        className="grid bg-white p-3"
        style={{
          gridTemplateColumns: `repeat(${size}, ${tileSize}px)`,
          gridTemplateRows: `repeat(${size}, ${tileSize}px)`,
          gap: 6,
          borderRadius: T.radius.md,
          boxShadow: T.shadow.raised,
        }}
      >
        {tiles.map((num, idx) => {
          const isBlank = num === 0;
          const isShining = shine && diagOf(idx) === shineIdx;
          const hue = num === 0 ? 0 : Math.round((num / total) * 40);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => !isBlank && handleTileClick(idx)}
              className="flex items-center justify-center font-display font-black transition-all duration-150 ease-in-out select-none"
              style={{
                width: tileSize,
                height: tileSize,
                fontSize,
                borderRadius: T.radius.sm,
                cursor: isBlank ? 'default' : 'pointer',
                pointerEvents: isBlank ? 'none' : 'auto',
                background: isBlank ? T.surface.sunk : isShining ? '#fbbf24' : `hsl(${38 + hue}, 90%, 58%)`,
                color: isBlank ? 'transparent' : '#fff',
                boxShadow: isBlank
                  ? 'none'
                  : isShining
                    ? '0 0 18px 6px rgba(251,191,36,0.55), 0 4px 0 #d97706'
                    : `0 4px 0 hsl(${38 + hue}, 90%, 40%)`,
                transform: isShining ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              {num !== 0 && num}
            </button>
          );
        })}
      </div>

      <Button tone="quiet" onClick={() => startGame(size)} icon={<RotateCcw size={16} />}>
        Start again
      </Button>

      {!isPreReader && <p className="text-[11px] font-medium" style={{ color: T.ink.faint }}>Tap a tile next to the empty space — or use arrow keys</p>}
    </div>
  );
};
