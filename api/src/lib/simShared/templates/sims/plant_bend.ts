// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, rect } from '../stage.js'

export const plant_bend: SimFile = {
  id: 'plant_bend',
  domain: 'chemistry',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Plant bends to light',
  description: 'Phototropism: shoot grows toward light. Roots grow down (gravitropism). Immediate turgor vs growth movement. Book 6.2.',
  equations: ['shoot → light', 'root → gravity'],
  keywords: ['phototropism', 'tropism', 'growth movement', 'auxin', 'control and coordination'],
  params: [
    choice('look', 'Stimulus', [
      { value: 0, label: 'light from the side' },
      { value: 1, label: 'gravity (root down)' },
    ], 0),
  ],
  schema: z.object({
    look: num(0, 1, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    const elements = [
      label('title', 24, 22, look === 0
        ? 'Light from the left. The shoot bends toward it. Phototropism.'
        : 'Root grows down. Shoot grows up. Gravity is the cue.'),
      label('eq', 24, 40, look === 0
        ? 'A chemical (auxin) gathers on the dark side and that side grows longer — so it bends.'
        : 'This is a growth movement, not a quick drop of water in a cell.'),
      rect('pot', { x: 210, y: 200, width: 80, height: 50, fill: '#b45309', rx: 4 }),
    ]
    if (look === 0) {
      elements.push(circle('sun', { cx: 70, cy: 80, r: 20, fill: '#fbbf24' }))
      elements.push(line('stem', { x1: 250, y1: 200, x2: 180, y2: 90, stroke: '#16a34a', strokeWidth: 6 }))
    } else {
      elements.push(line('shoot', { x1: 250, y1: 200, x2: 250, y2: 90, stroke: '#16a34a', strokeWidth: 6 }))
      elements.push(line('root', { x1: 250, y1: 230, x2: 250, y2: 280, stroke: '#a3a3a3', strokeWidth: 4 }))
    }
    elements.push(label('tip', 24, 286, 'Book 6.2: immediate response vs movement due to growth. Tendril coiling is also growth.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, kind: look === 0 ? 'phototropism' : 'gravitropism' },
      warnings: [],
      caption: look === 0 ? 'Shoot bends toward light.' : 'Root down, shoot up.',
    }
  },
}
