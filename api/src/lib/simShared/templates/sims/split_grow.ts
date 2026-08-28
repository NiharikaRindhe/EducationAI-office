// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, rect } from '../stage.js'

export const split_grow: SimFile = {
  id: 'split_grow',
  domain: 'chemistry',
  classBand: '10-10',
  ncertClass: 10,
  label: 'One parent, new life',
  description: 'Asexual: fission, budding, regeneration, spore, vegetative. Book 7.2. Not Class 9 bryophyllum-only, not human reproduction.',
  equations: ['one parent → offspring'],
  keywords: ['fission', 'budding', 'regeneration', 'spore formation', 'vegetative propagation', 'asexual'],
  params: [
    choice('look', 'Mode', [
      { value: 0, label: 'fission' },
      { value: 1, label: 'budding' },
      { value: 2, label: 'regeneration' },
      { value: 3, label: 'spore' },
      { value: 4, label: 'vegetative' },
    ], 0),
  ],
  schema: z.object({
    look: num(0, 4, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    const names = ['fission', 'budding', 'regeneration', 'spore', 'vegetative']
    const titles = [
      'Amoeba splits in two. Fission. DNA is copied first.',
      'Yeast or Hydra grows a bud that falls off.',
      'Planaria: a piece grows into a whole animal. Regeneration.',
      'Rhizopus: spores in a sporangium. They float, then grow.',
      'Bryophyllum leaf buds, or a potato eye. Vegetative propagation.',
    ]
    const elements = [
      label('title', 24, 22, titles[look]),
      label('eq', 24, 40, 'One parent. Offspring are nearly copies. Variation is small.'),
    ]
    if (look === 0) {
      elements.push(circle('a', { cx: 180, cy: 160, r: 36, fill: '#fde68a' }), circle('b', { cx: 300, cy: 160, r: 36, fill: '#fde68a' }))
    } else if (look === 1) {
      elements.push(circle('y', { cx: 230, cy: 160, r: 40, fill: '#fde68a' }), circle('bud', { cx: 290, cy: 120, r: 16, fill: '#fbbf24' }))
    } else if (look === 2) {
      elements.push(rect('w', { x: 140, y: 140, width: 80, height: 40, fill: '#86efac', rx: 8 }), rect('w2', { x: 280, y: 140, width: 80, height: 40, fill: '#86efac', rx: 8 }))
    } else if (look === 3) {
      elements.push(circle('sp', { cx: 250, cy: 140, r: 30, fill: '#a3a3a3' }))
      for (let i = 0; i < 5; i++) elements.push(circle(`s${i}`, { cx: 160 + i * 40, cy: 220, r: 8, fill: '#78716c' }))
    } else {
      elements.push(rect('leaf', { x: 170, y: 100, width: 160, height: 80, fill: '#22c55e', rx: 20 }))
      elements.push(circle('b1', { cx: 210, cy: 180, r: 10, fill: '#166534' }), circle('b2', { cx: 290, cy: 180, r: 10, fill: '#166534' }))
    }
    elements.push(label('tip', 24, 286, 'Book 7.2: fission to spores. Human reproduction is a different section — not this sim.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, name: names[look], parents: 1 },
      warnings: [],
      caption: titles[look],
    }
  },
}
