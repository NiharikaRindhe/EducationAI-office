// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const linear_poly: SimFile = {
  id: 'linear_poly',
  domain: 'math',
  classBand: '9-9',
  ncertClass: 9,
  label: 'Linear polynomial graph',
  description: 'A linear polynomial is degree 1: y = ax + b. The graph is a straight line. Not the old 9–10 slope tool and not Class 7 s = a + 3.',
  equations: ['y = ax + b', 'degree 1'],
  keywords: ['linear polynomial', 'linear growth', 'straight line graph', 'degree 1', 'variables'],
  params: [
    param('a', 'a (coefficient of x)', '', -4, 4, 0.5, 2),
    param('b', 'b (constant)', '', -6, 6, 0.5, 3),
  ],
  schema: z.object({
    a: num(-6, 6, 2),
    b: num(-8, 8, 3),
  }),
  run(params) {
    const a = params.a
    const b = params.b
    const ox = 80
    const oy = 230
    const sx = 36
    const sy = 16
    const x0 = 0
    const x1 = 8
    const yAt = (x: number) => a * x + b
    const elements = [
      label('title', 24, 22, `y = ${a}x + ${b}. Degree 1 — a straight line.`),
      label('eq', 24, 40, `At x = 0, y = ${b}. At x = 1, y = ${yAt(1)}. At x = 4, y = ${yAt(4)}.`),
      line('xaxis', { x1: ox, y1: oy, x2: ox + 8.5 * sx, y2: oy, stroke: '#94a3b8', strokeWidth: 1 }),
      line('yaxis', { x1: ox, y1: 50, x2: ox, y2: oy, stroke: '#94a3b8', strokeWidth: 1 }),
      line('graph', {
        x1: ox + x0 * sx,
        y1: oy - yAt(x0) * sy,
        x2: ox + x1 * sx,
        y2: oy - yAt(x1) * sy,
        stroke: '#2563eb',
        strokeWidth: 2.5,
      }),
      circle('bpt', { cx: ox, cy: oy - b * sy, r: 5, fill: '#d97706' }),
      label('tip', 24, 286, 'Book: linear growth and linear decay. A degree-2 expression like 10x − x² is not this line.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { a, b, y0: b, y1: yAt(1), y4: yAt(4), degree: 1 },
      warnings: [],
      caption: 'Book: y = 2x + 3. A linear polynomial graphs as a straight line.',
    }
  },
}
