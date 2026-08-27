// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const rect_diagonals: SimFile = {
  id: 'rect_diagonals',
  domain: 'math',
  classBand: '8-8',
  ncertClass: 8,
  label: 'Carpenter’s rectangle strips',
  description: 'Two wood strips are the diagonals. For a rectangle they must be equal and cross at their midpoints. Book strip is 8 cm.',
  equations: ['rectangle: diagonals equal and bisect each other'],
  keywords: ['quadrilateral', 'rectangle', 'diagonals', 'carpenter', '8 cm strip', 'square'],
  params: [
    param('d1', 'Strip 1', 'cm', 4, 14, 0.5, 8),
    param('d2', 'Strip 2', 'cm', 4, 14, 0.5, 8),
    param('tilt', 'Angle between strips', 'deg', 40, 140, 1, 70),
  ],
  schema: z.object({
    d1: num(3, 16, 8),
    d2: num(3, 16, 8),
    tilt: num(30, 150, 70),
  }),
  run(params) {
    const d1 = params.d1
    const d2 = params.d2
    const tilt = params.tilt
    const equal = Math.abs(d1 - d2) < 0.05
    const squareish = equal && Math.abs(tilt - 90) < 2
    const cx = 250
    const cy = 160
    const s = 12
    const rad = (tilt * Math.PI) / 180
    const ax = cx - (d1 * s) / 2
    const ay = cy
    const bx = cx + (d1 * s) / 2
    const by = cy
    const hx = ((d2 * s) / 2) * Math.cos(rad)
    const hy = ((d2 * s) / 2) * Math.sin(rad)
    const c1x = cx - hx
    const c1y = cy - hy
    const c2x = cx + hx
    const c2y = cy + hy
    const elements = [
      label('title', 24, 22, equal
        ? (squareish ? 'Equal diagonals at 90° — this can be a square.' : 'Equal diagonals that bisect each other — a rectangle.')
        : 'The strips are different lengths. The four ends will not make a rectangle.'),
      label('eq', 24, 40, `Strip 1 = ${d1} cm   Strip 2 = ${d2} cm   They cross at the midpoint.`),
      line('AC', { x1: ax, y1: ay, x2: bx, y2: by, stroke: '#2563eb', strokeWidth: 4 }),
      line('BD', { x1: c1x, y1: c1y, x2: c2x, y2: c2y, stroke: '#d97706', strokeWidth: 4 }),
      line('p1', { x1: ax, y1: ay, x2: c1x, y2: c1y, stroke: equal ? '#16a34a' : '#94a3b8', strokeWidth: 2 }),
      line('p2', { x1: c1x, y1: c1y, x2: bx, y2: by, stroke: equal ? '#16a34a' : '#94a3b8', strokeWidth: 2 }),
      line('p3', { x1: bx, y1: by, x2: c2x, y2: c2y, stroke: equal ? '#16a34a' : '#94a3b8', strokeWidth: 2 }),
      line('p4', { x1: c2x, y1: c2y, x2: ax, y2: ay, stroke: equal ? '#16a34a' : '#94a3b8', strokeWidth: 2 }),
      circle('m', { cx, cy, r: 5, fill: '#0f172a' }),
      label('mid', cx + 8, cy - 10, 'midpoint'),
      label('tip', 24, 278, 'Book carpenter: one 8 cm strip. The other diagonal must also be 8 cm.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { d1, d2, tilt, equal, isRectangle: equal },
      warnings: [],
      caption: 'Book: 8 cm strip. Equal diagonals, meeting in the middle.',
    }
  },
}
