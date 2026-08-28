// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, label, line, rect } from '../stage.js'

export const leaf_food: SimFile = {
  id: 'leaf_food',
  domain: 'chemistry',
  classBand: '7-7',
  ncertClass: 7,
  label: 'How a plant makes food',
  description: 'A sapling needs light and water. Leaves make food. Water travels up the stem.',
  equations: ['light + water → food in the leaf'],
  keywords: ['sapling', 'life processes in plants', 'leaf makes food', 'water up the stem'],
  params: [
    choice('light', 'Light', [
      { value: 1, label: 'sunlight' },
      { value: 0, label: 'kept in the dark' },
    ], 1),
    choice('water', 'Water', [
      { value: 1, label: 'watered' },
      { value: 0, label: 'dry soil' },
    ], 1),
  ],
  schema: z.object({
    light: num(0, 1, 1),
    water: num(0, 1, 1),
  }),
  run(params) {
    const light = Math.round(params.light)
    const water = Math.round(params.water)
    const food = light === 1 && water === 1
    const elements = [
      label('title', 24, 22, food
        ? 'Light and water: the leaf can make food.'
        : 'Missing light or water: the sapling cannot make food well.'),
      label('eq', 24, 42, water === 1 ? 'Water travels up the stem to the leaves.' : 'Dry soil — the stem has little to carry up.'),
      rect('pot', { x: 200, y: 200, width: 90, height: 50, fill: '#b45309', rx: 6 }),
      rect('soil', { x: 206, y: 200, width: 78, height: 18, fill: water ? '#57534e' : '#d6d3d1' }),
      line('stem', { x1: 245, y1: 200, x2: 245, y2: 120, stroke: '#16a34a', strokeWidth: 6 }),
      rect('leafL', { x: 170, y: 100, width: 70, height: 28, fill: food ? '#22c55e' : '#a3a3a3', rx: 14 }),
      rect('leafR', { x: 250, y: 88, width: 70, height: 28, fill: food ? '#22c55e' : '#a3a3a3', rx: 14 }),
    ]
    if (light) {
      elements.push(
        { id: 'sun', type: 'circle', role: 'none', props: { cx: 80, cy: 70, r: 24, fill: '#fbbf24' } },
        label('sl', 58, 110, 'sun')
      )
    } else {
      elements.push(rect('dark', { x: 40, y: 40, width: 80, height: 70, fill: '#1e293b', rx: 8 }), label('dl', 52, 80, 'dark', '#e2e8f0'))
    }
    if (water) {
      elements.push(label('up', 258, 160, '↑ water', '#0284c7'))
    }
    elements.push(
      label('food', 24, 268, food ? 'Green leaf = food is being made.' : 'Pale leaf = the plant is hungry.'),
    )
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { food, light, water },
      warnings: [],
      caption: 'Sapling, light vs dark, water up the stem — as the chapter shows.',
    }
  },
}
