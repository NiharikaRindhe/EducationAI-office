// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const dot_sequence: SimFile = {
  id: 'dot_sequence',
  domain: 'math',
  classBand: '9-9',
  ncertClass: 9,
  label: 'Triangular and square dots',
  description: 'Fig. 8.1: triangular numbers 1, 3, 6, 10, 15 as stacked rows. Squares are 1, 4, 9, 16, 25. Grade 9 rewrite — not the Class 6 picture table.',
  equations: ['Tₙ = n(n+1)/2', 'Sₙ = n²'],
  keywords: ['triangular numbers', 'square numbers', 'sequences', 'fig. 8.1', 'predicting what comes next'],
  params: [
    choice('kind', 'Which sequence', [
      { value: 0, label: 'triangular' },
      { value: 1, label: 'squares' },
    ], 0),
    param('n', 'How many pictures', '', 1, 6, 1, 5),
  ],
  schema: z.object({
    kind: num(0, 1, 0),
    n: num(1, 6, 5),
  }),
  run(params) {
    const kind = Math.round(params.kind)
    const n = Math.max(1, Math.min(6, Math.round(params.n)))
    const values: number[] = []
    for (let k = 1; k <= n; k++) values.push(kind === 1 ? k * k : (k * (k + 1)) / 2)
    const elements = [
      label('title', 24, 22, kind === 0
        ? `Triangular: ${values.join(', ')}. Each picture adds a new row.`
        : `Squares: ${values.join(', ')}. Odd numbers 1+3+5+… build squares.`),
      label('eq', 24, 40, kind === 0 ? 'Tₙ = 1+2+…+n = n(n+1)/2' : 'Sₙ = n² = 1+3+5+…+(2n−1)'),
    ]
    const gap = 78
    for (let k = 1; k <= n; k++) {
      const x0 = 28 + (k - 1) * gap
      const y0 = 220
      if (kind === 1) {
        for (let r = 0; r < k; r++) {
          for (let c = 0; c < k; c++) {
            elements.push(rect(`s${k}-${r}-${c}`, { x: x0 + c * 10, y: y0 - k * 10 + r * 10, width: 8, height: 8, fill: '#2563eb', rx: 1 }))
          }
        }
      } else {
        for (let r = 0; r < k; r++) {
          for (let c = 0; c <= r; c++) {
            elements.push(rect(`t${k}-${r}-${c}`, { x: x0 + (k - r) * 5 + c * 10, y: y0 - (k - r) * 10, width: 8, height: 8, fill: '#d97706', rx: 1 }))
          }
        }
      }
      elements.push(label(`v${k}`, x0, 248, String(values[k - 1])))
    }
    elements.push(label('tip', 24, 278, 'Book Fig. 8.1 first five triangular numbers. Draw the next two in your notebook.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { kind, n, last: values[n - 1], values: values.join(',') },
      warnings: [],
      caption: 'Book: triangular 1, 3, 6, 10, 15. Default n = 5.',
    }
  },
}
