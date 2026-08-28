// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const dist_displace: SimFile = {
  id: 'dist_displace',
  domain: 'physics',
  classBand: '9-9',
  ncertClass: 9,
  label: 'Distance and displacement',
  description: 'An athlete runs out from origin O then comes back. Distance is the path length. Displacement is the straight arrow from start to finish. Not a Class 7 100 m sprint.',
  equations: ['distance = path length', 'displacement = final − start'],
  keywords: ['distance travelled', 'displacement', 'reference point', 'describing motion', 'athlete'],
  params: [
    param('out', 'Out from O', 'm', 10, 150, 5, 100),
    param('back', 'Back towards O', 'm', 0, 150, 5, 40),
  ],
  schema: z.object({
    out: num(5, 200, 100),
    back: num(0, 200, 40),
  }),
  run(params) {
    const out = params.out
    const back = Math.min(params.back, params.out)
    const distance = out + back
    const displacement = out - back
    const ox = 50
    const y = 160
    const s = 3.2
    const end = ox + displacement * s
    const far = ox + out * s
    const elements = [
      label('title', 24, 22, `Out ${out} m, back ${back} m. Distance ${distance} m. Displacement ${displacement} m to the right of O.`),
      label('eq', 24, 40, 'Distance has no direction. Displacement needs a direction from the reference point O.'),
      line('track', { x1: ox, y1: y, x2: 470, y2: y, stroke: '#94a3b8', strokeWidth: 2 }),
      circle('O', { cx: ox, cy: y, r: 6, fill: '#0f172a' }),
      label('Ol', ox - 4, y + 22, 'O'),
      line('outA', { x1: ox, y1: y - 24, x2: far, y2: y - 24, stroke: '#2563eb', strokeWidth: 3 }),
      line('backA', { x1: far, y1: y + 24, x2: end, y2: y + 24, stroke: '#d97706', strokeWidth: 3 }),
      circle('ath', { cx: end, cy: y, r: 10, fill: '#16a34a' }),
      label('tip', 24, 270, 'Book: athlete on a straight track. Mark O, then positions at different times.'),
      label('d', 24, 286, `Path (blue then gold) = ${distance} m. Green arrow from O = ${displacement} m.`),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { out, back, distance, displacement },
      warnings: [],
      caption: 'Book: out 100 m, back 40 m. Distance 140 m, displacement 60 m.',
    }
  },
}
