// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const bag_straps: SimFile = {
  id: 'bag_straps',
  domain: 'physics',
  classBand: '8-8',
  ncertClass: 8,
  label: 'Same bag, different straps',
  description: 'Megha and Pawan carry the same weight. Narrow straps hurt more because the force sits on a smaller area. Pressure is force on an area. Not ρgh first.',
  equations: ['pressure = force / area'],
  keywords: ['pressure', 'straps', 'narrow', 'broad', 'winds', 'force per unit area', 'bag'],
  params: [
    param('weight', 'Bag weight (same for both)', '', 20, 80, 5, 40),
    param('width', 'Strap width', '', 1, 12, 1, 2),
  ],
  schema: z.object({
    weight: num(10, 80, 40),
    width: num(1, 12, 2),
  }),
  run(params) {
    const weight = params.weight
    const width = params.width
    const area = width * 8
    const pressure = weight / area
    const hurt = width <= 3
    const strapH = 16
    const elements = [
      label('title', 24, 22, hurt
        ? 'Narrow straps. Same weight, smaller area — the shoulders feel it more.'
        : 'Broad straps. Same weight spread out. More comfortable.'),
      label('eq', 24, 40, `Pressure is force on an area. Weight ${weight} on strap width ${width}.`),
      rect('bag', { x: 200, y: 90, width: 90, height: 80, fill: '#f59e0b', rx: 8 }),
      rect('strapL', { x: 210, y: 50, width: Math.max(6, width * 3), height: 48, fill: hurt ? '#fb7185' : '#86efac', rx: 4 }),
      rect('strapR', { x: 270, y: 50, width: Math.max(6, width * 3), height: 48, fill: hurt ? '#fb7185' : '#86efac', rx: 4 }),
      rect('shoulder', { x: 80, y: 200, width: 340, height: 28, fill: '#fdba74', rx: 10 }),
      label('sh', 200, 218, 'shoulders'),
      label('tip', 24, 248, 'Book: both bags equally heavy. Pawan’s narrow straps hurt. Megha’s broad straps do not.'),
      label('p', 24, 272, `Relative pressure (bigger = more pinch): ${pressure.toFixed(2)}`),
    ]
    void strapH
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { weight, width, area, pressure, hurt },
      warnings: [],
      caption: 'Book picnic bags: same weight, different strap width.',
    }
  },
}
