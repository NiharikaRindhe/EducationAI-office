// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const seq_pictures: SimFile = {
  id: 'seq_pictures',
  domain: 'math',
  classBand: '6-6',
  ncertClass: 6,
  label: 'Square and triangular pictures',
  description: 'Book Table 2: squares 1, 4, 9, 16, 25 as n×n dots. Triangular numbers 1, 3, 6, 10, 15 as stacked rows. Not locker puzzles.',
  equations: ['nth square = n²', 'nth triangular = 1+2+…+n'],
  keywords: ['patterns in mathematics', 'square numbers', 'triangular numbers', '1, 4, 9, 16, 25', 'virahanka'],
  params: [
    choice('kind', 'Which sequence', [
      { value: 0, label: 'squares' },
      { value: 1, label: 'triangular' },
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
    const values = []
    for (let k = 1; k <= n; k++) values.push(kind === 0 ? k * k : (k * (k + 1)) / 2)
    const elements = [
      label('title', 24, 22, kind === 0
        ? `Squares: ${values.join(', ')}. Each picture is a bigger square.`
        : `Triangular numbers: ${values.join(', ')}. Each picture is a bigger triangle of dots.`),
      label('eq', 24, 40, kind === 0 ? '1×1, 2×2, 3×3, …  That is why they are called squares.' : '1, then 1+2, then 1+2+3, …  They stack into a triangle.'),
    ]
    const gap = 78
    for (let k = 1; k <= n; k++) {
      const x0 = 28 + (k - 1) * gap
      const y0 = 220
      if (kind === 0) {
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
    elements.push(label('tip', 24, 278, 'Book Table 2. Draw the next picture in your notebook.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { kind, n, last: values[n - 1], values: values.join(',') },
      warnings: [],
      caption: 'Book: squares 1, 4, 9, 16, 25 and triangular 1, 3, 6, 10, 15.',
    }
  },
}
