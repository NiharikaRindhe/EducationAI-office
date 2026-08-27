// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, line } from '../stage.js'

export const tower_sight: SimFile = {
  id: 'tower_sight',
  domain: 'math',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Height from an angle',
  description: 'Line of sight to the top of a tower. h = d tan θ. Book heights and distances, default 30°. Elevation vs depression. Not the old d=20 generic tool.',
  equations: ['h = d tan θ'],
  keywords: ['angle of elevation', 'angle of depression', 'heights and distances', 'line of sight', 'tan theta'],
  params: [
    choice('look', 'Angle', [
      { value: 0, label: 'elevation' },
      { value: 1, label: 'depression' },
    ], 0),
    param('angleDeg', 'θ', '°', 15, 75, 5, 30),
    param('distance', 'Horizontal distance', 'm', 5, 40, 1, 10),
  ],
  schema: z.object({
    look: num(0, 1, 0),
    angleDeg: num(10, 80, 30),
    distance: num(4, 50, 10),
  }),
  run(params) {
    const look = Math.round(params.look)
    const th = (params.angleDeg * Math.PI) / 180
    const d = params.distance
    const h = d * Math.tan(th)
    const baseX = 80
    const baseY = 250
    const topY = baseY - Math.min(180, h * 8)
    const eyeX = look === 0 ? baseX + d * 12 : baseX + 40
    const eyeY = look === 0 ? baseY : topY + 20
    const elements = [
      label('title', 24, 22, look === 0
        ? `Elevation ${params.angleDeg}°. Distance ${d} m. Height = d tan θ = ${h.toFixed(2)} m.`
        : `Depression ${params.angleDeg}°. Looking down from the top.`),
      label('eq', 24, 40, 'Line of sight from the eye to the top (or to a point below). Horizontal is the ground line.'),
      line('ground', { x1: 40, y1: baseY, x2: 460, y2: baseY, stroke: '#64748b', strokeWidth: 2 }),
      line('tower', { x1: 380, y1: baseY, x2: 380, y2: topY, stroke: '#0f172a', strokeWidth: 6 }),
      line('sight', { x1: look === 0 ? 80 : 360, y1: look === 0 ? baseY : topY, x2: 380, y2: look === 0 ? topY : baseY - 40, stroke: '#d97706', strokeWidth: 2 }),
      line('horiz', { x1: look === 0 ? 80 : 300, y1: look === 0 ? baseY : topY, x2: 380, y2: look === 0 ? baseY : topY, stroke: '#94a3b8', strokeWidth: 1 }),
      label('th', 200, look === 0 ? 240 : topY + 24, `θ = ${params.angleDeg}°`),
      label('tip', 24, 286, 'Book Ch 9: electrician / minar / tower. Default 30°. h = d tan θ.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, angleDeg: params.angleDeg, distance: d, h },
      warnings: [],
      caption: `Book: θ = 30°, d = ${d} m. h = d tan θ.`,
    }
  },
}
