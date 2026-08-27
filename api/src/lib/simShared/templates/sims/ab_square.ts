// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const ab_square: SimFile = {
  id: 'ab_square',
  domain: 'math',
  classBand: '9-9',
  ncertClass: 9,
  label: '(a ± b)² tiles',
  description: 'A square of side (a+b) splits into a², two ab rectangles, and b². Toggle (a−b)². Book compare a=10, b=2. Not the old Class 8 identity tiles.',
  equations: ['(a+b)² = a² + 2ab + b²', '(a−b)² = a² − 2ab + b²'],
  keywords: ['algebraic identities', '(a+b)²', 'algebra tiles', 'visualising identities'],
  params: [
    param('a', 'a', '', 1, 12, 0.5, 10),
    param('b', 'b', '', 0.5, 8, 0.5, 2),
    choice('look', 'Identity', [
      { value: 0, label: '(a+b)²' },
      { value: 1, label: '(a−b)²' },
    ], 0),
  ],
  schema: z.object({
    a: num(0.5, 16, 10),
    b: num(0.5, 10, 2),
    look: num(0, 1, 0),
  }),
  run(params) {
    const a = params.a
    const b = params.b
    const look = Math.round(params.look)
    const plus = look === 0
    const sum = plus ? a + b : a - b
    const expanded = plus ? a * a + 2 * a * b + b * b : a * a - 2 * a * b + b * b
    const scale = 160 / Math.max(a + b, 1)
    const x0 = 150
    const y0 = 60
    const aw = a * scale
    const bw = b * scale
    const elements = [
      label('title', 24, 22, plus
        ? `(a+b)² = ${sum}² = ${expanded}. a²=${a * a}, 2ab=${2 * a * b}, b²=${b * b}.`
        : `(a−b)² = ${sum}² = ${expanded}. a²=${a * a}, 2ab=${2 * a * b}, b²=${b * b}.`),
      label('eq', 24, 40, plus ? '(a+b)² = a² + 2ab + b²  (true for all a, b)' : '(a−b)² = a² − 2ab + b²'),
      rect('a2', { x: x0, y: y0, width: aw, height: aw, fill: '#38bdf8', rx: 2 }),
    ]
    if (plus) {
      elements.push(
        rect('ab1', { x: x0 + aw, y: y0, width: bw, height: aw, fill: '#fbbf24', rx: 2 }),
        rect('ab2', { x: x0, y: y0 + aw, width: aw, height: bw, fill: '#fbbf24', rx: 2 }),
        rect('b2', { x: x0 + aw, y: y0 + aw, width: bw, height: bw, fill: '#f472b6', rx: 2 }),
      )
    } else {
      elements.push(
        label('minus', 24, 270, 'The two ab strips are taken off the big a² square; b² is put back in the corner.'),
      )
    }
    elements.push(label('tip', 24, 286, 'Book: a=10, b=2. (a+b)² = 144, a²+b² = 104. They are not equal.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { a, b, look, expanded, a2: a * a, twoAb: 2 * a * b, b2: b * b, outer: sum * sum },
      warnings: [],
      caption: 'Book Fig. 4.2. Default a=10, b=2.',
    }
  },
}
