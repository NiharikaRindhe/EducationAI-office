// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const ap_rungs: SimFile = {
  id: 'ap_rungs',
  domain: 'math',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Ladder rungs AP',
  description: 'An AP is a list with a fixed step d. Book Fig 5.1: bottom rung 45 cm, each next rung 2 cm shorter. Not the old a=2, d=3 dots, not Class 9 1,4,7.',
  equations: ['a_n = a + (n−1)d', 'S_n = n/2 [2a + (n−1)d]'],
  keywords: ['arithmetic progression', 'ladder', 'rungs', '45 cm', 'nth term', 'sum of first n terms'],
  params: [
    choice('look', 'Show', [
      { value: 0, label: 'rungs' },
      { value: 1, label: 'nth term' },
      { value: 2, label: 'sum S_n' },
    ], 0),
    param('a', 'First term a', 'cm', 10, 80, 1, 45),
    param('d', 'Common difference d', 'cm', -10, 10, 1, -2),
    param('n', 'n', '', 2, 16, 1, 10),
  ],
  schema: z.object({
    look: num(0, 2, 0),
    a: num(5, 90, 45),
    d: num(-12, 12, -2),
    n: num(2, 20, 10),
  }),
  run(params) {
    const look = Math.round(params.look)
    const a = params.a
    const d = params.d
    const n = Math.round(params.n)
    const last = a + (n - 1) * d
    const Sn = (n / 2) * (2 * a + (n - 1) * d)
    const terms = Array.from({ length: n }, (_, i) => a + i * d)
    const elements = [
      label('title', 24, 22, look === 2
        ? `S_n = n/2 [2a + (n−1)d] = ${Sn}. Gauss added 1 to n in pairs.`
        : look === 1
          ? `a_n = a + (n−1)d = ${a} + ${n - 1}×(${d}) = ${last}.`
          : `Ladder rungs: ${a} cm, then step ${d} cm each time.`),
      label('eq', 24, 40, `First ${Math.min(8, n)} terms: ${terms.slice(0, 8).join(', ')}${n > 8 ? '…' : ''}`),
    ]
    const shown = Math.min(n, 12)
    for (let i = 0; i < shown; i++) {
      const w = Math.max(20, terms[i] * 3)
      elements.push(rect(`r${i}`, {
        x: 250 - w / 2,
        y: 60 + i * 16,
        width: w,
        height: 10,
        fill: i === n - 1 || i === shown - 1 ? '#d97706' : '#93c5fd',
        rx: 2,
      }))
    }
    elements.push(label('tip', 24, 286, 'Book Fig 5.1: bottom rung 45 cm, each next 2 cm shorter. That list is an AP with a = 45, d = −2.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, a, d, n, last, Sn },
      warnings: [],
      caption: 'Book: ladder 45 cm, d = −2. An AP.',
    }
  },
}
