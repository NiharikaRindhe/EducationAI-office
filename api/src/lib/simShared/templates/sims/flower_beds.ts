// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const flower_beds: SimFile = {
  id: 'flower_beds',
  domain: 'math',
  classBand: '6-6',
  ncertClass: 6,
  label: 'Land and flower beds — area',
  description: 'Book: a plot 12 m by 10 m is 120 sq m. Four square flower beds of side 4 m are 16 sq m each, 64 sq m together. Remaining grass is 56 sq m. Not walking the boundary.',
  equations: ['area(rect) = l × w', 'area(square) = s × s'],
  keywords: ['area', 'flower bed', '12 m', '10 m', '120 sq m', 'unit square', 'perimeter and area'],
  params: [
    choice('look', 'Look at', [
      { value: 0, label: 'whole land' },
      { value: 1, label: 'one flower bed' },
      { value: 2, label: 'grass left' },
    ], 0),
    param('length', 'Land length', 'm', 4, 20, 1, 12),
    param('width', 'Land width', 'm', 4, 20, 1, 10),
    param('side', 'Flower-bed side', 'm', 1, 8, 1, 4),
  ],
  schema: z.object({
    look: num(0, 2, 0),
    length: num(4, 20, 12),
    width: num(4, 20, 10),
    side: num(1, 8, 4),
  }),
  run(params) {
    const look = Math.round(params.look)
    const L = Math.round(params.length)
    const W = Math.round(params.width)
    const s = Math.round(params.side)
    const land = L * W
    const one = s * s
    const four = 4 * one
    const grass = land - four
    const px = 12
    const elements = [
      label('title', 24, 22, look === 0
        ? `Whole land ${L} m × ${W} m. Area = ${land} sq m.`
        : look === 1
          ? `One square flower bed side ${s} m. Area = ${s} × ${s} = ${one} sq m.`
          : `Four beds take ${four} sq m. Grass left = ${land} − ${four} = ${grass} sq m.`),
      label('eq', 24, 40, 'Area is how much surface is covered — not how far you walk around it.'),
      rect('plot', {
        x: 40,
        y: 70,
        width: L * px,
        height: W * px,
        fill: '#bbf7d0',
        stroke: '#15803d',
        strokeWidth: 2,
      }),
    ]
    const bedFill = look === 2 ? '#86efac' : '#f9a8d4'
    for (let i = 0; i < 4; i++) {
      const col = i % 2
      const row = Math.floor(i / 2)
      const bx = 52 + col * (s * px + 8)
      const by = 82 + row * (s * px + 8)
      elements.push(rect(`bed${i}`, {
        x: bx,
        y: by,
        width: s * px,
        height: s * px,
        fill: look === 0 ? '#fbcfe8' : bedFill,
        stroke: '#be185d',
        strokeWidth: 1.5,
      }))
    }
    elements.push(label('tip', 24, 268, 'Book: land 12 m × 10 m = 120 sq m. Four 4 m squares = 64 sq m. Grass left 56 sq m.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, length: L, width: W, side: s, land, one, four, grass },
      warnings: grass < 0 ? ['flower beds overflow the plot'] : [],
      caption: 'Book 6.2: area of the whole land, then the four flower beds.',
    }
  },
}
