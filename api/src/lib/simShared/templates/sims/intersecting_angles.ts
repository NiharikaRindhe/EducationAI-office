// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, pathEl } from '../stage.js'

function arc(ox: number, oy: number, startDeg: number, endDeg: number, radius: number): string {
  const a0 = (startDeg * Math.PI) / 180
  const a1 = (endDeg * Math.PI) / 180
  const steps = Math.max(8, Math.round(Math.abs(endDeg - startDeg) / 6))
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = a0 + ((a1 - a0) * i) / steps
    pts.push(`${i === 0 ? 'M' : 'L'} ${(ox + radius * Math.cos(t)).toFixed(1)} ${(oy + radius * Math.sin(t)).toFixed(1)}`)
  }
  return pts.join(' ')
}

export const intersecting_angles: SimFile = {
  id: 'intersecting_angles',
  domain: 'math',
  classBand: '7-7',
  ncertClass: 7,
  label: 'Two lines cross — four corners',
  description: 'When two lines cross, opposite corners match. Neighbours on a straight line add to 180°.',
  equations: ['opposite corners equal', 'neighbours add to 180°'],
  keywords: ['intersecting lines', 'vertically opposite', 'linear pair', '120°'],
  params: [param('angleDeg', 'One corner', 'deg', 20, 160, 1, 120)],
  schema: z.object({
    angleDeg: num(10, 170, 120),
  }),
  run(params) {
    const A = Math.round(params.angleDeg)
    const adj = 180 - A
    const ox = 250
    const oy = 168
    const rad = (A * Math.PI) / 180
    const L = 140
    const ux = Math.cos(rad)
    const uy = Math.sin(rad)
    const elements = [
      label('title', 24, 22, 'Two sticks cross. Four corners appear.'),
      label('eq', 24, 40, `Opposite corners are both ${A}°. Next-door corners add to 180°.`),
      line('h', { x1: 70, y1: oy, x2: 430, y2: oy, stroke: '#334155', strokeWidth: 3 }),
      line('slash', { x1: ox - L * ux, y1: oy - L * uy, x2: ox + L * ux, y2: oy + L * uy, stroke: '#2563eb', strokeWidth: 3 }),
      circle('v', { cx: ox, cy: oy, r: 5, fill: '#0f172a' }),
      pathEl('a1', { d: arc(ox, oy, 0, A, 36), fill: 'none', stroke: '#16a34a', strokeWidth: 3 }),
      pathEl('a2', { d: arc(ox, oy, 180, 180 + A, 36), fill: 'none', stroke: '#16a34a', strokeWidth: 3 }),
      pathEl('b1', { d: arc(ox, oy, A, 180, 28), fill: 'none', stroke: '#d97706', strokeWidth: 2.5 }),
      pathEl('b2', { d: arc(ox, oy, 180 + A, 360, 28), fill: 'none', stroke: '#d97706', strokeWidth: 2.5 }),
      label('la', ox + 44, oy - 8, `${A}°`, '#16a34a'),
      label('la2', ox - 70, oy + 8, `${A}°`, '#16a34a'),
      label('lb', ox + 10, oy + 48, `${adj}°`, '#d97706'),
      label('lb2', ox - 40, oy - 40, `${adj}°`, '#d97706'),
      label('tip', 24, 278, 'Green pair: facing each other. Orange pair: sit on a straight line.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { angleDeg: A, opposite: A, neighbour: adj },
      warnings: [],
      caption: 'Book start: if one corner is 120°, the opposite is also 120°, and the next door is 60°.',
    }
  },
}
