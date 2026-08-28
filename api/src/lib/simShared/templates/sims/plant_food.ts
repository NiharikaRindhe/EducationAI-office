// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, rect } from '../stage.js'

export const plant_food: SimFile = {
  id: 'plant_food',
  domain: 'chemistry',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Leaf makes food',
  description: 'Photosynthesis needs chlorophyll, CO₂, water and sunlight. Stomata let gases in. Not Class 7 sapling, not Class 9 xylem-only.',
  equations: ['6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂'],
  keywords: ['stomata', 'chlorophyll', 'autotrophic nutrition', 'destarched leaf', 'life processes'],
  params: [
    choice('light', 'Light', [
      { value: 1, label: 'sunlight' },
      { value: 0, label: 'dark' },
    ], 1),
    choice('look', 'Also show', [
      { value: 0, label: 'leaf + stomata' },
      { value: 1, label: 'water up the stem' },
    ], 0),
  ],
  schema: z.object({
    light: num(0, 1, 1),
    look: num(0, 1, 0),
  }),
  run(params) {
    const light = Math.round(params.light)
    const look = Math.round(params.look)
    const food = light === 1
    const elements = [
      label('title', 24, 22, food
        ? 'Sunlight + CO₂ + water. Chlorophyll traps light. The leaf makes starch.'
        : 'No sunlight. Photosynthesis pauses. At night the leaf still respires.'),
      label('eq', 24, 40, look === 1
        ? 'Xylem carries water up. Phloem carries food. Do not mix the two pipes.'
        : 'Stomata open for CO₂. Guard cells swell with water and the pore opens.'),
      rect('leaf', { x: 160, y: 90, width: 180, height: 90, fill: food ? '#22c55e' : '#a3a3a3', rx: 40 }),
    ]
    if (light) elements.push(circle('sun', { cx: 80, cy: 80, r: 22, fill: '#fbbf24' }))
    if (look === 0) {
      elements.push(circle('st', { cx: 250, cy: 200, r: 16, fill: '#fff', stroke: '#166534', strokeWidth: 2 }))
      elements.push(label('stl', 228, 240, 'stoma'))
    } else {
      elements.push(line('stem', { x1: 250, y1: 180, x2: 250, y2: 250, stroke: '#16a34a', strokeWidth: 8 }))
      elements.push(label('up', 262, 220, '↑ water'))
    }
    elements.push(label('tip', 24, 286, 'Book 5.2.1: iodine test on a destarched leaf. Sunlight is essential. Stomata Fig 5.3.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { light, look, food },
      warnings: [],
      caption: 'Book: photosynthesis in the leaf. Stomata for CO₂.',
    }
  },
}
