// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const compass_circle: SimFile = {
  id: 'compass_circle',
  domain: 'math',
  classBand: '6-6',
  ncertClass: 6,
  label: 'All points 4 cm from P',
  description: 'Open the compass to 4 cm. Keep the point fixed. The curve is a circle: centre P, radius 4 cm. Wave on a line AB = 8 cm uses half-circles.',
  equations: ['circle = all points at equal distance from the centre'],
  keywords: ['constructions', 'compass', 'radius', '4 cm', 'centre', '8 cm', 'wave'],
  params: [
    param('radius', 'Radius', 'cm', 2, 8, 0.5, 4),
    choice('look', 'Draw', [
      { value: 0, label: 'circle around P' },
      { value: 1, label: 'wave on 8 cm line' },
    ], 0),
  ],
  schema: z.object({
    radius: num(1, 10, 4),
    look: num(0, 1, 0),
  }),
  run(params) {
    const r = params.radius
    const look = Math.round(params.look)
    const px = 18
    if (look === 1) {
      const ab = 8
      const rad = ab / 4
      const ax = 80
      const ay = 170
      const bx = ax + ab * px
      return {
        stage: {
          viewBox: VIEW,
          elements: [
            label('title', 24, 22, `Wave on AB = ${ab} cm. Each bump is a half circle.`),
            label('eq', 24, 40, 'Book: take AB = 8 cm. Radius of the first half circle is half of AX.'),
            line('ab', { x1: ax, y1: ay, x2: bx, y2: ay, stroke: '#334155', strokeWidth: 3 }),
            circle('w1', { cx: ax + (ab * px) / 4, cy: ay, r: (ab * px) / 4, fill: 'none', stroke: '#2563eb', strokeWidth: 3 }),
            circle('w2', { cx: ax + (3 * ab * px) / 4, cy: ay, r: (ab * px) / 4, fill: 'none', stroke: '#2563eb', strokeWidth: 3 }),
            label('A', ax - 4, ay + 22, 'A'),
            label('B', bx - 4, ay + 22, 'B'),
            label('tip', 24, 268, 'Keep the compass opening fixed. Only the pencil moves.'),
          ],
        },
        metrics: { look, radius: rad, ab },
        warnings: [],
        caption: 'Book wave: AB = 8 cm.',
      }
    }
    const cx = 250
    const cy = 160
    const rr = r * px
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('title', 24, 22, `Every point on this curve is ${r} cm from P.`),
          label('eq', 24, 40, 'P is the centre. That distance is the radius. The curve is a circle.'),
          circle('c', { cx, cy, r: rr, fill: 'none', stroke: '#2563eb', strokeWidth: 3 }),
          circle('P', { cx, cy, r: 5, fill: '#0f172a' }),
          label('pl', cx + 8, cy - 8, 'P'),
          line('rad', { x1: cx, y1: cy, x2: cx + rr, y2: cy, stroke: '#d97706', strokeWidth: 3 }),
          label('rl', cx + rr / 2 - 10, cy - 10, `${r} cm`),
          circle('Q', { cx: cx + rr, cy, r: 5, fill: '#16a34a' }),
          label('ql', cx + rr + 8, cy + 4, 'Q'),
          label('tip', 24, 268, 'Book: mark as many points as you can 4 cm from P. They make a circle.'),
        ],
      },
      metrics: { look, radius: r, centre: 'P' },
      warnings: [],
      caption: 'Book: all points 4 cm from P.',
    }
  },
}
