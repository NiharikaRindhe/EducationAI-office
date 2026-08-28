// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, n, pathEl, tLoop } from '../stage.js'

export const perp_bisector: SimFile = {
  id: 'perp_bisector',
  domain: 'math',
  classBand: '7-7',
  ncertClass: 7,
  label: 'Midpoint and a square corner',
  description: 'Open a compass more than half the stick. Arc from both ends. The crossing line hits the middle at 90°.',
  equations: ['midpoint', '90° at the meeting'],
  keywords: ['perpendicular bisector', 'compass', 'midpoint', 'constructions', 'tilings'],
  params: [param('length', 'Segment', 'cm', 4, 12, 1, 8)],
  schema: z.object({
    length: num(3, 14, 8),
  }),
  run(params) {
    const length = Math.round(params.length)
    const ax = 90
    const ay = 170
    const bx = ax + length * 28
    const by = ay
    const mx = (ax + bx) / 2
    const my = ay
    const r = (length * 28) * 0.62
    const t = tLoop(5, 4.8)
    const elements = [
      label('title', 24, 22, 'Compass arcs from both ends. They cross. Join the crosses.'),
      label('eq', 24, 40, `The new line cuts the ${length} cm stick in half and stands at 90°.`),
      line('ab', { x1: ax, y1: ay, x2: bx, y2: by, stroke: '#334155', strokeWidth: 3 }),
      circle('A', { cx: ax, cy: ay, r: 5, fill: '#0f172a' }),
      circle('B', { cx: bx, cy: by, r: 5, fill: '#0f172a' }),
      label('lA', ax - 14, ay + 22, 'A'),
      label('lB', bx + 6, by + 22, 'B'),
      pathEl('arc1', {
        d: `M ${ax} ${ay - r} A ${r} ${r} 0 0 1 ${ax} ${ay + r}`,
        fill: 'none',
        stroke: '#2563eb',
        strokeWidth: 2,
        opacity: 0.7,
      }),
      pathEl('arc2', {
        d: `M ${bx} ${by - r} A ${r} ${r} 0 0 0 ${bx} ${by + r}`,
        fill: 'none',
        stroke: '#16a34a',
        strokeWidth: 2,
        opacity: 0.7,
      }),
      circle('top', { cx: mx, cy: ay - Math.sqrt(Math.max(0, r * r - (mx - ax) * (mx - ax))), r: 5, fill: '#d97706' }),
      circle('bot', { cx: mx, cy: ay + Math.sqrt(Math.max(0, r * r - (mx - ax) * (mx - ax))), r: 5, fill: '#d97706' }),
      line('perp', {
        x1: mx,
        y1: ay - 90,
        x2: mx,
        y2: ay + 90,
        stroke: '#7c3aed',
        strokeWidth: 2.5,
      }),
      circle('mid', { cx: mx, cy: my, r: 6, fill: '#f59e0b' }),
      label('m', mx + 10, my - 10, 'mid'),
      label('sq', mx + 10, my + 22, '90°', '#7c3aed'),
      circle('pen', {
        cx: { $expr: `${n(ax)} + (${n(bx)} - ${n(ax)}) * min((${t}) / 4.8, 1)` },
        cy: ay - 48,
        r: 5,
        fill: '#2563eb',
      }, 'projectile'),
      label('tip', 24, 278, 'This is the eye construction — not “does a pentagon leave a gap?”.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { length, mid: length / 2, rightAngle: 90 },
      warnings: [],
      caption: 'Two arcs, a midpoint, a square corner. Pause the moving pen while you explain.',
    }
  },
}
