import React, { useState } from 'react';
import { Star, CheckCircle, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

/* Ported from EducationAI-Games-master's Grade4 "PictureMatch" (reading
   comprehension — sentence to matching picture) and restyled to this app's
   Adventure Island look. The source used 14 illustration PNGs; rebuilt here
   with emoji instead, since every other Batch1 game is emoji-only (no
   image-asset pipeline exists for Batch1). Class 2 gets simple single
   sentences; Class 3 gets subtler distractors, via params.questions. No
   curriculum_chapters row exists yet for Class 2/3 English reading beyond
   phonics, so this ships as an ungrouped skill game (chapter_ref = null). */

interface PictureOption { emoji: string; label: string; distractor?: string }
interface PictureQuestion { text: string; correctIdx: number; options: PictureOption[] }
interface PictureClueGame {
  gameId: string;
  name: string;
  icon: string;
  params: { questions?: PictureQuestion[] };
}
interface PictureClueEngineProps {
  game: PictureClueGame;
  isPreReader: boolean;
  onFinish: (gameId: string, stars: number, score: number) => void;
}

const FALLBACK_QUESTIONS: PictureQuestion[] = [
  { text: 'The cat rests on a soft mat.', correctIdx: 0, options: [{ emoji: '🐱', label: 'Cat on a mat' }, { emoji: '🐕', label: 'Dog with a ball', distractor: 'A dog is not a cat — check the subject again.' }, { emoji: '🐔', label: 'Hen near eggs', distractor: 'A hen is a bird, not a cat.' }] },
  { text: 'The dog plays with a round ball.', correctIdx: 1, options: [{ emoji: '🦮', label: 'Dog on a leash', distractor: 'The sentence says "ball", not "leash".' }, { emoji: '🐕', label: 'Dog with a ball' }, { emoji: '🐱', label: 'Cat on a mat', distractor: 'The subject is a dog, not a cat.' }] },
];

function starsForPictureClue(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct >= total - 1) return 2;
  if (correct >= Math.ceil(total / 2)) return 1;
  return 0;
}

export const PictureClueEngine: React.FC<PictureClueEngineProps> = ({ game, isPreReader, onFinish }) => {
  const questions = game.params.questions && game.params.questions.length > 0 ? game.params.questions : FALLBACK_QUESTIONS;

  const [idx, setIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);

  const question = questions[idx];

  function handleSelect(i: number) {
    if (result !== null) return;
    setSelected(i);
    const ok = i === question.correctIdx;
    setResult(ok ? 'correct' : 'wrong');
    if (ok) confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } });
    const newCorrect = correctCount + (ok ? 1 : 0);
    setCorrectCount(newCorrect);
    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        const earned = starsForPictureClue(newCorrect, questions.length);
        setFinished(true);
        onFinish(game.gameId, earned, newCorrect);
        if (earned >= 2) confetti({ particleCount: 80, spread: 60, colors: ['#f59e0b', '#22c55e', '#6366f1'] });
      } else {
        setIdx((n) => n + 1);
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
    const earned = starsForPictureClue(correctCount, questions.length);
    return (
      <div className="flex flex-col items-center gap-5 py-10 anim-fade-up">
        <span className="text-6xl">🏆</span>
        <div className="flex gap-1">{[1, 2, 3].map((n) => (<Star key={n} size={32} className={n <= earned ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />))}</div>
        {!isPreReader && <p className="font-display font-bold text-slate-600 text-sm">{correctCount} / {questions.length} correct</p>}
        <button onClick={handlePlayAgain} className="bg-amber-400 hover:bg-amber-500 text-white font-display font-bold text-sm rounded-full px-8 py-3 shadow-md transition-all cursor-pointer" style={{ minHeight: 48, minWidth: 120 }}>
          🔄 {isPreReader ? '' : 'Play Again'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 max-w-xl mx-auto anim-fade-up">
      <div className="flex gap-2">
        {questions.map((_, i) => (
          <div key={i} className={`w-3.5 h-3.5 rounded-full transition-all ${i < idx ? 'bg-emerald-400' : i === idx ? 'bg-amber-400 scale-125' : 'bg-slate-200'}`} />
        ))}
      </div>

      {!isPreReader && (
        <div className="w-full bg-white rounded-3xl border-2 border-amber-100 shadow-sm px-8 py-5">
          <p className="text-lg font-display font-semibold text-slate-800 text-center leading-relaxed">{question.text}</p>
        </div>
      )}

      <div className="w-full grid grid-cols-3 gap-4">
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correctIdx;
          const isSelected = i === selected;
          let border = 'border-slate-200 bg-white hover:border-amber-300';
          if (result !== null && isSelected && isCorrect) border = 'border-emerald-400 bg-emerald-50';
          else if (result !== null && isSelected && !isCorrect) border = 'border-red-400 bg-red-50';
          else if (result === 'wrong' && isCorrect) border = 'border-emerald-300 bg-emerald-50';
          return (
            <button key={i} onClick={() => handleSelect(i)} disabled={result !== null} className={`relative rounded-2xl border-2 p-4 transition-all flex flex-col items-center gap-2 ${border}`}>
              <span className="text-6xl anim-bob">{opt.emoji}</span>
              {!isPreReader && <span className="text-xs font-semibold text-slate-500 text-center">{opt.label}</span>}
              {result !== null && isSelected && (
                <div className={`absolute top-2 right-2 ${isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isCorrect ? <CheckCircle size={20} /> : <XCircle size={20} />}
                </div>
              )}
              {result === 'wrong' && !isSelected && isCorrect && (
                <div className="absolute top-2 right-2 text-emerald-500"><CheckCircle size={20} /></div>
              )}
            </button>
          );
        })}
      </div>

      {result === 'wrong' && !isPreReader && (
        <div className="w-full bg-red-50 border-2 border-red-300 rounded-2xl px-5 py-3 text-sm font-semibold text-red-600 anim-fade-up">
          💡 {(selected !== null && question.options[selected].distractor) ?? 'Read the sentence again carefully.'}
        </div>
      )}
    </div>
  );
};
