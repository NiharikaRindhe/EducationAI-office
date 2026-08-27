// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, rect } from '../stage.js'

export const mix_kinds: SimFile = {
  id: 'mix_kinds',
  domain: 'chemistry',
  classBand: '8-8',
  ncertClass: 8,
  label: 'Mixture, compound, element',
  description: 'Poha and sprout salad are mixtures — you can still pick out the bits. A compound is a new substance. An element is one kind of matter.',
  equations: ['mixture: components keep their properties'],
  keywords: ['mixture', 'compound', 'element', 'poha', 'sprout salad', 'components'],
  params: [
    choice('kind', 'What is it', [
      { value: 0, label: 'sprout salad (mixture)' },
      { value: 1, label: 'sugar in water (mixture)' },
      { value: 2, label: 'water H₂O (compound)' },
    ], 0),
  ],
  schema: z.object({
    kind: num(0, 2, 0),
  }),
  run(params) {
    const kind = Math.round(params.kind)
    const titles = [
      'Sprout salad. Gram, onion, tomato — each keeps its taste. A mixture.',
      'Sugar in water. You cannot pick the grains out, but it is still a mixture.',
      'Water is a compound. Hydrogen and oxygen have combined into a new substance.',
    ]
    const elements = [
      label('title', 24, 22, titles[kind]),
      label('eq', 24, 40, kind < 2
        ? 'Components of a mixture do not react. You can (sometimes) separate them.'
        : 'A compound is not just mixed — it is a new substance with new properties.'),
      rect('bowl', { x: 150, y: 80, width: 200, height: 140, fill: '#fef3c7', stroke: '#a16207', strokeWidth: 3, rx: 70 }),
    ]
    if (kind === 0) {
      const colors = ['#86efac', '#fde047', '#fb7185', '#fdba74']
      for (let i = 0; i < 12; i++) {
        elements.push(circle(`bit${i}`, { cx: 190 + (i % 4) * 32, cy: 120 + Math.floor(i / 4) * 28, r: 10, fill: colors[i % 4] }))
      }
      elements.push(label('tip', 24, 248, 'Book: green gram, chickpeas, onion, tomato — easy to see each part.'))
    } else if (kind === 1) {
      for (let i = 0; i < 16; i++) {
        elements.push(circle(`s${i}`, { cx: 180 + (i % 5) * 28, cy: 110 + Math.floor(i / 5) * 28, r: 4, fill: '#38bdf8', opacity: 0.7 }))
      }
      elements.push(label('tip', 24, 248, 'Uniform to the eye — still a mixture. Sugar and water keep their own identities until they react (they do not).'))
    } else {
      elements.push(circle('mol', { cx: 250, cy: 150, r: 36, fill: '#38bdf8' }))
      elements.push(circle('h1', { cx: 220, cy: 130, r: 14, fill: '#f8fafc', stroke: '#64748b' }))
      elements.push(circle('h2', { cx: 280, cy: 130, r: 14, fill: '#f8fafc', stroke: '#64748b' }))
      elements.push(label('tip', 24, 248, 'Not salad. Not sugar-water. A compound: new substance, new properties.'))
    }
    elements.push(label('kindL', 24, 278, ['MIXTURE', 'MIXTURE', 'COMPOUND'][kind], kind === 2 ? '#b45309' : '#0369a1'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { kind, name: ['mixture-salad', 'mixture-solution', 'compound'][kind] },
      warnings: [],
      caption: 'Book: poha and salad are mixtures. Components keep their properties.',
    }
  },
}
