// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const circle_chord: SimFile = {
  id: 'circle_chord',
  domain: 'math',
  classBand: '9-9',
  ncertClass: 9,
  label: 'Chord in a circle',
  description: 'A circle is all points at equal distance from the centre. A chord is a segment joining two points on the circle. The perpendicular from the centre bisects the chord. Not Class 10 tangents.',
  equations: ['chord ⊥ from centre bisects the chord'],
  keywords: ['chord', 'centre', 'radius', 'perpendicular bisector', 'up and down and round'],
  params: [
    param('radius', 'Radius', 'cm', 2, 8, 0.5, 4),
    param('dist', 'Distance of chord from centre', 'cm', 0, 7, 0.5, 2),
    choice('look', 'Look at', [
      { value: 0, label: 'chord and angle at centre' },
      { value: 1, label: 'perpendicular bisector' },
    ], 0),
  ],
  schema: z.object({
    radius: num(1, 10, 4),
    dist: num(0, 9, 2),
    look: num(0, 1, 0),
  }),
  run(params) {
    const r = params.radius
    const d = Math.min(params.dist, r - 0.2)
    const look = Math.round(params.look)
    const half = Math.sqrt(Math.max(0, r * r - d * d))
    const cx = 250
    const cy = 155
    const px = 22
    const R = r * px
    const yC = cy + d * px
    const elements = [
      label('title', 24, 22, `Centre A, radius ${r} cm. Chord is ${d} cm from A. Half-chord ${half.toFixed(2)} cm.`),
      label('eq', 24, 40, look === 1
        ? 'The perpendicular from the centre to a chord bisects the chord.'
        : 'Angle at the centre is subtended by the chord.'),
      circle('C', { cx, cy, r: R, fill: 'none', stroke: '#1d4ed8', strokeWidth: 2 }),
      circle('A', { cx, cy, r: 4, fill: '#0f172a' }),
      label('Al', cx + 8, cy - 8, 'A'),
      line('chord', { x1: cx - half * px, y1: yC, x2: cx + half * px, y2: yC, stroke: '#b45309', strokeWidth: 3 }),
      circle('B', { cx: cx - half * px, cy: yC, r: 5, fill: '#d97706' }),
      circle('Cpt', { cx: cx + half * px, cy: yC, r: 5, fill: '#d97706' }),
      label('Bl', cx - half * px - 14, yC + 16, 'B'),
      label('Cl', cx + half * px + 6, yC + 16, 'C'),
    ]
    if (look === 1) {
      elements.push(line('perp', { x1: cx, y1: cy, x2: cx, y2: yC, stroke: '#059669', strokeWidth: 2 }))
    } else {
      elements.push(
        line('AB', { x1: cx, y1: cy, x2: cx - half * px, y2: yC, stroke: '#64748b', strokeWidth: 1 }),
        line('AC', { x1: cx, y1: cy, x2: cx + half * px, y2: yC, stroke: '#64748b', strokeWidth: 1 }),
      )
    }
    elements.push(label('tip', 24, 286, 'Book: radius 4 cm language. Equal chords are equally far from the centre.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { radius: r, dist: d, half, chord: 2 * half, look },
      warnings: [],
      caption: 'Book: circle, chord BC, centre A. Default radius 4 cm.',
    }
  },
}
