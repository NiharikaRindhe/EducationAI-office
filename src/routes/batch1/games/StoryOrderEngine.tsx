import React, { useState } from 'react';
import { Star, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

/* Ported from EducationAI-Games-master's Grade4 "SequencingTiles" and
   restyled to this app's Adventure Island look — amber/emerald palette,
   font-display, rounded-3xl cards — instead of the source's own multi-color
   theme + standalone header/level-tabs. Tap-to-place only (drag-drop
   dropped to stay touch-first like the rest of Batch1). Class 3 gets
   stories with explicit sequence words (first/next/finally); Class 4 gets
   implicit cause-and-effect stories, via params.stories. No
   curriculum_chapters row exists yet for Class 3/4 English, so this ships
   as an ungrouped skill game (chapter_ref = null). */

interface StoryTile { id: string; text: string }
interface Story { title: string; tiles: StoryTile[]; correctOrder: string[] }
interface StoryOrderGame {
  gameId: string;
  name: string;
  icon: string;
  params: { stories?: Story[] };
}
interface StoryOrderEngineProps {
  game: StoryOrderGame;
  isPreReader: boolean;
  onFinish: (gameId: string, stars: number, score: number) => void;
}

const TILE_COLORS = [
  { bg: '#FEF3E2', border: '#FCD9A8', text: '#B45309' },
  { bg: '#DCFCE7', border: '#86EFAC', text: '#15803D' },
  { bg: '#DBEAFE', border: '#93C5FD', text: '#1D4ED8' },
  { bg: '#F3E8FF', border: '#D8B4FE', text: '#7E22CE' },
];

const FALLBACK_STORIES: Story[] = [
  {
    title: 'The Bird House',
    tiles: [
      { id: 'A', text: 'Finally, a little blue bird flew inside.' },
      { id: 'B', text: 'First, Tim painted the wooden bird house.' },
      { id: 'C', text: 'Next, he hung it up on a tall tree branch.' },
    ],
    correctOrder: ['B', 'C', 'A'],
  },
];

function starsForStoryOrder(mistakes: number): number {
  if (mistakes === 0) return 3;
  if (mistakes <= 1) return 2;
  return 1;
}

export const StoryOrderEngine: React.FC<StoryOrderEngineProps> = ({ game, isPreReader, onFinish }) => {
  const stories = game.params.stories && game.params.stories.length > 0 ? game.params.stories : FALLBACK_STORIES;

  const [idx, setIdx] = useState(0);
  const [slots, setSlots] = useState<(string | null)[]>(() => Array(stories[0].tiles.length).fill(null));
  const [pool, setPool] = useState<string[]>(() => stories[0].tiles.map((t) => t.id));
  const [picked, setPicked] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);
  const [shake, setShake] = useState(false);

  const story = stories[idx];
  const tileById = (id: string) => story.tiles.find((t) => t.id === id)!;
  const colorFor = (id: string) => TILE_COLORS[story.tiles.findIndex((t) => t.id === id) % TILE_COLORS.length];

  function placeInSlot(slotIdx: number) {
    if (result !== null) return;
    if (picked) {
      setSlots((prev) => prev.map((s, i) => (i === slotIdx ? picked : s)));
      setPool((prev) => prev.filter((id) => id !== picked));
      setPicked(null);
    } else if (slots[slotIdx]) {
      const id = slots[slotIdx]!;
      setSlots((prev) => prev.map((s, i) => (i === slotIdx ? null : s)));
      setPool((prev) => [...prev, id]);
    }
  }

  function tapPoolTile(id: string) {
    if (result !== null) return;
    setPicked((prev) => (prev === id ? null : id));
  }

  function checkAnswer() {
    if (slots.some((s) => !s)) return;
    const ok = story.correctOrder.every((id, i) => slots[i] === id);
    if (ok) {
      setResult('correct');
      confetti({ particleCount: 40, spread: 40, origin: { y: 0.7 } });
    } else {
      setResult('wrong');
      setMistakes((m) => m + 1);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  }

  function tryAgain() {
    setSlots(Array(story.tiles.length).fill(null));
    setPool(story.tiles.map((t) => t.id));
    setResult(null);
    setPicked(null);
  }

  function nextStory() {
    if (idx + 1 >= stories.length) {
      const earned = starsForStoryOrder(mistakes);
      setFinished(true);
      onFinish(game.gameId, earned, stories.length);
      if (earned >= 2) confetti({ particleCount: 80, spread: 60, colors: ['#f59e0b', '#22c55e', '#6366f1'] });
      return;
    }
    const next = idx + 1;
    setIdx(next);
    setSlots(Array(stories[next].tiles.length).fill(null));
    setPool(stories[next].tiles.map((t) => t.id));
    setResult(null);
    setPicked(null);
  }

  function handlePlayAgain() {
    setIdx(0);
    setMistakes(0);
    setFinished(false);
    setSlots(Array(stories[0].tiles.length).fill(null));
    setPool(stories[0].tiles.map((t) => t.id));
    setResult(null);
    setPicked(null);
  }

  if (finished) {
    const earned = starsForStoryOrder(mistakes);
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

  const allFilled = slots.every(Boolean);

  return (
    <div className="flex flex-col items-center gap-5 max-w-xl mx-auto anim-fade-up">
      <div className="flex gap-2">
        {stories.map((_, i) => (
          <div key={i} className={`w-3.5 h-3.5 rounded-full transition-all ${i < idx ? 'bg-emerald-400' : i === idx ? 'bg-amber-400 scale-125' : 'bg-slate-200'}`} />
        ))}
      </div>

      {!isPreReader && <p className="font-display font-black text-lg text-slate-700">{story.title}</p>}

      <div className={`w-full grid gap-3 ${slots.length <= 3 ? 'grid-cols-3' : 'grid-cols-4'} ${shake ? 'animate-game-shake' : ''}`}>
        {slots.map((tileId, i) => {
          const tile = tileId ? tileById(tileId) : null;
          const color = tileId ? colorFor(tileId) : null;
          const isWrongSlot = result === 'wrong' && tileId && slots[i] !== story.correctOrder[i];
          return (
            <button
              key={i}
              onClick={() => placeInSlot(i)}
              className="relative min-h-[100px] rounded-2xl border-2 transition-all flex flex-col items-center justify-center p-3"
              style={
                result === 'correct' && tile
                  ? { background: '#DCFCE7', borderColor: '#34D399' }
                  : isWrongSlot
                    ? { background: '#FEF2F2', borderColor: '#FCA5A5' }
                    : tile
                      ? { background: color!.bg, borderColor: color!.border }
                      : { borderStyle: 'dashed', borderColor: '#CBD5E1', background: 'white' }
              }
            >
              <span className={`absolute top-2 left-3 text-xs font-display font-black ${tile ? 'opacity-30' : 'text-slate-300'}`}>{i + 1}</span>
              {tile ? (
                <p className="text-sm font-display font-semibold text-center leading-snug mt-2" style={{ color: color!.text }}>{tile.text}</p>
              ) : (
                <span className="text-slate-200 text-2xl font-black">{i + 1}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        {!isPreReader && <p className="text-[10px] font-display font-black tracking-widest text-slate-400 mb-2 uppercase">Sentence Pool</p>}
        <div className="grid grid-cols-1 gap-2">
          {pool.length === 0 && <span className="text-sm text-slate-300 font-semibold text-center py-2">All placed — press Check!</span>}
          {pool.map((id) => {
            const tile = tileById(id);
            const color = colorFor(id);
            const isPicked = picked === id;
            return (
              <button
                key={id}
                onClick={() => tapPoolTile(id)}
                className={`rounded-xl border-2 px-4 py-2.5 text-sm font-display font-semibold text-left transition-all ${isPicked ? 'ring-2 ring-offset-1 ring-amber-400 scale-[1.02]' : ''}`}
                style={{ background: color.bg, borderColor: color.border, color: color.text }}
              >
                {tile.text}
              </button>
            );
          })}
        </div>
      </div>

      {result === null && (
        <button onClick={checkAnswer} disabled={!allFilled} className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-display font-bold px-8 py-3 rounded-full shadow-md transition-all">
          <CheckCircle2 size={18} /> Check!
        </button>
      )}

      {result === 'correct' && (
        <div className="w-full bg-emerald-50 border-2 border-emerald-300 rounded-2xl px-6 py-4 font-display font-bold text-center text-emerald-700 anim-fade-up">
          🎉 Perfect order!
          <button onClick={nextStory} className="mt-2 block mx-auto bg-emerald-500 hover:bg-emerald-600 text-white font-display font-bold px-6 py-2 rounded-full text-sm">
            {idx + 1 >= stories.length ? 'Finish' : 'Next Story →'}
          </button>
        </div>
      )}
      {result === 'wrong' && (
        <div className="w-full bg-red-50 border-2 border-red-300 rounded-2xl px-6 py-4 font-display font-bold text-center text-red-600 anim-fade-up">
          Not quite — check the order again!
          <button onClick={tryAgain} className="mt-2 block mx-auto bg-white border border-slate-200 text-slate-600 font-bold py-1.5 px-5 rounded-full text-sm hover:bg-slate-50">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};
