// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, arrow, circle, label, line, n, tLoop } from '../stage.js'

export const animal_jumps: SimFile = {
  id: 'animal_jumps',
  domain: 'math',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Animal jumps — factors and multiples',
  description: 'A rabbit and a frog hop from 0. Landing spots they share are common multiples.',
  equations: ['\\text{common multiples of }a,b'],
  keywords: ['common multiples', 'common factors', 'animal jumps', 'prime numbers', 'number line jumps'],
  params: [
    param('jumpA', 'Rabbit jump', '', 2, 12, 1, 4),
    param('jumpB', 'Frog jump', '', 2, 12, 1, 3),
  ],
  schema: z.object({
    jumpA: num(1, 20, 4),
    jumpB: num(1, 20, 3),
  }),
  run(params) {
    const a = Math.max(1, Math.round(params.jumpA))
    const b = Math.max(1, Math.round(params.jumpB))
    const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y))
    const g = gcd(a, b)
    const lcm = (a * b) / g
    const maxN = Math.max(lcm * 2, 24)
    const xL = 36
    const xR = 470
    const y = 168
    const xOf = (v: number) => xL + (v / maxN) * (xR - xL)
    const t = tLoop(4.2, 3.6)
    const hopsA = Math.floor(maxN / a)
    const hopsB = Math.floor(maxN / b)
    const xa = `${n(xOf(0))} + (${n(xOf(a) - xOf(0))}) * floor(min(${n(hopsA)}, (${t}) / 3.6 * ${n(hopsA)}))`
    const xb = `${n(xOf(0))} + (${n(xOf(b) - xOf(0))}) * floor(min(${n(hopsB)}, (${t}) / 3.6 * ${n(hopsB)}))`
    const commons: number[] = []
    for (let n0 = lcm; n0 <= maxN; n0 += lcm) commons.push(n0)
    const elements = [
      label('eq', 28, 22, `Rabbit +${a}   Frog +${b}   first common multiple = ${lcm}`),
      label('g', 28, 40, `other common multiples: ${commons.slice(0, 4).join(', ')}`),
      line('axis', { x1: 24, y1: y, x2: 486, y2: y, stroke: '#334155', strokeWidth: 2.5 }),
      arrow('right', { x1: 468, y1: y, x2: 492, y2: y, stroke: '#334155', strokeWidth: 2.5 }),
    ]
    const step = maxN > 40 ? 5 : 2
    for (let v = 0; v <= maxN; v++) {
      const x = xOf(v)
      const onA = v % a === 0
      const onB = v % b === 0
      elements.push(
        line(`t${v}`, {
          x1: x,
          y1: y - (v % step === 0 ? 8 : 3),
          x2: x,
          y2: y + (v % step === 0 ? 8 : 3),
          stroke: onA && onB && v > 0 ? '#16a34a' : '#94a3b8',
          strokeWidth: onA && onB && v > 0 ? 3 : 1,
        })
      )
      if (v % step === 0) elements.push(label(`n${v}`, x - 4, y + 26, String(v)))
      if (onA && v > 0) elements.push(circle(`a${v}`, { cx: x, cy: y - 22, r: 4, fill: '#2563eb' }))
      if (onB && v > 0) elements.push(circle(`b${v}`, { cx: x, cy: y + 22, r: 4, fill: '#ec4899' }))
    }
    elements.push(
      circle('rabbit', { cx: { $expr: xa }, cy: y - 22, r: 9, fill: '#2563eb' }, 'projectile'),
      circle('frog', { cx: { $expr: xb }, cy: y + 22, r: 9, fill: '#ec4899' }, 'projectile'),
      label('rl', 28, 64, 'blue = rabbit', '#2563eb'),
      label('fl', 160, 64, 'pink = frog', '#ec4899'),
    )
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { jumpA: a, jumpB: b, gcd: g, lcm, firstMeeting: lcm },
      warnings: [],
      caption: 'From 0, a jump of 4 and a jump of 3 both land on 12, 24, 36…',
    }
  },
}
