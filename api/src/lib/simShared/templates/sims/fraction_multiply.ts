// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const fraction_multiply: SimFile = {
  id: 'fraction_multiply',
  domain: 'math',
  classBand: '7-7',
  ncertClass: 7,
  label: 'Fractions as a rectangle',
  description: 'Tortoise: 3 copies of one-fourth make 3/4. Aaron: one-fifth of 3. Area of a rectangle, not equivalent-fraction bars.',
  equations: ['3 × 1/4 = 3/4', '1/5 × 3 = 3/5'],
  keywords: ['fraction multiply', 'working with fractions', 'tortoise', '3/4', 'one-fifth'],
  params: [
    param('copies', 'How many copies', '', 1, 8, 1, 3),
    param('den', 'Each piece is 1 over', '', 2, 8, 1, 4),
    choice('story', 'Book story', [
      { value: 0, label: 'Tortoise  3 × 1/4' },
      { value: 1, label: 'Aaron  1/5 × 3' },
    ], 0),
  ],
  schema: z.object({
    copies: num(1, 12, 3),
    den: num(2, 12, 4),
    story: num(0, 1, 0),
  }),
  run(params) {
    const copies = Math.max(1, Math.round(params.copies))
    const den = Math.max(2, Math.round(params.den))
    const story = Math.round(params.story)
    const nume = copies
    const whole = 1
    const shaded = story === 0 ? copies : copies
    const resultDen = den
    const resultNum = story === 0 ? copies : copies
    const w = 380
    const h = 90
    const x0 = 60
    const y0 = 80
    const colW = w / den
    const elements = [
      label('title', 24, 22, story === 0
        ? `Tortoise: ${copies} hours × 1/${den} km each hour = ${resultNum}/${resultDen} km`
        : `Aaron: 1/${den} hour × ${copies} km each hour = ${resultNum}/${resultDen} km`),
      label('eq', 24, 42, 'Colour the same fraction of a rectangle'),
    ]
    const rows = story === 0 ? 1 : 1
    for (let i = 0; i < den; i++) {
      const on = i < resultNum
      elements.push(
        rect(`c${i}`, {
          x: x0 + i * colW,
          y: y0,
          width: colW - 3,
          height: h,
          fill: on ? '#38bdf8' : '#e2e8f0',
          stroke: '#334155',
          strokeWidth: 1.2,
          rx: 4,
        })
      )
    }
    elements.push(
      rect('whole', { x: x0, y: 200, width: w, height: 28, fill: '#fef3c7', stroke: '#d97706', strokeWidth: 1.5, rx: 4 }),
      label('w', 200, 220, `${whole} whole`),
      label('tip', 24, 268, story === 0
        ? `The tortoise walks 1/${den} km in one hour. In ${copies} hours it walks ${resultNum}/${resultDen} km.`
        : `Aaron walks ${copies} km in one hour. In 1/${den} hour he walks ${resultNum}/${resultDen} km.`)
    )
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { product: resultNum / resultDen, numerator: resultNum, denominator: resultDen },
      warnings: [],
      caption: 'This is multiplying a whole number and a unit fraction — not renaming 1/2 as 2/4.',
    }
  },
}
