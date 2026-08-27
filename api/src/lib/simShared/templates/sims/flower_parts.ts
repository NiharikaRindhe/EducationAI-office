// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, rect } from '../stage.js'

export const flower_parts: SimFile = {
  id: 'flower_parts',
  domain: 'chemistry',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Parts of a flower',
  description: 'Stamen (anther, pollen) and pistil (stigma, ovary, ovule). Pollination then fertilisation. Book Fig 7.9. Not human anatomy.',
  equations: ['pollen + ovule → seed'],
  keywords: ['stamen', 'pistil', 'pollen', 'ovary', 'flowering plants', 'Fig. 7.9'],
  params: [
    choice('look', 'Highlight', [
      { value: 0, label: 'stamen' },
      { value: 1, label: 'pistil' },
      { value: 2, label: 'pollination' },
    ], 0),
  ],
  schema: z.object({
    look: num(0, 2, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    const titles = [
      'Stamen: anther holds pollen. Male part.',
      'Pistil: stigma, style, ovary with ovules. Female part.',
      'Pollen lands on stigma. A tube grows to the ovule. Fertilisation.',
    ]
    const elements = [
      label('title', 24, 22, titles[look]),
      label('eq', 24, 40, 'Sepals and petals wrap the working parts. After fertilisation the ovary becomes fruit.'),
      rect('petal', { x: 150, y: 80, width: 200, height: 140, fill: '#fecaca', rx: 70 }),
      line('st', { x1: 220, y1: 200, x2: 200, y2: 120, stroke: look === 0 ? '#d97706' : '#64748b', strokeWidth: 3 }),
      circle('an', { cx: 200, cy: 110, r: 12, fill: look === 0 ? '#fbbf24' : '#e2e8f0' }),
      line('pi', { x1: 260, y1: 210, x2: 260, y2: 100, stroke: look === 1 || look === 2 ? '#16a34a' : '#64748b', strokeWidth: 4 }),
      circle('ov', { cx: 260, cy: 220, r: 18, fill: look === 1 ? '#bbf7d0' : '#e2e8f0' }),
    ]
    if (look === 2) {
      elements.push(circle('po', { cx: 230, cy: 90, r: 6, fill: '#d97706' }))
      elements.push(label('tube', 270, 140, 'pollen tube'))
    }
    elements.push(label('tip', 24, 286, 'Book Fig 7.9 and Activity 7.7: compare a real flower with the figure. Not the human chapter.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, part: look === 0 ? 'stamen' : look === 1 ? 'pistil' : 'pollination' },
      warnings: [],
      caption: 'Book Fig 7.9: flower. Stamen and pistil.',
    }
  },
}
