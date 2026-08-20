import React, { useState } from 'react';
import { RotateCcw, Check, Plus, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button, GameFinishScreen, GameProgressDots, T } from '../ui';

/* Ported from EducationAI-Games-master's Grade4 "FractionPie" builder
   and restyled to this app's Adventure Island look — amber palette,
   font-display, rounded-3xl cards — instead of the source's own blue
   theme + standalone header/level-tabs (difficulty now comes from the
   seeded params.challenges list, matching this class's chapter). */

interface FractionChallenge {
  num: number;
  den: number;
}
interface FractionPieGame {
  gameId: string;
  name: string;
  icon: string;
  params: { challenges?: FractionChallenge[] };
}
interface FractionPieEngineProps {
  game: FractionPieGame;
  isPreReader: boolean;
  onFinish: (gameId: string, stars: number, score: number) => void;
}

const FALLBACK_CHALLENGES: FractionChallenge[] = [
  { num: 1, den: 2 },
  { num: 1, den: 4 },
  { num: 2, den: 3 },
  { num: 3, den: 4 },
  { num: 5, den: 4 },
];

interface Pie {
  id: number;
  shaded: Set<number>;
}

const CX = 90;
const CY = 90;
const R = 80;

function polarToXY(deg: number, r = R) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function slicePath(idx: number, total: number): string {
  if (total === 1) return `M ${CX} ${CY} m -${R} 0 a ${R} ${R} 0 1 1 0 0.001 Z`;
  const sweep = 360 / total;
  const s = polarToXY(sweep * idx);
  const e = polarToXY(sweep * (idx + 1));
  const large = sweep > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y} Z`;
}

function newPie(id: number): Pie {
  return { id, shaded: new Set() };
}

function starsForFractionPie(mistakes: number): number {
  if (mistakes === 0) return 3;
  if (mistakes <= 2) return 2;
  return 1;
}

let pieIdCounter = 0;

export const FractionPieEngine: React.FC<FractionPieEngineProps> = ({ game, isPreReader, onFinish }) => {
  const challenges = game.params.challenges && game.params.challenges.length > 0 ? game.params.challenges : FALLBACK_CHALLENGES;

  const [chalIdx, setChalIdx] = useState(0);
  const [pies, setPies] = useState<Pie[]>(() => [newPie(pieIdCounter++)]);
  const [slices, setSlices] = useState(challenges[0].den);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);

  const challenge = challenges[chalIdx];
  const { num, den } = challenge;
  const totalShaded = pies.reduce((sum, p) => sum + p.shaded.size, 0);
  const isLast = chalIdx === challenges.length - 1;

  function reset(newDen?: number) {
    setPies([newPie(pieIdCounter++)]);
    setSlices(newDen ?? den);
    setResult(null);
    setSubmitted(false);
  }

  function addPie() {
    if (submitted) return;
    setPies((prev) => [...prev, newPie(pieIdCounter++)]);
  }

  function removePie(id: number) {
    if (submitted || pies.length <= 1) return;
    setPies((prev) => prev.filter((p) => p.id !== id));
  }

  function toggleSlice(pieId: number, sliceIdx: number) {
    if (submitted) return;
    setPies((prev) =>
      prev.map((p) => {
        if (p.id !== pieId) return p;
        const next = new Set(p.shaded);
        if (next.has(sliceIdx)) next.delete(sliceIdx);
        else next.add(sliceIdx);
        return { ...p, shaded: next };
      }),
    );
  }

  function onSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value);
    setSlices(val);
    setPies((prev) => prev.map((p) => ({ ...p, shaded: new Set() })));
    setResult(null);
    setSubmitted(false);
  }

  function checkAnswer() {
    const ok = slices === den && totalShaded === num;
    setResult(ok ? 'correct' : 'wrong');
    setSubmitted(true);
    if (ok) {
      confetti({ particleCount: 40, spread: 40, origin: { y: 0.7 } });
    } else {
      setMistakes((m) => m + 1);
    }
  }

  function nextChallenge() {
    if (isLast) {
      const earned = starsForFractionPie(mistakes);
      setFinished(true);
      onFinish(game.gameId, earned, challenges.length);
      if (earned >= 2) confetti({ particleCount: 80, spread: 60, colors: ['#f59e0b', '#22c55e', '#6366f1'] });
      return;
    }
    const next = chalIdx + 1;
    setChalIdx(next);
    reset(challenges[next].den);
  }

  function handlePlayAgain() {
    setChalIdx(0);
    setMistakes(0);
    setFinished(false);
    reset(challenges[0].den);
  }

  if (finished) {
    const earned = starsForFractionPie(mistakes);
    return <GameFinishScreen earned={earned} onPlayAgain={handlePlayAgain} />;
  }

  return (
    <div className="flex flex-col items-center gap-5 anim-fade-up max-w-3xl mx-auto">
      <GameProgressDots total={challenges.length} current={chalIdx} />

      {/* Target */}
      <div className="flex flex-col items-center gap-1 px-8 py-4" style={{ borderRadius: T.radius.md, background: T.surface.sunk }}>
        {!isPreReader && <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#DB9A00' }}>Build this fraction</span>}
        <div className="text-3xl font-display font-black flex flex-col items-center leading-none" style={{ color: T.ink.strong }}>
          <span className="border-b-2 px-2 pb-1" style={{ borderColor: T.ink.strong }}>{num}</span>
          <span className="px-2 pt-1">{den}</span>
        </div>
      </div>

      <div className="w-full flex flex-col lg:flex-row gap-5 items-start">
        {/* Controls */}
        <div className="flex flex-col gap-3 w-full lg:w-64 shrink-0">
          <div className="bg-white p-4" style={{ borderRadius: T.radius.sm, boxShadow: T.shadow.card }}>
            <p className="text-[10px] font-black tracking-widest uppercase mb-1" style={{ color: T.ink.faint }}>Your build</p>
            <div className="text-2xl font-display font-black flex flex-col items-center leading-none w-fit" style={{ color: T.ink.strong }}>
              <span className="border-b-2 px-2 pb-0.5" style={{ borderColor: T.ink.strong }}>{totalShaded}</span>
              <span className="px-2 pt-0.5">{slices}</span>
            </div>
          </div>

          <div className="p-4" style={{ borderRadius: T.radius.sm, background: T.surface.sunk }}>
            <p className="text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: T.ink.muted }}>Slices (denominator)</p>
            <input type="range" min={2} max={8} value={slices} onChange={onSliderChange} className="w-full accent-amber-500 cursor-pointer" />
          </div>

          <div className="flex gap-2">
            <Button tone="quiet" onClick={() => reset()} className="flex-1 text-xs px-3" icon={<RotateCcw size={13} />}>
              Reset
            </Button>
            <Button tone="primary" onClick={checkAnswer} className="flex-1 text-xs px-3" icon={<Check size={13} />}>
              Check
            </Button>
          </div>

          {result === 'correct' && (
            <div className="px-4 py-3 text-center anim-fade-up" style={{ borderRadius: T.radius.sm, background: '#EAFBF0', border: '2px solid #A8E8BC' }}>
              <p className="font-display font-black text-sm" style={{ color: '#1B7F41' }}>🎉 Correct!</p>
              <div className="mt-2 flex justify-center">
                <Button tone="amber" onClick={nextChallenge} className="text-xs px-4">
                  {isLast ? 'Finish' : 'Next →'}
                </Button>
              </div>
            </div>
          )}
          {result === 'wrong' && (
            <div className="px-4 py-3 text-center anim-fade-up" style={{ borderRadius: T.radius.sm, background: '#FDEDEC', border: '2px solid #F5B3AD' }}>
              <p className="font-display font-black text-sm" style={{ color: '#B23930' }}>Not quite!</p>
              <p className="text-[11px] mt-1" style={{ color: '#C0362E' }}>{slices !== den ? `Slider should be at ${den}.` : `You shaded ${totalShaded} — need ${num}.`}</p>
              <div className="mt-2 flex justify-center">
                <Button tone="quiet" onClick={() => reset()} className="text-xs px-4">Try Again</Button>
              </div>
            </div>
          )}
        </div>

        {/* Pies */}
        <div className="flex-1 flex flex-wrap gap-4 items-start">
          {pies.map((pie) => (
            <div key={pie.id} className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <svg width={140} height={140} viewBox="0 0 180 180" className="drop-shadow-sm rounded-full">
                  <circle cx={CX} cy={CY} r={R} fill="#FEF3E2" stroke="#FCD9A8" strokeWidth={1.5} />
                  {Array.from({ length: slices }, (_, i) => (
                    <path
                      key={i}
                      d={slicePath(i, slices)}
                      fill={pie.shaded.has(i) ? '#F97316' : '#FFF8EE'}
                      stroke="#FCD9A8"
                      strokeWidth={2}
                      className={submitted ? 'cursor-default' : 'cursor-pointer hover:brightness-95'}
                      onClick={() => toggleSlice(pie.id, i)}
                    />
                  ))}
                </svg>
                {!submitted && pies.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePie(pie.id)}
                    aria-label="Remove this pie"
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: '#FDEDEC', color: '#B23930', border: '1px solid #F5B3AD' }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <span className="text-[11px] font-semibold" style={{ color: T.ink.faint }}>
                {pie.shaded.size}/{slices}
              </span>
            </div>
          ))}
          {!submitted && (
            <button
              type="button"
              onClick={addPie}
              className="w-[140px] h-[140px] flex flex-col items-center justify-center gap-1.5 font-display font-bold text-xs"
              style={{ borderRadius: '50%', border: '2px dashed #FCD9A8', background: '#FFF8EE', color: '#DB9A00' }}
            >
              <Plus size={22} />
              Add Pie
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
