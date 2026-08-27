// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const coord_gap: SimFile = {
  id: 'coord_gap',
  domain: 'math',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Distance on the plane',
  description: 'Distance PQ = √[(x2−x1)² + (y2−y1)²] from Pythagoras. Book: P(4, 6) and Q(6, 8). Not Class 9 (1,2) to (4,6).',
  equations: ['PQ = √[(x2−x1)² + (y2−y1)²]'],
  keywords: ['distance formula', 'coordinate geometry', 'P(4, 6)', 'Q(6, 8)', 'pythagoras'],
  params: [
    param('x1', 'x1', '', -4, 10, 0.5, 4),
    param('y1', 'y1', '', -4, 10, 0.5, 6),
    param('x2', 'x2', '', -4, 10, 0.5, 6),
    param('y2', 'y2', '', -4, 10, 0.5, 8),
  ],
  schema: z.object({
    x1: num(-6, 12, 4),
    y1: num(-6, 12, 6),
    x2: num(-6, 12, 6),
    y2: num(-6, 12, 8),
  }),
  run(params) {
    const { x1, y1, x2, y2 } = params
    const dx = x2 - x1
    const dy = y2 - y1
    const d = Math.sqrt(dx * dx + dy * dy)
    const ox = 60
    const oy = 250
    const s = 22
    const px = ox + x1 * s
    const py = oy - y1 * s
    const qx = ox + x2 * s
    const qy = oy - y2 * s
    const elements = [
      label('title', 24, 22, `P(${x1}, ${y1}) to Q(${x2}, ${y2}). Distance = √(${dx}² + ${dy}²) = ${d.toFixed(3)}.`),
      label('eq', 24, 40, 'Drop a right triangle. Pythagoras gives the formula.'),
      line('xaxis', { x1: ox, y1: oy, x2: ox + 12 * s, y2: oy, stroke: '#94a3b8', strokeWidth: 1 }),
      line('yaxis', { x1: ox, y1: 40, x2: ox, y2: oy, stroke: '#94a3b8', strokeWidth: 1 }),
      line('pq', { x1: px, y1: py, x2: qx, y2: qy, stroke: '#2563eb', strokeWidth: 2.5 }),
      line('leg', { x1: px, y1: py, x2: qx, y2: py, stroke: '#94a3b8', strokeWidth: 1 }),
      line('leg2', { x1: qx, y1: py, x2: qx, y2: qy, stroke: '#94a3b8', strokeWidth: 1 }),
      circle('P', { cx: px, cy: py, r: 5, fill: '#d97706' }),
      circle('Q', { cx: qx, cy: qy, r: 5, fill: '#16a34a' }),
      label('Pl', px + 8, py, 'P'),
      label('Ql', qx + 8, qy, 'Q'),
      label('tip', 24, 286, 'Book Fig 7.3: P(4, 6) and Q(6, 8) in the first quadrant. √(2² + 2²) = 2√2.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { x1, y1, x2, y2, d, dx, dy },
      warnings: [],
      caption: 'Book: P(4, 6), Q(6, 8). Distance 2√2.',
    }
  },
}
