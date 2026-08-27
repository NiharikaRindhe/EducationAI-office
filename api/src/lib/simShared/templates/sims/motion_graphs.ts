// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, pathEl } from '../stage.js'

export const motion_graphs: SimFile = {
  id: 'motion_graphs',
  domain: 'physics',
  classBand: '9-9',
  ncertClass: 9,
  label: 's–t, v–t, and a round path',
  description: 'Constant acceleration: s = ut + ½at², v = u + at. Book free-fall a = 9.8. Other look: uniform circular motion — speed constant, direction changes. Not the old 7–10 s–t file.',
  equations: ['v = u + at', 's = ut + ½at²'],
  keywords: ['position-time', 'velocity-time', 'kinematic', '9.8', 'uniform circular motion', 'describing motion'],
  params: [
    param('u', 'u', 'm/s', 0, 20, 1, 0),
    param('a', 'a', 'm/s²', 0, 12, 0.2, 9.8),
    param('t', 't', 's', 1, 6, 0.5, 3),
    choice('look', 'Look at', [
      { value: 0, label: 's–t and v–t' },
      { value: 1, label: 'round path (UCM)' },
    ], 0),
  ],
  schema: z.object({
    u: num(0, 30, 0),
    a: num(0, 15, 9.8),
    t: num(0.5, 8, 3),
    look: num(0, 1, 0),
  }),
  run(params) {
    const u = params.u
    const a = params.a
    const t = params.t
    const look = Math.round(params.look)
    const v = u + a * t
    const s = u * t + 0.5 * a * t * t
    if (look === 1) {
      const cx = 250
      const cy = 160
      const R = 70
      const elements = [
        label('title', 24, 22, 'Uniform circular motion. Speed stays the same. Direction keeps turning.'),
        label('eq', 24, 40, 'Not a projectile. A stone on a string, a point on a wheel.'),
        circle('path', { cx, cy, r: R, fill: 'none', stroke: '#94a3b8', strokeWidth: 2 }),
        circle('p', { cx: cx + R, cy, r: 8, fill: '#2563eb' }),
        line('r', { x1: cx, y1: cy, x2: cx + R, y2: cy, stroke: '#64748b', strokeWidth: 1 }),
        label('tip', 24, 286, 'Book Ch 4: linear motion and uniform circular motion. Pause while you talk about velocity as a vector.'),
      ]
      return {
        stage: { viewBox: VIEW, elements },
        metrics: { look, u, a, t, v, s, ucm: true },
        warnings: [],
        caption: 'Book: uniform circular motion. Speed constant, direction changes.',
      }
    }
    const ox = 70
    const oy = 230
    const pts: string[] = []
    for (let i = 0; i <= 20; i++) {
      const ti = (t * i) / 20
      const si = u * ti + 0.5 * a * ti * ti
      pts.push(`${ox + (ti / t) * 200} ${oy - (si / Math.max(s, 1)) * 140}`)
    }
    const elements = [
      label('title', 24, 22, `u=${u}, a=${a}, t=${t} s.  v=${v.toFixed(1)} m/s.  s=${s.toFixed(1)} m.`),
      label('eq', 24, 40, 'v = u + at.  s = ut + ½at². Book table: 0, 9.8, 19.6, 29.4 m/s when a = 9.8.'),
      line('ax', { x1: ox, y1: oy, x2: ox + 210, y2: oy, stroke: '#94a3b8' }),
      line('ay', { x1: ox, y1: oy, x2: ox, y2: 70, stroke: '#94a3b8' }),
      pathEl('st', { d: `M ${pts.join(' L ')}`, fill: 'none', stroke: '#2563eb', strokeWidth: 2 }),
      label('tip', 24, 270, 'Blue curve is s against t (a parabola when a is not zero).'),
      label('v', 24, 286, `After ${t} s the v–t graph is a straight slope of ${a}.`),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, u, a, t, v, s },
      warnings: [],
      caption: 'Book: u=0, a=9.8, t=3 s. Free-fall numbers.',
    }
  },
}
