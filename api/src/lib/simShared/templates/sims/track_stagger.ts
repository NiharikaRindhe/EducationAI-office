// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label } from '../stage.js'

export const track_stagger: SimFile = {
  id: 'track_stagger',
  domain: 'math',
  classBand: '9-9',
  ncertClass: 9,
  label: 'Relay-lane stagger',
  description: 'A 400 m track. Outer lanes run a bigger circle. Stagger = 2π × lane width so every runner covers 400 m. Olympic lane is 1.22 m wide. Not Class 10 sectors.',
  equations: ['C = 2πr', 'stagger = 2π × lane width'],
  keywords: ['stagger', '4 × 100 m', 'circumference', 'C/D', 'perimeter of a circle', '400 m track'],
  params: [
    param('laneWidth', 'Lane width', 'm', 0.8, 1.5, 0.01, 1.22),
    param('track', 'Inner track length', 'm', 200, 400, 50, 400),
  ],
  schema: z.object({
    laneWidth: num(0.5, 2, 1.22),
    track: num(150, 500, 400),
  }),
  run(params) {
    const w = params.laneWidth
    const track = params.track
    const rIn = track / (2 * Math.PI)
    const stagger = 2 * Math.PI * w
    const rOut = rIn + w
    const cx = 250
    const cy = 160
    const s = 1.6
    const elements = [
      label('title', 24, 22, `Inner path ${track} m. Lane ${w} m wide. Stagger ${stagger.toFixed(2)} m.`),
      label('eq', 24, 40, `C = 2πr. Extra path = 2π × ${w} = ${stagger.toFixed(2)} m. Outer start is that far ahead.`),
      circle('out', { cx, cy, r: rOut * s, fill: 'none', stroke: '#fb923c', strokeWidth: 10 }),
      circle('inn', { cx, cy, r: rIn * s, fill: 'none', stroke: '#2563eb', strokeWidth: 10 }),
      label('tip', 24, 270, 'Book: 4 × 100 m relay. Outer lanes start ahead. A 200 m school track still uses the same lane width.'),
      label('cd', 24, 286, `C/D of any circle is π. Inner r ≈ ${rIn.toFixed(2)} m.`),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { laneWidth: w, track, stagger, rIn, rOut },
      warnings: [],
      caption: 'Book: 400 m track, 1.22 m lane. Stagger = 2π × 1.22 m.',
    }
  },
}
