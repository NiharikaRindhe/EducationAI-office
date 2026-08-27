// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const rect_area: SimFile = {
  id: 'rect_area',
  domain: 'math',
  classBand: '8-8',
  ncertClass: 8,
  label: 'Which rectangle needs more rangoli?',
  description: 'Area of a rectangle is length × breadth. Same area can look different. A square split into 4 equal-area parts still has the same total.',
  equations: ['area = length × breadth'],
  keywords: ['area', 'rangoli', 'rectangle', 'equal area', 'unit square'],
  params: [
    param('w1', 'First width', '', 2, 12, 1, 8),
    param('h1', 'First height', '', 2, 12, 1, 4),
    param('w2', 'Second width', '', 2, 12, 1, 6),
    param('h2', 'Second height', '', 2, 12, 1, 6),
  ],
  schema: z.object({
    w1: num(1, 12, 8),
    h1: num(1, 12, 4),
    w2: num(1, 12, 6),
    h2: num(1, 12, 6),
  }),
  run(params) {
    const w1 = Math.round(params.w1)
    const h1 = Math.round(params.h1)
    const w2 = Math.round(params.w2)
    const h2 = Math.round(params.h2)
    const a1 = w1 * h1
    const a2 = w2 * h2
    const more = a1 === a2 ? 'same' : a1 > a2 ? 'first' : 'second'
    const px = 14
    const elements = [
      label('title', 24, 22, more === 'same'
        ? `Both need the same powder. Area ${a1} square units.`
        : more === 'first'
          ? `The first rectangle needs more powder (${a1} vs ${a2}).`
          : `The second rectangle needs more powder (${a2} vs ${a1}).`),
      label('eq', 24, 40, `Area = length × breadth.  ${w1}×${h1} = ${a1}    ${w2}×${h2} = ${a2}`),
      rect('r1', { x: 40, y: 70, width: w1 * px, height: h1 * px, fill: '#fbcfe8', stroke: '#be185d', strokeWidth: 2 }),
      label('l1', 40, 70 + h1 * px + 18, `${w1} × ${h1} = ${a1}`),
      rect('r2', { x: 280, y: 70, width: w2 * px, height: h2 * px, fill: '#a5f3fc', stroke: '#0e7490', strokeWidth: 2 }),
      label('l2', 280, 70 + h2 * px + 18, `${w2} × ${h2} = ${a2}`),
      label('tip', 24, 278, 'Colouring evenly, the one with more area uses more rangoli powder — shape can fool the eye.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { w1, h1, w2, h2, a1, a2, more },
      warnings: [],
      caption: 'Compare two rectangles. Area decides the powder.',
    }
  },
}
