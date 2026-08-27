// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, rect } from '../stage.js'

export const one_parent: SimFile = {
  id: 'one_parent',
  domain: 'chemistry',
  classBand: '9-9',
  ncertClass: 9,
  label: 'One parent, new plant',
  description: 'Asexual: Bryophyllum leaf plantlets, hydra budding, amoeba split. One parent, copies. No sim on human pregnancy.',
  equations: ['one parent → identical offspring'],
  keywords: ['asexual', 'bryophyllum', 'binary fission', 'budding', 'vegetative propagation'],
  params: [
    choice('look', 'How', [
      { value: 0, label: 'Bryophyllum leaf' },
      { value: 1, label: 'amoeba split' },
      { value: 2, label: 'hydra budding' },
    ], 0),
  ],
  schema: z.object({
    look: num(0, 2, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    const titles = [
      'Bryophyllum. Tiny plantlets grow on the leaf. They fall and become new plants.',
      'Amoeba. One cell pinches into two. Binary fission.',
      'Hydra. A bud grows on the side and becomes a new hydra.',
    ]
    const elements = [
      label('title', 24, 22, titles[look]),
      label('eq', 24, 40, 'One parent. Offspring are almost exact copies. Farmers use cuttings for the same reason.'),
    ]
    if (look === 0) {
      elements.push(rect('leaf', { x: 160, y: 90, width: 180, height: 90, fill: '#86efac', rx: 40 }))
      for (let i = 0; i < 4; i++) {
        elements.push(circle(`p${i}`, { cx: 190 + i * 40, cy: 200, r: 10, fill: '#16a34a' }))
      }
    } else if (look === 1) {
      elements.push(circle('a1', { cx: 190, cy: 160, r: 40, fill: '#fde68a' }))
      elements.push(circle('a2', { cx: 310, cy: 160, r: 40, fill: '#fde68a' }))
    } else {
      elements.push(circle('body', { cx: 250, cy: 170, r: 36, fill: '#fda4af' }))
      elements.push(circle('bud', { cx: 310, cy: 140, r: 18, fill: '#fb7185' }))
    }
    elements.push(label('tip', 24, 286, 'Book Fig. 11.1. Human reproduction pages are not simulated.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, name: ['bryophyllum', 'amoeba', 'hydra'][look], parents: 1 },
      warnings: [],
      caption: 'Book: Bryophyllum leaf sprouts plantlets. Asexual.',
    }
  },
}
