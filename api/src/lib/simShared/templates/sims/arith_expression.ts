// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const arith_expression: SimFile = {
  id: 'arith_expression',
  domain: 'math',
  classBand: '7-7',
  ncertClass: 7,
  label: 'Same value, different phrases',
  description: 'An arithmetic expression is a phrase for a number. Brackets tell us what to do first. We are not solving for x.',
  equations: ['5 × 25 = 125', '10 + 2 > 7 + 1'],
  keywords: ['arithmetic expressions', 'brackets', 'same value', 'different phrases', '5 × 25'],
  params: [
    param('a', 'First number', '', 1, 40, 1, 5),
    param('b', 'Second number', '', 1, 40, 1, 25),
    choice('op', 'Phrase', [
      { value: 0, label: 'add  +' },
      { value: 1, label: 'times  ×' },
      { value: 2, label: 'compare two sums' },
    ], 1),
    param('c', 'Other first', '', 1, 40, 1, 10),
    param('d', 'Other second', '', 1, 40, 1, 2),
    param('e', 'Compare first', '', 1, 40, 1, 7),
    param('f', 'Compare second', '', 1, 40, 1, 1),
  ],
  schema: z.object({
    a: num(0, 80, 5),
    b: num(0, 80, 25),
    op: num(0, 2, 1),
    c: num(0, 80, 10),
    d: num(0, 80, 2),
    e: num(0, 80, 7),
    f: num(0, 80, 1),
  }),
  run(params) {
    const a = Math.round(params.a)
    const b = Math.round(params.b)
    const c = Math.round(params.c)
    const d = Math.round(params.d)
    const op = Math.round(params.op)
    const e = Math.round(params.e)
    const f = Math.round(params.f)
    const product = a * b
    const sum1 = a + b
    const left = c + d
    const right = e + f
    const same = left === right
    const elements = [
      label('title', 24, 24, 'A phrase is just another way to say a number'),
    ]
    if (op === 1) {
      elements.push(
        rect('card', { x: 70, y: 70, width: 360, height: 150, fill: '#eff6ff', stroke: '#2563eb', strokeWidth: 2, rx: 12 }),
        label('ph', 160, 120, `${a} × ${b}`, '#1d4ed8'),
        label('eq', 150, 170, `= ${product}`, '#0f172a'),
        label('note', 24, 250, 'Try the book: 5 × 25 is one hundred twenty-five')
      )
    } else if (op === 0) {
      elements.push(
        rect('card', { x: 70, y: 70, width: 360, height: 150, fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 2, rx: 12 }),
        label('ph', 160, 120, `${a} + ${b}`, '#15803d'),
        label('eq', 170, 170, `= ${sum1}`),
        label('note', 24, 250, 'Do the + inside if there are brackets: (10 + 2)')
      )
    } else {
      elements.push(
        rect('l', { x: 40, y: 70, width: 190, height: 140, fill: same ? '#f0fdf4' : '#fff7ed', stroke: '#16a34a', strokeWidth: 2, rx: 12 }),
        rect('r', { x: 270, y: 70, width: 190, height: 140, fill: same ? '#f0fdf4' : '#fff7ed', stroke: '#d97706', strokeWidth: 2, rx: 12 }),
        label('lp', 85, 120, `${c} + ${d}`),
        label('lv', 105, 165, `= ${left}`),
        label('rp', 315, 120, `${e} + ${f}`),
        label('rv', 335, 165, `= ${right}`),
        label('note', 24, 250, same
          ? 'Same value — two different phrases'
          : left > right
            ? `Book: ${c} + ${d} is greater than ${e} + ${f}`
            : `${c} + ${d} is smaller than ${e} + ${f}`),
        label('book', 24, 272, 'The book writes 10 + 2 > 7 + 1  because 12 is more than 8.')
      )
    }
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { product, left, right, sameValue: same },
      warnings: [],
      caption: 'We are reading phrases, not finding an unknown letter.',
    }
  },
}
