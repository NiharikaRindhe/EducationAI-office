import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameFinishScreen, GameOption, GameOptionState, GameProgressDots, Pic, T } from '../ui';

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
      <GameFinishScreen
        earned={earned}
        scoreLabel={isPreReader ? undefined : `${correctCount} of ${questions.length} correct`}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 max-w-xl mx-auto anim-fade-up">
      <GameProgressDots total={questions.length} current={idx} />

      {!isPreReader && (
        <div className="w-full bg-white px-8 py-5" style={{ borderRadius: T.radius.md, boxShadow: T.shadow.card }}>
          <p className="text-lg font-display font-semibold text-center leading-relaxed" style={{ color: T.ink.strong }}>{question.text}</p>
        </div>
      )}

      <div className="w-full grid grid-cols-3 gap-4">
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correctIdx;
          const isSelected = i === selected;
          let state: GameOptionState = 'idle';
          if (result !== null) {
            if (isSelected) state = isCorrect ? 'correct' : 'wrong';
            else if (isCorrect) state = 'correct';
            else state = 'dimmed';
          }
          return (
            <GameOption
              key={i}
              state={state}
              disabled={result !== null}
              onClick={() => handleSelect(i)}
              className="relative p-4 flex flex-col items-center gap-2"
            >
              <Pic emoji={opt.emoji} size={60} className="anim-bob" />
              {!isPreReader && <span className="text-xs font-semibold text-center opacity-90">{opt.label}</span>}
              {result !== null && isSelected && (
                <div className="absolute top-2 right-2 text-white">
                  {isCorrect ? <CheckCircle size={20} /> : <XCircle size={20} />}
                </div>
              )}
              {result === 'wrong' && !isSelected && isCorrect && (
                <div className="absolute top-2 right-2 text-white"><CheckCircle size={20} /></div>
              )}
            </GameOption>
          );
        })}
      </div>

      {result === 'wrong' && !isPreReader && (
        <div
          className="w-full px-5 py-3 text-sm font-semibold anim-fade-up"
          style={{ borderRadius: T.radius.sm, border: '2px solid #F5B3AD', background: '#FDEDEC', color: '#B23930' }}
        >
          💡 {(selected !== null && question.options[selected].distractor) ?? 'Read the sentence again carefully.'}
        </div>
      )}
    </div>
  );
};
