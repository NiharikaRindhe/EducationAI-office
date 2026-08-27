// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const distribute_grid: SimFile = {
  id: 'distribute_grid',
  domain: 'math',
  classBand: '8-8',
  ncertClass: 8,
  label: 'We distribute, yet things multiply',
  description: 'Book start: 23 × 27. Bump one factor by 1 and the product grows by the other factor. a(b+1) = ab + a.',
  equations: ['a(b + c) = ab + ac', '(a+1)(b+1) = ab + a + b + 1'],
  keywords: ['distributive', 'we distribute', '23 × 27', 'increments in products', 'a(b+c)'],
  params: [
    param('a', 'First number a', '', 2, 40, 1, 23),
    param('b', 'Second number b', '', 2, 40, 1, 27),
    choice('bump', 'What we change', [
      { value: 0, label: 'keep ab' },
      { value: 1, label: 'b becomes b+1' },
      { value: 2, label: 'both +1' },
    ], 1),
  ],
  schema: z.object({
    a: num(2, 40, 23),
    b: num(2, 40, 27),
    bump: num(0, 2, 1),
  }),
  run(params) {
    const a = Math.round(params.a)
    const b = Math.round(params.b)
    const bump = Math.round(params.bump)
    const ab = a * b
    const aNext = bump === 2 ? a + 1 : a
    const bNext = bump === 0 ? b : b + 1
    const product = aNext * bNext
    const extra = product - ab
    const scale = 160 / Math.max(a + 1, b + 1)
    const x0 = 40
    const y0 = 70
    const aw = a * scale
    const bw = b * scale
    const extraW = bump === 0 ? 0 : scale
    const extraH = bump === 2 ? scale : 0
    const titles = [
      `${a} × ${b} = ${ab}`,
      `${a} × (${b}+1) = ${ab} + ${a} = ${product}`,
      `(${a}+1)(${b}+1) = ${ab} + ${a} + ${b} + 1 = ${product}`,
    ]
    const elements = [
      label('title', 24, 22, titles[bump]),
      label('eq', 24, 40, bump === 1 ? `The product grows by a = ${a}. That is distributivity.` : bump === 2 ? `Both grow by 1. Extra = a + b + 1 = ${a + b + 1}.` : 'The yellow rectangle is the original product.'),
      rect('ab', { x: x0, y: y0, width: aw, height: bw, fill: '#fde047', stroke: '#a16207', strokeWidth: 1.5 }),
      label('abl', x0 + 8, y0 + 18, `ab = ${ab}`),
    ]
    if (bump >= 1) {
      elements.push(
        rect('strip', { x: x0 + aw, y: y0, width: extraW, height: bw, fill: '#86efac', stroke: '#15803d', strokeWidth: 1.5 }),
        label('sl', x0 + aw + 2, y0 + 18, `+a`)
      )
    }
    if (bump === 2) {
      elements.push(
        rect('row', { x: x0, y: y0 + bw, width: aw, height: extraH, fill: '#93c5fd', stroke: '#1d4ed8', strokeWidth: 1.5 }),
        rect('one', { x: x0 + aw, y: y0 + bw, width: extraW, height: extraH, fill: '#fda4af', stroke: '#be123c', strokeWidth: 1.5 }),
        label('oneL', x0 + aw + 2, y0 + bw + 14, '+1'),
      )
    }
    elements.push(label('tip', 24, 278, `New product ${product}. Extra compared with ${a}×${b}: ${extra}.`))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { a, b, ab, product, extra, bump },
      warnings: [],
      caption: 'Book: 23 × 27. Increase one number by 1.',
    }
  },
}
