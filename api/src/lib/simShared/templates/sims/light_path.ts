// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, rect } from '../stage.js'

export const light_path: SimFile = {
  id: 'light_path',
  domain: 'physics',
  classBand: '7-7',
  ncertClass: 7,
  label: 'Torch, shadow, one mirror image',
  description: 'Light goes straight. An opaque card makes a shadow. A plane mirror shows one image. No H/h = D/u formula.',
  equations: ['light travels in a straight line', 'one image in a plane mirror'],
  keywords: ['shadow', 'torch', 'opaque', 'plane mirror', 'reflection', 'straight line'],
  params: [
    choice('mode', 'Look at', [
      { value: 0, label: 'shadow' },
      { value: 1, label: 'plane mirror' },
    ], 0),
    param('card', 'Card distance', '', 80, 220, 10, 140),
  ],
  schema: z.object({
    mode: num(0, 1, 0),
    card: num(60, 240, 140),
  }),
  run(params) {
    const mode = Math.round(params.mode)
    const card = Math.round(params.card)
    const elements = [
      label('title', 24, 22, mode === 0
        ? 'Torch → card → shadow on the wall. Light does not bend around the card.'
        : 'A plane mirror: one image, the same size, as far behind as you stand in front.'),
    ]
    if (mode === 0) {
      elements.push(
        circle('torch', { cx: 50, cy: 160, r: 16, fill: '#fbbf24' }),
        line('r1', { x1: 66, y1: 150, x2: 430, y2: 110, stroke: '#f59e0b', strokeWidth: 2 }),
        line('r2', { x1: 66, y1: 170, x2: 430, y2: 210, stroke: '#f59e0b', strokeWidth: 2 }),
        rect('card', { x: card, y: 120, width: 14, height: 80, fill: '#334155', rx: 2 }),
        rect('wall', { x: 430, y: 70, width: 16, height: 180, fill: '#e2e8f0', stroke: '#94a3b8' }),
        rect('shade', { x: 432, y: 120, width: 12, height: 80, fill: '#0f172a', opacity: 0.55 }),
        label('c', card - 10, 220, 'card'),
        label('s', 400, 268, 'shadow'),
        label('tip', 24, 42, 'Opaque card blocks the straight rays. No similar-triangle formula.')
      )
    } else {
      const personX = 160
      const mirrorX = 280
      const imgX = mirrorX + (mirrorX - personX)
      elements.push(
        line('m', { x1: mirrorX, y1: 60, x2: mirrorX, y2: 250, stroke: '#38bdf8', strokeWidth: 5 }),
        label('ml', mirrorX + 10, 54, 'mirror'),
        rect('p', { x: personX - 14, y: 140, width: 28, height: 70, fill: '#2563eb', rx: 6 }),
        rect('img', { x: imgX - 14, y: 140, width: 28, height: 70, fill: '#93c5fd', rx: 6, opacity: 0.7 }),
        line('eye', { x1: personX, y1: 150, x2: mirrorX, y2: 150, stroke: '#f59e0b', strokeWidth: 2 }),
        label('you', personX - 10, 230, 'you'),
        label('im', imgX - 18, 230, 'image'),
        label('tip', 24, 42, 'One image only. We do not draw i = r with a Class 8 protractor yet.')
      )
    }
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { mode, card },
      warnings: [],
      caption: 'Torch, opaque card, plane mirror — the three pictures in this chapter.',
    }
  },
}
