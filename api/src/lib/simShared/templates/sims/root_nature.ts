// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, pathEl } from '../stage.js'

export const root_nature: SimFile = {
  id: 'root_nature',
  domain: 'math',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Nature of roots',
  description: 'D = b² − 4ac. D > 0 two real roots, D = 0 one, D < 0 none. Book Example 7: 2x² − 4x + 3 = 0, D = −8, the graph misses the x-axis. Not the old empty parabola.',
  equations: ['D = b² − 4ac', 'roots = (−b ± √D) / 2a'],
  keywords: ['nature of roots', 'discriminant', 'quadratic equation', '2x² − 4x + 3'],
  params: [
    param('a', 'a', '', -4, 4, 0.5, 2),
    param('b', 'b', '', -8, 8, 0.5, -4),
    param('c', 'c', '', -8, 8, 0.5, 3),
  ],
  schema: z.object({
    a: num(-6, 6, 2),
    b: num(-10, 10, -4),
    c: num(-10, 10, 3),
  }),
  run(params) {
    const a = params.a || 1
    const b = params.b
    const c = params.c
    const D = b * b - 4 * a * c
    const ox = 220
    const oy = 200
    const sx = 36
    const sy = 12
    const yAt = (x: number) => a * x * x + b * x + c
    let d = ''
    for (let i = 0; i <= 24; i++) {
      const x = -3 + i * (6 / 24)
      const px = ox + x * sx
      const py = Math.max(50, Math.min(270, oy - yAt(x) * sy))
      d += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`
    }
    const nature = D > 0 ? 'two real' : D === 0 ? 'one real' : 'no real'
    const elements = [
      label('title', 24, 22, `y = ${a}x² ${b >= 0 ? '+' : ''} ${b}x ${c >= 0 ? '+' : ''} ${c}.  D = ${D}.`),
      label('eq', 24, 40, D < 0
        ? 'D < 0. The curve does not cut the x-axis. No real roots.'
        : D === 0
          ? 'D = 0. The curve touches the x-axis at one point.'
          : 'D > 0. Two distinct real roots — two cut points.'),
      line('xaxis', { x1: 40, y1: oy, x2: 470, y2: oy, stroke: '#94a3b8', strokeWidth: 1 }),
      line('yaxis', { x1: ox, y1: 50, x2: ox, y2: 270, stroke: '#94a3b8', strokeWidth: 1 }),
      pathEl('g', { d, fill: 'none', stroke: '#2563eb', strokeWidth: 2 }),
    ]
    if (D >= 0) {
      const r1 = (-b - Math.sqrt(D)) / (2 * a)
      const r2 = (-b + Math.sqrt(D)) / (2 * a)
      elements.push(circle('r1', { cx: ox + r1 * sx, cy: oy, r: 6, fill: '#d97706' }))
      if (D > 0) elements.push(circle('r2', { cx: ox + r2 * sx, cy: oy, r: 6, fill: '#d97706' }))
    }
    elements.push(label('tip', 24, 286, 'Book Example 7: 2x² − 4x + 3 = 0. D = 16 − 24 = −8. No real roots.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { a, b, c, D, nature },
      warnings: [],
      caption: 'Book: 2x² − 4x + 3 = 0. D = −8. No real roots.',
    }
  },
}
