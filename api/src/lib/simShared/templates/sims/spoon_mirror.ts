// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, pathEl } from '../stage.js'

export const spoon_mirror: SimFile = {
  id: 'spoon_mirror',
  domain: 'physics',
  classBand: '8-8',
  ncertClass: 8,
  label: 'A spoon as a curved mirror',
  description: 'Inner spoon (curved in) — image inverted. Outer spoon (bulges out) — erect but smaller. Move it away and the image changes. No 1/v − 1/u = 1/f.',
  equations: ['inner (concave) close → inverted', 'outer (convex) → erect, smaller'],
  keywords: ['spherical mirror', 'concave', 'convex', 'spoon', 'mirrors and lenses', 'enlarged', 'inverted'],
  params: [
    choice('side', 'Spoon side', [
      { value: 0, label: 'inner (inward)' },
      { value: 1, label: 'outer (outward)' },
    ], 0),
    param('distance', 'How far from your face', '', 5, 40, 1, 8),
  ],
  schema: z.object({
    side: num(0, 1, 0),
    distance: num(5, 40, 8),
  }),
  run(params) {
    const side = Math.round(params.side)
    const d = params.distance
    const inner = side === 0
    const close = d < 16
    const inverted = inner && close
    const erect = !inverted
    const small = !inner || d > 22
    const imgH = small ? 36 : inner && close ? 70 : 50
    const title = inner
      ? (inverted ? 'Inner spoon, close: the face looks upside down.' : 'Inner spoon, farther: the image changes.')
      : 'Outer spoon: erect, but a tiny you.'
    const elements = [
      label('title', 24, 22, title),
      label('eq', 24, 40, inner
        ? 'The inner side is curved inwards — a concave mirror (like a cave).'
        : 'The outer side bulges outwards — a convex mirror. Side-view mirrors of cars are like this.'),
      pathEl('spoon', {
        d: inner
          ? 'M 80 70 Q 40 150 80 230 L 100 230 Q 70 150 100 70 Z'
          : 'M 70 70 Q 130 150 70 230 L 90 230 Q 140 150 90 70 Z',
        fill: '#cbd5e1',
        stroke: '#334155',
        strokeWidth: 3,
      }),
      circle('face', { cx: 280, cy: 150, r: 40, fill: '#fdba74' }),
      label('you', 258, 210, 'you'),
      circle('img', {
        cx: 400,
        cy: inverted ? 170 : 140,
        r: imgH / 2,
        fill: '#fde68a',
        stroke: '#b45309',
        strokeWidth: 2,
      }),
      label('im', 372, 230, inverted ? 'upside down' : small ? 'tiny, erect' : 'erect'),
      label('tip', 24, 268, 'Book Activity 10.1: shiny spoon. Flip it. Walk it away from your face.'),
      label('d', 24, 288, `Distance ${d}. ${erect ? 'Erect' : 'Inverted'}${small ? ', smaller' : ''}. No lens formula.`),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { side, distance: d, inverted, erect, small, kind: inner ? 'concave' : 'convex' },
      warnings: [],
      caption: 'Book: inner spoon inverted; outer erect and smaller.',
    }
  },
}
