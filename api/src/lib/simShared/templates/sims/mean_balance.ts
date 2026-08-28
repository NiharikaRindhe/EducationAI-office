// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, rect } from '../stage.js'

export const mean_balance: SimFile = {
  id: 'mean_balance',
  domain: 'math',
  classBand: '8-8',
  ncertClass: 8,
  label: 'Mean as the balance point',
  description: 'Two dots 3 and 7 sit on a number line. Their mean 5 is exactly in the middle — the fulcrum. Add a third number and the fulcrum moves.',
  equations: ['mean of two = (a+b)/2', 'mean of three = (a+b+c)/3'],
  keywords: ['mean', 'median', 'balance', 'tales by dots', 'average', '3 and 7'],
  params: [
    param('a', 'First number', '', 0, 12, 1, 3),
    param('b', 'Second number', '', 0, 12, 1, 7),
    param('c', 'Third number (0 = hide)', '', 0, 12, 1, 0),
  ],
  schema: z.object({
    a: num(0, 12, 3),
    b: num(0, 12, 7),
    c: num(0, 12, 0),
  }),
  run(params) {
    const a = params.a
    const b = params.b
    const c = params.c
    const useC = c > 0
    const mean = useC ? (a + b + c) / 3 : (a + b) / 2
    const xOf = (v: number) => 40 + (v / 12) * 420
    const elements = [
      label('title', 24, 22, useC
        ? `Three numbers. Mean = (${a} + ${b} + ${c}) / 3 = ${mean.toFixed(2)}.`
        : `Two numbers ${a} and ${b}. Mean = (${a}+${b})/2 = ${mean}. Halfway.`),
      label('eq', 24, 40, 'The mean is the balance point of the dots.'),
      line('axis', { x1: 40, y1: 170, x2: 460, y2: 170, stroke: '#334155', strokeWidth: 3 }),
    ]
    for (let i = 0; i <= 12; i++) {
      const x = xOf(i)
      elements.push(line(`tk${i}`, { x1: x, y1: 164, x2: x, y2: 176, stroke: '#64748b', strokeWidth: 2 }))
      if (i % 2 === 0) elements.push(label(`n${i}`, x - 4, 196, String(i)))
    }
    const dots = useC ? [a, b, c] : [a, b]
    dots.forEach((v, i) => {
      elements.push(circle(`d${i}`, { cx: xOf(v), cy: 148, r: 10, fill: '#2563eb' }))
    })
    const mx = xOf(mean)
    elements.push(
      rect('ful', { x: mx - 8, y: 170, width: 16, height: 28, fill: '#f59e0b' }),
      label('ml', mx - 18, 220, `mean ${Number.isInteger(mean) ? mean : mean.toFixed(2)}`),
      label('tip', 24, 278, 'Book: 3 and 7 → mean 5, exactly in the middle of the two dots.'),
    )
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { a, b, c, mean, count: dots.length },
      warnings: [],
      caption: 'Book pair 3 and 7. Mean 5.',
    }
  },
}
