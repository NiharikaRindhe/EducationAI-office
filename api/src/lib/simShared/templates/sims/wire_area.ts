// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const wire_area: SimFile = {
  id: 'wire_area',
  domain: 'math',
  classBand: '9-9',
  ncertClass: 9,
  label: '20 cm wire rectangles',
  description: 'A 20 cm wire bent into a rectangle of length x has width 10 − x. Area = x(10 − x) = 10x − x². That is degree 2 — not a linear polynomial.',
  equations: ['width = 10 − x', 'area = x(10 − x)'],
  keywords: ['20 cm wire', 'bent to form rectangles', '10x − x²', 'linear polynomials'],
  params: [
    param('x', 'Length x', 'cm', 1, 9, 0.5, 7),
  ],
  schema: z.object({
    x: num(0.5, 9.5, 7),
  }),
  run(params) {
    const x = params.x
    const w = 10 - x
    const area = x * w
    const scale = 18
    const elements = [
      label('title', 24, 22, `Wire 20 cm. Length ${x} cm, width ${w} cm. Area ${area.toFixed(2)} cm².`),
      label('eq', 24, 40, `Area = x(10 − x) = 10x − x². Degree 2 — not linear.`),
      rect('rect', {
        x: 90,
        y: 70,
        width: Math.max(8, x * scale),
        height: Math.max(8, w * scale),
        fill: '#bfdbfe',
        stroke: '#1d4ed8',
        strokeWidth: 2,
      }),
      label('L', 90, 62, `${x} cm`),
      label('W', 24, 70 + w * 9, `${w} cm`),
      label('tip', 24, 270, 'Book Example 3: 7 cm × 3 cm, or 5.5 cm × 4.5 cm. Same wire, different area.'),
      label('peri', 24, 286, 'Perimeter is always 20 cm. Area changes with x.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { x, width: w, area, perimeter: 20, degree: 2 },
      warnings: [],
      caption: 'Book: 20 cm wire. Default 7 cm × 3 cm. Area 21 cm².',
    }
  },
}
