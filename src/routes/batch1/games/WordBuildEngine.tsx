import React, { useState } from 'react';
import { Hand, Delete, RotateCcw, CheckCircle2, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

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
    return (
      <div className="flex flex-col items-center gap-5 py-10 anim-fade-up">
        <span className="text-6xl">🏆</span>
        <div className="flex gap-1">
          {[1, 2, 3].map((n) => (
            <Star key={n} size={32} className={n <= earned ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
          ))}
        </div>
        <button
          onClick={handlePlayAgain}
          className="bg-amber-400 hover:bg-amber-500 text-white font-display font-bold text-sm rounded-full px-8 py-3 shadow-md transition-all cursor-pointer"
          style={{ minHeight: 48, minWidth: 120 }}
        >
          🔄 Play Again
        </button>
      </div>
    );
  }

  const parts = puzzle.sentence.split('______');
  const before = parts[0];
  const after = parts[1] ?? '';

  function slotStyle(slot: Slot, idx: number) {
    if (!checked || !slot.letter) return 'border-dashed border-2 border-slate-300 bg-amber-50/60';
    const correct = slot.letter === puzzle.answer[idx];
    return correct ? 'border-2 border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-2 border-red-400 bg-red-50 text-red-600';
  }

  return (
    <div className="flex flex-col items-center gap-5 anim-fade-up max-w-2xl mx-auto">
      {/* Progress dots */}
      <div className="flex gap-2">
        {puzzles.map((_, i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full transition-all ${
              i < puzzleIdx ? 'bg-emerald-400' : i === puzzleIdx ? 'bg-amber-400 scale-125' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 px-10 py-5 flex flex-col items-center gap-2" style={{ boxShadow: '0 4px 0 rgba(20,90,140,.08)' }}>
        <div className="text-6xl">{puzzle.emoji}</div>
      </div>

      <div className="w-full bg-amber-50/60 border border-amber-100 rounded-2xl px-6 py-4 text-center">
        <p className="text-slate-700 text-lg font-semibold leading-relaxed">
          {before}
          <span className="text-amber-600 underline decoration-amber-300 underline-offset-4 tracking-widest mx-1">{'_'.repeat(puzzle.answer.length)}</span>
          {after}
        </p>
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        {slots.map((slot, idx) => (
          <button
            key={idx}
            onClick={() => removeSlot(idx)}
            style={{ width: 60, height: 64 }}
            className={`rounded-2xl flex items-center justify-center text-xl font-display font-black transition-all cursor-pointer ${slotStyle(slot, idx)}`}
          >
            {slot.letter ?? ''}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        {pool.map((item) => (
          <button
            key={item.id}
            onClick={() => placeLetter(item)}
            disabled={item.used}
            style={{ width: 60, height: 60 }}
            className={`rounded-2xl text-2xl font-display font-black shadow-sm transition-all ${
              item.used ? 'bg-amber-100 text-amber-200 opacity-50 cursor-not-allowed' : 'bg-amber-400 hover:bg-amber-500 text-white cursor-pointer active:scale-95'
            }`}
          >
            {item.letter}
          </button>
        ))}
      </div>

      <div className="flex gap-2 w-full">
        <button onClick={handleHint} className="flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-display font-bold px-4 py-3 rounded-full text-xs">
          <Hand size={14} /> HINT
        </button>
        <button
          onClick={deleteLast}
          disabled={!hasAnyFilled}
          className={`flex items-center justify-center gap-1 px-4 rounded-2xl font-display font-bold text-xs ${
            hasAnyFilled ? 'bg-red-500 hover:bg-red-600 text-white active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
          }`}
        >
          <Delete size={16} />
        </button>
        <button
          onClick={resetPuzzle}
          disabled={!hasAnyFilled}
          className={`flex items-center justify-center gap-1 px-4 rounded-2xl font-display font-bold text-xs ${
            hasAnyFilled ? 'bg-slate-200 hover:bg-slate-300 text-slate-600 active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
          }`}
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={handleCheck}
          disabled={!allFilled}
          className={`flex-1 flex items-center justify-center gap-2 font-display font-bold py-3 rounded-full text-sm ${
            allFilled ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {won ? (
            <>
              <CheckCircle2 size={18} /> CORRECT!
            </>
          ) : (
            'CHECK'
          )}
        </button>
      </div>

      {checked && !won && <p className="text-red-500 font-display font-semibold text-sm">Not quite — tap a letter to remove it and try again!</p>}

      {won && (
        <div className="w-full bg-emerald-50 border-2 border-emerald-300 rounded-3xl px-8 py-4 flex flex-col items-center gap-2 anim-fade-up">
          <p className="font-display font-black text-emerald-700">🎉 The word was {puzzle.answer}!</p>
          <button onClick={nextPuzzle} className="bg-amber-400 hover:bg-amber-500 text-white font-display font-bold py-2.5 px-8 rounded-full text-sm">
            Next →
          </button>
        </div>
      )}
    </div>
  );
};
