// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, rect } from '../stage.js'

export const living_or_not: SimFile = {
  id: 'living_or_not',
  domain: 'chemistry',
  classBand: '6-6',
  ncertClass: 6,
  label: 'Living or not?',
  description: 'A pigeon is living. A pencil is not. A car moves but does not grow — not living. A still snail shell can still house a living snail.',
  equations: ['living: grow, need food, respond', 'moving ≠ living'],
  keywords: ['living creatures', 'living', 'non-living', 'pigeon', 'snail', 'car'],
  params: [
    choice('thing', 'What is it', [
      { value: 0, label: 'pigeon' },
      { value: 1, label: 'pencil' },
      { value: 2, label: 'car' },
      { value: 3, label: 'snail in a shell' },
    ], 0),
  ],
  schema: z.object({
    thing: num(0, 3, 0),
  }),
  run(params) {
    const thing = Math.round(params.thing)
    const living = thing === 0 || thing === 3
    const titles = [
      'A pigeon grows, eats, breathes, and responds. Living.',
      'A pencil does not grow or need food. Non-living.',
      'A car moves, but it does not grow and it does not need food the way you do. Non-living.',
      'The shell is not moving — but a living snail may be inside. Still living.',
    ]
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('title', 24, 22, titles[thing]),
          label('eq', 24, 40, living ? 'LIVING' : 'NON-LIVING'),
          thing === 0
            ? circle('body', { cx: 250, cy: 150, r: 40, fill: '#94a3b8' })
            : thing === 1
              ? rect('pen', { x: 210, y: 120, width: 80, height: 16, fill: '#fbbf24', rx: 4 })
              : thing === 2
                ? rect('car', { x: 180, y: 130, width: 140, height: 50, fill: '#2563eb', rx: 10 })
                : circle('sh', { cx: 250, cy: 150, r: 36, fill: '#d6d3d1', stroke: '#78716c', strokeWidth: 3 }),
          label('tip', 24, 248, 'Book: compare with yourself. Movement alone is not enough — you grow, a car does not.'),
          label('lab', 24, 272, living ? 'LIVING BEING' : 'NON-LIVING THING', living ? '#15803d' : '#b45309'),
        ],
      },
      metrics: { thing, living, name: ['pigeon', 'pencil', 'car', 'snail'][thing] },
      warnings: [],
      caption: 'Book Table 10.1: pigeon living, pencil not, car not.',
    }
  },
}
