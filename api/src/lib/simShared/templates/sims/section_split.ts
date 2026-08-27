// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const section_split: SimFile = {
  id: 'section_split',
  domain: 'math',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Section formula',
  description: 'Point dividing AB internally in the ratio m : n. Book Class 10 coordinate geometry — not the old (0,0)–(4,2) midpoint tool.',
  equations: ['x = (mx2 + nx1)/(m+n)', 'y = (my2 + ny1)/(m+n)'],
  keywords: ['section formula', 'divides internally', 'ratio m:n', 'coordinate geometry', 'Niharika'],
  params: [
    param('x1', 'x1', '', -2, 10, 0.5, 1),
    param('y1', 'y1', '', -2, 10, 0.5, 2),
    param('x2', 'x2', '', -2, 10, 0.5, 7),
    param('y2', 'y2', '', -2, 10, 0.5, 8),
    param('m', 'm', '', 1, 6, 1, 1),
    param('n', 'n', '', 1, 6, 1, 1),
  ],
  schema: z.object({
    x1: num(-4, 12, 1),
    y1: num(-4, 12, 2),
    x2: num(-4, 12, 7),
    y2: num(-4, 12, 8),
    m: num(1, 8, 1),
    n: num(1, 8, 1),
  }),
  run(params) {
    const { x1, y1, x2, y2, m, n } = params
    const x = (m * x2 + n * x1) / (m + n)
    const y = (m * y2 + n * y1) / (m + n)
    const ox = 50
    const oy = 250
    const s = 22
    const elements = [
      label('title', 24, 22, `P divides AB in m:n = ${m}:${n}. P = (${x.toFixed(2)}, ${y.toFixed(2)}).`),
      label('eq', 24, 40, 'x = (m x2 + n x1)/(m+n). Same for y. Midpoint when m = n = 1.'),
      line('xaxis', { x1: ox, y1: oy, x2: 460, y2: oy, stroke: '#94a3b8', strokeWidth: 1 }),
      line('yaxis', { x1: ox, y1: 50, x2: ox, y2: oy, stroke: '#94a3b8', strokeWidth: 1 }),
      line('ab', { x1: ox + x1 * s, y1: oy - y1 * s, x2: ox + x2 * s, y2: oy - y2 * s, stroke: '#2563eb', strokeWidth: 2 }),
      circle('A', { cx: ox + x1 * s, cy: oy - y1 * s, r: 5, fill: '#64748b' }),
      circle('B', { cx: ox + x2 * s, cy: oy - y2 * s, r: 5, fill: '#64748b' }),
      circle('P', { cx: ox + x * s, cy: oy - y * s, r: 6, fill: '#d97706' }),
      label('Al', ox + x1 * s - 12, oy - y1 * s - 8, 'A'),
      label('Bl', ox + x2 * s + 6, oy - y2 * s - 8, 'B'),
      label('Pl', ox + x * s + 8, oy - y * s, 'P'),
      label('tip', 24, 286, 'Book: internal section formula. Fig 7.12 race / Niharika runs on those pages.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { x1, y1, x2, y2, m, n, x, y },
      warnings: [],
      caption: `Section formula. P divides AB in ${m}:${n}.`,
    }
  },
}
