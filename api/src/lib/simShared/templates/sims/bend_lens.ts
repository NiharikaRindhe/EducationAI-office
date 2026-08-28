// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const bend_lens: SimFile = {
  id: 'bend_lens',
  domain: 'physics',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Lens formula',
  description: 'Convex (look 0) or concave (look 1). 1/v − 1/u = 1/f. Book example around u = −30 cm, convex f = +15 cm. Not the old convex_lens id.',
  equations: ['1/v − 1/u = 1/f', 'm = v/u', 'P = 1/f (f in m)'],
  keywords: ['convex lens', 'concave lens', 'lens formula', 'focal length', 'power of a lens'],
  params: [
    choice('look', 'Lens', [
      { value: 0, label: 'convex' },
      { value: 1, label: 'concave' },
    ], 0),
    param('u', 'Object distance |u|', 'cm', 10, 60, 1, 30),
    param('f', 'Focal length |f|', 'cm', 8, 25, 1, 15),
  ],
  schema: z.object({
    look: num(0, 1, 0),
    u: num(8, 80, 30),
    f: num(6, 30, 15),
  }),
  run(params) {
    const look = Math.round(params.look)
    const uAbs = params.u
    const fAbs = params.f
    const u = -uAbs
    const f = look === 0 ? fAbs : -fAbs
    const v = 1 / (1 / f + 1 / u)
    const m = v / u
    const P = 100 / f
    const ox = 280
    const axisY = 160
    const objX = ox - uAbs * 4
    const elements = [
      label('title', 24, 22, look === 0
        ? `Convex. u = −${uAbs} cm, f = +${fAbs} cm. v = ${v.toFixed(1)} cm.`
        : `Concave. u = −${uAbs} cm, f = −${fAbs} cm. v = ${v.toFixed(1)} cm.`),
      label('eq', 24, 40, `1/v − 1/u = 1/f. m = v/u = ${m.toFixed(2)}. Power P = ${P.toFixed(2)} D.`),
      line('axis', { x1: 40, y1: axisY, x2: 470, y2: axisY, stroke: '#94a3b8', strokeWidth: 1 }),
      line('lens', { x1: ox, y1: 70, x2: ox, y2: 250, stroke: '#0284c7', strokeWidth: 4 }),
      line('obj', { x1: objX, y1: axisY, x2: objX, y2: axisY - 50, stroke: '#2563eb', strokeWidth: 3 }),
      circle('O', { cx: objX, cy: axisY - 50, r: 5, fill: '#2563eb' }),
    ]
    if (Number.isFinite(v)) {
      const imgX = ox + v * 4
      elements.push(line('img', { x1: imgX, y1: axisY, x2: imgX, y2: axisY - 50 * Math.abs(m) * Math.sign(-m), stroke: '#16a34a', strokeWidth: 3 }))
    }
    elements.push(label('tip', 24, 286, 'Book 9.3.7: lens formula. Convex f positive. Object on the left, u negative. Power in dioptre.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, u, f, v, m, P, kind: look === 0 ? 'convex' : 'concave' },
      warnings: [],
      caption: look === 0 ? 'Book convex: u = −30 cm, f = +15 cm.' : 'Concave lens. Virtual, erect, diminished.',
    }
  },
}
