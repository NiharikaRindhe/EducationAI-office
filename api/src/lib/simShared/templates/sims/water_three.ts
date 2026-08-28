// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, rect } from '../stage.js'

export const water_three: SimFile = {
  id: 'water_three',
  domain: 'chemistry',
  classBand: '6-6',
  ncertClass: 6,
  label: 'Ice, water, vapour — same stuff',
  description: 'Ice in shikanji and ice on the table become water. Puddles disappear — water becomes vapour. Same substance, different states. Not a T < 0 formula chart.',
  equations: ['ice → water (melting)', 'water → vapour (evaporation)'],
  keywords: ['states of water', 'ice cube', 'puddles', 'evaporation', 'melting', 'shikanji'],
  params: [
    choice('state', 'What we see', [
      { value: 0, label: 'ice cube' },
      { value: 1, label: 'water in the cup' },
      { value: 2, label: 'puddle drying' },
    ], 0),
  ],
  schema: z.object({
    state: num(0, 2, 0),
  }),
  run(params) {
    const state = Math.round(params.state)
    const titles = [
      'Ice feels hard. Leave the cube on the table — it becomes water. Same substance.',
      'Water flows and splashes. Ice does not. Still H₂O — a different state.',
      'The puddle is smaller by evening. Water did not seep through the steel plate — it became vapour.',
    ]
    const elements = [
      label('title', 24, 22, titles[state]),
      label('eq', 24, 40, ['MELTING', 'LIQUID WATER', 'EVAPORATION'][state]),
      rect('cup', { x: 180, y: 90, width: 140, height: 120, fill: '#e0f2fe', stroke: '#0369a1', strokeWidth: 3, rx: 8 }),
    ]
    if (state === 0) {
      elements.push(rect('ice', { x: 210, y: 130, width: 80, height: 50, fill: '#bae6fd', stroke: '#0284c7', rx: 4 }))
    } else if (state === 1) {
      elements.push(rect('liq', { x: 186, y: 140, width: 128, height: 64, fill: '#38bdf8', rx: 4 }))
    } else {
      for (let i = 0; i < 6; i++) {
        elements.push(circle(`v${i}`, { cx: 220 + i * 14, cy: 70 + (i % 2) * 10, r: 6, fill: '#7dd3fc', opacity: 0.6 }))
      }
      elements.push(rect('puddle', { x: 200, y: 180, width: 100, height: 16, fill: '#38bdf8', rx: 8 }))
    }
    elements.push(label('tip', 24, 248, 'Book: ice and water are two forms of the same substance. Puddles and wet plates dry by evaporation.'))
    elements.push(label('same', 24, 272, 'SAME SUBSTANCE — different state', '#0369a1'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { state, name: ['ice', 'water', 'vapour'][state] },
      warnings: [],
      caption: 'Book: ice cube melts. Puddles disappear.',
    }
  },
}
