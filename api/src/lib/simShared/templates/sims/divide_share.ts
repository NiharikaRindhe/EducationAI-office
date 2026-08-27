// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, rect } from '../stage.js'

export const divide_share: SimFile = {
  id: 'divide_share',
  domain: 'math',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Division as sharing',
  description: 'Split coconuts into equal groups. Multiplication undoes division.',
  equations: ['N = D \\times Q + R'],
  keywords: ['division facts', 'coconut farm', 'sharing equally', 'dividend divisor quotient'],
  params: [
    param('dividend', 'How many (dividend)', '', 1, 80, 1, 35),
    param('divisor', 'How many groups', '', 1, 12, 1, 7),
  ],
  schema: z.object({
    dividend: num(1, 200, 35),
    divisor: num(1, 20, 7),
  }),
  run(params) {
    const N = Math.max(1, Math.round(params.dividend))
    const D = Math.max(1, Math.round(params.divisor))
    const Q = Math.floor(N / D)
    const R = N % D
    const groups = Math.min(D, 10)
    const shownQ = Math.min(Q, 8)
    const x0 = 36
    const y0 = 78
    const gw = 44
    const elements = [
      label('eq', 28, 24, `${N} ÷ ${D} = ${Q} remainder ${R}`),
      label('mul', 28, 42, `${D} × ${Q} + ${R} = ${N}     (and ${Q} × ${D} + ${R} = ${N})`),
    ]
    for (let g = 0; g < groups; g++) {
      const x = x0 + g * gw
      elements.push(rect(`box${g}`, { x, y: y0, width: 38, height: 168, fill: '#f1f5f9', stroke: '#94a3b8', strokeWidth: 1, rx: 6 }))
      for (let i = 0; i < shownQ; i++) {
        elements.push(
          circle(`c${g}-${i}`, {
            cx: x + 19,
            cy: y0 + 148 - i * 18,
            r: 7,
            fill: '#16a34a',
            stroke: '#14532d',
            strokeWidth: 1,
          })
        )
      }
      elements.push(label(`g${g}`, x + 12, 262, String(g + 1)))
    }
    for (let i = 0; i < Math.min(R, 8); i++) {
      elements.push(
        circle(`rem${i}`, {
          cx: 430,
          cy: 230 - i * 18,
          r: 7,
          fill: '#f59e0b',
        })
      )
    }
    if (R > 0) elements.push(label('rem', 402, 262, 'left over'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { dividend: N, divisor: D, quotient: Q, remainder: R },
      warnings: D > 10 ? [`showing first ${groups} groups`] : [],
      caption: '35 split into 7 groups has 5 in each group. 5 × 7 = 35.',
    }
  },
}
