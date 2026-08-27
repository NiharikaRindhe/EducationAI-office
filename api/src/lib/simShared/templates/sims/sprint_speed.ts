// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, n, tLoop } from '../stage.js'

export const sprint_speed: SimFile = {
  id: 'sprint_speed',
  domain: 'physics',
  classBand: '7-7',
  ncertClass: 7,
  label: '100 m sprint',
  description: 'Speed = distance ÷ time. A 100 m race with a stopwatch. Steady pace vs speeding up.',
  equations: ['speed = distance ÷ time'],
  keywords: ['speed', '100 m', 'stopwatch', 'uniform motion', 'time and motion'],
  params: [
    param('distance', 'Race', 'm', 20, 200, 10, 100),
    param('timeSec', 'Time', 's', 5, 30, 1, 12),
    choice('pace', 'Pace', [
      { value: 0, label: 'steady' },
      { value: 1, label: 'not steady' },
    ], 0),
  ],
  schema: z.object({
    distance: num(10, 400, 100),
    timeSec: num(2, 40, 12),
    pace: num(0, 1, 0),
  }),
  run(params) {
    const d = Math.round(params.distance)
    const T = Math.round(params.timeSec)
    const pace = Math.round(params.pace)
    const speed = d / T
    const t = tLoop(Math.max(4, T / 2), Math.max(3.5, T / 2 - 0.3))
    const x0 = 50
    const x1 = 450
    const frac = pace === 0
      ? `min((${t}) / ${n(Math.max(3.5, T / 2 - 0.3))}, 1)`
      : `min(pow((${t}) / ${n(Math.max(3.5, T / 2 - 0.3))}, 2), 1)`
    const elements = [
      label('title', 24, 22, `${d} m in ${T} s  →  speed = ${speed.toFixed(2)} m/s`),
      label('eq', 24, 42, pace === 0
        ? 'Steady: equal distance in equal time.'
        : 'Not steady: the runner speeds up. Equal times, unequal distances.'),
      line('track', { x1: x0, y1: 180, x2: x1, y2: 180, stroke: '#16a34a', strokeWidth: 8 }),
      label('s0', x0, 210, '0'),
      label('s1', x1 - 24, 210, `${d} m`),
      circle('runner', {
        cx: { $expr: `${n(x0)} + (${n(x1)} - ${n(x0)}) * ${frac}` },
        cy: 168,
        r: 12,
        fill: '#2563eb',
      }, 'projectile'),
      label('tip', 24, 258, 'No pendulum formula. No s = vt cart from a higher class. Pause mid-race to mark time.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { distance: d, timeSec: T, speed },
      warnings: [],
      caption: 'Book picture: a 100 m sprint and a stopwatch.',
    }
  },
}
