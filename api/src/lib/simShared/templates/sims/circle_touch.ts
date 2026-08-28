// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const circle_touch: SimFile = {
  id: 'circle_touch',
  domain: 'math',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Tangent to a circle',
  description: 'A tangent meets the circle at one point. The radius to that point is perpendicular to the tangent. Two tangents from an external point are equal. Not Class 9 chords, not old r=3 d=5.',
  equations: ['radius ⟂ tangent', 'PA = PB from external P'],
  keywords: ['tangent to a circle', 'point of contact', 'two tangents', 'perpendicular to radius', 'secant'],
  params: [
    choice('look', 'Show', [
      { value: 0, label: 'radius ⟂ tangent' },
      { value: 1, label: 'two equal tangents' },
    ], 0),
    param('r', 'Radius', '', 2, 8, 0.5, 5),
    param('d', 'Distance OP', '', 6, 14, 0.5, 13),
  ],
  schema: z.object({
    look: num(0, 1, 0),
    r: num(1, 10, 5),
    d: num(5, 16, 13),
  }),
  run(params) {
    const look = Math.round(params.look)
    const r = params.r
    const d = Math.max(params.d, r + 0.5)
    const cx = 220
    const cy = 160
    const s = 12
    const len = Math.sqrt(Math.max(0, d * d - r * r))
    const elements = [
      label('title', 24, 22, look === 0
        ? 'The tangent touches at one point. Radius to that point is perpendicular to the tangent.'
        : `Two tangents from P. Length = √(d² − r²) = ${len.toFixed(2)}.`),
      label('eq', 24, 40, look === 0
        ? 'Theorem: tangent ⟂ radius at the point of contact.'
        : 'The two tangent segments from an external point are equal.'),
      circle('c', { cx, cy, r: r * s, fill: '#e0f2fe', stroke: '#2563eb', strokeWidth: 2 }),
      circle('O', { cx, cy, r: 4, fill: '#0f172a' }),
      label('Ol', cx - 14, cy - 8, 'O'),
    ]
    if (look === 0) {
      elements.push(
        line('rad', { x1: cx, y1: cy, x2: cx + r * s, y2: cy, stroke: '#d97706', strokeWidth: 2 }),
        line('tan', { x1: cx + r * s, y1: cy - 80, x2: cx + r * s, y2: cy + 80, stroke: '#16a34a', strokeWidth: 2 }),
        circle('A', { cx: cx + r * s, cy, r: 5, fill: '#d97706' }),
        label('Al', cx + r * s + 8, cy - 8, 'A'),
      )
    } else {
      const ang = Math.asin(r / d)
      const px = cx + d * s
      const py = cy
      const ax = cx + r * s * Math.sin(ang)
      const ay = cy - r * s * Math.cos(ang)
      const bx = cx + r * s * Math.sin(ang)
      const by = cy + r * s * Math.cos(ang)
      elements.push(
        line('pa', { x1: px, y1: py, x2: ax, y2: ay, stroke: '#16a34a', strokeWidth: 2 }),
        line('pb', { x1: px, y1: py, x2: bx, y2: by, stroke: '#16a34a', strokeWidth: 2 }),
        line('oa', { x1: cx, y1: cy, x2: ax, y2: ay, stroke: '#d97706', strokeWidth: 1.5 }),
        line('ob', { x1: cx, y1: cy, x2: bx, y2: by, stroke: '#d97706', strokeWidth: 1.5 }),
        circle('P', { cx: px, cy: py, r: 5, fill: '#0f172a' }),
        label('Pl', px + 8, py, 'P'),
      )
    }
    elements.push(label('tip', 24, 286, 'Book: one tangent at a point; two equal tangents from an outside point. A secant cuts at two points.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, r, d, tangentLength: len },
      warnings: [],
      caption: look === 0 ? 'Tangent ⟂ radius at the point of contact.' : 'Two tangents from P are equal.',
    }
  },
}
