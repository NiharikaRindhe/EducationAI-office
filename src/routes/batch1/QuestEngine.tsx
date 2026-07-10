import React, { useCallback, useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import confetti from 'canvas-confetti';

/**
 * QuestEngine — one visual-MCQ engine, many mechanics.
 * `params.generator` picks the round generator (counting, place-value,
 * times-table, equal-share, patterns, measure, clock, calendar, daytime,
 * money, fractions, tally, skip-count, word-match, picture-quiz), so a
 * single component covers every chapter in the catalog. Silent-lab rules:
 * every prompt is picture-first, feedback is motion + color, never text walls.
 */

type Visual =
  | { kind: 'emojis'; text: string }
  | { kind: 'grid'; rows: number; cols: number; emoji: string }
  | { kind: 'clock'; h: number; m: number }
  | { kind: 'coins'; values: number[] }
  | { kind: 'fraction'; num: number; den: number }
  | { kind: 'big'; e: string }
  | { kind: 'text'; text: string }
  | { kind: 'none' };

interface Round {
  visual: Visual;
  prompt: string;
  options: string[];
  answer: number; // index into options
}

interface QuestGame {
  gameId: string;
  name: string;
  icon: string;
  params: Record<string, any>;
}

interface QuestProps {
  game: QuestGame;
  numChoices: number;
  isPreReader: boolean;
  onFinish: (gameId: string, stars: number, score: number) => void;
}

const TOTAL_ROUNDS = 5;
const ri = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(arr: T[]): T => arr[ri(arr.length)];

function shuffleWithAnswer(options: (string | number)[], answerValue: string | number): { options: string[]; answer: number } {
  const strs = options.map(String);
  const shuffled = [...strs].sort(() => Math.random() - 0.5);
  return { options: shuffled, answer: shuffled.indexOf(String(answerValue)) };
}

function numberDistractors(correct: number, count: number, min = 0): number[] {
  const set = new Set<number>([correct]);
  let guard = 0;
  while (set.size < count && guard++ < 60) {
    const offset = ri(7) - 3 || 1;
    const cand = correct + offset;
    if (cand >= min) set.add(cand);
  }
  let extra = 1;
  while (set.size < count) set.add(correct + count + extra++);
  return Array.from(set);
}

/* ── Round generators ─────────────────────────────────────── */

const FRUIT = ['🍎', '🍌', '⭐', '🐟', '🐥', '🌸', '🧁', '⚽'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYTIME_QS = [
  { q: 'When do we see the sun rise? 🌅', o: ['🌅 morning', '🌙 night', '🌆 evening'], a: 0 },
  { q: 'When do we sleep? 😴', o: ['🌙 night', '🌞 noon', '🌅 morning'], a: 0 },
  { q: 'Which comes first in a day?', o: ['🌅 morning', '🌆 evening', '🌙 night'], a: 0 },
  { q: 'When is the sky dark?', o: ['🌙 night', '🌞 noon', '🌅 morning'], a: 0 },
  { q: 'When do we eat breakfast? 🍳', o: ['🌅 morning', '🌙 night', '🌆 evening'], a: 0 },
];
const METRIC_QS = [
  { q: '1 metre = ? centimetres', o: ['100', '10', '1000'], a: 0 },
  { q: '1 kilogram = ? grams', o: ['1000', '100', '10'], a: 0 },
  { q: 'Which is used to measure milk?', o: ['🥛 litres', '📏 metres', '⚖️ kilograms'], a: 0 },
  { q: 'Which is heavier?', o: ['🐘 elephant', '🐱 cat', '🐜 ant'], a: 0 },
  { q: 'Which unit measures your height?', o: ['📏 cm', '🥛 litres', '🕐 hours'], a: 0 },
];
const METRIC_BIG_QS = [
  { q: '1 kilometre = ? metres', o: ['1000', '100', '10'], a: 0 },
  { q: '1 litre = ? millilitres', o: ['1000', '100', '10'], a: 0 },
  { q: 'The distance between cities is measured in…', o: ['🛣️ kilometres', '📏 centimetres', '🥄 millilitres'], a: 0 },
  { q: 'A fence around a field measures its…', o: ['🔲 perimeter', '🎨 colour', '⚖️ weight'], a: 0 },
  { q: 'Half of 1 litre is ? mL', o: ['500', '50', '5'], a: 0 },
];
const LENGTH_PAIRS = [
  { long: '🚌 bus', short: '✏️ pencil' }, { long: '🚂 train', short: '🚲 cycle' },
  { long: '🐍 snake', short: '🐛 caterpillar' }, { long: '🌉 bridge', short: '🪜 ladder' },
  { long: '🦒 giraffe', short: '🐰 rabbit' },
];
const CAPACITY_SETS = [
  { most: '🪣 bucket', rest: ['🥛 glass', '🥄 spoon'] }, { most: '🛁 bathtub', rest: ['🪣 bucket', '🥛 glass'] },
  { most: '🫙 jug', rest: ['🥤 cup', '🥄 spoon'] },
];

function makeRound(gen: string, params: Record<string, any>, numChoices: number): Round {
  switch (gen) {
    case 'counting': {
      const max = Math.min(params.max ?? 10, 20);
      const n = 1 + ri(max);
      const emoji = pick(FRUIT);
      const nums = numberDistractors(n, numChoices, 1);
      const { options, answer } = shuffleWithAnswer(nums, n);
      return { visual: { kind: 'grid', rows: Math.ceil(n / 5), cols: Math.min(n, 5), emoji }, prompt: `How many ${emoji}?`, options, answer };
    }
    case 'place-value': {
      const max = params.max ?? 99;
      if (max <= 99) {
        const v = 10 + ri(max - 9);
        const tens = Math.floor(v / 10);
        const ones = v % 10;
        const nums = numberDistractors(v, numChoices, 1);
        const { options, answer } = shuffleWithAnswer(nums, v);
        return {
          visual: { kind: 'emojis', text: '🔟'.repeat(tens) + (ones ? ' ' + '🔵'.repeat(ones) : '') },
          prompt: `${tens} tens and ${ones} ones make…`,
          options, answer,
        };
      }
      const a = 100 + ri(max - 99);
      let b = 100 + ri(max - 99);
      if (b === a) b = a + 1 + ri(50);
      const bigger = Math.max(a, b);
      const { options, answer } = shuffleWithAnswer([a, b], bigger);
      return { visual: { kind: 'text', text: `${a}   ${b}` }, prompt: 'Tap the BIGGER number!', options, answer };
    }
    case 'skip-count': {
      const step = pick<number>(params.steps ?? [2, 5, 10]);
      const start = step * (1 + ri(3));
      const seq = [start, start + step, start + step * 2];
      const next = start + step * 3;
      const nums = numberDistractors(next, numChoices, 1);
      const { options, answer } = shuffleWithAnswer(nums, next);
      return { visual: { kind: 'text', text: seq.join(',  ') + ',  ?' }, prompt: 'What comes next?', options, answer };
    }
    case 'times-table': {
      const a = pick<number>(params.tables ?? [2, 3, 4, 5]);
      const b = 2 + ri(8);
      const prod = a * b;
      const nums = numberDistractors(prod, numChoices, 1);
      const { options, answer } = shuffleWithAnswer(nums, prod);
      const visual: Visual = a <= 5 && b <= 6 ? { kind: 'grid', rows: a, cols: b, emoji: '⭐' } : { kind: 'text', text: `${a} × ${b} = ?` };
      return { visual, prompt: `${a} × ${b} = ?`, options, answer };
    }
    case 'equal-share': {
      const d = 2 + ri((params.divisorMax ?? 5) - 1);
      const each = 1 + ri(Math.max(1, Math.min(Math.floor((params.maxItems ?? 20) / d), 9)));
      const total = d * each;
      const nums = numberDistractors(each, numChoices, 1);
      const { options, answer } = shuffleWithAnswer(nums, each);
      const visual: Visual = total <= 15 ? { kind: 'emojis', text: '🍪'.repeat(total) } : { kind: 'text', text: `${total} ÷ ${d} = ?` };
      return { visual, prompt: `${total} 🍪 shared by ${d} 🧒 — each gets?`, options, answer };
    }
    case 'patterns': {
      const pools = [['🔴', '🔵'], ['🔺', '🟨'], ['🌸', '🍀'], ['⭐', '🌙'], ['🟦', '🟧', '🟩']];
      const pool = pick(pools);
      const level: number = params.level ?? 1;
      const unit = level >= 3 && pool.length > 2 ? pool : pool.slice(0, 2);
      const patternTypes = level === 1 ? ['AB'] : level === 2 ? ['AB', 'AAB'] : ['AB', 'AAB', 'ABB', 'ABC'];
      const type = pick(patternTypes);
      const seqUnit = type === 'AB' ? [unit[0], unit[1]]
        : type === 'AAB' ? [unit[0], unit[0], unit[1]]
        : type === 'ABB' ? [unit[0], unit[1], unit[1]]
        : [unit[0], unit[1], unit[2] ?? unit[0]];
      const seq: string[] = [];
      while (seq.length < 6) seq.push(seqUnit[seq.length % seqUnit.length]);
      const next = seqUnit[seq.length % seqUnit.length];
      const distinct = Array.from(new Set([...unit, ...pick(pools)])).slice(0, Math.max(numChoices, 2));
      if (!distinct.includes(next)) distinct[0] = next;
      const { options, answer } = shuffleWithAnswer(distinct, next);
      return { visual: { kind: 'text', text: seq.join(' ') + '  ?' }, prompt: 'What comes next?', options, answer };
    }
    case 'measure': {
      const mode = params.mode ?? 'length';
      if (mode === 'metric') { const q = pick(METRIC_QS); return { visual: { kind: 'none' }, prompt: q.q, ...shuffleWithAnswer(q.o, q.o[q.a]) }; }
      if (mode === 'metric-big') { const q = pick(METRIC_BIG_QS); return { visual: { kind: 'none' }, prompt: q.q, ...shuffleWithAnswer(q.o, q.o[q.a]) }; }
      if (mode === 'capacity') {
        const s = pick(CAPACITY_SETS);
        const { options, answer } = shuffleWithAnswer([s.most, ...s.rest], s.most);
        return { visual: { kind: 'none' }, prompt: 'Which holds the MOST water? 💧', options, answer };
      }
      const p = pick(LENGTH_PAIRS);
      const askLong = Math.random() < 0.5;
      const { options, answer } = shuffleWithAnswer([p.long, p.short], askLong ? p.long : p.short);
      return { visual: { kind: 'none' }, prompt: askLong ? 'Which is LONGER? 📏' : 'Which is SHORTER? 📏', options, answer };
    }
    case 'clock': {
      const h = 1 + ri(12);
      const m = params.level === 'minutes' ? pick([0, 15, 30, 45]) : 0;
      const label = `${h}:${m.toString().padStart(2, '0')}`;
      const wrongs = new Set<string>([label]);
      let guard = 0;
      while (wrongs.size < numChoices && guard++ < 40) {
        const wh = 1 + ri(12);
        const wm = params.level === 'minutes' ? pick([0, 15, 30, 45]) : 0;
        wrongs.add(`${wh}:${wm.toString().padStart(2, '0')}`);
      }
      const { options, answer } = shuffleWithAnswer(Array.from(wrongs), label);
      return { visual: { kind: 'clock', h, m }, prompt: 'What time is it? 🕐', options, answer };
    }
    case 'calendar': {
      const i = ri(7);
      const next = DAYS[(i + 1) % 7];
      const wrongSet = new Set<string>([next]);
      while (wrongSet.size < Math.min(numChoices, 4)) wrongSet.add(DAYS[ri(7)]);
      const { options, answer } = shuffleWithAnswer(Array.from(wrongSet), next);
      return { visual: { kind: 'big', e: '📅' }, prompt: `Which day comes after ${DAYS[i]}?`, options, answer };
    }
    case 'money': {
      const maxAmount = params.maxAmount ?? 10;
      const coinSet = maxAmount <= 10 ? [1, 2, 5] : maxAmount <= 100 ? [2, 5, 10, 20] : [10, 20, 50, 100];
      const count = 2 + ri(2);
      const values: number[] = [];
      for (let i = 0; i < count; i++) values.push(pick(coinSet));
      const total = values.reduce((a, b) => a + b, 0);
      const nums = numberDistractors(total, numChoices, 1);
      const { options, answer } = shuffleWithAnswer(nums.map((n) => `₹${n}`), `₹${total}`);
      return { visual: { kind: 'coins', values }, prompt: 'How many rupees in all? 💰', options, answer };
    }
    case 'fractions': {
      const den = pick<number>(params.parts ?? [2, 4]);
      const num = 1 + ri(den - 1);
      const label = `${num}/${den}`;
      const all = ['1/2', '1/4', '3/4', '1/3', '2/3', '2/4'].filter((f) => f !== label);
      const opts = [label, ...all.slice(0, numChoices - 1)];
      const { options, answer } = shuffleWithAnswer(opts, label);
      return { visual: { kind: 'fraction', num, den }, prompt: 'How much is colored? 🎨', options, answer };
    }
    case 'tally': {
      const max = params.max ?? 6;
      const kinds = [pick(FRUIT), pick(['🐟', '🐦', '🐰'])];
      const counts = kinds.map(() => 1 + ri(max));
      const askIdx = ri(kinds.length);
      const rows = kinds.map((k, i) => k.repeat(counts[i])).join('\n');
      const nums = numberDistractors(counts[askIdx], numChoices, 0);
      const { options, answer } = shuffleWithAnswer(nums, counts[askIdx]);
      return { visual: { kind: 'emojis', text: rows }, prompt: `How many ${kinds[askIdx]}?`, options, answer };
    }
    case 'word-match': {
      const words: { w: string; e: string }[] = params.words ?? [{ w: 'sun', e: '☀️' }];
      const target = pick(words);
      const wrongs = words.filter((x) => x.w !== target.w).sort(() => Math.random() - 0.5).slice(0, numChoices - 1);
      const { options, answer } = shuffleWithAnswer([target.w, ...wrongs.map((x) => x.w)], target.w);
      return { visual: { kind: 'big', e: target.e }, prompt: 'Which word is this?', options, answer };
    }
    case 'picture-quiz': {
      const qs: { q: string; o: string[]; a: number }[] = params.questions ?? [];
      const q = qs.length > 0 ? pick(qs) : { q: 'Which one is a star?', o: ['⭐', '🐟', '🍎'], a: 0 };
      const { options, answer } = shuffleWithAnswer(q.o, q.o[q.a]);
      return { visual: { kind: 'none' }, prompt: q.q, options, answer };
    }
    default: {
      const n = 1 + ri(9);
      const { options, answer } = shuffleWithAnswer(numberDistractors(n, numChoices, 1), n);
      return { visual: { kind: 'emojis', text: '⭐'.repeat(n) }, prompt: 'How many ⭐?', options, answer };
    }
  }
}

/* ── Visual renderer ──────────────────────────────────────── */

const ClockFace: React.FC<{ h: number; m: number }> = ({ h, m }) => {
  const hourAngle = ((h % 12) + m / 60) * 30;
  const minAngle = m * 6;
  return (
    <svg width="150" height="150" viewBox="0 0 100 100" role="img" aria-label={`Clock showing ${h}:${m}`}>
      <circle cx="50" cy="50" r="46" fill="#fff" stroke="#17425F" strokeWidth="5" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return <circle key={i} cx={50 + 38 * Math.sin(a)} cy={50 - 38 * Math.cos(a)} r="2.4" fill="#7BA2BC" />;
      })}
      <line x1="50" y1="50" x2={50 + 20 * Math.sin((hourAngle * Math.PI) / 180)} y2={50 - 20 * Math.cos((hourAngle * Math.PI) / 180)}
            stroke="#17425F" strokeWidth="5.5" strokeLinecap="round" />
      <line x1="50" y1="50" x2={50 + 31 * Math.sin((minAngle * Math.PI) / 180)} y2={50 - 31 * Math.cos((minAngle * Math.PI) / 180)}
            stroke="#FF62A5" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="50" cy="50" r="4" fill="#17425F" />
    </svg>
  );
};

const VisualView: React.FC<{ v: Visual }> = ({ v }) => {
  switch (v.kind) {
    case 'emojis':
      return <div className="text-4xl leading-relaxed text-center whitespace-pre-wrap" style={{ letterSpacing: 2 }}>{v.text}</div>;
    case 'grid':
      return (
        <div className="grid gap-1.5 justify-center" style={{ gridTemplateColumns: `repeat(${v.cols}, minmax(0,1fr))` }}>
          {Array.from({ length: v.rows * v.cols }).map((_, i) => (
            <span key={i} className="text-3xl">{v.emoji}</span>
          ))}
        </div>
      );
    case 'clock':
      return <ClockFace h={v.h} m={v.m} />;
    case 'coins':
      return (
        <div className="flex gap-3 flex-wrap justify-center">
          {v.values.map((val, i) => (
            <span key={i}
                  className="w-16 h-16 rounded-full flex items-center justify-center font-display font-black text-lg"
                  style={{ background: 'radial-gradient(circle at 35% 30%, #FFE9A8, #F2B60C 75%)', color: '#7A5200',
                           boxShadow: '0 4px 0 #C28E00, inset 0 0 0 4px #E8AE0B' }}>
              ₹{val}
            </span>
          ))}
        </div>
      );
    case 'fraction': {
      const pct = (v.num / v.den) * 100;
      return (
        <div className="flex items-center justify-center">
          <div className="w-36 h-36 rounded-full"
               style={{ background: `conic-gradient(#FF62A5 0 ${pct}%, #E4EEF8 ${pct}% 100%)`,
                        boxShadow: '0 5px 0 rgba(20,90,140,.18), inset 0 0 0 6px #fff' }} />
        </div>
      );
    }
    case 'big':
      return <div className="text-7xl text-center anim-bob">{v.e}</div>;
    case 'text':
      return <div className="font-display font-black text-3xl text-center tracking-wider" style={{ color: '#17425F' }}>{v.text}</div>;
    default:
      return null;
  }
};

/* ── The engine ───────────────────────────────────────────── */

export const QuestEngine: React.FC<QuestProps> = ({ game, numChoices, isPreReader, onFinish }) => {
  const gen: string = game.params.generator ?? 'counting';

  const [round, setRound] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [current, setCurrent] = useState<Round>(() => makeRound(gen, game.params, numChoices));
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const nextRound = useCallback(() => {
    setSelected(null);
    setCurrent(makeRound(gen, game.params, numChoices));
  }, [gen, game.params, numChoices]);

  useEffect(() => { nextRound(); /* new game -> fresh round */ }, [game.gameId]); // eslint-disable-line react-hooks/exhaustive-deps

  const starsFor = (correct: number) => (correct >= 5 ? 3 : correct >= 4 ? 2 : correct >= 3 ? 1 : 0);

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const isRight = idx === current.answer;
    const newCorrect = correctCount + (isRight ? 1 : 0);
    if (isRight) {
      setCorrectCount(newCorrect);
      confetti({ particleCount: 25, spread: 30, origin: { y: 0.7 } });
    }
    setTimeout(() => {
      if (round + 1 >= TOTAL_ROUNDS) {
        const earned = starsFor(newCorrect);
        setFinished(true);
        onFinish(game.gameId, earned, newCorrect);
        if (earned >= 2) confetti({ particleCount: 80, spread: 60, colors: ['#FFC800', '#55C400', '#1CA5F1'] });
      } else {
        setRound((r) => r + 1);
        nextRound();
      }
    }, isRight ? 1200 : 1800);
  };

  const handlePlayAgain = () => {
    setRound(0);
    setCorrectCount(0);
    setFinished(false);
    nextRound();
  };

  if (finished) {
    const earned = starsFor(correctCount);
    return (
      <div className="flex flex-col items-center gap-5 py-10 anim-fade-up">
        <span className="text-6xl">{earned >= 2 ? '🏆' : '💪'}</span>
        <div className="flex gap-1">
          {[1, 2, 3].map((n) => (
            <Star key={n} size={34} className={n <= earned ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
          ))}
        </div>
        {!isPreReader && (
          <p className="font-display font-bold text-slate-600 text-sm">{correctCount} / {TOTAL_ROUNDS} correct</p>
        )}
        <button
          onClick={handlePlayAgain}
          className="text-white font-display font-black text-sm rounded-2xl px-8 py-3.5 cursor-pointer transition-transform
                     hover:-translate-y-0.5 active:translate-y-0.5"
          style={{ background: 'linear-gradient(180deg,#74DE22,#55C400)', boxShadow: '0 5px 0 #3F9C00' }}
        >
          🔄 {isPreReader ? '' : 'Play Again'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 max-w-lg mx-auto anim-fade-up">
      {/* Progress dots */}
      <div className="flex gap-2">
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
          <div key={i}
               className={`w-3.5 h-3.5 rounded-full transition-all ${
                 i < round ? 'bg-emerald-400' : i === round ? 'bg-amber-400 scale-125' : 'bg-slate-200'}`} />
        ))}
      </div>

      {/* Prompt bubble */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl px-6 py-3 text-center">
        <span className="font-display font-black text-lg" style={{ color: '#8A5B00' }}>{current.prompt}</span>
      </div>

      {/* Visual */}
      {current.visual.kind !== 'none' && (
        <div className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 flex items-center justify-center min-h-[120px]">
          <VisualView v={current.visual} />
        </div>
      )}

      {/* Options */}
      <div className="flex gap-4 flex-wrap justify-center">
        {current.options.map((opt, idx) => {
          const isAnswer = idx === current.answer;
          const isSelected = selected === idx;
          let cls = 'bg-white border-2 border-slate-200 hover:border-amber-300 text-slate-700';
          let style: React.CSSProperties = {};
          if (selected !== null) {
            if (isAnswer) { cls = 'bg-emerald-500 border-2 border-emerald-500 text-white animate-glow-green'; style = { transform: 'scale(1.12)' }; }
            else if (isSelected) cls = 'bg-red-400 border-2 border-red-400 text-white animate-game-shake opacity-60';
            else cls = 'bg-slate-100 border-2 border-slate-100 text-slate-300';
            if (isAnswer && selected !== current.answer) cls += ' animate-pulse-hint';
          }
          const long = opt.length > 4;
          return (
            <button key={idx} onClick={() => handleSelect(idx)} disabled={selected !== null}
                    className={`rounded-2xl font-display font-extrabold flex items-center justify-center transition-all cursor-pointer shadow-sm px-4 ${cls}
                                ${long ? 'text-base min-w-[120px]' : 'text-2xl w-16'}`}
                    style={{ minHeight: 64, ...style }}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};
