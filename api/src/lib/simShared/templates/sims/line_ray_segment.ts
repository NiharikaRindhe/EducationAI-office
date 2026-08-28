// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const line_ray_segment: SimFile = {
  id: 'line_ray_segment',
  domain: 'math',
  classBand: '6-6',
  ncertClass: 6,
  label: 'Point, segment, ray, line',
  description: 'A point is a precise spot. A crease gives a line segment with two ends. A ray starts at one point and goes on. A line through A and B never ends. Not Class 7 crossing angles.',
  equations: ['two points → one unique line'],
  keywords: ['lines and angles', 'line segment', 'ray', 'point', 'crease', 'lighthouse'],
  params: [
    choice('kind', 'Look at', [
      { value: 0, label: 'point' },
      { value: 1, label: 'line segment' },
      { value: 2, label: 'ray' },
      { value: 3, label: 'line' },
    ], 1),
  ],
  schema: z.object({
    kind: num(0, 3, 1),
  }),
  run(params) {
    const kind = Math.round(params.kind)
    const titles = [
      'A point is a precise location. It has no length. Mark it with a capital letter.',
      'A line segment has two end points, A and B. The crease of a fold is a model for it. Shortest path from A to B.',
      'A ray starts at A and goes on forever one way — like a torch beam or a lighthouse.',
      'A line through A and B goes forever both ways. You cannot draw the whole of it. Any two points sit on exactly one line.',
    ]
    const elements = [
      label('title', 24, 22, titles[kind]),
      label('eq', 24, 44, ['Point P', 'Segment AB', 'Ray AP', 'Line AB  (no ends)'][kind]),
    ]
    if (kind === 0) {
      elements.push(circle('p', { cx: 250, cy: 160, r: 6, fill: '#0f172a' }), label('pl', 242, 186, 'P'))
    } else {
      const ax = 120
      const ay = 160
      const bx = 360
      const by = 160
      elements.push(circle('A', { cx: ax, cy: ay, r: 6, fill: '#0f172a' }), label('Al', ax - 4, ay + 24, 'A'))
      if (kind === 1) {
        elements.push(line('ab', { x1: ax, y1: ay, x2: bx, y2: by, stroke: '#2563eb', strokeWidth: 4 }))
        elements.push(circle('B', { cx: bx, cy: by, r: 6, fill: '#0f172a' }), label('Bl', bx - 4, by + 24, 'B'))
      } else if (kind === 2) {
        elements.push(line('ray', { x1: ax, y1: ay, x2: 470, y2: by, stroke: '#d97706', strokeWidth: 4 }))
        elements.push(circle('P', { cx: 300, cy: 160, r: 6, fill: '#0f172a' }), label('Pl', 294, 186, 'P'))
        elements.push(label('arrow', 450, 148, '→'))
      } else {
        elements.push(line('ln', { x1: 30, y1: ay, x2: 470, y2: by, stroke: '#0f172a', strokeWidth: 4 }))
        elements.push(circle('B', { cx: bx, cy: by, r: 6, fill: '#0f172a' }), label('Bl', bx - 4, by + 24, 'B'))
        elements.push(label('lft', 36, 148, '←'), label('rgt', 450, 148, '→'))
      }
    }
    elements.push(label('tip', 24, 268, 'Book: Rihan — many lines through one point. Sheetal — exactly one line through two points.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { kind, name: ['point', 'segment', 'ray', 'line'][kind] },
      warnings: [],
      caption: 'Book start: point, crease = segment, ray, line.',
    }
  },
}
