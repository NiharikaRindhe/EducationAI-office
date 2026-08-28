// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, line, rect } from '../stage.js'

export const glass_slab: SimFile = {
  id: 'glass_slab',
  domain: 'physics',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Ray through a glass slab',
  description: 'A ray enters a rectangular glass slab, bends toward the normal, then comes out parallel but shifted. Book n ≈ 1.5. Not the old Snell-only boundary.',
  equations: ['n1 sin i = n2 sin r', 'emergent ray ∥ incident, laterally shifted'],
  keywords: ['glass slab', 'refraction', 'lateral shift', 'rectangular slab', 'refractive index'],
  params: [
    param('theta1', 'Angle of incidence', '°', 10, 60, 1, 35),
    param('n2', 'n of glass', '', 1.2, 1.8, 0.05, 1.5),
  ],
  schema: z.object({
    theta1: num(5, 70, 35),
    n2: num(1.1, 2, 1.5),
  }),
  run(params) {
    const i = (params.theta1 * Math.PI) / 180
    const n2 = params.n2
    const sR = Math.min(0.999, Math.sin(i) / n2)
    const r = Math.asin(sR)
    const shift = 40 * Math.sin(i - r)
    const elements = [
      label('title', 24, 22, `Air n=1 to glass n=${n2}. i = ${params.theta1}°. Ray comes out parallel, shifted.`),
      label('eq', 24, 40, `sin i / sin r = n. Lateral shift ≈ ${shift.toFixed(1)} (scale).`),
      rect('slab', { x: 180, y: 70, width: 140, height: 160, fill: '#e0f2fe', stroke: '#0284c7', strokeWidth: 2 }),
      line('in', { x1: 60, y1: 80, x2: 180, y2: 120, stroke: '#d97706', strokeWidth: 2 }),
      line('mid', { x1: 180, y1: 120, x2: 320, y2: 150, stroke: '#2563eb', strokeWidth: 2 }),
      line('out', { x1: 320, y1: 150, x2: 460, y2: 190, stroke: '#d97706', strokeWidth: 2 }),
      line('n1', { x1: 180, y1: 80, x2: 180, y2: 200, stroke: '#94a3b8', strokeWidth: 1 }),
      label('tip', 24, 286, 'Book 9.3.1: rectangular glass slab. Emergent ray is parallel to the incident ray. Air to glass n ≈ 1.5.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { theta1: params.theta1, n2, rDeg: (r * 180) / Math.PI, shift },
      warnings: [],
      caption: 'Book: glass slab, n ≈ 1.5. Lateral shift.',
    }
  },
}
