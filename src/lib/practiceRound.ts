import type { PracticeQuestion } from '../data/activities';

function shuffle<T>(items: T[]): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(items: T[]): T {
  return items[randInt(0, items.length - 1)];
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function fmtInt(n: number): string {
  if (!Number.isInteger(n)) return String(Math.round(n * 1000) / 1000);
  return n < 0 ? `−${Math.abs(n)}` : String(n);
}

function fmtDec(n: number, places = 2): string {
  const v = Math.round(n * 10 ** places) / 10 ** places;
  if (Number.isInteger(v)) return fmtInt(v);
  return String(v);
}

function almost(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-6;
}

function parseLoose(s: string): number | null {
  const t = s
    .replace(/,/g, '')
    .replace(/−/g, '-')
    .replace(/[₹$]/g, '')
    .replace(/rs\.?/gi, '')
    .replace(/°c|℃|°|degrees?/gi, '')
    .replace(/\bkm\/h\b/gi, '')
    .replace(/\bbottles?\b/gi, '')
    .trim();
  if (/and|,|parallel|positive|negative|equal|always/i.test(s) && !/^x\s*=/i.test(t)) return null;
  const eq = t.match(/^x\s*=\s*([+-]?\d+(?:\.\d+)?)\s*$/i);
  if (eq) return Number(eq[1]);
  const frac = t.match(/^([+-]?\d+)\s*\/\s*(\d+)\s*$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const plain = t.match(/^([+-]?\d+(?:\.\d+)?)\s*$/);
  return plain ? Number(plain[1]) : null;
}

function restyle(template: string, n: number): string {
  if (/x\s*=/i.test(template)) return `x = ${fmtInt(n)}`;
  if (/°C/.test(template)) return `${fmtInt(n)}°C`;
  if (/^−-?\d/.test(template) || template.startsWith('−') || template.startsWith('-')) return fmtInt(n);
  if (template.startsWith('+')) return n >= 0 ? `+${Math.abs(n)}` : fmtInt(n);
  if (/\//.test(template) && Number.isInteger(n) === false) {
    const f = toFrac(n);
    if (f) return f;
  }
  if (template.includes('.')) return fmtDec(n);
  return fmtInt(n);
}

function toFrac(n: number): string | null {
  for (let d = 1; d <= 80; d += 1) {
    const num = Math.round(n * d);
    if (almost(num / d, n)) {
      const g = gcd(num, d);
      return `${num / g}/${d / g}`;
    }
  }
  return null;
}

function fracTok(n: number, d: number): string {
  const g = gcd(n, d);
  return `${n / g}/${d / g}`;
}

function shuffleMcq(q: Extract<PracticeQuestion, { type: 'mcq' }>): PracticeQuestion {
  const paired = q.options.map((text, i) => ({ text, correct: i === q.correctIdx }));
  const mixed = shuffle(paired);
  return {
    ...q,
    options: mixed.map((p) => p.text),
    correctIdx: mixed.findIndex((p) => p.correct),
  };
}

function nearbyWrong(correct: number, used: Set<string>): string {
  for (let i = 0; i < 20; i += 1) {
    const delta = randInt(1, 9) * (Math.random() < 0.5 ? -1 : 1);
    const n = Number.isInteger(correct) ? correct + delta : Math.round((correct + delta * 0.25) * 100) / 100;
    if (almost(n, correct)) continue;
    const s = fmtInt(n);
    if (!used.has(s)) return s;
  }
  return fmtInt(correct + 3);
}

function finishMcq(
  q: Extract<PracticeQuestion, { type: 'mcq' }>,
  prompt: string,
  scene: string | undefined,
  answer: number,
  label: string,
  explanation?: string,
): PracticeQuestion {
  const used = new Set<string>([label, fmtInt(answer), fmtDec(answer)]);
  const options = q.options.map((opt, i) => {
    if (i === q.correctIdx) return label;
    const next = nearbyWrong(answer, used);
    used.add(next);
    return restyle(opt, parseLoose(next) ?? answer + i + 1);
  });
  return shuffleMcq({
    ...q,
    prompt,
    scene,
    options,
    explanation: explanation ?? q.explanation,
  });
}

function finishShort(
  q: Extract<PracticeQuestion, { type: 'short_answer' }>,
  prompt: string,
  scene: string | undefined,
  answer: string,
  extra: string[] = [],
  rubric?: string,
): PracticeQuestion {
  return {
    ...q,
    prompt,
    scene,
    answer,
    accepted: Array.from(new Set([answer, ...extra])),
    rubric: rubric ?? q.rubric,
  };
}

const NAMES = ['Riya', 'Kavya', 'Kabir', 'Ishaan', 'Ananya', 'Diya', 'Rohan', 'Aarav', 'Meera', 'Sara', 'Dev', 'Yash'];

function swapNames(text: string): string {
  return text.replace(/\b(?:Riya|Kavya|Kabir|Ishaan|Ananya|Diya|Rohan|Aarav|Meera|Sara|Dev|Yash|Anita|Naina|Gopal|Ravi|Maya|Ira|Nishad|Aanya|Zara|Algu|Imran|Jumman|Salim)\b/g, () =>
    pick(NAMES),
  );
}

function parseNumToken(raw: string): number {
  const t = raw.replace(/−/g, '-').replace(/\s+/g, '');
  const frac = t.match(/^([+-]?\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  return Number(t);
}

function tryBinary(q: PracticeQuestion): PracticeQuestion | null {
  if (/decimal equals|as a fraction|as a decimal|corresponding angles are/i.test(q.prompt)) return null;
  const blob = q.prompt;
  const m = blob.match(
    /(?:Compute\s+)?([+\-−]?\d+(?:\.\d+)?(?:\s*\/\s*\d+)?)\s*([+\-−×*÷]|of|x|\/)\s*([+\-−]?\d+(?:\.\d+)?(?:\s*\/\s*\d+)?)/i,
  );
  if (!m) return null;
  if (m[2] === '/' && !/\d\s+\/\s+\d/.test(m[0]) && !m[1].includes('/') && !m[3].includes('/')) return null;
  if (m[2].toLowerCase() === 'x' && /[a-z]\s*=|[a-z]\s*[+\-−]|\d+[a-z]/i.test(q.prompt)) return null;
  const opRaw = m[2].toLowerCase();
  const isFrac = m[1].includes('/') || m[3].includes('/');
  const isDec = m[1].includes('.') || m[3].includes('.');

  for (let i = 0; i < 16; i += 1) {
    let a: number;
    let b: number;
    let res: number;
    let aTok: string;
    let bTok: string;
    let ans: string;
    if (isFrac) {
      const an = randInt(1, 7);
      const ad = randInt(an + 1, 9);
      const bn = randInt(1, 7);
      const bd = randInt(bn + 1, 9);
      a = an / ad;
      b = bn / bd;
      aTok = `${an}/${ad}`;
      bTok = `${bn}/${bd}`;
      if (opRaw === 'of' || opRaw === '×' || opRaw === 'x' || opRaw === '*') {
        res = a * b;
        ans = fracTok(an * bn, ad * bd);
      } else if (opRaw === '÷' || opRaw === '/') {
        res = a / b;
        ans = fracTok(an * bd, ad * bn);
      } else if (opRaw === '+') {
        res = a + b;
        ans = toFrac(res) ?? fmtDec(res);
      } else {
        res = a - b;
        ans = toFrac(res) ?? fmtDec(res);
      }
    } else if (isDec) {
      a = randInt(3, 19) / 2;
      b = randInt(1, 9) / 2;
      if (Number.isInteger(a)) a += 0.1;
      if (Number.isInteger(b) || b === 0) b = 0.5;
      aTok = fmtDec(a, 1);
      bTok = fmtDec(b, 1);
      if (opRaw === '×' || opRaw === 'x' || opRaw === '*') res = a * b;
      else if (opRaw === '÷' || opRaw === '/') res = a / b;
      else if (opRaw === '+') res = a + b;
      else res = a - b;
      ans = fmtDec(res);
    } else {
      a = randInt(opRaw === '+' || opRaw.includes('−') || opRaw === '-' ? -20 : 2, 20);
      b = randInt(2, 12);
      if (a === 0) a = randInt(2, 9);
      aTok = fmtInt(a);
      bTok = fmtInt(b);
      if (opRaw === '×' || opRaw === 'x' || opRaw === '*') res = a * b;
      else if (opRaw === '÷' || opRaw === '/') {
        a = b * randInt(2, 12);
        aTok = fmtInt(a);
        res = a / b;
      } else if (opRaw === '+') res = a + b;
      else res = a - b;
      ans = fmtInt(res);
    }
    const prompt = q.prompt.replace(m[1], aTok).replace(m[3], bTok);
    const scene = q.scene ? q.scene.replace(m[1], aTok).replace(m[3], bTok) : undefined;
    if (q.type === 'mcq') return finishMcq(q, prompt, scene, res, ans);
    return finishShort(q, prompt, scene, ans, [fmtDec(res), ans.replace('−', '-')], `${aTok} ${m[2]} ${bTok} = ${ans}`);
  }
  return null;
}

function tryLinearEquation(q: PracticeQuestion): PracticeQuestion | null {
  const p = q.prompt;
  if (q.type === 'mcq' && parseLoose(q.options[q.correctIdx]) === null && !/more than twice|think of a number|written as/i.test(p)) {
    if (/isolates|which step/i.test(p)) {
      const step = p.match(/([a-z])\s*([+−-])\s*(\d+)\s*=\s*(\d+)/i);
      if (step) {
        const v = step[1];
        const b = randInt(4, 16);
        const rhs = b + randInt(6, 18);
        const prompt = p.replace(step[0], `${v} + ${b} = ${rhs}`);
        const options = q.options.map((opt) => opt.replace(/\d+/g, String(b)));
        return { ...q, prompt, options };
      }
    }
    return null;
  }

  const axb = p.match(/(\d+)\s*([a-z])\s*([+−-])\s*(\d+)\s*=\s*([+\-−]?\d+)/i);
  if (axb) {
    const v = axb[2];
    const minus = axb[3] !== '+';
    for (let i = 0; i < 10; i += 1) {
      const x = randInt(2, 12);
      const a = randInt(2, 8);
      const b = randInt(2, 15);
      const rhs = minus ? a * x - b : a * x + b;
      if (minus && rhs <= 0) continue;
      const left = minus ? `${a}${v} − ${b}` : `${a}${v} + ${b}`;
      const prompt = p.replace(axb[0], `${left} = ${rhs}`);
      if (q.type === 'mcq') return finishMcq(q, prompt, q.scene, x, `x = ${x}`, `${left} = ${rhs} → ${v} = ${x}`);
      return finishShort(q, prompt, q.scene, String(x), [String(x)], `${left} = ${rhs}`);
    }
  }

  const ax = p.match(/(\d+)\s*([a-z])\s*=\s*([+\-−]?\d+)/i);
  if (ax) {
    const v = ax[2];
    const x = randInt(2, 12);
    const a = randInt(2, 9);
    const rhs = a * x;
    const prompt = p.replace(ax[0], `${a}${v} = ${rhs}`);
    if (q.type === 'mcq') return finishMcq(q, prompt, q.scene, x, `x = ${x}`);
    return finishShort(q, prompt, q.scene, String(x), [String(x)], `${a}${v} = ${rhs}`);
  }

  const xdiv = p.match(/([a-z])\s*\/\s*(\d+)\s*=\s*([+\-−]?\d+)/i);
  if (xdiv) {
    const v = xdiv[1];
    const d = randInt(2, 9);
    const qv = randInt(2, 12);
    const x = d * qv;
    const prompt = p.replace(xdiv[0], `${v}/${d} = ${qv}`);
    if (q.type === 'mcq') return finishMcq(q, prompt, q.scene, x, String(x));
    return finishShort(q, prompt, q.scene, String(x));
  }

  const xminus = p.match(/([a-z])\s*([+−-])\s*(\d+)\s*=\s*([+\-−]?\d+)/i);
  if (xminus) {
    const v = xminus[1];
    const plus = xminus[2] === '+';
    for (let i = 0; i < 10; i += 1) {
      const b = randInt(3, 15);
      const rhs = plus ? b + randInt(4, 16) : randInt(4, 20);
      const x = plus ? rhs - b : b + rhs;
      if (x <= 0) continue;
      const prompt = p.replace(xminus[0], plus ? `${v} + ${b} = ${rhs}` : `${v} − ${b} = ${rhs}`);
      if (q.type === 'mcq') return finishMcq(q, prompt, q.scene, x, String(x));
      return finishShort(q, prompt, q.scene, String(x));
    }
  }

  if (/think of a number/i.test(p) && q.type === 'mcq') {
    const a = randInt(2, 8);
    const b = randInt(2, 12);
    const x = randInt(3, 12);
    const rhs = a * x + b;
    return shuffleMcq({
      ...q,
      options: [`${a}x + ${b} = ${rhs}`, `${a}x − ${b} = ${rhs}`, `x + ${a} = ${rhs}`, `${b}x = ${rhs}`],
      correctIdx: 0,
    });
  }

  const think = p.match(/multiply(?: it)? by (\d+).*add (\d+).*?(\d+)/i);
  if (think) {
    const a = randInt(2, 8);
    const b = randInt(2, 12);
    const x = randInt(3, 12);
    const rhs = a * x + b;
    const prompt = p
      .replace(think[1], String(a))
      .replace(think[2], String(b))
      .replace(think[3], String(rhs));
    const scene = q.scene
      ?.replace(think[1], String(a))
      .replace(think[2], String(b))
      .replace(think[3], String(rhs));
    if (q.type === 'mcq') {
      return shuffleMcq({
        ...q,
        prompt,
        scene,
        options: [`${a}x + ${b} = ${rhs}`, `${a}x − ${b} = ${rhs}`, `x + ${a} = ${rhs}`, `${b}x = ${rhs}`],
        correctIdx: 0,
      });
    }
    return finishShort(q, prompt, scene, String(x), [String(x)], `${a}x + ${b} = ${rhs}`);
  }

  const twice = p.match(/(\d+) more than twice a number is (\d+)/i);
  if (twice) {
    const x = randInt(3, 12);
    const add = randInt(2, 9);
    const rhs = 2 * x + add;
    const prompt = p.replace(twice[1], String(add)).replace(twice[2], String(rhs));
    if (q.type === 'mcq') {
      return shuffleMcq({
        ...q,
        prompt,
        options: [`2x + ${add} = ${rhs}`, `2x − ${add} = ${rhs}`, `x + 2 = ${rhs}`, `${add}x = ${rhs}`],
        correctIdx: 0,
      });
    }
    return finishShort(q, prompt, q.scene, String(x));
  }

  const sub = p.match(/(\d+) is subtracted from a number, the result is (\d+)/i);
  if (sub) {
    const a = randInt(3, 15);
    const rhs = randInt(4, 20);
    const x = a + rhs;
    const prompt = p.replace(sub[1], String(a)).replace(sub[2], String(rhs));
    if (q.type === 'mcq') return finishMcq(q, prompt, q.scene, x, String(x));
    return finishShort(q, prompt, q.scene, String(x));
  }

  return null;
}


function newList(kind: 'mean' | 'median' | 'mode' | 'range'): { values: number[]; answer: number } {
  if (kind === 'mode') {
    const mode = randInt(2, 12);
    const extras = [randInt(1, 15), randInt(1, 15), randInt(1, 15)].map((n) => (n === mode ? n + 1 : n));
    return { values: shuffle([mode, mode, mode, extras[0], extras[1], extras[2]]), answer: mode };
  }
  if (kind === 'median') {
    const a = randInt(2, 8);
    const mid = a + randInt(2, 6);
    const c = mid + randInt(2, 6);
    const extra = Math.random() < 0.5 ? [c + randInt(1, 4), a - 1 > 0 ? a - 1 : c + 5] : [];
    const values = shuffle([a, mid, c, ...extra.filter((n) => n > 0)]);
    const ordered = values.slice().sort((x, y) => x - y);
    const answer = ordered[Math.floor(ordered.length / 2)];
    return { values, answer };
  }
  if (kind === 'range') {
    const lo = randInt(2, 10);
    const hi = lo + randInt(6, 20);
    const mid = randInt(lo + 1, hi - 1);
    const mid2 = randInt(lo + 1, hi - 1);
    return { values: shuffle([lo, mid, hi, mid2]), answer: hi - lo };
  }
  const values = [randInt(2, 10), randInt(2, 10), randInt(2, 10), randInt(2, 10)];
  const sum = values.reduce((s, n) => s + n, 0);
  return { values, answer: sum / values.length };
}

function tryStats(q: PracticeQuestion): PracticeQuestion | null {
  const p = q.prompt;
  const meanN = p.match(/mean of (\w+) numbers is (\d+)/i);
  if (meanN) {
    const count = randInt(4, 6);
    const mean = randInt(6, 12);
    const total = count * mean;
    const word = ['four', 'five', 'six'][count - 4];
    const prompt = p.replace(meanN[1], word).replace(meanN[2], String(mean));
    const scene = q.scene?.replace(/\bfive\b/i, word).replace(meanN[2], String(mean));
    if (q.type === 'mcq') return finishMcq(q, prompt, scene, total, String(total));
    return finishShort(q, prompt, scene, String(total));
  }

  const kind = /mean/i.test(p) ? 'mean' : /median/i.test(p) ? 'median' : /mode/i.test(p) ? 'mode' : /range/i.test(p) ? 'range' : null;
  if (!kind) return null;
  const listMatch = p.match(/((?:[+\-−]?\d+(?:\.\d+)?)(?:\s*,\s*[+\-−]?\d+(?:\.\d+)?)+)/);
  if (!listMatch) return null;
  const next = newList(kind);
  if (kind === 'mean' && !Number.isInteger(next.answer)) {
    const target = randInt(5, 12);
    const n = 4;
    const values = [target - 2, target, target + 1, target + 1];
    next.values = values;
    next.answer = target;
  }
  const list = next.values.join(', ');
  const prompt = p.replace(listMatch[1], list);
  const scene = q.scene ? q.scene.replace(listMatch[1], list) : undefined;
  if (q.type === 'mcq') return finishMcq(q, prompt, scene, next.answer, String(next.answer));
  return finishShort(q, prompt, scene, String(next.answer));
}

function tryStoryMath(q: PracticeQuestion): PracticeQuestion | null {
  const blob = `${q.prompt} ${q.scene ?? ''}`;

  const startM = blob.match(/(\d+)\s*°C/);
  const dropM = blob.match(/(?:drops|falling|falls)(?:\s+by)?\s+(\d+)\s*°C/i);
  const hourM = q.prompt.match(/(\d+):00/) ?? blob.match(/until (\d+)\s*PM/i);
  if (startM && dropM && hourM) {
    const start = randInt(12, 22);
    const drop = randInt(1, 3);
    const hourTok = hourM[1] ?? hourM[2];
    const hours = [3, 4, 6].filter((h) => h !== Number(hourTok))[randInt(0, 1)] ?? 4;
    const ans = start - drop * hours;
    const prompt = q.prompt.replace(`${hourTok}:00`, `${hours}:00`).replace(`until ${hourTok}`, `until ${hours}`);
    const scene = q.scene
      ?.replace(`${startM[1]}°C`, `${start}°C`)
      .replace(`${dropM[1]}°C`, `${drop}°C`)
      .replace(`${hourTok}:00`, `${hours}:00`)
      .replace(`until ${hourTok}`, `until ${hours}`);
    if (q.type === 'mcq') return finishMcq(q, prompt, scene, ans, `${fmtInt(ans)}°C`);
    return finishShort(q, prompt, scene, String(ans), [String(ans), `${ans}°C`, `+${ans}`]);
  }

  const lift = q.prompt.match(/floor \+?(\d+).*down (\d+) floors/i);
  if (lift) {
    const start = randInt(2, 8);
    const down = randInt(3, 9);
    const ans = start - down;
    const prompt = q.prompt
      .replace(/floor \+?\d+/i, `floor +${start}`)
      .replace(/down \d+ floors/i, `down ${down} floors`);
    if (q.type === 'mcq') return finishMcq(q, prompt, q.scene, ans, ans >= 0 ? `+${ans}` : fmtInt(ans));
    return finishShort(q, prompt, q.scene, String(ans), [fmtInt(ans), `+${ans}`]);
  }

  const money = blob.match(/loss of Rs (\d+).*profit of Rs (\d+)/i);
  if (money) {
    const loss = randInt(20, 60);
    const profit = loss + randInt(10, 50);
    const ans = profit - loss;
    const prompt = q.prompt.replace(money[1], String(loss)).replace(money[2], String(profit));
    const scene = q.scene?.replace(money[1], String(loss)).replace(money[2], String(profit));
    if (q.type === 'mcq') return finishMcq(q, prompt, scene, ans, String(ans));
    return finishShort(q, prompt, scene, String(ans), [`+${ans}`, `Rs ${ans}`, `₹${ans}`]);
  }

  const inv = q.prompt.match(/additive inverse of ([+\-−]?\d+)/i);
  if (inv) {
    const n = randInt(4, 20) * (Math.random() < 0.7 ? -1 : 1);
    const ans = -n;
    const prompt = q.prompt.replace(inv[1], fmtInt(n));
    if (q.type === 'mcq') return finishMcq(q, prompt, q.scene, ans, fmtInt(ans));
    return finishShort(q, prompt, q.scene, String(ans), [fmtInt(ans), `+${ans}`]);
  }

  const bottle = q.prompt.match(/holds ([\d.]+) L.*make ([\d.]+) L/i);
  if (bottle) {
    const each = [0.25, 0.5, 0.75, 1.5][randInt(0, 3)];
    const count = randInt(3, 8);
    const total = each * count;
    const prompt = q.prompt.replace(bottle[1], fmtDec(each)).replace(bottle[2], fmtDec(total));
    if (q.type === 'mcq') return finishMcq(q, prompt, q.scene, count, String(count));
    return finishShort(q, prompt, q.scene, String(count), [`${count} bottles`]);
  }

  const twoCorr = q.prompt.match(/corresponding angles are (\d+)° and (\d+)°/i);
  if (twoCorr) {
    const same = twoCorr[1] === twoCorr[2];
    const a = randInt(40, 85);
    const b = same ? a : a + randInt(8, 25);
    const prompt = q.prompt.replace(/corresponding angles are \d+° and \d+°/i, `corresponding angles are ${a}° and ${b}°`);
    if (q.type === 'short_answer') return finishShort(q, prompt, q.scene, q.answer, q.accepted, q.rubric);
    return { ...q, prompt };
  }

  const third = q.prompt.match(/(\d+)° and (\d+)°/);
  if (third && /third angle|triangle/i.test(q.prompt)) {
    const a = randInt(30, 70);
    const b = randInt(30, 70);
    if (a + b < 170) {
      const c = 180 - a - b;
      const prompt = q.prompt.replace(third[1], String(a)).replace(third[2], String(b));
      const scene = q.scene?.replace(third[1], String(a)).replace(third[2], String(b));
      if (q.type === 'mcq') return finishMcq(q, prompt, scene, c, `${c}°`);
      return finishShort(q, prompt, scene, String(c), [`${c}°`]);
    }
  }

  const linearPair = q.prompt.match(/angle of (\d+)° and its linear pair/i);
  if (linearPair && q.type === 'mcq') {
    const a = randInt(40, 80);
    const b = 180 - a;
    const prompt = q.prompt.replace(linearPair[1], String(a));
    return shuffleMcq({
      ...q,
      prompt,
      options: [`${a}° and ${a}°`, `${a}° and ${b}°`, `${a}° and ${90 - (a % 40)}°`, `${a}° and ${b + 20}°`],
      correctIdx: 1,
    });
  }

  const angle = q.prompt.match(/(\d+)°/);
  const given = angle ? Number(angle[1]) : NaN;
  const ansN = parseLoose(q.type === 'mcq' ? q.options[q.correctIdx] : q.answer);
  if (angle && ansN !== null && /corresponding|alternate|vertically opposite|co-interior|consecutive|linear|complement/i.test(blob)) {
    const a = randInt(35, 80);
    const prompt = q.prompt.replace(angle[1], String(a));
    const scene = q.scene?.replace(angle[1], String(a));
    let next = a;
    if (almost(ansN, 180 - given)) next = 180 - a;
    else if (almost(ansN, 90 - given)) next = 90 - a;
    else if (!almost(ansN, given)) return null;
    if (q.type === 'mcq') return finishMcq(q, prompt, scene, next, `${next}°`);
    return finishShort(q, prompt, scene, String(next), [`${next}°`]);
  }

  if (/which integer is greatest/i.test(q.prompt) && q.type === 'mcq') {
    const vals = shuffle([-randInt(2, 9), -randInt(10, 18), -randInt(19, 28), -randInt(3, 12)]);
    const unique = Array.from(new Set(vals));
    while (unique.length < 4) unique.push(-randInt(2, 25));
    const options = unique.slice(0, 4).map((n) => fmtInt(n));
    const nums = options.map((s) => parseLoose(s) ?? 0);
    const correctIdx = nums.indexOf(Math.max(...nums));
    return { ...q, options, correctIdx };
  }

  if (/which statement is correct/i.test(q.prompt) && q.type === 'mcq' && q.options.some((o) => /greater than/.test(o))) {
    const a = -randInt(8, 20);
    const b = -randInt(1, 7);
    return shuffleMcq({
      ...q,
      options: [
        `${fmtInt(a)} is greater than ${fmtInt(b)}`,
        `${fmtInt(b)} is greater than ${fmtInt(a)}`,
        `${fmtInt(a)} = ${fmtInt(b)}`,
        'Negatives cannot be compared',
      ],
      correctIdx: 1,
    });
  }

  const decFrac = q.prompt.match(/([\d.]+) as a fraction/i);
  if (decFrac && q.type === 'mcq') {
    const pairs: [string, string, string[]][] = [
      ['0.5', '1/2', ['1/3', '2/5', '5/10']],
      ['0.2', '1/5', ['1/2', '2/5', '1/4']],
      ['0.75', '3/4', ['2/3', '7/5', '3/5']],
      ['0.4', '2/5', ['1/4', '4/10', '1/5']],
    ];
    const [dec, ans, wrong] = pick(pairs);
    return shuffleMcq({
      ...q,
      prompt: q.prompt.replace(decFrac[1], dec),
      options: [ans, ...wrong],
      correctIdx: 0,
    });
  }

  if (/which product is greatest/i.test(q.prompt) && q.type === 'mcq') {
    const make = () => {
      const a = randInt(1, 4);
      const b = randInt(a + 1, 8);
      const c = randInt(1, 4);
      const d = randInt(c + 1, 8);
      return { t: `${a}/${b} × ${c}/${d}`, v: (a / b) * (c / d) };
    };
    const opts = [make(), make(), make(), make()];
    const best = Math.max(...opts.map((o) => o.v));
    const correctIdx = opts.findIndex((o) => o.v === best);
    return { ...q, options: opts.map((o) => o.t), correctIdx };
  }

  const fracDec = q.prompt.match(/decimal equals (\d+)\s*\/\s*(\d+)/i);
  if (fracDec && q.type === 'mcq') {
    const pairs: [string, string, string[]][] = [
      ['1/4', '0.25', ['0.14', '0.4', '1.4']],
      ['1/8', '0.125', ['0.18', '0.8', '1.8']],
      ['2/5', '0.4', ['0.25', '0.2', '2.5']],
      ['3/5', '0.6', ['0.35', '0.3', '3.5']],
    ];
    const [frac, ans, wrong] = pick(pairs);
    return shuffleMcq({
      ...q,
      prompt: q.prompt.replace(`${fracDec[1]}/${fracDec[2]}`, frac).replace(`${fracDec[1]} / ${fracDec[2]}`, frac),
      options: [ans, ...wrong],
      correctIdx: 0,
    });
  }

  return null;
}

function extractNums(text: string): { raw: string; value: number }[] {
  const out: { raw: string; value: number }[] = [];
  const re = /[+\-−]?\d+(?:\.\d+)?(?:\s*\/\s*\d+)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (/:00/.test(text.slice(m.index, m.index + m[0].length + 3))) continue;
    out.push({ raw: m[0], value: parseNumToken(m[0]) });
  }
  return out;
}

function replaceTokens(text: string, from: { raw: string }[], to: string[]): string {
  let out = text;
  from.forEach((tok, i) => {
    out = out.replace(tok.raw, to[i] ?? tok.raw);
  });
  return out;
}

function tryInferred(q: PracticeQuestion): PracticeQuestion | null {
  const answerRaw = q.type === 'mcq' ? q.options[q.correctIdx] : q.answer;
  const answer = parseLoose(answerRaw);
  if (answer === null) return null;
  const tokens = extractNums(`${q.prompt} ${q.scene ?? ''}`);
  const nums = tokens.map((t) => t.value);
  if (nums.length < 1) return null;

  type Formula = { sample: () => { next: number[]; result: number } | null };
  const formulas: Formula[] = [];

  if (nums.length === 1) {
    const n = nums[0];
    if (almost(answer, -n)) {
      formulas.push({
        sample: () => {
          const a = randInt(4, 20) * (n < 0 ? -1 : 1);
          return { next: [a], result: -a };
        },
      });
    }
    if (almost(answer, n)) {
      formulas.push({
        sample: () => {
          const a = randInt(8, 80);
          return { next: [a], result: a };
        },
      });
    }
  }

  if (nums.length >= 2) {
    const a = nums[0];
    const b = nums[1];
    const add = (fn: (x: number, y: number) => number, ok: boolean) => {
      if (!ok) return;
      formulas.push({
        sample: () => {
          const x = randInt(2, 24);
          const y = randInt(2, 18);
          return { next: [x, y], result: fn(x, y) };
        },
      });
    };
    add((x, y) => x + y, almost(answer, a + b));
    add((x, y) => x - y, almost(answer, a - b));
    add((x, y) => y - x, almost(answer, b - a));
    add((x, y) => x * y, almost(answer, a * b));
    add((x, y) => (y === 0 ? x : x / y), b !== 0 && almost(answer, a / b));
    add((x, y) => (x === 0 ? y : y / x), a !== 0 && almost(answer, b / a));
    add((x, y) => 2 * (x + y), almost(answer, 2 * (a + b)));
    add((x, y) => (x / 100) * y, almost(answer, (a / 100) * b));
  }

  if (nums.length >= 3) {
    const [a, b, c] = nums;
    const add3 = (fn: (x: number, y: number, z: number) => number, ok: boolean) => {
      if (!ok) return;
      formulas.push({
        sample: () => {
          const x = randInt(4, 20);
          const y = randInt(1, 6);
          const z = randInt(2, 8);
          return { next: [x, y, z], result: fn(x, y, z) };
        },
      });
    };
    add3((x, y, z) => x - y * z, almost(answer, a - b * c));
    add3((x, y, z) => x + y * z, almost(answer, a + b * c));
    add3((x, y, z) => x * y + z, almost(answer, a * b + c));
    add3((x, y, z) => (x + y + z) / 3, almost(answer, (a + b + c) / 3));
    add3((x, y, _z) => 180 - x - y, almost(answer, 180 - a - b));
  }

  for (const formula of formulas) {
    for (let i = 0; i < 10; i += 1) {
      const sampled = formula.sample();
      if (!sampled) continue;
      if (almost(sampled.result, answer)) continue;
      const labels = sampled.next.map((n, idx) => (String(tokens[idx]?.raw ?? '').includes('.') ? fmtDec(n) : fmtInt(n)));
      const prompt = replaceTokens(q.prompt, tokens, labels);
      const scene = q.scene ? replaceTokens(q.scene, tokens, labels) : undefined;
      const label = restyle(answerRaw, sampled.result);
      if (q.type === 'mcq') return finishMcq(q, prompt, scene, sampled.result, label);
      return finishShort(q, prompt, scene, Number.isInteger(sampled.result) ? String(sampled.result) : fmtDec(sampled.result), [label]);
    }
  }
  return null;
}

function varyDecorative(q: PracticeQuestion): PracticeQuestion {
  const rename = (s: string) => swapNames(s);
  if (q.type === 'mcq') {
    return shuffleMcq({
      ...q,
      prompt: rename(q.prompt),
      scene: q.scene ? rename(q.scene) : undefined,
      options: q.options.map(rename),
    });
  }
  return {
    ...q,
    prompt: rename(q.prompt),
    scene: q.scene ? rename(q.scene) : undefined,
  };
}

function varyOne(q: PracticeQuestion): PracticeQuestion {
  return tryBinary(q) ?? tryLinearEquation(q) ?? tryStats(q) ?? tryStoryMath(q) ?? tryInferred(q) ?? varyDecorative(q);
}

/** New numbers (and a matching key) for the same chapter skills. */
export function varyRound(questions: PracticeQuestion[]): PracticeQuestion[] {
  return shuffle(questions.map(varyOne));
}

export function remixRound(questions: PracticeQuestion[]): PracticeQuestion[] {
  return varyRound(questions);
}

export function isPracticeQuestion(value: unknown): value is PracticeQuestion {
  if (!value || typeof value !== 'object') return false;
  const q = value as PracticeQuestion;
  if (q.type === 'mcq') {
    return (
      typeof q.prompt === 'string' &&
      Array.isArray(q.options) &&
      q.options.length >= 3 &&
      q.options.every((o) => typeof o === 'string' && o.trim()) &&
      Number.isInteger(q.correctIdx) &&
      q.correctIdx >= 0 &&
      q.correctIdx < q.options.length
    );
  }
  if (q.type === 'short_answer') {
    return typeof q.prompt === 'string' && typeof q.answer === 'string' && q.answer.trim().length > 0;
  }
  return false;
}
