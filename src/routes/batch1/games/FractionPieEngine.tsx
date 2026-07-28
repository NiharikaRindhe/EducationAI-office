import React, { useState } from 'react';
import { RotateCcw, Check, Plus, Trash2, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

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
          🔄 {isPreReader ? '' : 'Play Again'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 anim-fade-up max-w-3xl mx-auto">
      {/* Progress dots */}
      <div className="flex gap-2">
        {challenges.map((_, i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full transition-all ${
              i < chalIdx ? 'bg-emerald-400' : i === chalIdx ? 'bg-amber-400 scale-125' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Target */}
      <div className="flex flex-col items-center gap-1 bg-amber-50/60 border border-amber-100 rounded-3xl px-8 py-4">
        <span className="text-[10px] font-black tracking-widest uppercase text-amber-500">Build this fraction</span>
        <div className="text-3xl font-display font-black text-slate-700 flex flex-col items-center leading-none">
          <span className="border-b-2 border-slate-700 px-2 pb-1">{num}</span>
          <span className="px-2 pt-1">{den}</span>
        </div>
      </div>

      <div className="w-full flex flex-col lg:flex-row gap-5 items-start">
        {/* Controls */}
        <div className="flex flex-col gap-3 w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-100 p-4" style={{ boxShadow: '0 3px 0 rgba(20,90,140,.06)' }}>
            <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-1">Your build</p>
            <div className="text-2xl font-display font-black text-slate-700 flex flex-col items-center leading-none w-fit">
              <span className="border-b-2 border-slate-700 px-2 pb-0.5">{totalShaded}</span>
              <span className="px-2 pt-0.5">{slices}</span>
            </div>
          </div>

          <div className="bg-amber-50/60 rounded-2xl border border-amber-100 p-4">
            <p className="text-[10px] font-black tracking-widest uppercase text-slate-500 mb-2">Slices (denominator)</p>
            <input type="range" min={2} max={8} value={slices} onChange={onSliderChange} className="w-full accent-amber-500 cursor-pointer" />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => reset()}
              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-display font-bold text-xs px-3 py-2.5 rounded-2xl"
            >
              <RotateCcw size={13} /> Reset
            </button>
            <button
              onClick={checkAnswer}
              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-display font-bold text-xs px-3 py-2.5 rounded-2xl"
            >
              <Check size={13} /> Check
            </button>
          </div>

          {result === 'correct' && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl px-4 py-3 text-center anim-fade-up">
              <p className="text-emerald-700 font-display font-black text-sm">🎉 Correct!</p>
              <button onClick={nextChallenge} className="mt-2 bg-amber-400 hover:bg-amber-500 text-white font-display font-bold px-4 py-1.5 rounded-full text-xs">
                {isLast ? 'Finish' : 'Next →'}
              </button>
            </div>
          )}
          {result === 'wrong' && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl px-4 py-3 text-center anim-fade-up">
              <p className="text-red-600 font-display font-black text-sm">Not quite!</p>
              <p className="text-red-400 text-[11px] mt-1">{slices !== den ? `Slider should be at ${den}.` : `You shaded ${totalShaded} — need ${num}.`}</p>
              <button onClick={() => reset()} className="mt-2 bg-red-100 hover:bg-red-200 text-red-600 font-display font-bold px-4 py-1.5 rounded-full text-xs">
                Try Again
              </button>
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
                    onClick={() => removePie(pie.id)}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 text-red-500 flex items-center justify-center border border-red-200"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-semibold">
                {pie.shaded.size}/{slices}
              </span>
            </div>
          ))}
          {!submitted && (
            <button
              onClick={addPie}
              className="w-[140px] h-[140px] rounded-full border-2 border-dashed border-amber-300 bg-amber-50 hover:bg-amber-100 flex flex-col items-center justify-center gap-1.5 text-amber-500 font-display font-bold text-xs"
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
