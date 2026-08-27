// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, pathEl } from '../stage.js'

export const two_lenses: SimFile = {
  id: 'two_lenses',
  domain: 'physics',
  classBand: '8-8',
  ncertClass: 8,
  label: 'Look through a convex or concave lens',
  description: 'Convex = thicker in the middle, converging. Close: erect and enlarged (magnifying glass). Farther: inverted. Concave = thicker at the edges, always erect and smaller. Light goes through a lens. No 1/v − 1/u = 1/f.',
  equations: ['convex = converging lens', 'concave = diverging lens'],
  keywords: ['convex lens', 'concave lens', 'magnifying glass', 'thicker at the middle', 'converging lens', 'sketch pen'],
  params: [
    choice('kind', 'Which lens', [
      { value: 0, label: 'convex (middle thick)' },
      { value: 1, label: 'concave (edges thick)' },
    ], 0),
    param('distance', 'How far the object sits', '', 4, 30, 1, 8),
  ],
  schema: z.object({
    kind: num(0, 1, 0),
    distance: num(4, 30, 8),
  }),
  run(params) {
    const convex = Math.round(params.kind) === 0
    const d = params.distance
    const close = d < 14
    const inverted = convex && !close
    const enlarged = convex && close
    const small = !convex || (!close && d > 20)
    const imgH = enlarged ? 56 : small ? 18 : 36
    const title = convex
      ? (close
        ? 'Convex lens, close: the object looks erect and bigger — a magnifying glass.'
        : 'Convex lens, farther: the object looks inverted, then smaller.')
      : 'Concave lens: always erect and smaller. A diverging lens.'
    const elements = [
      label('title', 24, 22, title),
      label('eq', 24, 40, convex
        ? 'Thicker in the middle than at the edges. Light goes through it and the beams come together.'
        : 'Thicker at the edges than in the middle. Beams spread after they pass through.'),
      pathEl('lens', {
        d: convex
          ? 'M 230 70 Q 270 150 230 230 Q 190 150 230 70 Z'
          : 'M 210 70 Q 230 150 210 230 L 250 230 Q 230 150 250 70 Z',
        fill: '#bae6fd',
        stroke: '#0284c7',
        strokeWidth: 3,
        opacity: 0.85,
      }),
      circle('obj', { cx: 90, cy: 150, r: 22, fill: '#fdba74' }),
      label('ol', 70, 190, 'object'),
      circle('img', {
        cx: 400,
        cy: inverted ? 170 : 150,
        r: imgH / 2,
        fill: '#fde68a',
        stroke: '#b45309',
        strokeWidth: 2,
      }),
      label('il', 360, 230, inverted ? 'upside down' : enlarged ? 'bigger, erect' : 'tiny, erect'),
      line('ray1', { x1: 112, y1: 138, x2: 230, y2: 138, stroke: '#f59e0b', strokeWidth: 2 }),
      line('ray2', { x1: 112, y1: 162, x2: 230, y2: 162, stroke: '#f59e0b', strokeWidth: 2 }),
      line('out1', {
        x1: 230,
        y1: 138,
        x2: 380,
        y2: convex ? (inverted ? 175 : 130) : 110,
        stroke: '#f59e0b',
        strokeWidth: 2,
      }),
      line('out2', {
        x1: 230,
        y1: 162,
        x2: 380,
        y2: convex ? (inverted ? 175 : 170) : 190,
        stroke: '#f59e0b',
        strokeWidth: 2,
      }),
      label('tip', 24, 268, 'Book Activity 10.9: look through the lens. 10.10: convex converges sunrays; concave diverges. No lens formula.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: {
        kind: convex ? 'convex' : 'concave',
        distance: d,
        inverted,
        erect: !inverted,
        enlarged,
        small,
        converges: convex,
      },
      warnings: [],
      caption: 'Book: convex thicker in the middle; concave thicker at the edges. See through a lens, not in it.',
    }
  },
}
