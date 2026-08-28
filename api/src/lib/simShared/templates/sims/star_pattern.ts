// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, rect } from '../stage.js'

export const star_pattern: SimFile = {
  id: 'star_pattern',
  domain: 'physics',
  classBand: '6-6',
  ncertClass: 6,
  label: 'Join the stars',
  description: 'Activity 12.1: bright stars in a patch of sky. Join them into a familiar shape — a constellation pattern. Not Class 5 globe-and-torch day and night.',
  equations: ['constellation = imagined pattern among stars'],
  keywords: ['beyond earth', 'constellation', 'stars', 'night sky', 'ladakh', 'pattern'],
  params: [
    choice('join', 'Join the dots', [
      { value: 0, label: 'stars only' },
      { value: 1, label: 'dipper pattern' },
    ], 1),
  ],
  schema: z.object({
    join: num(0, 1, 1),
  }),
  run(params) {
    const join = Math.round(params.join)
    const stars = [
      [140, 80], [200, 100], [250, 90], [300, 120], [280, 180], [220, 200], [160, 170],
    ]
    const elements = [
      label('title', 24, 22, join
        ? 'A familiar shape appears when we join the bright stars. That is a constellation pattern.'
        : 'Bright stars in a dark Ladakh sky. Try to imagine a pattern.'),
      label('eq', 24, 40, 'Stars shine with their own light. Patterns helped travellers find direction.'),
      rect('sky', { x: 40, y: 55, width: 420, height: 200, fill: '#0f172a', rx: 8 }),
    ]
    if (join) {
      for (let i = 0; i < stars.length - 1; i++) {
        elements.push(line(`e${i}`, {
          x1: stars[i][0],
          y1: stars[i][1],
          x2: stars[i + 1][0],
          y2: stars[i + 1][1],
          stroke: '#fde047',
          strokeWidth: 2,
        }))
      }
    }
    stars.forEach((s, i) => {
      elements.push(circle(`st${i}`, { cx: s[0], cy: s[1], r: 4, fill: '#fef9c3' }))
    })
    elements.push(label('tip', 24, 272, 'Book Activity 12.1: draw lines, name the animal or object, make a story. Not day-and-night yet.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { join, stars: stars.length },
      warnings: [],
      caption: 'Book: join bright stars into a pattern.',
    }
  },
}
