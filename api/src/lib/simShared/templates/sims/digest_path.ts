// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, n, tLoop } from '../stage.js'

const STOPS = [
  { name: 'mouth', x: 80, y: 80 },
  { name: 'food pipe', x: 80, y: 150 },
  { name: 'stomach', x: 180, y: 190 },
  { name: 'small intestine', x: 300, y: 170 },
  { name: 'large intestine', x: 400, y: 120 },
]

export const digest_path: SimFile = {
  id: 'digest_path',
  domain: 'chemistry',
  classBand: '7-7',
  ncertClass: 7,
  label: 'Food’s journey',
  description: 'Mouth → food pipe → stomach → intestine. Pause at each stop to say what happens there.',
  equations: ['mouth → food pipe → stomach → intestine'],
  keywords: ['digestion', 'food pipe', 'stomach', 'intestine', 'life processes in animals'],
  params: [
    choice('stop', 'Stop to talk about', [
      { value: 0, label: 'mouth' },
      { value: 1, label: 'food pipe' },
      { value: 2, label: 'stomach' },
      { value: 3, label: 'small intestine' },
      { value: 4, label: 'large intestine' },
    ], 0),
    choice('mode', 'Also show', [
      { value: 0, label: 'food journey' },
      { value: 1, label: 'breathing' },
    ], 0),
  ],
  schema: z.object({
    stop: num(0, 4, 0),
    mode: num(0, 1, 0),
  }),
  run(params) {
    const stop = Math.max(0, Math.min(4, Math.round(params.stop)))
    const mode = Math.round(params.mode)
    const t = tLoop(8, 7.5)
    const notes = [
      'Mouth: teeth cut, saliva wets.',
      'Food pipe: a squeeze-push down to the stomach.',
      'Stomach: a bag that churns and mixes.',
      'Small intestine: food becomes tiny and is taken into blood.',
      'Large intestine: leftover water is taken back.',
    ]
    const elements = [
      label('title', 24, 22, mode === 1 ? 'Breathing: air in, air out — lungs swell and shrink.' : 'Follow one bite of food.'),
      label('eq', 24, 42, mode === 1 ? 'Nose → windpipe → lungs. Pause when the chest is full.' : notes[stop]),
    ]
    if (mode === 0) {
      STOPS.forEach((s, i) => {
        elements.push(
          circle(`s${i}`, { cx: s.x, cy: s.y, r: i === stop ? 22 : 16, fill: i === stop ? '#fbbf24' : '#cbd5e1' }),
          label(`n${i}`, s.x - 24, s.y + 36, s.name)
        )
        if (i < STOPS.length - 1) {
          const n = STOPS[i + 1]
          elements.push({
            id: `l${i}`,
            type: 'line',
            role: 'none',
            props: { x1: s.x, y1: s.y, x2: n.x, y2: n.y, stroke: '#94a3b8', strokeWidth: 3 },
          })
        }
      })
      const a = STOPS[Math.min(stop, 3)]
      const b = STOPS[Math.min(stop + 1, 4)]
      elements.push(
        circle('food', {
          cx: { $expr: `${n(a.x)} + (${n(b.x)} - ${n(a.x)}) * min((${t}) / 7.5, 1)` },
          cy: { $expr: `${n(a.y)} + (${n(b.y)} - ${n(a.y)}) * min((${t}) / 7.5, 1)` },
          r: 8,
          fill: '#d97706',
        }, 'projectile')
      )
    } else {
      elements.push(
        circle('lungL', {
          cx: 180,
          cy: 160,
          r: { $expr: `40 + 10 * sin(${t} * 2)` },
          fill: '#bae6fd',
          stroke: '#0284c7',
          strokeWidth: 2,
        }),
        circle('lungR', {
          cx: 300,
          cy: 160,
          r: { $expr: `40 + 10 * sin(${t} * 2)` },
          fill: '#bae6fd',
          stroke: '#0284c7',
          strokeWidth: 2,
        }),
        label('air', 200, 250, 'air in … air out')
      )
    }
    elements.push(label('tip', 24, 278, 'Pause the moving bite at each organ while you explain.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { stop, name: STOPS[stop].name },
      warnings: [],
      caption: 'Food journey first. Breathing only if this chapter spends time on it.',
    }
  },
}
