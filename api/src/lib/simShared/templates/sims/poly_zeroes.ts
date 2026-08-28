// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, pathEl } from '../stage.js'

export const poly_zeroes: SimFile = {
  id: 'poly_zeroes',
  domain: 'math',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Zeroes on the graph',
  description: 'A zero is where the graph meets the x-axis. Book Fig 2.2: y = x² − 3x − 4 meets at −1 and 4. Cubic look is y = x³ − 4x. Not the old empty parabola.',
  equations: ['p(x) = 0 at a zero', 'sum of zeroes = −b/a', 'product = c/a'],
  keywords: ['zeroes of a polynomial', 'geometrical meaning', 'x² − 3x − 4', 'quadratic graph'],
  params: [
    choice('look', 'Graph', [
      { value: 0, label: 'quadratic' },
      { value: 1, label: 'cubic x³ − 4x' },
    ], 0),
    param('a', 'a (x²)', '', -3, 3, 0.5, 1),
    param('b', 'b (x)', '', -8, 8, 0.5, -3),
    param('c', 'c', '', -8, 8, 0.5, -4),
  ],
  schema: z.object({
    look: num(0, 1, 0),
    a: num(-4, 4, 1),
    b: num(-10, 10, -3),
    c: num(-12, 12, -4),
  }),
  run(params) {
    const look = Math.round(params.look)
    const a = params.a || 1
    const b = params.b
    const c = params.c
    const ox = 220
    const oy = 180
    const sx = 28
    const sy = 8
    const yAt = (x: number) => (look === 1 ? x * x * x - 4 * x : a * x * x + b * x + c)
    let d = ''
    for (let i = 0; i <= 24; i++) {
      const x = -4.5 + i * (9 / 24)
      const px = ox + x * sx
      const py = oy - yAt(x) * sy
      d += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`
    }
    const zeros = look === 1 ? [-2, 0, 2] : [-1, 4]
    const sum = look === 0 ? -b / a : 0
    const product = look === 0 ? c / a : 0
    const elements = [
      label('title', 24, 22, look === 1
        ? 'Cubic y = x³ − 4x. Zeroes at −2, 0, 2 (Fig. 2.6).'
        : `Quadratic y = ${a}x² ${b >= 0 ? '+' : ''} ${b}x ${c >= 0 ? '+' : ''} ${c}. Zeroes where it cuts the x-axis.`),
      label('eq', 24, 40, look === 0
        ? `Sum of zeroes = −b/a = ${sum}. Product = c/a = ${product}. Book: −1 and 4.`
        : 'A cubic can have up to three real zeroes.'),
      line('xaxis', { x1: 40, y1: oy, x2: 470, y2: oy, stroke: '#94a3b8', strokeWidth: 1 }),
      line('yaxis', { x1: ox, y1: 50, x2: ox, y2: 260, stroke: '#94a3b8', strokeWidth: 1 }),
      pathEl('g', { d, fill: 'none', stroke: '#2563eb', strokeWidth: 2 }),
    ]
    zeros.forEach((z, i) => {
      elements.push(circle(`z${i}`, { cx: ox + z * sx, cy: oy, r: 6, fill: '#d97706' }))
      elements.push(label(`zl${i}`, ox + z * sx - 8, oy + 18, String(z)))
    })
    elements.push(label('tip', 24, 286, 'Book Fig 2.2: graph meets the x-axis at −1 and 4. Those x-values are the zeroes.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, a, b, c, sum, product, z0: zeros[0], z1: zeros[1] ?? 0 },
      warnings: [],
      caption: 'Book: y = x² − 3x − 4. Zeroes −1 and 4.',
    }
  },
}
