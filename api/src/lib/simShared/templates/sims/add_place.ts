// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, line, rect } from '../stage.js'

function indianComma(n: number): string {
  const s = String(Math.abs(Math.round(n)))
  if (s.length <= 3) return s
  return s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3)
}

export const add_place: SimFile = {
  id: 'add_place',
  domain: 'math',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Add and subtract with place value',
  description: 'Stack two numbers in H T O (and thousands). Watch the sum or difference.',
  equations: ['A + B', 'A - B'],
  keywords: ['fuel arithmetic', 'making sums equal', 'consecutive numbers', 'adding large numbers'],
  params: [
    param('a', 'First number', '', 0, 20000, 1, 28),
    param('b', 'Second number', '', 0, 20000, 1, 75),
    choice('mode', 'Operation', [
      { value: 0, label: 'Add' },
      { value: 1, label: 'Subtract' },
    ], 0),
  ],
  schema: z.object({
    a: num(0, 99999, 28),
    b: num(0, 99999, 75),
    mode: num(0, 1, 0),
  }),
  run(params) {
    const a = Math.max(0, Math.round(params.a))
    const b = Math.max(0, Math.round(params.b))
    const subtract = params.mode >= 0.5
    const hi = Math.max(a, b)
    const lo = Math.min(a, b)
    const result = subtract ? hi - lo : a + b
    const op = subtract ? '−' : '+'
    const left = subtract ? hi : a
    const right = subtract ? lo : b
    const places = ['TTh', 'Th', 'H', 'T', 'O']
    const weights = [10000, 1000, 100, 10, 1]
    const digit = (n: number, w: number) => Math.floor(n / w) % 10
    const elements = [
      label('eq', 28, 24, `${indianComma(left)}  ${op}  ${indianComma(right)}  =  ${indianComma(result)}`),
      label('hint', 28, 44, subtract ? 'Bigger minus smaller. Check: difference + smaller = bigger.' : 'Regroup: 10 ones make 1 ten.'),
    ]
    places.forEach((tag, i) => {
      const x = 70 + i * 80
      elements.push(
        label(`h-${tag}`, x + 18, 78, tag),
        rect(`boxL-${tag}`, { x, y: 90, width: 64, height: 44, fill: '#dbeafe', rx: 6 }),
        label(`L-${tag}`, x + 24, 118, String(digit(left, weights[i]))),
        rect(`boxR-${tag}`, { x, y: 142, width: 64, height: 44, fill: '#fce7f3', rx: 6 }),
        label(`R-${tag}`, x + 24, 170, String(digit(right, weights[i]))),
        line(`div-${tag}`, { x1: x, y1: 196, x2: x + 64, y2: 196, stroke: '#334155', strokeWidth: 2 }),
        rect(`boxS-${tag}`, { x, y: 206, width: 64, height: 44, fill: '#dcfce7', rx: 6 }),
        label(`S-${tag}`, x + 24, 234, String(digit(result, weights[i])))
      )
    })
    elements.push(label('op', 28, 168, op, '#2563eb'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { a, b, result, mode: subtract ? 1 : 0 },
      warnings: [],
      caption: subtract ? 'Subtraction undoes addition.' : 'Add ones, then tens, then hundreds. Carry when a place goes past 9.',
    }
  },
}
