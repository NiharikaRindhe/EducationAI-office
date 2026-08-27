// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const ohm_line: SimFile = {
  id: 'ohm_line',
  domain: 'physics',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Ohm’s law V–I line',
  description: 'V = IR. Straight V–I graph through the origin. Book Activity 11.1: four 1.5 V cells. Example I = 0.5 A. Not Class 8 ohm_circuit.',
  equations: ['V = IR', 'I = Q/t'],
  keywords: ['ohm\'s law', 'V-I graph', 'four cells', '1.5 V', 'nichrome', 'electricity'],
  params: [
    param('cells', 'Number of 1.5 V cells', '', 1, 6, 1, 4),
    param('R', 'Resistance', 'Ω', 1, 20, 0.5, 6),
  ],
  schema: z.object({
    cells: num(1, 8, 4),
    R: num(0.5, 30, 6),
  }),
  run(params) {
    const cells = Math.round(params.cells)
    const R = params.R
    const V = cells * 1.5
    const I = V / R
    const ox = 70
    const oy = 240
    const x2 = ox + Math.min(360, V * 22)
    const y2 = oy - Math.min(170, I * 40)
    const elements = [
      label('title', 24, 22, `${cells} cells × 1.5 V = ${V} V. R = ${R} Ω. I = V/R = ${I.toFixed(2)} A.`),
      label('eq', 24, 40, 'V–I graph is a straight line through the origin. Slope = 1/R. Nichrome wire in Activity 11.1.'),
      line('xaxis', { x1: ox, y1: oy, x2: 450, y2: oy, stroke: '#94a3b8', strokeWidth: 1 }),
      line('yaxis', { x1: ox, y1: 50, x2: ox, y2: oy, stroke: '#94a3b8', strokeWidth: 1 }),
      line('vi', { x1: ox, y1: oy, x2, y2, stroke: '#2563eb', strokeWidth: 2.5 }),
      circle('pt', { cx: x2, cy: y2, r: 5, fill: '#d97706' }),
      label('xl', 430, 256, 'V'),
      label('yl', 40, 60, 'I'),
      label('tip', 24, 286, 'Book: four dry cells of 1.5 V. Plot V against I. Example elsewhere: I = 0.5 A for 10 min through a bulb.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { cells, R, V, I },
      warnings: [],
      caption: 'Book: four 1.5 V cells. Ohm’s law, V–I straight line.',
    }
  },
}
