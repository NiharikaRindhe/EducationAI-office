import React, { useCallback, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { GameFinishScreen, GameOption, GameOptionState, GameProgressDots, Pic, T } from './ui';

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

/**
 * Tuning knobs read from `games_catalog.params` (a JSONB column), so every key
 * is optional and each generator below reads only the ones it understands.
 * `level` is deliberately `number | string`: the pattern generator grades
 * difficulty numerically while the clock generator uses it as a mode flag.
 */
export interface QuestParams {
  generator?: string;
  max?: number;
  steps?: number[];
  tables?: number[];
  divisorMax?: number;
  maxItems?: number;
  level?: number | string;
  mode?: string;
  maxAmount?: number;
  parts?: number[];
  words?: { w: string; e: string }[];
  questions?: { q: string; o: string[]; a: number }[];
}

interface QuestGame {
  gameId: string;
  name: string;
  icon: string;
  params: QuestParams;
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
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

const PICTURE_NAMES: Record<string, string> = {
  '🔴': 'red circle', '🔵': 'blue circle', '🔺': 'red triangle', '🟨': 'yellow square',
  '🌸': 'flower', '🍀': 'clover', '⭐': 'star', '🌙': 'moon',
  '🟦': 'blue square', '🟧': 'orange square', '🟩': 'green square',
  '🌱': 'plant', '🐟': 'fish', '🪨': 'stone', '🍃': 'leaf',
  '🥚': 'egg', '🧱': 'brick', '🌻': 'flower', '🐚': 'shell', '🥾': 'boot',
  '⬆️': 'up', '⬇️': 'down', '➡️': 'right', '⬅️': 'left',
  '👨‍👩‍👧': 'family', '🚗': 'car', '🌳': 'tree',
};

const PICTURE_LABEL_PALETTE: Record<GameOptionState, { bg: string; color: string; border: string; shadow: string }> = {
  idle: { bg: '#FFFFFF', color: T.ink.strong, border: T.surface.line, shadow: '0 3px 0 rgba(20,90,140,.10)' },
  correct: { bg: '#3FCB6E', color: '#FFFFFF', border: 'transparent', shadow: '0 3px 0 #2E9E54' },
  wrong: { bg: '#F0554C', color: '#FFFFFF', border: 'transparent', shadow: '0 3px 0 #C33F38' },
  dimmed: { bg: T.surface.sunk, color: T.ink.faint, border: T.surface.line, shadow: 'none' },
};

/**
 * Catalog answer choices use a compact `"emoji label"` string. Rendering the
 * whole value as text made the picture only 16px in labelled choices (the
 * giraffe/rabbit measurement round is the clearest example). Split just the
 * leading picture so it can use the same large, artwork-aware `<Pic>` path as
 * the rest of the child UI. Numbers, fractions and ordinary words stay text.
 */
function splitOptionPicture(option: string): { emoji: string; label: string } | null {
  const [first = '', ...rest] = option.trim().split(/\s+/);
  const isPicture = /^(?:\p{Extended_Pictographic}|[\u2190-\u2BFF])(?:\uFE0F|\u200D|\p{Emoji_Modifier}|\p{Extended_Pictographic}|[\u2190-\u2BFF])*$/u.test(first);
  if (!isPicture) return null;
  return { emoji: first, label: rest.join(' ') || PICTURE_NAMES[first] || 'picture' };
}

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
const METRIC_QS = [
  { q: '1 metre = ? centimetres', o: ['100', '10', '1000'], a: 0 },
  { q: '1 kilogram = ? grams', o: ['1000', '100', '10'], a: 0 },
  { q: 'Which is used to measure milk?', o: ['\u{1F95B} litres', '\u{1F4CF} metres', '\u{2696}\u{FE0F} kilograms'], a: 0 },
  { q: 'Which is heavier?', o: ['\u{1F418} elephant', '\u{1F431} cat', '\u{1F41C} ant'], a: 0 },
  { q: 'Which unit measures your height?', o: ['\u{1F4CF} cm', '\u{1F95B} litres', '\u{1F550} hours'], a: 0 },
  { q: 'Which is used to measure rice?', o: ['\u{2696}\u{FE0F} kilograms', '\u{1F4CF} metres', '\u{1F550} hours'], a: 0 },
  { q: '100 centimetres = ? metre', o: ['1', '10', '100'], a: 0 },
  { q: 'Which is lighter?', o: ['\u{1FAB6} feather', '\u{1F9F1} brick', '\u{1FAB5} log'], a: 0 },
  { q: 'Half a kilogram = ? grams', o: ['500', '50', '5'], a: 0 },
  { q: 'We weigh vegetables using a\u2026', o: ['\u{2696}\u{FE0F} balance', '\u{1F4CF} ruler', '\u{1F550} clock'], a: 0 },
];
const METRIC_BIG_QS = [
  { q: '1 kilometre = ? metres', o: ['1000', '100', '10'], a: 0 },
  { q: '1 litre = ? millilitres', o: ['1000', '100', '10'], a: 0 },
  { q: 'The distance between cities is measured in\u2026', o: ['\u{1F6E3}\u{FE0F} kilometres', '\u{1F4CF} centimetres', '\u{1F944} millilitres'], a: 0 },
  { q: 'A fence around a field measures its\u2026', o: ['\u{1F532} perimeter', '\u{1F3A8} colour', '\u{2696}\u{FE0F} weight'], a: 0 },
  { q: 'Half of 1 litre is ? mL', o: ['500', '50', '5'], a: 0 },
  { q: '2 kilometres = ? metres', o: ['2000', '200', '20'], a: 0 },
  { q: 'A medicine spoon holds about\u2026', o: ['\u{1F944} 5 mL', '\u{1F95B} 5 litres', '\u{1FAA3} 5 buckets'], a: 0 },
  { q: 'Which would you measure in kilometres?', o: ['\u{1F68C} a bus journey', '\u{270F}\u{FE0F} a pencil', '\u{1F4D6} a book'], a: 0 },
  { q: 'The space inside a shape is its\u2026', o: ['\u{25FC}\u{FE0F} area', '\u{1F4CF} perimeter', '\u{2696}\u{FE0F} weight'], a: 0 },
  { q: '1500 metres is the same as\u2026', o: ['1 km 500 m', '15 km 0 m', '150 km 0 m'], a: 0 },
];
const LENGTH_PAIRS = [
  { long: '\u{1F68C} bus', short: '\u{270F}\u{FE0F} pencil' }, { long: '\u{1F682} train', short: '\u{1F6B2} cycle' },
  { long: '\u{1F40D} snake', short: '\u{1F41B} caterpillar' }, { long: '\u{1F309} bridge', short: '\u{1FA9C} ladder' },
  { long: '\u{1F992} giraffe', short: '\u{1F430} rabbit' }, { long: '\u{1F334} palm tree', short: '\u{1F33F} small plant' },
  { long: '\u{1F6E3}\u{FE0F} road', short: '\u{1F9F5} thread' }, { long: '\u{1F3E2} tall building', short: '\u{1F3E0} hut' },
  { long: '\u{1F40B} whale', short: '\u{1F41F} fish' },
];
const CAPACITY_SETS = [
  { most: '\u{1FAA3} bucket', rest: ['\u{1F95B} glass', '\u{1F944} spoon'] },
  { most: '\u{1F6C1} bathtub', rest: ['\u{1FAA3} bucket', '\u{1F95B} glass'] },
  { most: '\u{1FAD9} jug', rest: ['\u{1F964} cup', '\u{1F944} spoon'] },
  { most: '\u{1F6A2} water tanker', rest: ['\u{1FAD9} jug', '\u{1F37C} bottle'] },
  { most: '\u{1F37C} bottle', rest: ['\u{1F944} spoon', '\u{1F48A} cap'] },
  { most: '\u{1F958} big pot', rest: ['\u{1F963} bowl', '\u{1F944} spoon'] },
  { most: '\u{1F30A} lake', rest: ['\u{1FAA3} bucket', '\u{1F95B} glass'] },
];

function makeRound(gen: string, params: QuestParams, numChoices: number): Round {
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
      // `level` is shared with the clock generator, which stores a string —
      // guard rather than trusting the JSONB column to hold a number here.
      const level: number = typeof params.level === 'number' ? params.level : 1;
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
      const value = num / den;
      // The pie still shows the slices it was built from (2 of 4 quarters), but
      // the answer is always in lowest terms. Accepting "2/4" as the answer for
      // a half-shaded pie is unteachable when "1/2" is sitting in the options.
      const g = gcd(num, den);
      const label = `${num / g}/${den / g}`;
      // Options are chosen by VALUE, not by label. Half a pie shaded is exactly
      // what 2/4 looks like, so 1/2 and 2/4 must never appear together: as
      // answer + distractor that asks a child to choose between two correct
      // answers, and as two distractors it shows the same amount twice.
      const taken = new Set<number>([value]);
      const all = ['1/2', '1/4', '3/4', '1/3', '2/3', '2/4', '1/6', '5/6', '2/6', '3/6', '3/8', '5/8']
        .sort(() => Math.random() - 0.5)
        .filter((f) => {
          const [n, d] = f.split('/').map(Number);
          if (taken.has(n / d)) return false;
          taken.add(n / d);
          return true;
        });
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

/* -- Session deck: five DIFFERENT questions ---------------------------- */

/* Every generator used to be called fresh each round with no memory of what
   it had already asked, and `pick()` samples with replacement — so a game
   drawing 5 rounds from a 4-question pool repeated itself every single time,
   and even the 5-question pools repeated in 96% of sessions.

   A round is "the same question" when the child sees the same picture, is
   asked the same thing, and the same option is correct. buildDeck generates
   with rejection on that signature, so a session never asks twice. */

function visualKey(v: Visual): string {
  switch (v.kind) {
    case 'emojis': return 'e:' + v.text;
    case 'grid': return `g:${v.rows}x${v.cols}:${v.emoji}`;
    case 'clock': return `c:${v.h}:${v.m}`;
    case 'coins': return 'o:' + v.values.join(',');
    // By value, not by label: 1/2 and 2/4 draw the same pie, so a deck that
    // told them apart would show a child the same picture twice.
    case 'fraction': return `f:${v.num / v.den}`;
    case 'big': return 'b:' + v.e;
    case 'text': return 't:' + v.text;
    default: return 'n';
  }
}

const roundKey = (r: Round) => `${r.prompt}|${r.options[r.answer]}|${visualKey(r.visual)}`;

/** Never fewer than this many rounds — a one-question game reads as broken
 *  even when the pool honestly holds only one question. */
const MIN_ROUNDS = 3;

export function buildDeck(gen: string, params: QuestParams, numChoices: number, wanted: number): Round[] {
  const deck: Round[] = [];
  const seen = new Set<string>();

  // Rejection sampling. The budget is generous because a rejected round costs
  // only a few object allocations, and small pools need many tries to finish.
  for (let attempt = 0; deck.length < wanted && attempt < wanted * 60; attempt++) {
    const r = makeRound(gen, params, numChoices);
    const key = roundKey(r);
    if (seen.has(key)) continue;
    seen.add(key);
    deck.push(r);
  }

  // The pool is genuinely smaller than a full game. Play a SHORTER game rather
  // than asking the same question twice — stars scale to the deck, so a
  // 4-round game is still winnable at 3 stars.
  if (deck.length >= MIN_ROUNDS || deck.length === 0) return deck;
  while (deck.length < MIN_ROUNDS) deck.push(makeRound(gen, params, numChoices));
  return deck;
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

/** `v.text` is a plain string built by `'🍎'.repeat(n)` (or several such runs
 *  joined by spaces/newlines — see place-value and tally above), so it still
 *  has to be split back into individual glyphs to route each one through
 *  `<Pic>`. `Array.from` splits on Unicode code points, not UTF-16 units,
 *  which is what every emoji this generator produces needs. Newlines become
 *  rows (tally's two counted kinds); spaces become a gap within a row
 *  (place-value's tens/ones groups) without breaking into a new row. */
const EmojiText: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-col items-center gap-2.5">
    {text.split('\n').map((row, ri) => (
      <div key={ri} className="flex items-center justify-center gap-3 flex-wrap">
        {row.split(' ').filter(Boolean).map((group, gi) => (
          <div key={gi} className="flex items-center gap-1 flex-wrap justify-center">
            {Array.from(group).map((ch, ci) => (
              <Pic key={ci} emoji={ch} size={36} />
            ))}
          </div>
        ))}
      </div>
    ))}
  </div>
);

const VisualView: React.FC<{ v: Visual }> = ({ v }) => {
  switch (v.kind) {
    case 'emojis':
      return <EmojiText text={v.text} />;
    case 'grid':
      return (
        <div className="grid gap-1.5 justify-center" style={{ gridTemplateColumns: `repeat(${v.cols}, minmax(0,1fr))` }}>
          {Array.from({ length: v.rows * v.cols }).map((_, i) => (
            <Pic key={i} emoji={v.emoji} size={30} />
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
  // One deck per session, dealt up front. Holding the whole deck (rather than
  // generating each round on demand) is what lets a question be excluded
  // because an EARLIER round already asked it.
  const [deck, setDeck] = useState<Round[]>(() => buildDeck(gen, game.params, numChoices, TOTAL_ROUNDS));
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const totalRounds = Math.max(deck.length, 1);
  const current: Round = deck[round] ?? deck[0];

  const deal = useCallback(() => {
    setSelected(null);
    setRound(0);
    setCorrectCount(0);
    setDeck(buildDeck(gen, game.params, numChoices, TOTAL_ROUNDS));
  }, [gen, game.params, numChoices]);

  useEffect(() => { deal(); /* new game -> fresh deck */ }, [game.gameId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Stars scale to the deck, because a small pool deals a shorter game:
     every question right = 3, four fifths = 2, three fifths = 1. On a full
     5-round deck this is the original 5/4/3 thresholds exactly. */
  const starsFor = (correct: number) => {
    const pct = correct / totalRounds;
    return pct >= 1 ? 3 : pct >= 0.8 ? 2 : pct >= 0.6 ? 1 : 0;
  };

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
      if (round + 1 >= totalRounds) {
        const earned = starsFor(newCorrect);
        setFinished(true);
        onFinish(game.gameId, earned, newCorrect);
        if (earned >= 2) confetti({ particleCount: 80, spread: 60, colors: ['#FFC800', '#55C400', '#1CA5F1'] });
      } else {
        setSelected(null);
        setRound((r) => r + 1);
      }
    }, isRight ? 1200 : 1800);
  };

  const handlePlayAgain = () => {
    setFinished(false);
    deal();
  };

  if (finished) {
    const earned = starsFor(correctCount);
    return (
      <GameFinishScreen
        earned={earned}
        scoreLabel={isPreReader ? undefined : `${correctCount} of ${totalRounds} correct`}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 max-w-lg mx-auto anim-fade-up">
      <GameProgressDots total={totalRounds} current={round} />

      {/* Prompt bubble */}
      <div className="px-6 py-3 text-center" style={{ borderRadius: T.radius.md, background: '#FFF7E0', border: '2px solid #FFE9A8' }}>
        <span className="font-display font-black text-lg" style={{ color: '#8A5B00' }}>{current.prompt}</span>
      </div>

      {/* Visual */}
      {current.visual.kind !== 'none' && (
        <div className="w-full flex items-center justify-center min-h-[120px] p-6" style={{ borderRadius: T.radius.md, background: T.surface.sunk }}>
          <VisualView v={current.visual} />
        </div>
      )}

      {/* Options */}
      <div className="flex gap-4 flex-wrap justify-center">
        {current.options.map((opt, idx) => {
          const isAnswer = idx === current.answer;
          const isSelected = selected === idx;
          let state: GameOptionState = 'idle';
          let extra = '';
          if (selected !== null) {
            if (isAnswer) { state = 'correct'; extra = 'scale-[1.12]'; }
            else if (isSelected) state = 'wrong';
            else state = 'dimmed';
            if (isAnswer && selected !== current.answer) extra += ' animate-pulse-hint';
          }
          const picture = splitOptionPicture(opt);
          const long = opt.length > 4;
          const picturePalette = PICTURE_LABEL_PALETTE[state];
          return (
            <GameOption
              key={idx}
              state={state}
              disabled={selected !== null}
              onClick={() => handleSelect(idx)}
              ariaLabel={picture?.label}
              className={`${extra} ${picture ? 'flex flex-col items-center justify-start gap-2 p-1' : long ? 'text-base' : 'text-2xl'}`}
              style={picture ? {
                width: 156,
                minHeight: 120,
                background: 'transparent',
                border: '2px solid transparent',
                boxShadow: 'none',
              } : { minWidth: long ? 120 : 64, paddingLeft: 16, paddingRight: 16 }}
            >
              {picture ? (
                <>
                  <Pic emoji={picture.emoji} size={76} className="anim-bob drop-shadow-[0_4px_4px_rgba(20,66,95,.16)]" />
                  <span
                    className="w-full min-h-11 px-3 py-2 rounded-2xl flex items-center justify-center text-lg leading-tight"
                    style={{
                      background: picturePalette.bg,
                      color: picturePalette.color,
                      border: `2px solid ${picturePalette.border}`,
                      boxShadow: picturePalette.shadow,
                    }}
                  >
                    {picture.label}
                  </span>
                </>
              ) : opt}
            </GameOption>
          );
        })}
      </div>
    </div>
  );
};
