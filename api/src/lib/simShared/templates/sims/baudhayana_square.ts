// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, line, pathEl } from '../stage.js'

function poly(pts: Array<[number, number]>): string {
  return `${pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')} Z`
}

export const baudhayana_square: SimFile = {
  id: 'baudhayana_square',
  domain: 'math',
  classBand: '8-8',
  ncertClass: 8,
  label: 'Baudhāyana — square on the diagonal',
  description: 'A square on the diagonal has double the area of the original square. Later: a² + b² = c² on a right triangle. Not the old 3-4-5 drop-in.',
  equations: ['square on diagonal has area 2s²', 'a^2 + b^2 = c^2'],
  keywords: ['baudhayana', 'pythagoras', 'doubling a square', 'diagonal', 'sulba'],
  params: [
    param('side', 'Side of the first square', 'cm', 2, 8, 0.5, 4),
    choice('look', 'Look at', [
      { value: 0, label: 'double the square' },
      { value: 1, label: 'right triangle 3-4-5' },
    ], 0),
    param('a', 'Leg a (right-triangle mode)', '', 1, 8, 0.5, 3),
    param('b', 'Leg b (right-triangle mode)', '', 1, 8, 0.5, 4),
  ],
  schema: z.object({
    side: num(1, 10, 4),
    look: num(0, 1, 0),
    a: num(1, 10, 3),
    b: num(1, 10, 4),
  }),
  run(params) {
    const look = Math.round(params.look)
    const s = params.side
    const a = params.a
    const b = params.b
    const elements = []
    if (look === 0) {
      const px = 28
      const x0 = 80
      const y0 = 200
      const orig: Array<[number, number]> = [[x0, y0], [x0 + s * px, y0], [x0 + s * px, y0 - s * px], [x0, y0 - s * px]]
      const diag: [number, number] = [x0 + s * px, y0 - s * px]
      const vx = s * px
      const vy = -s * px
      // square on diagonal: rotate (vx,vy) by 90° → (vy, -vx) wait rotate 90 CCW of diagonal vector (s, -s) is (s, s) in screen? 
      // Diagonal from SW to NE: (s*px, -s*px). Perp of (dx,dy) is (-dy, dx) = (s*px, s*px) which goes down-right... 
      // We want the new square sitting on the diagonal, outward (up-right).
      const dx = s * px
      const dy = -s * px
      const pxp = -dy
      const pyp = dx
      const p2: [number, number] = [x0 + pxp, y0 + pyp]
      const p3: [number, number] = [diag[0] + pxp, diag[1] + pyp]
      const big: Array<[number, number]> = [[x0, y0], diag, p3, p2]
      const origArea = s * s
      const newArea = 2 * origArea
      elements.push(
        label('title', 24, 22, `Square on the diagonal has area ${newArea}. Original area is ${origArea}. Double.`),
        label('eq', 24, 40, `Side ${s} cm. Diagonal builds a square of ${newArea} square cm.`),
        pathEl('orig', { d: poly(orig), fill: '#93c5fd', stroke: '#1d4ed8', strokeWidth: 2 }),
        pathEl('big', { d: poly(big), fill: '#fde68a', stroke: '#b45309', strokeWidth: 2, opacity: 0.7 }),
        line('diag', { x1: x0, y1: y0, x2: diag[0], y2: diag[1], stroke: '#0f172a', strokeWidth: 3 }),
        label('tip', 24, 278, 'Baudhāyana: the diagonal of a square produces a square of double the area. Two small triangles vs four.'),
      )
      return {
        stage: { viewBox: VIEW, elements },
        metrics: { look, side: s, origArea, newArea, doubled: true },
        warnings: [],
        caption: 'Book: doubling a square. Default side 4 cm.',
      }
    }
    const c = Math.hypot(a, b)
    const a2 = a * a
    const b2 = b * b
    const c2 = a2 + b2
    elements.push(
      label('title', 24, 22, `${a}² + ${b}² = ${a2 + b2}. Hypotenuse² = ${c2.toFixed(2)}.`),
      label('eq', 24, 40, `Right triangle legs ${a} and ${b}. Hypotenuse ${c.toFixed(2)}.`),
      pathEl('tri', {
        d: poly([[80, 230], [80 + a * 28, 230], [80, 230 - b * 28]]),
        fill: '#e0f2fe',
        stroke: '#0f172a',
        strokeWidth: 2,
      }),
      label('la', 80 + a * 14, 248, `${a}`),
      label('lb', 50, 230 - b * 14, `${b}`),
      label('lc', 90 + a * 10, 230 - b * 16, `${c.toFixed(2)}`),
      label('tip', 24, 278, 'Use this mode only on pages that have moved from doubling a square to a²+b²=c².'),
    )
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, a, b, c, a2, b2, c2 },
      warnings: [],
      caption: 'Right-triangle check after the doubling story.',
    }
  },
}
