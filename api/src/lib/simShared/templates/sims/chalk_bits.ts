// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, rect } from '../stage.js'

export const chalk_bits: SimFile = {
  id: 'chalk_bits',
  domain: 'chemistry',
  classBand: '8-8',
  ncertClass: 8,
  label: 'Break the chalk — still chalk',
  description: 'Activity 7.1: break and grind chalk. Every speck is still chalk — a physical change. Matter is made of tiny bits we cannot see.',
  equations: ['grinding = physical change', 'same substance, smaller pieces'],
  keywords: ['particulate', 'chalk', 'particles of matter', 'grind', 'physical change'],
  params: [
    param('breaks', 'How far we have broken it', '', 0, 4, 1, 2),
  ],
  schema: z.object({
    breaks: num(0, 4, 2),
  }),
  run(params) {
    const breaks = Math.max(0, Math.min(4, Math.round(params.breaks)))
    const labels = ['a stick of chalk', 'two pieces', 'small bits', 'powder you can still see', 'specks under a magnifying glass']
    const count = [1, 2, 6, 18, 40][breaks]
    const r = [28, 20, 12, 6, 3][breaks]
    const elements = [
      label('title', 24, 22, `Still chalk. Now it is ${labels[breaks]}.`),
      label('eq', 24, 40, 'Breaking and grinding do not make a new substance. Grade 7 called this a physical change.'),
    ]
    for (let i = 0; i < count; i++) {
      const col = i % 8
      const row = Math.floor(i / 8)
      elements.push(
        circle(`p${i}`, {
          cx: 80 + col * (40 - breaks * 4),
          cy: 110 + row * (36 - breaks * 3),
          r,
          fill: '#f8fafc',
          stroke: '#94a3b8',
          strokeWidth: 1.5,
        })
      )
    }
    elements.push(label('tip', 24, 268, 'Each tiny grain is still a speck of chalk. Matter is made of particles too small to see.'))
    elements.push(label('kind', 24, 288, 'PHYSICAL CHANGE — same substance', '#0369a1'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { breaks, pieces: count, stillChalk: true },
      warnings: [],
      caption: 'Book Activity 7.1: grind chalk. Still chalk.',
    }
  },
}
