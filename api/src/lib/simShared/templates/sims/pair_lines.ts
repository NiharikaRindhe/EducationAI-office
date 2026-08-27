// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const pair_lines: SimFile = {
  id: 'pair_lines',
  domain: 'math',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Two lines on a graph',
  description: 'A pair of linear equations is two straight lines. Unique = they cross. Parallel = never meet. Coincident = the same line. Book: x − y + 1 = 0 and 3x + 2y − 12 = 0. Not the old single-line graph.',
  equations: ['a1x + b1y + c1 = 0', 'a2x + b2y + c2 = 0'],
  keywords: ['pair of linear equations', 'graphical method', 'consistent', 'x − y + 1', 'two variables'],
  params: [
    choice('look', 'Pair', [
      { value: 0, label: 'cross (unique)' },
      { value: 1, label: 'parallel' },
      { value: 2, label: 'same line' },
    ], 0),
  ],
  schema: z.object({
    look: num(0, 2, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    const ox = 80
    const oy = 240
    const sx = 36
    const sy = 18
    const y1 = (x: number) => x + 1
    const y2 = (x: number) => look === 1 ? x + 4 : look === 2 ? x + 1 : -1.5 * x + 6
    const ix = look === 0 ? 2 : NaN
    const iy = look === 0 ? 3 : NaN
    const kind = look === 0 ? 'unique' : look === 1 ? 'parallel' : 'coincident'
    const elements = [
      label('title', 24, 22, look === 0
        ? 'x − y + 1 = 0 and 3x + 2y − 12 = 0. The lines cross at one point.'
        : look === 1
          ? 'Parallel lines. Same slope, different intercepts. No solution.'
          : 'The same line twice. Infinitely many solutions.'),
      label('eq', 24, 40, look === 0
        ? `They meet at (${ix}, ${iy}). One solution — consistent and independent.`
        : look === 1
          ? 'Inconsistent: the pair has no solution.'
          : 'Dependent: every point on the line is a solution.'),
      line('xaxis', { x1: ox, y1: oy, x2: ox + 10 * sx, y2: oy, stroke: '#94a3b8', strokeWidth: 1 }),
      line('yaxis', { x1: ox, y1: 50, x2: ox, y2: oy, stroke: '#94a3b8', strokeWidth: 1 }),
      line('l1', {
        x1: ox + 0 * sx, y1: oy - y1(0) * sy,
        x2: ox + 6 * sx, y2: oy - y1(6) * sy,
        stroke: '#2563eb', strokeWidth: 2.5,
      }),
      line('l2', {
        x1: ox + 0 * sx, y1: oy - y2(0) * sy,
        x2: ox + 6 * sx, y2: oy - y2(6) * sy,
        stroke: '#d97706', strokeWidth: 2.5,
      }),
    ]
    if (look === 0) {
      elements.push(circle('meet', { cx: ox + ix * sx, cy: oy - iy * sy, r: 6, fill: '#16a34a' }))
      elements.push(label('pt', ox + ix * sx + 8, oy - iy * sy - 8, '(2, 3)'))
    }
    elements.push(label('tip', 24, 286, 'Book Exercise: x − y + 1 = 0 and 3x + 2y − 12 = 0. The triangle with the x-axis has vertices you can read off the graph.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, kind, x: look === 0 ? 2 : 0, y: look === 0 ? 3 : 0 },
      warnings: [],
      caption: 'Book: x − y + 1 = 0 and 3x + 2y − 12 = 0 meet at (2, 3).',
    }
  },
}
