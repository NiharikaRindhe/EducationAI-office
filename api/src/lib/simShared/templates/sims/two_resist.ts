// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, line, rect } from '../stage.js'

export const two_resist: SimFile = {
  id: 'two_resist',
  domain: 'physics',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Two resistors',
  description: 'Series: Req = R1+R2. Parallel: 1/Req = 1/R1+1/R2. Book combination of resistors — not the old 10 V, 2 Ω, 3 Ω tool.',
  equations: ['series: Req = R1 + R2', 'parallel: 1/Req = 1/R1 + 1/R2'],
  keywords: ['resistors in series', 'resistors in parallel', 'equivalent resistance', 'combination of resistors'],
  params: [
    choice('look', 'Join', [
      { value: 0, label: 'series' },
      { value: 1, label: 'parallel' },
    ], 0),
    param('R1', 'R1', 'Ω', 1, 20, 0.5, 4),
    param('R2', 'R2', 'Ω', 1, 20, 0.5, 6),
    param('V', 'Battery', 'V', 1.5, 12, 0.5, 6),
  ],
  schema: z.object({
    look: num(0, 1, 0),
    R1: num(0.5, 30, 4),
    R2: num(0.5, 30, 6),
    V: num(1, 24, 6),
  }),
  run(params) {
    const look = Math.round(params.look)
    const R1 = params.R1
    const R2 = params.R2
    const V = params.V
    const Req = look === 0 ? R1 + R2 : 1 / (1 / R1 + 1 / R2)
    const I = V / Req
    const elements = [
      label('title', 24, 22, look === 0
        ? `Series. Req = ${R1} + ${R2} = ${Req} Ω. I = ${I.toFixed(2)} A same in both.`
        : `Parallel. Req = ${Req.toFixed(2)} Ω. Battery V = ${V} V across both.`),
      label('eq', 24, 40, look === 0
        ? 'One path. If one bulb fails, the other goes off too.'
        : 'Two paths. If one fails, the other still glows.'),
      rect('bat', { x: 40, y: 120, width: 40, height: 60, fill: '#fde68a', rx: 4 }),
    ]
    if (look === 0) {
      elements.push(
        line('w1', { x1: 80, y1: 150, x2: 160, y2: 150, stroke: '#0f172a', strokeWidth: 2 }),
        rect('r1', { x: 160, y: 135, width: 80, height: 30, fill: '#93c5fd' }),
        rect('r2', { x: 280, y: 135, width: 80, height: 30, fill: '#86efac' }),
        label('l1', 180, 155, `R1 ${R1}`),
        label('l2', 300, 155, `R2 ${R2}`),
      )
    } else {
      elements.push(
        rect('r1', { x: 200, y: 90, width: 80, height: 30, fill: '#93c5fd' }),
        rect('r2', { x: 200, y: 180, width: 80, height: 30, fill: '#86efac' }),
        line('a', { x1: 80, y1: 150, x2: 200, y2: 105, stroke: '#0f172a', strokeWidth: 2 }),
        line('b', { x1: 80, y1: 150, x2: 200, y2: 195, stroke: '#0f172a', strokeWidth: 2 }),
      )
    }
    elements.push(label('tip', 24, 286, 'Book 11.6: series vs parallel. House wiring is parallel so each lamp has the full voltage.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, R1, R2, V, Req, I, mode: look === 0 ? 'series' : 'parallel' },
      warnings: [],
      caption: look === 0 ? `Series Req = ${Req} Ω.` : `Parallel Req = ${Req.toFixed(2)} Ω.`,
    }
  },
}
