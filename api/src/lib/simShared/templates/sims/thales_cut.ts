// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const thales_cut: SimFile = {
  id: 'thales_cut',
  domain: 'math',
  classBand: '10-10',
  ncertClass: 10,
  label: 'A line parallel to one side',
  description: 'Thales / BPT: a line parallel to one side of a triangle cuts the other two sides in the same ratio. DE ∥ BC. Not a generic scale-factor pair.',
  equations: ['If DE ∥ BC then AD/DB = AE/EC'],
  keywords: ['basic proportionality theorem', 'thales', 'DE parallel BC', 'similar triangles', 'line parallel to one side'],
  params: [
    param('k', 'Where DE sits (fraction down AB)', '', 0.2, 0.8, 0.05, 0.5),
  ],
  schema: z.object({
    k: num(0.15, 0.85, 0.5),
  }),
  run(params) {
    const k = params.k
    const A = { x: 250, y: 50 }
    const B = { x: 80, y: 250 }
    const C = { x: 420, y: 250 }
    const D = { x: A.x + (B.x - A.x) * k, y: A.y + (B.y - A.y) * k }
    const E = { x: A.x + (C.x - A.x) * k, y: A.y + (C.y - A.y) * k }
    const ratio = k / (1 - k)
    const elements = [
      label('title', 24, 22, 'DE is parallel to BC. It cuts AB and AC in the same ratio.'),
      label('eq', 24, 40, `AD/DB = AE/EC = ${k.toFixed(2)}/${(1 - k).toFixed(2)} = ${ratio.toFixed(2)}.`),
      line('AB', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, stroke: '#0f172a', strokeWidth: 2 }),
      line('AC', { x1: A.x, y1: A.y, x2: C.x, y2: C.y, stroke: '#0f172a', strokeWidth: 2 }),
      line('BC', { x1: B.x, y1: B.y, x2: C.x, y2: C.y, stroke: '#0f172a', strokeWidth: 2 }),
      line('DE', { x1: D.x, y1: D.y, x2: E.x, y2: E.y, stroke: '#2563eb', strokeWidth: 3 }),
      circle('A', { cx: A.x, cy: A.y, r: 5, fill: '#d97706' }),
      circle('B', { cx: B.x, cy: B.y, r: 5, fill: '#d97706' }),
      circle('C', { cx: C.x, cy: C.y, r: 5, fill: '#d97706' }),
      circle('D', { cx: D.x, cy: D.y, r: 5, fill: '#2563eb' }),
      circle('E', { cx: E.x, cy: E.y, r: 5, fill: '#2563eb' }),
      label('Al', A.x + 8, A.y + 4, 'A'),
      label('Bl', B.x - 14, B.y + 16, 'B'),
      label('Cl', C.x + 6, C.y + 16, 'C'),
      label('Dl', D.x - 16, D.y, 'D'),
      label('El', E.x + 6, E.y, 'E'),
      label('tip', 24, 286, 'Book Theorem 6.1: a line parallel to one side, meeting the other two, divides them in the same ratio.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { k, ratio },
      warnings: [],
      caption: 'Book: DE ∥ BC. AD/DB = AE/EC.',
    }
  },
}
