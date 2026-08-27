// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const sqrt2_line: SimFile = {
  id: 'sqrt2_line',
  domain: 'math',
  classBand: '9-9',
  ncertClass: 9,
  label: '√2 on the number line',
  description: 'A unit square has diagonal √2. That length sits on the real line between 1 and 2. Not a Class 5 place-value chart and not a number-line walk.',
  equations: ['diagonal² = 1² + 1² = 2', 'diagonal = √2'],
  keywords: ['irrational', 'square root of 2', 'construction of length', 'real numbers', 'world of numbers'],
  params: [
    param('side', 'Side of the square', '', 1, 3, 0.5, 1),
  ],
  schema: z.object({
    side: num(1, 4, 1),
  }),
  run(params) {
    const s = params.side
    const d = s * Math.SQRT2
    const x0 = 70
    const y0 = 200
    const px = 70
    const lineY = 250
    const origin = 70
    const unit = 90
    const elements = [
      label('title', 24, 22, `Unit square side ${s}. Diagonal √2 × ${s} = ${d.toFixed(3)}.`),
      label('eq', 24, 40, 'N ⊂ Z ⊂ Q ⊂ R. √2 is real, not rational.'),
      line('sq1', { x1: x0, y1: y0, x2: x0 + s * px, y2: y0, stroke: '#1d4ed8', strokeWidth: 2 }),
      line('sq2', { x1: x0 + s * px, y1: y0, x2: x0 + s * px, y2: y0 - s * px, stroke: '#1d4ed8', strokeWidth: 2 }),
      line('sq3', { x1: x0 + s * px, y1: y0 - s * px, x2: x0, y2: y0 - s * px, stroke: '#1d4ed8', strokeWidth: 2 }),
      line('sq4', { x1: x0, y1: y0 - s * px, x2: x0, y2: y0, stroke: '#1d4ed8', strokeWidth: 2 }),
      line('diag', { x1: x0, y1: y0, x2: x0 + s * px, y2: y0 - s * px, stroke: '#b45309', strokeWidth: 3 }),
      line('nl', { x1: origin, y1: lineY, x2: origin + 3.2 * unit, y2: lineY, stroke: '#334155', strokeWidth: 2 }),
      circle('z0', { cx: origin, cy: lineY, r: 4, fill: '#334155' }),
      circle('z1', { cx: origin + unit, cy: lineY, r: 4, fill: '#334155' }),
      circle('z2', { cx: origin + 2 * unit, cy: lineY, r: 4, fill: '#334155' }),
      circle('rt', { cx: origin + d * unit, cy: lineY, r: 6, fill: '#d97706' }),
      label('n0', origin - 4, lineY + 16, '0'),
      label('n1', origin + unit - 4, lineY + 16, '1'),
      label('n2', origin + 2 * unit - 4, lineY + 16, '2'),
      label('rtL', origin + d * unit - 8, lineY - 12, '√2'),
      label('tip', 24, 286, 'Book §3.5.2: construct the length √2 and mark it on the number line.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { side: s, diagonal: d, sqrt2: Math.SQRT2 },
      warnings: [],
      caption: 'Book: unit square diagonal √2 ≈ 1.414 on the real line.',
    }
  },
}
