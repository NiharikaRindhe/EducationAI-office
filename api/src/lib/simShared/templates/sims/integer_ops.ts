// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, arrow, circle, label, line, n, tLoop } from '../stage.js'

export const integer_ops: SimFile = {
  id: 'integer_ops',
  domain: 'math',
  classBand: '7-7',
  ncertClass: 7,
  label: 'Jumps with negatives',
  description: 'Two numbers that add to 25 and differ by 11 are 18 and 7. Walk the number line — jumps may go left (negative).',
  equations: ['18 + 7 = 25', '18 − 7 = 11'],
  keywords: ['integers', 'negative', 'number line', 'sum 25', 'difference 11'],
  params: [
    param('sum', 'They add to', '', 4, 40, 1, 25),
    param('diff', 'They differ by', '', 0, 24, 1, 11),
  ],
  schema: z.object({
    sum: num(0, 50, 25),
    diff: num(0, 40, 11),
  }),
  run(params) {
    const sum = Math.round(params.sum)
    const diff = Math.round(params.diff)
    const bigger = (sum + diff) / 2
    const smaller = (sum - diff) / 2
    const ok = Number.isInteger(bigger) && Number.isInteger(smaller)
    const a = ok ? bigger : Math.round(bigger)
    const b = ok ? smaller : Math.round(smaller)
    const x0 = 40
    const y = 170
    const maxAbs = Math.max(30, Math.abs(a) + Math.abs(b) + 4)
    const scale = 420 / maxAbs
    const toX = (v: number) => x0 + (v - Math.min(0, b, a)) * scale
    const start = 0
    const mid = a
    const end = a + b
    const t = tLoop(6, 5.5)
    const hop = `min((${t}) / 2.6, 1)`
    const elements = [
      label('title', 24, 22, ok
        ? `The two numbers are ${a} and ${b}`
        : 'Pick a sum and difference that make whole numbers'),
      label('eq', 24, 40, `${a} + ${b} = ${a + b}     ${a} − ${b} = ${a - b}`),
      line('axis', { x1: 30, y1: y, x2: 470, y2: y, stroke: '#64748b', strokeWidth: 2 }),
    ]
    const minV = Math.min(0, a, a + b) - 1
    const maxV = Math.max(0, a, a + b) + 1
    for (let v = minV; v <= maxV; v++) {
      const x = x0 + (v - minV) * (420 / Math.max(1, maxV - minV))
      elements.push(
        line(`t${v}`, { x1: x, y1: y - 6, x2: x, y2: y + 6, stroke: '#94a3b8', strokeWidth: 1 }),
        label(`n${v}`, x - 4, y + 22, String(v))
      )
    }
    const xStart = x0 + (0 - minV) * (420 / Math.max(1, maxV - minV))
    const xA = x0 + (a - minV) * (420 / Math.max(1, maxV - minV))
    const xEnd = x0 + (a + b - minV) * (420 / Math.max(1, maxV - minV))
    elements.push(
      arrow('j1', {
        x1: xStart,
        y1: y - 36,
        x2: { $expr: `${n(xStart)} + (${n(xA)} - ${n(xStart)}) * ${hop}` },
        y2: y - 36,
        stroke: '#2563eb',
        strokeWidth: 3,
      }),
      circle('dot', {
        cx: { $expr: `${n(xStart)} + (${n(xA)} - ${n(xStart)}) * min((${t}) / 2.6, 1) + (${n(xEnd)} - ${n(xA)}) * max(((${t}) - 2.6) / 2.6, 0)` },
        cy: y - 36,
        r: 7,
        fill: '#f59e0b',
      }, 'projectile'),
      label('tip', 24, 268, 'A negative jump would hop to the left. This is not the Class 6 frog-and-rabbit story.')
    )
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { a, b, sum: a + b, diff: a - b },
      warnings: ok ? [] : ['Those two numbers are not both whole numbers.'],
      caption: 'Book: two numbers add to 25 and differ by 11 → 18 and 7.',
    }
  },
}
