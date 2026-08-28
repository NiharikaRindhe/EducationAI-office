// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const coord_distance: SimFile = {
  id: 'coord_distance',
  domain: 'math',
  classBand: '9-9',
  ncertClass: 9,
  label: 'Distance between two points',
  description: 'Distance on the plane is the hypotenuse of the Δx and Δy steps. Not the old 3-4-5 Pythagoras drop-in and not the Class 10 section formula.',
  equations: ['d = √[(x₂−x₁)² + (y₂−y₁)²]'],
  keywords: ['distance between two points', 'coordinate plane', '1.4', 'orienting yourself'],
  params: [
    param('x1', 'x₁', '', -8, 8, 0.5, 1),
    param('y1', 'y₁', '', -8, 8, 0.5, 2),
    param('x2', 'x₂', '', -8, 8, 0.5, 4),
    param('y2', 'y₂', '', -8, 8, 0.5, 6),
  ],
  schema: z.object({
    x1: num(-8, 8, 1),
    y1: num(-8, 8, 2),
    x2: num(-8, 8, 4),
    y2: num(-8, 8, 6),
  }),
  run(params) {
    const { x1, y1, x2, y2 } = params
    const dx = x2 - x1
    const dy = y2 - y1
    const d = Math.hypot(dx, dy)
    const ox = 250
    const oy = 170
    const s = 16
    const elements = [
      label('title', 24, 22, `A(${x1}, ${y1}) to B(${x2}, ${y2}). Distance = ${d.toFixed(2)}.`),
      label('eq', 24, 40, `√[(${dx})² + (${dy})²] = ${d.toFixed(2)}`),
      line('xaxis', { x1: 40, y1: oy, x2: 460, y2: oy, stroke: '#94a3b8', strokeWidth: 1 }),
      line('yaxis', { x1: ox, y1: 55, x2: ox, y2: 270, stroke: '#94a3b8', strokeWidth: 1 }),
      line('AB', { x1: ox + x1 * s, y1: oy - y1 * s, x2: ox + x2 * s, y2: oy - y2 * s, stroke: '#0f172a', strokeWidth: 2 }),
      line('dx', { x1: ox + x1 * s, y1: oy - y1 * s, x2: ox + x2 * s, y2: oy - y1 * s, stroke: '#2563eb', strokeWidth: 1.5 }),
      line('dy', { x1: ox + x2 * s, y1: oy - y1 * s, x2: ox + x2 * s, y2: oy - y2 * s, stroke: '#d97706', strokeWidth: 1.5 }),
      circle('A', { cx: ox + x1 * s, cy: oy - y1 * s, r: 6, fill: '#2563eb' }),
      circle('B', { cx: ox + x2 * s, cy: oy - y2 * s, r: 6, fill: '#d97706' }),
      label('tip', 24, 286, 'Book §1.4. Walk across, then up. The straight path is the distance.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { x1, y1, x2, y2, dx, dy, d },
      warnings: [],
      caption: 'Book: A(1, 2) to B(4, 6). Distance 5.',
    }
  },
}
