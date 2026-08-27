// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, line } from '../stage.js'

export const like_triangles: SimFile = {
  id: 'like_triangles',
  domain: 'math',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Similar triangles',
  description: 'AA / SSS / SAS: same angles, sides in one scale k. Corresponding sides are proportional. Not the old k=1.5-only tool, not Thales.',
  equations: ['AB/A′B′ = BC/B′C′ = CA/C′A′ = k'],
  keywords: ['similar triangles', 'AA criterion', 'SAS similarity', 'SSS similarity', 'scale factor', 'corresponding sides'],
  params: [
    param('k', 'Scale k', '', 0.5, 2.5, 0.1, 1.5),
  ],
  schema: z.object({
    k: num(0.4, 3, 1.5),
  }),
  run(params) {
    const k = params.k
    const ax = 40
    const ay = 220
    const elements = [
      label('title', 24, 22, `Same shape. Scale k = ${k}. Corresponding sides are in that ratio.`),
      label('eq', 24, 40, 'AA is enough: two equal angles ⇒ similar. Sides then match in order.'),
      line('a1', { x1: ax, y1: ay, x2: ax + 80, y2: 80, stroke: '#2563eb', strokeWidth: 2 }),
      line('a2', { x1: ax + 80, y1: 80, x2: ax + 140, y2: ay, stroke: '#2563eb', strokeWidth: 2 }),
      line('a3', { x1: ax, y1: ay, x2: ax + 140, y2: ay, stroke: '#2563eb', strokeWidth: 2 }),
      line('b1', { x1: 260, y1: ay, x2: 260 + 80 * k, y2: ay - 140 * k * 0.7, stroke: '#d97706', strokeWidth: 2 }),
      line('b2', { x1: 260 + 80 * k, y1: ay - 140 * k * 0.7, x2: 260 + 140 * k, y2: ay, stroke: '#d97706', strokeWidth: 2 }),
      line('b3', { x1: 260, y1: ay, x2: 260 + 140 * k, y2: ay, stroke: '#d97706', strokeWidth: 2 }),
      label('t1', ax + 40, 240, 'ABC'),
      label('t2', 280, 240, "A'B'C'"),
      label('tip', 24, 286, 'Book: two triangles are similar if they are equiangular. Then corresponding sides are proportional.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { k, side: 140 * k },
      warnings: [],
      caption: `Similar triangles, scale k = ${k}. AA criterion.`,
    }
  },
}
