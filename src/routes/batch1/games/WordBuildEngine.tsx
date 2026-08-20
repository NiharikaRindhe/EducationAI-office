import React, { useState } from 'react';
import { Hand, Delete, RotateCcw, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button, GameFinishScreen, GameOption, GameProgressDots, Pic, PRESS, T } from '../ui';

/* Ported from EducationAI-Games-master's Grade2 "SentenceStrip" spelling
   game and restyled to this app's Adventure Island look — amber tiles,
   font-display, rounded-3xl cards — instead of the source's own blue
   theme + standalone header. Richer than the quest engine's word-match
   generator: the student spells the word letter-by-letter from a mixed
   pool instead of picking a whole-word multiple-choice answer. */

interface WordPuzzle {
  sentence: string; // contains "______" for the blank
  answer: string; // UPPERCASE word to spell
  emoji: string;
  distractors: string[]; // extra letters mixed into the pool
}

interface WordBuildGame {
  gameId: string;
  name: string;
  icon: string;
  params: { words?: WordPuzzle[] };
}

interface WordBuildEngineProps {
  game: WordBuildGame;
  isPreReader: boolean;
  onFinish: (gameId: string, stars: number, score: number) => void;
}

interface Slot {
  letter: string | null;
}
interface PoolTile {
  id: number;
  letter: string;
  used: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildPool(puzzle: WordPuzzle): PoolTile[] {
  const letters = puzzle.answer.split('');
  const all = [...letters, ...puzzle.distractors];
  return shuffle(all).map((letter, i) => ({ id: i, letter, used: false }));
}

function starsForWordBuild(mistakes: number, hintsUsed: number): number {
  const penalty = mistakes + hintsUsed;
  if (penalty === 0) return 3;
  if (penalty <= 2) return 2;
  return 1;
}

const FALLBACK_PUZZLES: WordPuzzle[] = [
  { sentence: 'The ______ is yellow and hot.', answer: 'SUN', emoji: '☀️', distractors: ['M', 'T', 'P'] },
  { sentence: 'The ______ barks at night.', answer: 'DOG', emoji: '🐶', distractors: ['B', 'T', 'Z'] },
  { sentence: 'She drinks ______ every morning.', answer: 'MILK', emoji: '🥛', distractors: ['W', 'R', 'X'] },
];

export const WordBuildEngine: React.FC<WordBuildEngineProps> = ({ game, isPreReader, onFinish }) => {
  const puzzles = game.params.words && game.params.words.length > 0 ? game.params.words : FALLBACK_PUZZLES;

  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [slots, setSlots] = useState<Slot[]>(() => puzzles[0].answer.split('').map(() => ({ letter: null })));
  const [pool, setPool] = useState<PoolTile[]>(() => buildPool(puzzles[0]));
  const [checked, setChecked] = useState(false);
  const [won, setWon] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [finished, setFinished] = useState(false);

  const puzzle = puzzles[puzzleIdx];
  const allFilled = slots.every((s) => s.letter);
  const hasAnyFilled = slots.some((s) => s.letter);
  const nextEmptyIdx = slots.findIndex((s) => !s.letter);

  function placeLetter(item: PoolTile) {
    if (item.used || nextEmptyIdx === -1) return;
    setSlots((prev) => prev.map((s, i) => (i === nextEmptyIdx ? { letter: item.letter } : s)));
    setPool((prev) => prev.map((p) => (p.id === item.id ? { ...p, used: true } : p)));
    setChecked(false);
  }

  function removeSlot(idx: number) {
    const slot = slots[idx];
    if (!slot.letter) return;
    const letter = slot.letter;
    let restored = false;
    setPool((prev) =>
      [...prev].reverse().map((p) => (!restored && p.used && p.letter === letter ? ((restored = true), { ...p, used: false }) : p)).reverse(),
    );
    setSlots((prev) => prev.map((s, i) => (i === idx ? { letter: null } : s)));
    setChecked(false);
  }

  function handleHint() {
    const idx = slots.findIndex((s) => !s.letter);
    if (idx === -1) return;
    const correctLetter = puzzle.answer[idx];
    let used = false;
    setPool((prev) => prev.map((p) => (!used && !p.used && p.letter === correctLetter ? ((used = true), { ...p, used: true }) : p)));
    setSlots((prev) => prev.map((s, i) => (i === idx ? { letter: correctLetter } : s)));
    setHintsUsed((h) => h + 1);
    setChecked(false);
  }

  function deleteLast() {
    for (let i = slots.length - 1; i >= 0; i--) {
      if (slots[i].letter) {
        removeSlot(i);
        return;
      }
    }
  }

  function resetPuzzle() {
    setSlots(puzzle.answer.split('').map(() => ({ letter: null })));
    setPool(buildPool(puzzle));
    setChecked(false);
    setWon(false);
  }

  function handleCheck() {
    if (!allFilled) return;
    const attempt = slots.map((s) => s.letter).join('');
    const correct = attempt === puzzle.answer;
    setChecked(true);
    if (correct) {
      setWon(true);
      confetti({ particleCount: 40, spread: 40, origin: { y: 0.7 } });
    } else {
      setMistakes((m) => m + 1);
    }
  }

  function nextPuzzle() {
    if (puzzleIdx + 1 >= puzzles.length) {
      const earned = starsForWordBuild(mistakes, hintsUsed);
      setFinished(true);
      onFinish(game.gameId, earned, puzzles.length);
      if (earned >= 2) confetti({ particleCount: 80, spread: 60, colors: ['#f59e0b', '#22c55e', '#6366f1'] });
      return;
    }
    const next = puzzleIdx + 1;
    setPuzzleIdx(next);
    setSlots(puzzles[next].answer.split('').map(() => ({ letter: null })));
    setPool(buildPool(puzzles[next]));
    setChecked(false);
    setWon(false);
  }

  function handlePlayAgain() {
    setPuzzleIdx(0);
    setMistakes(0);
    setHintsUsed(0);
    setFinished(false);
    setSlots(puzzles[0].answer.split('').map(() => ({ letter: null })));
    setPool(buildPool(puzzles[0]));
    setChecked(false);
    setWon(false);
  }

  if (finished) {
    const earned = starsForWordBuild(mistakes, hintsUsed);
    return <GameFinishScreen earned={earned} onPlayAgain={handlePlayAgain} />;
  }

  const parts = puzzle.sentence.split('______');
  const before = parts[0];
  const after = parts[1] ?? '';

  function slotState(slot: Slot, idx: number): 'idle' | 'correct' | 'wrong' {
    if (!checked || !slot.letter) return 'idle';
    return slot.letter === puzzle.answer[idx] ? 'correct' : 'wrong';
  }

  return (
    <div className="flex flex-col items-center gap-5 anim-fade-up max-w-2xl mx-auto">
      <GameProgressDots total={puzzles.length} current={puzzleIdx} />

      <div className="bg-white flex flex-col items-center gap-2 px-10 py-5" style={{ borderRadius: T.radius.md, boxShadow: T.shadow.card }}>
        <Pic emoji={puzzle.emoji} size={60} />
      </div>

      <div className="w-full px-6 py-4 text-center" style={{ borderRadius: T.radius.sm, background: T.surface.sunk }}>
        <p className="text-lg font-semibold leading-relaxed" style={{ color: T.ink.strong }}>
          {/* Class 1-2 can't read the sentence yet — the picture above and the
              blank's letter-count are the whole puzzle for them; the full
              sentence is for Class 3-4, who are reading it as a spelling clue. */}
          {!isPreReader && before}
          <span className="underline decoration-2 underline-offset-4 tracking-widest mx-1" style={{ color: '#DB9A00', textDecorationColor: '#FFD53E' }}>
            {'_'.repeat(puzzle.answer.length)}
          </span>
          {!isPreReader && after}
        </p>
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        {slots.map((slot, idx) => (
          <GameOption
            key={idx}
            state={slotState(slot, idx)}
            onClick={() => removeSlot(idx)}
            className="text-xl"
            style={{ width: 60, height: 64, minHeight: 64, borderStyle: slot.letter ? 'solid' : 'dashed' }}
          >
            {slot.letter ?? ''}
          </GameOption>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        {pool.map((item) => (
          <GameOption
            key={item.id}
            state={item.used ? 'dimmed' : 'idle'}
            disabled={item.used}
            onClick={() => placeLetter(item)}
            className="text-2xl"
            style={{ width: 60, height: 60, minHeight: 60 }}
          >
            {item.letter}
          </GameOption>
        ))}
      </div>

      <div className="flex gap-2 w-full">
        <Button tone="amber" onClick={handleHint} className="text-xs px-4" icon={<Hand size={14} />}>
          Hint
        </Button>
        <button
          type="button"
          onClick={deleteLast}
          disabled={!hasAnyFilled}
          aria-label="Delete last letter"
          className={`flex items-center justify-center px-4 ${hasAnyFilled ? PRESS : 'opacity-40'}`}
          style={{ minHeight: T.tap, borderRadius: T.radius.sm, background: hasAnyFilled ? '#F0554C' : T.surface.sunk, color: '#FFFFFF', boxShadow: hasAnyFilled ? '0 3px 0 #C33F38' : 'none' }}
        >
          <Delete size={18} color={hasAnyFilled ? '#FFFFFF' : T.ink.faint} />
        </button>
        <button
          type="button"
          onClick={resetPuzzle}
          disabled={!hasAnyFilled}
          aria-label="Start this word over"
          className={`flex items-center justify-center px-4 bg-white ${hasAnyFilled ? PRESS : 'opacity-40'}`}
          style={{ minHeight: T.tap, borderRadius: T.radius.sm, border: `2px solid ${T.surface.line}`, boxShadow: '0 3px 0 rgba(20,90,140,.10)' }}
        >
          <RotateCcw size={18} style={{ color: T.ink.muted }} />
        </button>
        <Button tone="primary" onClick={handleCheck} disabled={!allFilled} className="flex-1" icon={won ? <CheckCircle2 size={18} /> : undefined}>
          {won ? 'Correct!' : 'Check'}
        </Button>
      </div>

      {checked && !won && (
        <p className="font-display font-semibold text-sm" style={{ color: '#C0362E' }}>
          Not quite — tap a letter to remove it and try again!
        </p>
      )}

      {won && (
        <div
          className="w-full flex flex-col items-center gap-3 px-8 py-4 anim-fade-up"
          style={{ borderRadius: T.radius.md, background: '#EAFBF0', border: '2px solid #A8E8BC' }}
        >
          <p className="font-display font-black" style={{ color: '#1B7F41' }}>🎉 The word was {puzzle.answer}!</p>
          <Button tone="amber" onClick={nextPuzzle}>Next →</Button>
        </div>
      )}
    </div>
  );
};
