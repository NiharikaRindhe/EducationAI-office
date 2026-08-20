import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button, GameFinishScreen, GameProgressDots, T } from '../ui';

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
    return <GameFinishScreen earned={earned} onPlayAgain={handlePlayAgain} />;
  }

  const allFilled = slots.every(Boolean);

  return (
    <div className="flex flex-col items-center gap-5 max-w-xl mx-auto anim-fade-up">
      <GameProgressDots total={stories.length} current={idx} />

      {!isPreReader && <p className="font-display font-black text-lg" style={{ color: T.ink.strong }}>{story.title}</p>}

      <div className={`w-full grid gap-3 ${slots.length <= 3 ? 'grid-cols-3' : 'grid-cols-4'} ${shake ? 'animate-game-shake' : ''}`}>
        {slots.map((tileId, i) => {
          const tile = tileId ? tileById(tileId) : null;
          const color = tileId ? colorFor(tileId) : null;
          const isWrongSlot = result === 'wrong' && tileId && slots[i] !== story.correctOrder[i];
          return (
            <button
              key={i}
              type="button"
              onClick={() => placeInSlot(i)}
              className="relative min-h-[100px] transition-all flex flex-col items-center justify-center p-3"
              style={{
                borderRadius: T.radius.sm,
                borderWidth: 2,
                borderStyle: tile ? 'solid' : 'dashed',
                ...(result === 'correct' && tile
                  ? { background: '#EAFBF0', borderColor: '#3FCB6E' }
                  : isWrongSlot
                    ? { background: '#FDEDEC', borderColor: '#F0554C' }
                    : tile
                      ? { background: color!.bg, borderColor: color!.border }
                      : { borderColor: T.surface.line, background: '#FFFFFF' }),
              }}
            >
              <span className="absolute top-2 left-3 text-xs font-display font-black" style={{ color: tile ? color!.text : T.ink.faint, opacity: tile ? 0.5 : 1 }}>{i + 1}</span>
              {tile ? (
                <p className="text-sm font-display font-semibold text-center leading-snug mt-2" style={{ color: color!.text }}>{tile.text}</p>
              ) : (
                <span className="text-2xl font-black" style={{ color: T.surface.line }}>{i + 1}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="w-full bg-white p-4" style={{ borderRadius: T.radius.sm, boxShadow: T.shadow.card }}>
        {!isPreReader && <p className="text-[10px] font-display font-black tracking-widest mb-2 uppercase" style={{ color: T.ink.faint }}>Sentence Pool</p>}
        <div className="grid grid-cols-1 gap-2">
          {pool.length === 0 && <span className="text-sm font-semibold text-center py-2" style={{ color: T.ink.faint }}>All placed — press Check!</span>}
          {pool.map((id) => {
            const tile = tileById(id);
            const color = colorFor(id);
            const isPicked = picked === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => tapPoolTile(id)}
                className={`px-4 py-2.5 text-sm font-display font-semibold text-left transition-all ${isPicked ? 'ring-2 ring-offset-1 ring-amber-400 scale-[1.02]' : ''}`}
                style={{ borderRadius: T.radius.sm, border: `2px solid ${color.border}`, background: color.bg, color: color.text, minHeight: T.tap }}
              >
                {tile.text}
              </button>
            );
          })}
        </div>
      </div>

      {result === null && (
        <Button tone="amber" onClick={checkAnswer} disabled={!allFilled} icon={<CheckCircle2 size={18} />}>
          Check!
        </Button>
      )}

      {result === 'correct' && (
        <div className="w-full px-6 py-4 font-display font-bold text-center anim-fade-up" style={{ borderRadius: T.radius.sm, background: '#EAFBF0', border: '2px solid #A8E8BC', color: '#1B7F41' }}>
          🎉 Perfect order!
          <div className="mt-3 flex justify-center">
            <Button tone="primary" onClick={nextStory}>
              {idx + 1 >= stories.length ? 'Finish' : 'Next Story →'}
            </Button>
          </div>
        </div>
      )}
      {result === 'wrong' && (
        <div className="w-full px-6 py-4 font-display font-bold text-center anim-fade-up" style={{ borderRadius: T.radius.sm, background: '#FDEDEC', border: '2px solid #F5B3AD', color: '#B23930' }}>
          Not quite — check the order again!
          <div className="mt-3 flex justify-center">
            <Button tone="quiet" onClick={tryAgain}>Try Again</Button>
          </div>
        </div>
      )}
    </div>
  );
};
