import React, { useState, useMemo } from 'react';
import { Star, Lightbulb } from 'lucide-react';
import confetti from 'canvas-confetti';

/* Ported from EducationAI-Games-master's Grade2 "Crossword" (two
   intersecting words filled from a shared letter-tile pool) and restyled to
   this app's Adventure Island look — amber/emerald palette, font-display,
   rounded-3xl cards — instead of the source's own blue theme + standalone
   header. Word pairs come from params.puzzles (2 words each); auto-position
   logic (intersect on a shared letter, else place side by side) is kept
   from the source. Class 2 gets 3-4 letter words; Class 3 gets longer
   words, via params.puzzles. */

interface CrosswordWord { id: string; answer: string; clue: string; emoji: string }
interface CrosswordPuzzle { words: [CrosswordWord, CrosswordWord] }
interface CrosswordGame {
  gameId: string;
  name: string;
  icon: string;
  params: { puzzles?: CrosswordPuzzle[] };
}
interface CrosswordEngineProps {
  game: CrosswordGame;
  isPreReader: boolean;
  onFinish: (gameId: string, stars: number, score: number) => void;
}

const FALLBACK_PUZZLES: CrosswordPuzzle[] = [
  {
    words: [
      { id: 'cat', answer: 'CAT', clue: 'A furry pet that says meow', emoji: '🐱' },
      { id: 'cap', answer: 'CAP', clue: 'You wear it on your head', emoji: '🧢' },
    ],
  },
];

interface PositionedWord extends CrosswordWord { direction: 'across' | 'down'; startRow: number; startCol: number; label: number }
interface Cell { row: number; col: number; answer: string; wordIds: string[]; num: number | null }

function cellKey(r: number, c: number) { return `${r},${c}`; }
function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

function positionWords(words: [CrosswordWord, CrosswordWord]): PositionedWord[] {
  const a1 = words[0].answer.toUpperCase();
  const a2 = words[1].answer.toUpperCase();
  let inter: { i: number; j: number } | null = null;
  outer: for (let i = 0; i < a1.length; i++) {
    for (let j = 0; j < a2.length; j++) {
      if (a1[i] === a2[j]) { inter = { i, j }; break outer; }
    }
  }
  const w1Row = 1, w1Col = 0;
  const w2Row = inter ? w1Row - inter.j : 0;
  const w2Col = inter ? w1Col + inter.i : a1.length + 1;
  return [
    { ...words[0], answer: a1, direction: 'across', startRow: w1Row, startCol: w1Col, label: 1 },
    { ...words[1], answer: a2, direction: 'down', startRow: w2Row, startCol: w2Col, label: 2 },
  ];
}

function buildCells(words: PositionedWord[]): Cell[] {
  const map: Record<string, Cell> = {};
  const numbered = new Set<string>();
  words.forEach((word) => {
    word.answer.split('').forEach((letter, i) => {
      const row = word.direction === 'across' ? word.startRow : word.startRow + i;
      const col = word.direction === 'across' ? word.startCol + i : word.startCol;
      const k = cellKey(row, col);
      if (!map[k]) map[k] = { row, col, answer: letter, wordIds: [], num: null };
      if (!map[k].wordIds.includes(word.id)) map[k].wordIds.push(word.id);
    });
    const sk = cellKey(word.startRow, word.startCol);
    if (!numbered.has(sk)) { map[sk].num = word.label; numbered.add(sk); }
  });
  return Object.values(map);
}

function buildPool(cells: Cell[]): string[] {
  const letters = cells.map((c) => c.answer);
  const answerSet = new Set(letters);
  const distractor = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find((l) => !answerSet.has(l)) ?? 'Z';
  return shuffle([...letters, distractor]);
}

function starsForCrossword(hinted: boolean): number {
  return hinted ? 2 : 3;
}

export const CrosswordEngine: React.FC<CrosswordEngineProps> = ({ game, isPreReader, onFinish }) => {
  const puzzles = game.params.puzzles && game.params.puzzles.length > 0 ? game.params.puzzles : FALLBACK_PUZZLES;

  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const words = useMemo(() => positionWords(puzzles[puzzleIdx].words), [puzzleIdx, puzzles]);
  const cells = useMemo(() => buildCells(words), [words]);
  const allRows = useMemo(() => [...new Set(cells.map((c) => c.row))].sort((a, b) => a - b), [cells]);
  const allCols = useMemo(() => [...new Set(cells.map((c) => c.col))].sort((a, b) => a - b), [cells]);

  const [filled, setFilled] = useState<Record<string, string>>({});
  const [wrong, setWrong] = useState<Record<string, boolean>>({});
  const [used, setUsed] = useState<number[]>([]);
  const [pool, setPool] = useState<string[]>(() => buildPool(cells));
  const [activeId, setActiveId] = useState<string>(words[0].id);
  const [won, setWon] = useState(false);
  const [totalHinted, setTotalHinted] = useState(false);
  const [finished, setFinished] = useState(false);

  /** Resets per-puzzle state for the puzzle at `idx` — called directly from
   *  nextPuzzle()/handlePlayAgain() rather than a useEffect keyed on
   *  puzzleIdx, since the next puzzle's words/cells are cheap to compute
   *  inline and this avoids a render-then-reset cascade. */
  function loadPuzzle(idx: number) {
    const nextWords = positionWords(puzzles[idx].words);
    const nextCells = buildCells(nextWords);
    setPuzzleIdx(idx);
    setFilled({});
    setWrong({});
    setUsed([]);
    setPool(buildPool(nextCells));
    setActiveId(nextWords[0].id);
    setWon(false);
  }

  const activeWord = words.find((w) => w.id === activeId)!;
  const activeCells = cells
    .filter((c) => c.wordIds.includes(activeId))
    .sort((a, b) => (activeWord.direction === 'across' ? a.col - b.col : a.row - b.row));
  const nextEmpty = activeCells.find((c) => !filled[cellKey(c.row, c.col)]);

  function placeLetter(letter: string, poolIdx: number) {
    if (used.includes(poolIdx) || !nextEmpty) return;
    const k = cellKey(nextEmpty.row, nextEmpty.col);
    const isCorrect = letter === nextEmpty.answer;
    const newFilled = { ...filled, [k]: letter };
    setFilled(newFilled);
    setUsed([...used, poolIdx]);
    setWrong({ ...wrong, [k]: !isCorrect });
    if (cells.every((c) => newFilled[cellKey(c.row, c.col)] === c.answer)) {
      setWon(true);
      confetti({ particleCount: 60, spread: 50, colors: ['#f59e0b', '#22c55e', '#6366f1'] });
    }
  }

  function giveHint() {
    if (!nextEmpty) return;
    const k = cellKey(nextEmpty.row, nextEmpty.col);
    const newFilled = { ...filled, [k]: nextEmpty.answer };
    setFilled(newFilled);
    setWrong((prev) => ({ ...prev, [k]: false }));
    setTotalHinted(true);
    const pi = pool.findIndex((l, i) => l === nextEmpty.answer && !used.includes(i));
    if (pi !== -1) setUsed((prev) => [...prev, pi]);
    if (cells.every((c) => newFilled[cellKey(c.row, c.col)] === c.answer)) {
      setTimeout(() => { setWon(true); confetti({ particleCount: 60, spread: 50 }); }, 300);
    }
  }

  function nextPuzzle() {
    if (puzzleIdx + 1 >= puzzles.length) {
      const earned = starsForCrossword(totalHinted);
      setFinished(true);
      onFinish(game.gameId, earned, puzzles.length);
      if (earned >= 2) confetti({ particleCount: 80, spread: 60, colors: ['#f59e0b', '#22c55e', '#6366f1'] });
    } else {
      loadPuzzle(puzzleIdx + 1);
    }
  }

  function handlePlayAgain() {
    loadPuzzle(0);
    setTotalHinted(false);
    setFinished(false);
  }

  if (finished) {
    const earned = starsForCrossword(totalHinted);
    return (
      <div className="flex flex-col items-center gap-5 py-10 anim-fade-up">
        <span className="text-6xl">🏆</span>
        <div className="flex gap-1">{[1, 2, 3].map((n) => (<Star key={n} size={32} className={n <= earned ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />))}</div>
        <button onClick={handlePlayAgain} className="bg-amber-400 hover:bg-amber-500 text-white font-display font-bold text-sm rounded-full px-8 py-3 shadow-md transition-all cursor-pointer" style={{ minHeight: 48, minWidth: 120 }}>
          🔄 Play Again
        </button>
      </div>
    );
  }

  const SIZE = 52;

  return (
    <div className="flex flex-col items-center gap-4 max-w-xl mx-auto anim-fade-up">
      <div className="flex gap-2">
        {puzzles.map((_, i) => (
          <div key={i} className={`w-3.5 h-3.5 rounded-full transition-all ${i < puzzleIdx ? 'bg-emerald-400' : i === puzzleIdx ? 'bg-amber-400 scale-125' : 'bg-slate-200'}`} />
        ))}
      </div>

      <div className="w-full grid grid-cols-2 gap-3">
        {words.map((word) => {
          const isActive = word.id === activeId;
          return (
            <button
              key={word.id}
              onClick={() => setActiveId(word.id)}
              className={`relative text-left rounded-2xl p-3 border-2 bg-white shadow-sm flex items-center gap-3 transition-all ${isActive ? 'border-amber-400 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <span className="text-3xl">{word.emoji}</span>
              <div>
                {!isPreReader && <p className="text-slate-600 text-xs">{word.clue}</p>}
                {isActive && <p className="text-xs font-display font-black mt-0.5 tracking-widest text-amber-500">{word.answer.split('').join(' · ')}</p>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-white/70 rounded-3xl p-5 border border-slate-100" style={{ boxShadow: '0 4px 0 rgba(20,90,140,.08)' }}>
        <div style={{ display: 'grid', gridTemplateRows: `repeat(${allRows.length}, ${SIZE}px)`, gridTemplateColumns: `repeat(${allCols.length}, ${SIZE}px)`, gap: 6 }}>
          {allRows.map((r) => allCols.map((c) => {
            const cell = cells.find((cl) => cl.row === r && cl.col === c);
            const k = cellKey(r, c);
            const val = filled[k];
            if (!cell) return <div key={k} style={{ width: SIZE, height: SIZE }} />;
            const isActive = cell.wordIds.includes(activeId);
            const isWrong = wrong[k];
            const isRight = val && !isWrong;
            const style = isRight ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
              : isWrong ? 'border-red-400 bg-red-50 text-red-600'
                : isActive ? 'border-amber-300 bg-amber-50'
                  : 'border-slate-200 bg-white';
            return (
              <div
                key={k}
                onClick={() => setActiveId(cell.wordIds[0])}
                style={{ width: SIZE, height: SIZE }}
                className={`relative rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all ${style}`}
              >
                {val && <span className="text-xl font-display font-black">{val}</span>}
              </div>
            );
          }))}
        </div>
      </div>

      {won && (
        <div className="w-full bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 flex flex-col items-center gap-3 anim-fade-up">
          <span className="text-4xl">🎉</span>
          <p className="font-display font-black text-emerald-700">Great Job!</p>
          <button onClick={nextPuzzle} className="bg-amber-400 hover:bg-amber-500 text-white font-display font-bold px-8 py-3 rounded-full shadow-md">
            {puzzleIdx + 1 >= puzzles.length ? 'Finish' : 'Next Puzzle →'}
          </button>
        </div>
      )}

      {!won && (
        <>
          {!isPreReader && (
            <button onClick={giveHint} className="flex items-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-700 font-display font-bold text-xs px-5 py-2 rounded-full">
              <Lightbulb size={14} /> HINT
            </button>
          )}
          <div className="flex flex-wrap justify-center gap-2.5">
            {pool.map((letter, i) => {
              const isUsed = used.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => placeLetter(letter, i)}
                  disabled={isUsed}
                  className={`w-12 h-12 rounded-xl text-xl font-display font-black shadow-sm transition-all ${isUsed ? 'bg-slate-100 text-slate-300' : 'bg-amber-400 text-white hover:bg-amber-500 active:scale-95'}`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
