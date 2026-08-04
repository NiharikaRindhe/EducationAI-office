import React, { useState, useMemo } from 'react';
import { Star } from 'lucide-react';
import confetti from 'canvas-confetti';

/* Ported from EducationAI-Games-master's Grade4 "FractionCompare" and
   restyled to this app's Adventure Island look — amber/emerald palette,
   font-display, rounded-3xl cards — instead of the source's own blue theme
   + standalone header/level-tabs. Pies are pre-shaded (unlike the source's
   build-it-yourself Level 1/2) since building a fraction is already
   FractionPieEngine's job — this game's own skill is comparing two given
   fractions. Seeded as level 3 of the 'fractions' skill (fraction-pie is
   level 2), so it unlocks once fraction-pie is 2-starred. */

interface FractionPair { a: { num: number; den: number }; b: { num: number; den: number } }
interface FractionCompareGame {
  gameId: string;
  name: string;
  icon: string;
  params: { problems?: FractionPair[] };
}
interface FractionCompareEngineProps {
  game: FractionCompareGame;
  isPreReader: boolean;
  onFinish: (gameId: string, stars: number, score: number) => void;
}

const FALLBACK_PROBLEMS: FractionPair[] = [
  { a: { num: 2, den: 5 }, b: { num: 3, den: 5 } },
  { a: { num: 3, den: 4 }, b: { num: 3, den: 8 } },
  { a: { num: 1, den: 2 }, b: { num: 1, den: 5 } },
  { a: { num: 4, den: 8 }, b: { num: 1, den: 2 } },
  { a: { num: 2, den: 3 }, b: { num: 2, den: 5 } },
];

const PIE_A_COLOR = '#F59E0B';
const PIE_B_COLOR = '#10B981';
const CX = 90, CY = 90, R = 80;

function polarToXY(deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) };
}
function slicePath(idx: number, total: number): string {
  const sweep = 360 / total;
  const s = polarToXY(sweep * idx);
  const e = polarToXY(sweep * (idx + 1));
  const large = sweep > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y} Z`;
}

const PieSVG: React.FC<{ num: number; den: number; color: string }> = ({ num, den, color }) => (
  <svg width={110} height={110} viewBox="0 0 180 180" className="drop-shadow-sm">
    <circle cx={CX} cy={CY} r={R} fill="#FEF3E2" stroke="#FCD9A8" strokeWidth={1.5} />
    {Array.from({ length: den }, (_, i) => (
      <path key={i} d={slicePath(i, den)} fill={i < num ? color : '#FFF8EE'} stroke="#FCD9A8" strokeWidth={2} />
    ))}
  </svg>
);

function starsForCompare(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct >= total - 1) return 2;
  if (correct >= Math.ceil(total / 2)) return 1;
  return 0;
}

export const FractionCompareEngine: React.FC<FractionCompareEngineProps> = ({ game, isPreReader, onFinish }) => {
  const problems = game.params.problems && game.params.problems.length > 0 ? game.params.problems : FALLBACK_PROBLEMS;

  const [idx, setIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selected, setSelected] = useState<'<' | '=' | '>' | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);

  const problem = problems[idx];
  const aVal = problem.a.num / problem.a.den;
  const bVal = problem.b.num / problem.b.den;
  const answer = useMemo(() => (aVal > bVal ? '>' : aVal < bVal ? '<' : '='), [aVal, bVal]);

  function handleSelect(sym: '<' | '=' | '>') {
    if (result !== null) return;
    setSelected(sym);
    const ok = sym === answer;
    setResult(ok ? 'correct' : 'wrong');
    if (ok) confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } });
    const newCorrect = correctCount + (ok ? 1 : 0);
    setCorrectCount(newCorrect);
    setTimeout(() => {
      if (idx + 1 >= problems.length) {
        const earned = starsForCompare(newCorrect, problems.length);
        setFinished(true);
        onFinish(game.gameId, earned, newCorrect);
        if (earned >= 2) confetti({ particleCount: 80, spread: 60, colors: ['#f59e0b', '#22c55e', '#6366f1'] });
      } else {
        setIdx((i) => i + 1);
        setSelected(null);
        setResult(null);
      }
    }, ok ? 1400 : 1900);
  }

  function handlePlayAgain() {
    setIdx(0);
    setCorrectCount(0);
    setFinished(false);
    setSelected(null);
    setResult(null);
  }

  if (finished) {
    const earned = starsForCompare(correctCount, problems.length);
    return (
      <div className="flex flex-col items-center gap-5 py-10 anim-fade-up">
        <span className="text-6xl">🏆</span>
        <div className="flex gap-1">{[1, 2, 3].map((n) => (<Star key={n} size={32} className={n <= earned ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />))}</div>
        {!isPreReader && <p className="font-display font-bold text-slate-600 text-sm">{correctCount} / {problems.length} correct</p>}
        <button onClick={handlePlayAgain} className="bg-amber-400 hover:bg-amber-500 text-white font-display font-bold text-sm rounded-full px-8 py-3 shadow-md transition-all cursor-pointer" style={{ minHeight: 48, minWidth: 120 }}>
          🔄 {isPreReader ? '' : 'Play Again'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 max-w-lg mx-auto anim-fade-up">
      <div className="flex gap-2">
        {problems.map((_, i) => (
          <div key={i} className={`w-3.5 h-3.5 rounded-full transition-all ${i < idx ? 'bg-emerald-400' : i === idx ? 'bg-amber-400 scale-125' : 'bg-slate-200'}`} />
        ))}
      </div>

      {!isPreReader && <p className="font-display font-black text-lg text-slate-700">Which is bigger?</p>}

      <div className="flex items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-2 bg-white rounded-3xl border border-slate-100 p-4" style={{ boxShadow: '0 4px 0 rgba(20,90,140,.08)' }}>
          <PieSVG num={problem.a.num} den={problem.a.den} color={PIE_A_COLOR} />
          <span className="font-display font-black text-lg" style={{ color: PIE_A_COLOR }}>{problem.a.num}/{problem.a.den}</span>
        </div>

        <div className="flex flex-col items-center gap-3">
          {(['<', '=', '>'] as const).map((sym) => {
            let cls = 'w-14 h-14 rounded-2xl font-display font-black text-2xl border-2 flex items-center justify-center transition-all ';
            if (result === null) {
              cls += selected === sym ? 'bg-amber-400 text-white border-amber-400 scale-110' : 'bg-white border-slate-200 hover:border-amber-300 text-slate-600 cursor-pointer';
            } else if (sym === answer) {
              cls += 'bg-emerald-500 text-white border-emerald-500 scale-110';
            } else if (sym === selected) {
              cls += 'bg-red-400 text-white border-red-400';
            } else {
              cls += 'bg-white border-slate-200 text-slate-300';
            }
            return (
              <button key={sym} onClick={() => handleSelect(sym)} disabled={result !== null} className={cls}>
                {sym}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-2 bg-white rounded-3xl border border-slate-100 p-4" style={{ boxShadow: '0 4px 0 rgba(20,90,140,.08)' }}>
          <PieSVG num={problem.b.num} den={problem.b.den} color={PIE_B_COLOR} />
          <span className="font-display font-black text-lg" style={{ color: PIE_B_COLOR }}>{problem.b.num}/{problem.b.den}</span>
        </div>
      </div>

      {result && (
        <div className={`w-full rounded-2xl px-6 py-4 font-display font-bold text-center anim-fade-up ${result === 'correct' ? 'bg-emerald-50 border-2 border-emerald-300 text-emerald-700' : 'bg-red-50 border-2 border-red-300 text-red-600'}`}>
          {result === 'correct' ? '🎉 Correct!' : `Not quite — ${problem.a.num}/${problem.a.den} ${answer} ${problem.b.num}/${problem.b.den}`}
        </div>
      )}
    </div>
  );
};
