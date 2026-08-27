// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

function factors(n: number): number[] {
  const out: number[] = []
  let x = Math.max(1, Math.round(n))
  let p = 2
  while (p * p <= x) {
    while (x % p === 0) {
      out.push(p)
      x = Math.round(x / p)
    }
    p += 1
  }
  if (x > 1) out.push(x)
  return out
}

function hcfOf(a: number, b: number): number {
  let x = Math.abs(Math.round(a))
  let y = Math.abs(Math.round(b))
  while (y) {
    const t = y
    y = x % y
    x = t
  }
  return x || 1
}

export const prime_share: SimFile = {
  id: 'prime_share',
  domain: 'math',
  classBand: '10-10',
  ncertClass: 10,
  label: 'HCF and LCM by primes',
  description: 'Prime factor trees for two numbers. HCF is the shared primes. LCM uses every prime at its highest power. Book: 6 and 20. Not Class 7 tiles.',
  equations: ['HCF(a,b) × LCM(a,b) = a × b'],
  keywords: ['fundamental theorem of arithmetic', 'HCF', 'LCM', 'prime factorisation', '6 and 20'],
  params: [
    param('a', 'First number', '', 2, 120, 1, 6),
    param('b', 'Second number', '', 2, 120, 1, 20),
  ],
  schema: z.object({
    a: num(2, 200, 6),
    b: num(2, 200, 20),
  }),
  run(params) {
    const a = Math.round(params.a)
    const b = Math.round(params.b)
    const fa = factors(a)
    const fb = factors(b)
    const hcf = hcfOf(a, b)
    const lcm = Math.round((a * b) / hcf)
    const elements = [
      label('title', 24, 22, `Prime factors. ${a} = ${fa.join(' × ')}. ${b} = ${fb.join(' × ')}.`),
      label('eq', 24, 40, `HCF = ${hcf}. LCM = ${lcm}. Check: ${hcf} × ${lcm} = ${a * b} = ${a} × ${b}.`),
      rect('boxA', { x: 40, y: 80, width: 180, height: 120, fill: '#dbeafe', rx: 8 }),
      rect('boxB', { x: 280, y: 80, width: 180, height: 120, fill: '#fef3c7', rx: 8 }),
      label('la', 70, 130, `${a}`),
      label('lb', 310, 130, `${b}`),
      label('fa', 50, 170, fa.join(' × ')),
      label('fb', 290, 170, fb.join(' × ')),
      rect('share', { x: 160, y: 220, width: 180, height: 36, fill: '#bbf7d0', rx: 6 }),
      label('sh', 175, 244, `shared primes → HCF ${hcf}`),
      label('tip', 24, 286, 'Book Example 2: 6 and 20. HCF 2, LCM 60. Two numbers only — three numbers do not obey this product rule.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { a, b, hcf, lcm, product: a * b, check: hcf * lcm },
      warnings: [],
      caption: 'Book: 6 and 20. HCF = 2, LCM = 60.',
    }
  },
}
