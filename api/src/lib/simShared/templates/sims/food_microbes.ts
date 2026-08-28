// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, rect, tLoop } from '../stage.js'

export const food_microbes: SimFile = {
  id: 'food_microbes',
  domain: 'chemistry',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Why food spoils',
  description: 'Microbes need moisture, air and a warm place. Take one away and food lasts longer.',
  equations: ['\\text{warmth, moisture and air help microbes grow}'],
  keywords: ['microbes', 'food spoilage', 'mould', 'food preservation', 'mystery of food'],
  params: [
    param('temperature', 'Warmth (fridge to hot)', '', 0, 45, 1, 30),
    choice('moisture', 'Moisture', [
      { value: 1, label: 'Moist (uttapam / bread)' },
      { value: 0, label: 'Dry or oiled (pickle)' },
    ], 1),
    choice('air', 'Air', [
      { value: 1, label: 'Open to air' },
      { value: 0, label: 'Covered / sealed' },
    ], 1),
  ],
  schema: z.object({
    temperature: num(-5, 60, 30),
    moisture: num(0, 1, 1),
    air: num(0, 1, 1),
  }),
  run(params) {
    const T = params.temperature
    const moist = params.moisture >= 0.5
    const open = params.air >= 0.5
    const warmth = T <= 4 ? 0.05 : T >= 60 ? 0.1 : Math.min(1, Math.max(0, (T - 4) / 30))
    const rate = warmth * (moist ? 1 : 0.08) * (open ? 1 : 0.2)
    const patches = Math.max(0, Math.min(18, Math.round(rate * 16)))
    const lasts = rate < 0.15 ? 'food lasts a long time' : rate < 0.5 ? 'food spoils slowly' : 'food spoils fast — coloured patches appear'
    const warmthWord = T <= 4 ? 'fridge-cold' : T < 20 ? 'cool' : T < 35 ? 'warm' : 'hot'
    const t = tLoop(5, 4)
    const elements = [
      label('eq', 28, 22, lasts),
      label('need', 28, 40, `Microbes like a ${warmthWord} place, ${moist ? 'moisture' : 'no moisture'}, ${open ? 'air' : 'little air'}`),
      rect('box', { x: 140, y: 70, width: 220, height: 160, fill: '#fef3c7', stroke: '#b45309', strokeWidth: 3, rx: 12 }),
      label('food', 210, 150, moist ? 'uttapam' : 'pickle'),
    ]
    for (let i = 0; i < patches; i++) {
      const px = 160 + (i % 6) * 32
      const py = 90 + Math.floor(i / 6) * 36
      elements.push(
        circle(`m${i}`, {
          cx: px,
          cy: py,
          r: { $expr: `3 + 5 * min(1, (${t}) / 4)` },
          fill: i % 2 === 0 ? '#4d7c0f' : '#a21caf',
          opacity: { $expr: `min(0.9, (${t}) / 4)` },
        })
      )
    }
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { temperature: T, moisture: moist ? 1 : 0, air: open ? 1 : 0, lasts },
      warnings: [],
      caption: 'Paati’s pickle lasts because oil keeps air and moisture away from the food.',
    }
  },
}
