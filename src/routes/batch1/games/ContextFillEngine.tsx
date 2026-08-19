import React, { useState } from 'react';
import { Star } from 'lucide-react';
import confetti from 'canvas-confetti';

/* Ported from EducationAI-Games-master's Grade3 "MissingWord" (context-clue
   fill-in-the-blank) and restyled to this app's Adventure Island look —
   amber/emerald palette, font-display, rounded-3xl cards — instead of the
   source's own blue theme + standalone header/level-tabs. The source's
   free-type Level 3 is dropped (kept multiple-choice only, matching the
   rest of Batch1). Class 3 gets shorter passages; Class 4 gets longer ones
   with harder distractors, via params.puzzles. No curriculum_chapters row
   exists yet for Class 3/4 English (see batch1-content-plan-foundation),
   so this ships as an ungrouped skill game (chapter_ref = null). */

interface ContextFillPuzzle {
  passage: string;
  emoji: string;
  options: string[];
  correct: string;
  wrong?: Record<string, string>;
}
interface ContextFillGame {
  gameId: string;
  name: string;
  icon: string;
  params: { puzzles?: ContextFillPuzzle[] };
}
interface ContextFillEngineProps {
  game: ContextFillGame;
  isPreReader: boolean;
  onFinish: (gameId: string, stars: number, score: number) => void;
}

const FALLBACK_PUZZLES: ContextFillPuzzle[] = [
  {
    passage: 'The bird built a ______ in the tall tree.',
    emoji: '🐦',
    options: ['nest', 'rock', 'river', 'cloud'],
    correct: 'nest',
  },
  {
    passage: 'It was raining, so he opened his ______.',
    emoji: '☔',
    options: ['umbrella', 'book', 'banana', 'chair'],
    correct: 'umbrella',
  },
];

function starsForContextFill(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct >= total - 1) return 2;
  if (correct >= Math.ceil(total / 2)) return 1;
  return 0;
}

export const ContextFillEngine: React.FC<ContextFillEngineProps> = ({ game, isPreReader, onFinish }) => {
  const puzzles = game.params.puzzles && game.params.puzzles.length > 0 ? game.params.puzzles : FALLBACK_PUZZLES;

  const [idx, setIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);

  const puzzle = puzzles[idx];
  const parts = puzzle.passage.split('______');
  const before = parts[0];
  const after = parts[1] ?? '';

  function handleSelect(opt: string) {
    if (result !== null) return;
    setSelected(opt);
    const ok = opt === puzzle.correct;
    setResult(ok ? 'correct' : 'wrong');
    if (ok) confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } });
    const newCorrect = correctCount + (ok ? 1 : 0);
    setCorrectCount(newCorrect);
    setTimeout(() => {
      if (idx + 1 >= puzzles.length) {
        const earned = starsForContextFill(newCorrect, puzzles.length);
        setFinished(true);
        onFinish(game.gameId, earned, newCorrect);
        if (earned >= 2) confetti({ particleCount: 80, spread: 60, colors: ['#f59e0b', '#22c55e', '#6366f1'] });
      } else {
        setIdx((i) => i + 1);
        setSelected(null);
        setResult(null);
      }
    }, ok ? 1600 : 2200);
  }

  function handlePlayAgain() {
    setIdx(0);
    setCorrectCount(0);
    setFinished(false);
    setSelected(null);
    setResult(null);
  }

  if (finished) {
    const earned = starsForContextFill(correctCount, puzzles.length);
    return (
      <div className="flex flex-col items-center gap-5 py-10 anim-fade-up">
        <span className="text-6xl">🏆</span>
        <div className="flex gap-1">{[1, 2, 3].map((n) => (<Star key={n} size={32} className={n <= earned ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />))}</div>
        {!isPreReader && <p className="font-display font-bold text-slate-600 text-sm">{correctCount} / {puzzles.length} correct</p>}
        <button onClick={handlePlayAgain} className="bg-amber-400 hover:bg-amber-500 text-white font-display font-bold text-sm rounded-full px-8 py-3 shadow-md transition-all cursor-pointer" style={{ minHeight: 48, minWidth: 120 }}>
          🔄 Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 max-w-lg mx-auto anim-fade-up">
      <div className="flex gap-2">
        {puzzles.map((_, i) => (
          <div key={i} className={`w-3.5 h-3.5 rounded-full transition-all ${i < idx ? 'bg-emerald-400' : i === idx ? 'bg-amber-400 scale-125' : 'bg-slate-200'}`} />
        ))}
      </div>

      <div className="w-full bg-white rounded-3xl border-2 border-amber-100 shadow-sm px-6 py-6 flex flex-col items-center gap-4">
        <span className="text-6xl anim-bob">{puzzle.emoji}</span>
        <p className="font-display font-black text-lg text-slate-700 text-center leading-relaxed">
          {before}
          <span className={`inline-block mx-1.5 px-3 py-0.5 rounded-xl border-2 min-w-[70px] text-center ${result === 'correct' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : result === 'wrong' ? 'border-red-400 bg-red-50 text-red-600' : 'border-amber-300 bg-amber-50 text-amber-400'}`}>
            {selected ?? '?'}
          </span>
          {after}
        </p>
      </div>

      <div className="w-full grid grid-cols-2 gap-3">
        {puzzle.options.map((opt) => {
          const isCorrect = opt === puzzle.correct;
          const isSelected = opt === selected;
          let cls = 'py-3.5 rounded-2xl font-display font-black text-base border-2 transition-all active:scale-95 ';
          if (result === null) cls += 'bg-white border-slate-200 hover:border-amber-300 text-slate-700';
          else if (isCorrect) cls += 'bg-emerald-500 border-emerald-500 text-white animate-glow-green';
          else if (isSelected) cls += 'bg-red-400 border-red-400 text-white animate-game-shake';
          else cls += 'bg-slate-100 border-slate-100 text-slate-300';
          return (
            <button key={opt} onClick={() => handleSelect(opt)} disabled={result !== null} className={cls}>
              {opt}
            </button>
          );
        })}
      </div>

      {result === 'wrong' && !isPreReader && (
        <div className="w-full bg-red-50 border-2 border-red-300 rounded-2xl px-5 py-3 text-sm font-semibold text-red-600 anim-fade-up">
          {(selected && puzzle.wrong?.[selected]) ?? `Think about what fits best — the answer is "${puzzle.correct}".`}
        </div>
      )}
    </div>
  );
};
