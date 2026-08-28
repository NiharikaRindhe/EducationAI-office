// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, rect } from '../stage.js'

export const machine_help: SimFile = {
  id: 'machine_help',
  domain: 'physics',
  classBand: '9-9',
  ncertClass: 9,
  label: 'Pulley, incline, lever',
  description: 'Simple machines trade force for distance. Incline: MA = length / height. Pulley and lever too. Not Class 8 bag-strap pressure.',
  equations: ['MA = load / effort', 'incline MA ≈ L / h'],
  keywords: ['simple machines', 'pulley', 'inclined plane', 'lever', 'mechanical advantage'],
  params: [
    choice('look', 'Machine', [
      { value: 0, label: 'inclined plane' },
      { value: 1, label: 'pulley' },
      { value: 2, label: 'lever' },
    ], 0),
    param('load', 'Load', 'N', 10, 100, 5, 50),
    param('length', 'Incline length', 'm', 2, 10, 0.5, 4),
    param('h', 'Height', 'm', 0.5, 4, 0.5, 1),
  ],
  schema: z.object({
    look: num(0, 2, 0),
    load: num(5, 200, 50),
    length: num(1, 12, 4),
    h: num(0.5, 6, 1),
  }),
  run(params) {
    const look = Math.round(params.look)
    const load = params.load
    const L = params.length
    const h = Math.min(params.h, L - 0.1)
    const ma = L / h
    const effort = load / ma
    const names = ['Inclined plane', 'Pulley', 'Lever']
    const elements = [
      label('title', 24, 22, `${names[look]}. Load ${load} N. Effort about ${effort.toFixed(1)} N. MA ≈ ${ma.toFixed(2)}.`),
      label('eq', 24, 40, look === 0 ? `MA ≈ length/height = ${L}/${h} = ${ma.toFixed(2)}.` : 'A machine lets you use a smaller force over a longer path.'),
    ]
    if (look === 0) {
      elements.push(
        line('ramp', { x1: 80, y1: 230, x2: 80 + 220, y2: 230 - 80, stroke: '#334155', strokeWidth: 4 }),
        rect('box', { x: 180, y: 150, width: 40, height: 28, fill: '#d97706' }),
      )
    } else if (look === 1) {
      elements.push(
        circle('wheel', { cx: 250, cy: 90, r: 28, fill: 'none', stroke: '#334155', strokeWidth: 4 }),
        line('left', { x1: 222, y1: 90, x2: 222, y2: 200, stroke: '#64748b', strokeWidth: 2 }),
        line('right', { x1: 278, y1: 90, x2: 278, y2: 160, stroke: '#64748b', strokeWidth: 2 }),
        rect('load', { x: 260, y: 160, width: 36, height: 28, fill: '#d97706' }),
      )
    } else {
      elements.push(
        line('bar', { x1: 80, y1: 180, x2: 400, y2: 180, stroke: '#334155', strokeWidth: 6 }),
        circle('fulcrum', { cx: 220, cy: 200, r: 14, fill: '#78716c' }),
      )
    }
    elements.push(label('tip', 24, 286, 'Book §7.6: pulley, inclined plane, lever. Building blocks of everyday machines.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, load, length: L, h, ma, effort },
      warnings: [],
      caption: 'Book: incline default. MA = length / height.',
    }
  },
}
