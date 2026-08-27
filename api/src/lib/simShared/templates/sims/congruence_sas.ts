// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const congruence_sas: SimFile = {
  id: 'congruence_sas',
  domain: 'math',
  classBand: '7-7',
  ncertClass: 7,
  label: 'Matching twins (SAS)',
  description: 'Copy a triangle using two sides and the corner between them. Book signboard: AB = 4 cm, BC = 8 cm, angle ABC = 80°.',
  equations: ['SAS: two sides and the included angle'],
  keywords: ['congruence', 'SAS', 'geometric twins', '4 cm', '8 cm', '80°'],
  params: [
    param('ab', 'Side AB', 'cm', 2, 10, 1, 4),
    param('bc', 'Side BC', 'cm', 3, 12, 1, 8),
    param('angleB', 'Corner B', 'deg', 20, 140, 1, 80),
  ],
  schema: z.object({
    ab: num(1, 12, 4),
    bc: num(2, 14, 8),
    angleB: num(15, 160, 80),
  }),
  run(params) {
    const ab = Math.round(params.ab)
    const bc = Math.round(params.bc)
    const ang = Math.round(params.angleB)
    const rad = (ang * Math.PI) / 180
    const s = 18
    function tri(ox: number, oy: number, color: string, prefix: string) {
      const Bx = ox
      const By = oy
      const Cx = ox + bc * s
      const Cy = oy
      // BA leaves BC at angle `ang` (included angle at B).
      const Ax = ox + ab * s * Math.cos(rad)
      const Ay = oy - ab * s * Math.sin(rad)
      return [
        line(`${prefix}bc`, { x1: Bx, y1: By, x2: Cx, y2: Cy, stroke: color, strokeWidth: 3 }),
        line(`${prefix}ba`, { x1: Bx, y1: By, x2: Ax, y2: Ay, stroke: color, strokeWidth: 3 }),
        line(`${prefix}ac`, { x1: Ax, y1: Ay, x2: Cx, y2: Cy, stroke: color, strokeWidth: 2 }),
        circle(`${prefix}b`, { cx: Bx, cy: By, r: 4, fill: '#0f172a' }),
        circle(`${prefix}a`, { cx: Ax, cy: Ay, r: 4, fill: '#0f172a' }),
        circle(`${prefix}c`, { cx: Cx, cy: Cy, r: 4, fill: '#0f172a' }),
        label(`${prefix}lb`, Bx - 6, By + 18, 'B'),
        label(`${prefix}la`, Ax - 12, Ay - 6, 'A'),
        label(`${prefix}lc`, Cx + 4, Cy + 18, 'C'),
      ]
    }
    const elements = [
      label('title', 24, 22, `Copy with SAS: AB = ${ab} cm, BC = ${bc} cm, ∠B = ${ang}°`),
      label('eq', 24, 40, 'The copy is a twin — same shape, same size. Not Pythagoras.'),
      ...tri(70, 230, '#2563eb', 'p'),
      ...tri(280, 230, '#16a34a', 'q'),
      label('orig', 90, 268, 'signboard'),
      label('copy', 310, 268, 'replica'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { ab, bc, angleB: ang, included: ang },
      warnings: [],
      caption: 'Two sides and the corner squeezed between them are enough to make a twin.',
    }
  },
}
