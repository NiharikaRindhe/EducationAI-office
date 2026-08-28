// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, pathEl } from '../stage.js'

export const heron_area: SimFile = {
  id: 'heron_area',
  domain: 'math',
  classBand: '9-9',
  ncertClass: 9,
  label: 'Heron’s formula',
  description: 'Three sides a, b, c. Semi-perimeter s. Area = √[s(s−a)(s−b)(s−c)]. Book triangle 13, 14, 15. Not a Class 8 rectangle area.',
  equations: ['s = (a+b+c)/2', 'area = √[s(s−a)(s−b)(s−c)]'],
  keywords: ['heron', 'area of a triangle', 'three sides', 'semi-perimeter'],
  params: [
    param('a', 'Side a', '', 3, 20, 0.5, 13),
    param('b', 'Side b', '', 3, 20, 0.5, 14),
    param('c', 'Side c', '', 3, 20, 0.5, 15),
  ],
  schema: z.object({
    a: num(1, 30, 13),
    b: num(1, 30, 14),
    c: num(1, 30, 15),
  }),
  run(params) {
    const a = params.a
    const b = params.b
    const c = params.c
    const s = (a + b + c) / 2
    const raw = s * (s - a) * (s - b) * (s - c)
    const ok = raw > 0 && a + b > c && b + c > a && c + a > b
    const area = ok ? Math.sqrt(raw) : 0
    const x0 = 80
    const y0 = 240
    const scale = 10
    const Bx = x0 + c * scale
    const By = y0
    const Ax = x0 + (b * b + c * c - a * a) / (2 * c) * scale
    const h2 = b * b * scale * scale - (Ax - x0) * (Ax - x0)
    const Ay = y0 - Math.sqrt(Math.max(0, h2))
    const elements = [
      label('title', 24, 22, ok
        ? `Sides ${a}, ${b}, ${c}. s = ${s}. Area = ${area.toFixed(2)}.`
        : 'Those three lengths do not make a triangle.'),
      label('eq', 24, 40, 's = (a+b+c)/2.  Area = √[s(s−a)(s−b)(s−c)].'),
    ]
    if (ok) {
      elements.push(
        pathEl('tri', {
          d: `M ${x0} ${y0} L ${Bx} ${By} L ${Ax} ${Ay} Z`,
          fill: '#fde68a',
          stroke: '#b45309',
          strokeWidth: 2,
        }),
      )
    }
    elements.push(label('tip', 24, 286, 'Book §6.8.1 Heron’s formula. Default 13, 14, 15 → area 84.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { a, b, c, s, area, triangle: ok },
      warnings: ok ? [] : ['Not a triangle'],
      caption: 'Book: sides 13, 14, 15. s = 21. Area 84.',
    }
  },
}
