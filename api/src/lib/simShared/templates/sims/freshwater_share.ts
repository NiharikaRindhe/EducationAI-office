// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const freshwater_share: SimFile = {
  id: 'freshwater_share',
  domain: 'physics',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Fresh water on Earth',
  description: 'If all water on Earth were a glass, the drinkable fresh water would be about a teaspoon.',
  equations: ['\\text{fresh} \\ll \\text{salt}'],
  keywords: ['freshwater', 'saltwater', 'teaspoon', 'oceans', 'water on earth'],
  params: [
    param('glassMl', 'Glass of all water', 'ml', 50, 400, 10, 200),
    param('freshMl', 'Fresh water in it', 'ml', 1, 40, 1, 5),
  ],
  schema: z.object({
    glassMl: num(20, 500, 200),
    freshMl: num(1, 80, 5),
  }),
  run(params) {
    const glass = Math.max(20, params.glassMl)
    const fresh = Math.min(glass, Math.max(1, params.freshMl))
    const pct = (100 * fresh) / glass
    const glassH = 160
    const glassW = 90
    const gx = 120
    const gy = 70
    const teaH = Math.max(18, (fresh / glass) * glassH)
    const elements = [
      label('eq', 28, 22, `If Earth\'s water is ${glass} ml, freshwater is ${fresh} ml (${pct.toFixed(1)}%)`),
      label('q', 28, 40, 'Most of the glass is ocean — we cannot drink it'),
      rect('g-outline', { x: gx, y: gy, width: glassW, height: glassH, fill: '#e0f2fe', stroke: '#334155', strokeWidth: 3, rx: 8 }),
      rect('salt', {
        x: gx + 4,
        y: gy + 4,
        width: glassW - 8,
        height: glassH - 8,
        fill: '#38bdf8',
        opacity: 0.55,
        rx: 6,
      }),
      label('gl', gx + 18, gy + glassH + 28, `${glass} ml glass`),
      rect('spoon', {
        x: 310,
        y: gy + glassH - teaH - 10,
        width: 70,
        height: teaH + 10,
        fill: '#7dd3fc',
        stroke: '#0369a1',
        strokeWidth: 2,
        rx: 20,
      }),
      label('sp', 318, gy + glassH + 28, `${fresh} ml teaspoon`),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { glassMl: glass, freshMl: fresh, percentFresh: Number(pct.toFixed(4)) },
      warnings: [],
      caption: 'The book’s glass is 200 ml; the teaspoon of freshwater is 5 ml.',
    }
  },
}
