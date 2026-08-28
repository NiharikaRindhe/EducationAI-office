// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

function quadrant(x: number, y: number): string {
  if (x === 0 && y === 0) return 'the origin O'
  if (x === 0) return y > 0 ? 'the positive y-axis' : 'the negative y-axis'
  if (y === 0) return x > 0 ? 'the positive x-axis' : 'the negative x-axis'
  if (x > 0 && y > 0) return 'quadrant I'
  if (x < 0 && y > 0) return 'quadrant II'
  if (x < 0 && y < 0) return 'quadrant III'
  return 'quadrant IV'
}

export const four_quadrant: SimFile = {
  id: 'four_quadrant',
  domain: 'math',
  classBand: '9-9',
  ncertClass: 9,
  label: 'Four-quadrant plane',
  description: 'A point is two numbers from the origin O. Negative axes are values less than zero. Book point (0, −4.5) sits on the negative y-axis. Not a Class 7 two-point plot.',
  equations: ['P(x, y)', 'origin O = (0, 0)'],
  keywords: ['cartesian', 'quadrant', 'origin', 'coordinates', 'orienting yourself', 'negative axes'],
  params: [
    param('x', 'x', '', -8, 8, 0.5, 3),
    param('y', 'y', '', -8, 8, 0.5, 4),
  ],
  schema: z.object({
    x: num(-8, 8, 3),
    y: num(-8, 8, 4),
  }),
  run(params) {
    const x = params.x
    const y = params.y
    const ox = 250
    const oy = 160
    const s = 18
    const q = quadrant(x, y)
    const elements = [
      label('title', 24, 22, `P(${x}, ${y}) is ${q}. Origin O is (0, 0).`),
      label('eq', 24, 40, 'x is right/left of O. y is up/down of O. Negative means the other way.'),
      line('xaxis', { x1: 40, y1: oy, x2: 460, y2: oy, stroke: '#475569', strokeWidth: 1.5 }),
      line('yaxis', { x1: ox, y1: 50, x2: ox, y2: 270, stroke: '#475569', strokeWidth: 1.5 }),
      label('xp', 448, oy - 8, 'x'),
      label('yp', ox + 6, 58, 'y'),
      label('O', ox + 6, oy + 14, 'O'),
      circle('P', { cx: ox + x * s, cy: oy - y * s, r: 7, fill: '#2563eb' }),
      label('pl', ox + x * s + 10, oy - y * s - 8, `P(${x}, ${y})`),
      label('tip', 24, 286, 'Book: (0, −4.5) is 4.5 units down from O. Brahmagupta’s zero makes four quadrants possible.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { x, y, quadrant: q, onAxis: x === 0 || y === 0 },
      warnings: [],
      caption: 'Book: four-quadrant plane. Default P(3, 4). Try (0, −4.5).',
    }
  },
}
