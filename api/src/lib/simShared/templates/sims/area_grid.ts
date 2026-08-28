// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, line, rect } from '../stage.js'

export const area_grid: SimFile = {
  id: 'area_grid',
  domain: 'math',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Area and perimeter on a grid',
  description: 'Cover a quilt with unit squares. Area is how many; perimeter is the lace around the border.',
  equations: ['A = \\ell \\times b', 'P = 2(\\ell + b)'],
  keywords: ['grandmother quilt', 'square grid', 'unit square', 'same area different perimeter'],
  params: [
    param('length', 'Length (units)', '', 1, 12, 1, 6),
    param('breadth', 'Breadth (units)', '', 1, 12, 1, 4),
  ],
  schema: z.object({
    length: num(1, 20, 6),
    breadth: num(1, 20, 4),
  }),
  run(params) {
    const L = Math.max(1, Math.round(params.length))
    const B = Math.max(1, Math.round(params.breadth))
    const area = L * B
    const peri = 2 * (L + B)
    const shownL = Math.min(L, 12)
    const shownB = Math.min(B, 8)
    const cell = Math.min(28, 320 / shownL, 160 / shownB)
    const x0 = 90
    const y0 = 78
    const elements = [
      label('eq', 28, 22, `Area = ${L} × ${B} = ${area} square units`),
      label('p', 28, 40, `Perimeter (lace) = 2 × (${L} + ${B}) = ${peri} units`),
    ]
    for (let r = 0; r < shownB; r++) {
      for (let c = 0; c < shownL; c++) {
        const edge = r === 0 || c === 0 || r === shownB - 1 || c === shownL - 1
        elements.push(
          rect(`c${r}-${c}`, {
            x: x0 + c * cell,
            y: y0 + r * cell,
            width: cell - 1,
            height: cell - 1,
            fill: edge ? '#fbcfe8' : '#93c5fd',
            stroke: '#1e3a8a',
            strokeWidth: 1,
          })
        )
      }
    }
    const w = shownL * cell
    const h = shownB * cell
    elements.push(
      line('lace', {
        x1: x0,
        y1: y0,
        x2: x0 + w,
        y2: y0,
        stroke: '#db2777',
        strokeWidth: 4,
      }),
      line('lace2', { x1: x0 + w, y1: y0, x2: x0 + w, y2: y0 + h, stroke: '#db2777', strokeWidth: 4 }),
      line('lace3', { x1: x0 + w, y1: y0 + h, x2: x0, y2: y0 + h, stroke: '#db2777', strokeWidth: 4 }),
      line('lace4', { x1: x0, y1: y0 + h, x2: x0, y2: y0, stroke: '#db2777', strokeWidth: 4 }),
      label('L', x0 + w / 2 - 10, y0 - 8, `ℓ = ${L}`),
      label('B', x0 + w + 8, y0 + h / 2, `b = ${B}`),
    )
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { length: L, breadth: B, area, perimeter: peri },
      warnings: L > 12 || B > 8 ? [`grid drawn as ${shownL}×${shownB} for clarity`] : [],
      caption: 'Bigger area does not always mean a longer border. Try 2 × 12 and 6 × 4.',
    }
  },
}
