import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { GameFinishScreen, GameOption, GameProgressDots, Pic, T } from '../ui';

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
      <GameFinishScreen
        earned={earned}
        scoreLabel={isPreReader ? undefined : `${correctCount} of ${puzzles.length} correct`}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-5 sm:gap-6 max-w-lg sm:max-w-xl md:max-w-2xl mx-auto px-2 sm:px-0 anim-fade-up">
      <GameProgressDots total={puzzles.length} current={idx} />

      <div
        className="w-full bg-white flex flex-col items-center gap-4 px-6 py-6 sm:px-8 sm:py-8 md:px-10 md:py-9"
        style={{ borderRadius: T.radius.md, boxShadow: T.shadow.card }}
      >
        <Pic emoji={puzzle.emoji} size={60} className="anim-bob sm:!w-20 sm:!h-20 md:!w-24 md:!h-24" />
        <p className="font-display font-black text-lg sm:text-xl md:text-2xl text-center leading-relaxed" style={{ color: T.ink.strong }}>
          {before}
          <span
            className="inline-block mx-1.5 px-3 py-0.5 min-w-[70px] sm:min-w-[90px] text-center"
            style={{
              borderRadius: T.radius.sm,
              border: `2px solid ${result === 'correct' ? '#3FCB6E' : result === 'wrong' ? '#F0554C' : '#FFB100'}`,
              background: result === 'correct' ? '#EAFBF0' : result === 'wrong' ? '#FDEDEC' : '#FFF7E0',
              color: result === 'correct' ? '#1B7F41' : result === 'wrong' ? '#B23930' : T.ink.faint,
            }}
          >
            {selected ?? '?'}
          </span>
          {after}
        </p>
      </div>

      <div className="w-full grid grid-cols-2 gap-3 sm:gap-4">
        {puzzle.options.map((opt) => {
          const isCorrect = opt === puzzle.correct;
          const isSelected = opt === selected;
          const state = result === null ? 'idle' : isCorrect ? 'correct' : isSelected ? 'wrong' : 'dimmed';
          return (
            <GameOption
              key={opt}
              state={state}
              disabled={result !== null}
              onClick={() => handleSelect(opt)}
              className="py-3.5 sm:py-4 md:py-5 text-base sm:text-lg"
            >
              {opt}
            </GameOption>
          );
        })}
      </div>

      {result === 'wrong' && !isPreReader && (
        <div
          className="w-full px-5 py-3 text-sm sm:text-base font-semibold anim-fade-up"
          style={{ borderRadius: T.radius.sm, border: '2px solid #F5B3AD', background: '#FDEDEC', color: '#B23930' }}
        >
          {(selected && puzzle.wrong?.[selected]) ?? `Think about what fits best — the answer is "${puzzle.correct}".`}
        </div>
      )}
    </div>
  );
};
