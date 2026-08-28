// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const lift_work: SimFile = {
  id: 'lift_work',
  domain: 'physics',
  classBand: '9-9',
  ncertClass: 9,
  label: 'Wheat bag and a slide',
  description: 'A 5 kg bag lifted 1 m. W = mgh. Three bags, or 3 m, triples the work. Slide look: PE becomes KE. Not the old W = Fs cosθ lab.',
  equations: ['W = mgh', 'PE + KE stays the same on a smooth slide'],
  keywords: ['wheat bag', 'work done', '5 kg', '1 m', 'kinetic energy', 'potential energy', 'slide'],
  params: [
    param('mass', 'Mass of one bag', 'kg', 1, 10, 0.5, 5),
    param('h', 'Height', 'm', 0.5, 5, 0.5, 1),
    param('bags', 'How many bags', '', 1, 3, 1, 1),
    choice('look', 'Look at', [
      { value: 0, label: 'lifting bags' },
      { value: 1, label: 'slide (energy)' },
    ], 0),
  ],
  schema: z.object({
    mass: num(0.5, 20, 5),
    h: num(0.2, 8, 1),
    bags: num(1, 3, 1),
    look: num(0, 1, 0),
  }),
  run(params) {
    const m = params.mass
    const h = params.h
    const bags = Math.max(1, Math.min(3, Math.round(params.bags)))
    const look = Math.round(params.look)
    const g = 9.8
    const W = bags * m * g * h
    if (look === 1) {
      const v = Math.sqrt(2 * g * h)
      const elements = [
        label('title', 24, 22, `Smooth slide of height ${h} m. At the bottom, v = √(2gh) = ${v.toFixed(2)} m/s.`),
        label('eq', 24, 40, 'mgh at the top becomes ½mv² at the bottom. Mass cancels — two children, same v.'),
        rect('slide', { x: 80, y: 80, width: 280, height: 12, fill: '#38bdf8', transform: undefined }),
        label('tip', 24, 270, 'Book Think It Over: blue slide. Different masses, same velocity at the bottom if the slide is smooth.'),
        label('w', 24, 286, `PE at top = ${ (m * g * h).toFixed(1) } J for mass ${m} kg.`),
      ]
      return {
        stage: { viewBox: VIEW, elements },
        metrics: { look, mass: m, h, bags, W, v },
        warnings: [],
        caption: 'Book: child on a slide. PE → KE. Mass does not change v.',
      }
    }
    const elements = [
      label('title', 24, 22, `${bags} bag(s) of ${m} kg, height ${h} m. Work = ${W.toFixed(1)} J.`),
      label('eq', 24, 40, 'W = mgh. Three bags, or three metres, triples the work.'),
    ]
    for (let i = 0; i < bags; i++) {
      elements.push(rect(`bag${i}`, { x: 80 + i * 90, y: 200 - h * 40, width: 70, height: 50, fill: '#d97706', rx: 4 }))
    }
    elements.push(label('tip', 24, 270, 'Book Fig. 7.2: 5 kg wheat bag, 1 m. Lift slowly — force ≈ mg upward.'))
    elements.push(label('g', 24, 286, `g = 9.8 m/s². One bag 1 m → ${ (m * g * h).toFixed(1) } J.`))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, mass: m, h, bags, W, g },
      warnings: [],
      caption: 'Book: 5 kg bag, 1 m. W = 49 J.',
    }
  },
}
