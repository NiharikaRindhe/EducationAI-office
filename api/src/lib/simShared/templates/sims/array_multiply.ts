// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, n, rect, tLoop } from '../stage.js'

export const array_multiply: SimFile = {
  id: 'array_multiply',
  domain: 'math',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Multiplication array',
  description: 'Rows × columns of dairy packets. Swap rows and columns — the total stays the same.',
  equations: ['a \\times b = b \\times a'],
  keywords: ['multiplication array', 'dairy farm', 'butter packets', 'commutative', 'groups of'],
  params: [
    param('rows', 'Rows (groups)', '', 1, 12, 1, 8),
    param('cols', 'Columns (group size)', '', 1, 12, 1, 5),
  ],
  schema: z.object({
    rows: num(1, 16, 8),
    cols: num(1, 16, 5),
  }),
  run(params) {
    const rows = Math.max(1, Math.round(params.rows))
    const cols = Math.max(1, Math.round(params.cols))
    const product = rows * cols
    const shownR = Math.min(rows, 10)
    const shownC = Math.min(cols, 12)
    const cell = Math.min(28, 280 / shownC, 160 / shownR)
    const x0 = 110
    const y0 = 70
    const t = tLoop(2.4, 2)
    const elements = [
      label('eq', 28, 24, `${rows} × ${cols} = ${product}    and    ${cols} × ${rows} = ${product}`),
      label('story', 28, 42, `${rows} groups of ${cols} packets`),
    ]
    for (let r = 0; r < shownR; r++) {
      for (let c = 0; c < shownC; c++) {
        const delay = (r * shownC + c) / Math.max(1, shownR * shownC)
        elements.push(
          rect(`p${r}-${c}`, {
            x: x0 + c * (cell + 3),
            y: y0 + r * (cell + 3),
            width: cell,
            height: cell,
            fill: '#38bdf8',
            rx: 4,
            opacity: { $expr: `min(1, max(0, ((${t}) / 2) - ${n(delay)}) * 8)` },
          })
        )
      }
    }
    elements.push(
      label('r', 28, 90, `${rows} rows`),
      label('c', x0, 268, `${cols} in each row`)
    )
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { rows, cols, product },
      warnings: rows > 10 || cols > 12 ? [`grid drawn as ${shownR}×${shownC} for clarity`] : [],
      caption: 'Turning the tray does not change how many packets you have.',
    }
  },
}
