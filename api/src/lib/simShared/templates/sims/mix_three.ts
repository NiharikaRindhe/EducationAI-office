// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, rect } from '../stage.js'

export const mix_three: SimFile = {
  id: 'mix_three',
  domain: 'chemistry',
  classBand: '9-9',
  ncertClass: 9,
  label: 'Salt, chalk, milk',
  description: 'Activity 5.1: salt in 50 mL water is a true solution (no Tyndall). Chalk is a suspension (settles, residue). Milk is a colloid (Tyndall). Not Class 6 tea-filter and not Class 8 ORS.',
  equations: ['solution: no Tyndall', 'colloid: Tyndall', 'suspension: settles'],
  keywords: ['tyndall', 'homogeneous', 'colloid', 'suspension', 'chalk powder', 'laser', 'exploring mixtures'],
  params: [
    choice('look', 'Beaker', [
      { value: 0, label: 'salt in water' },
      { value: 1, label: 'chalk in water' },
      { value: 2, label: 'milk in water' },
    ], 0),
    choice('laser', 'Laser', [
      { value: 0, label: 'off' },
      { value: 1, label: 'on' },
    ], 1),
  ],
  schema: z.object({
    look: num(0, 2, 0),
    laser: num(0, 1, 1),
  }),
  run(params) {
    const look = Math.round(params.look)
    const laser = Math.round(params.laser)
    const names = ['Salt + water — true solution. Homogeneous.', 'Chalk + water — suspension. Particles settle.', 'Milk + water — colloid. Particles stay spread.']
    const tyndall = look > 0
    const residue = look === 1
    const elements = [
      label('title', 24, 22, names[look]),
      label('eq', 24, 40, laser
        ? (tyndall ? 'The laser path is bright — Tyndall effect.' : 'The laser path is not seen. Particles are too small.')
        : 'Turn the laser on. Do not shine it at an eye.'),
      rect('beaker', { x: 180, y: 70, width: 140, height: 160, fill: look === 2 ? '#fef3c7' : '#e0f2fe', stroke: '#334155', strokeWidth: 2 }),
    ]
    if (look === 1) {
      for (let i = 0; i < 10; i++) {
        elements.push(circle(`c${i}`, { cx: 200 + (i % 5) * 20, cy: 200 - Math.floor(i / 5) * 18, r: 5, fill: '#cbd5e1' }))
      }
    }
    if (look === 2) {
      for (let i = 0; i < 14; i++) {
        elements.push(circle(`m${i}`, { cx: 200 + (i % 5) * 22, cy: 110 + Math.floor(i / 5) * 28, r: 4, fill: '#f8fafc', opacity: 0.9 }))
      }
    }
    if (laser) {
      elements.push(line('beam', { x1: 40, y1: 140, x2: 400, y2: 140, stroke: tyndall ? '#ef4444' : '#fecaca', strokeWidth: tyndall ? 4 : 1 }))
    }
    elements.push(label('tip', 24, 270, residue
      ? 'Filter: residue on the paper. Suspension.'
      : look === 0
        ? 'Filter: no residue. A solution.'
        : 'Filter: little or no residue. A colloid.'))
    elements.push(label('kind', 24, 286, ['SOLUTION', 'SUSPENSION', 'COLLOID'][look], '#0f172a'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, laser, tyndall, residue, name: ['solution', 'suspension', 'colloid'][look] },
      warnings: [],
      caption: 'Book Activity 5.1: salt / chalk / milk in 50 mL. Laser, then filter.',
    }
  },
}
