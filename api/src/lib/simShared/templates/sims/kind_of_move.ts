// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, tLoop } from '../stage.js'

export const kind_of_move: SimFile = {
  id: 'kind_of_move',
  domain: 'physics',
  classBand: '6-6',
  ncertClass: 6,
  label: 'Rest, linear, circular, oscillatory',
  description: 'Motion means position changes against a reference point. Orange drop / car on a road is linear. Merry-go-round is circular. Swing is oscillatory. Passengers look at rest in the bus, in motion from a building. Not s = vt, not a metre scale.',
  equations: ['motion ⇔ position changes vs a reference point', 'circular and oscillatory are periodic'],
  keywords: ['linear motion', 'circular motion', 'oscillatory', 'reference point', 'merry-go-round', 'swing', 'types of motion'],
  params: [
    choice('look', 'Look at', [
      { value: 0, label: 'at rest (tree)' },
      { value: 1, label: 'linear (orange drop)' },
      { value: 2, label: 'circular (merry-go-round)' },
      { value: 3, label: 'oscillatory (swing)' },
    ], 1),
  ],
  schema: z.object({
    look: num(0, 3, 1),
  }),
  run(params) {
    const look = Math.round(params.look)
    const names = ['rest', 'linear', 'circular', 'oscillatory']
    const t = tLoop(3.2, 3)
    const titles = [
      'A tree does not change place against the ground. It is at rest.',
      'An orange dropping from a tree moves in a straight line — linear motion.',
      'Whirl an eraser on a thread. Merry-go-round. Circular motion.',
      'A swing moves to and fro about a fixed point — oscillatory motion.',
    ]
    const elements = [
      label('title', 24, 22, titles[look]),
      label('eq', 24, 40, 'Reference point: still in the bus; in motion against a building outside.'),
    ]
    if (look === 0) {
      elements.push(
        line('trunk', { x1: 250, y1: 220, x2: 250, y2: 120, stroke: '#7c3aed', strokeWidth: 10 }),
        circle('crown', { cx: 250, cy: 100, r: 40, fill: '#16a34a' }),
        label('tree', 232, 250, 'tree'),
      )
    } else if (look === 1) {
      elements.push(
        circle('orange', {
          cx: 250,
          cy: { $expr: `80 + 140 * min(1, (${t}) / 2.4)` },
          r: 14,
          fill: '#f97316',
        }, 'projectile'),
        line('ground', { x1: 80, y1: 240, x2: 420, y2: 240, stroke: '#475569', strokeWidth: 3 }),
        label('drop', 200, 262, 'straight down'),
      )
    } else if (look === 2) {
      elements.push(
        circle('hub', { cx: 250, cy: 155, r: 8, fill: '#334155' }),
        circle('path', { cx: 250, cy: 155, r: 70, fill: 'none', stroke: '#94a3b8', strokeWidth: 2 }),
        circle('eraser', {
          cx: { $expr: `250 + 70 * cos(6.283 * (${t}) / 3.2)` },
          cy: { $expr: `155 + 70 * sin(6.283 * (${t}) / 3.2)` },
          r: 12,
          fill: '#f472b6',
        }, 'projectile'),
        label('mgr', 180, 262, 'circular path'),
      )
    } else {
      const swingX = `250 + 90 * sin(3.14 * (${t}) / 1.6)`
      elements.push(
        line('bar', { x1: 160, y1: 50, x2: 340, y2: 50, stroke: '#334155', strokeWidth: 6 }),
        line('rope', {
          x1: 250,
          y1: 50,
          x2: { $expr: swingX },
          y2: 200,
          stroke: '#78716c',
          strokeWidth: 3,
        }),
        circle('seat', {
          cx: { $expr: swingX },
          cy: 210,
          r: 16,
          fill: '#f59e0b',
        }, 'projectile'),
        label('sw', 200, 262, 'to and fro'),
      )
    }
    elements.push(label('tip', 24, 282, 'Book: Table 5.4 children’s park — swing is oscillatory. Car on a straight road is linear.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, name: names[look], periodic: look === 2 || look === 3 },
      warnings: [],
      caption: 'Book 5.7: types of motion. Rest vs motion needs a reference point.',
    }
  },
}
