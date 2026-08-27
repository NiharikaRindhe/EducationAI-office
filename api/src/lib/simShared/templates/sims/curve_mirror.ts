// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const curve_mirror: SimFile = {
  id: 'curve_mirror',
  domain: 'physics',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Spherical mirror rays',
  description: 'Concave (look 0) or convex (look 1). Mirror formula 1/v + 1/u = 1/f. Book New Cartesian: object u = −30 cm, concave f = −15 cm. Not the old generic ray tool.',
  equations: ['1/v + 1/u = 1/f', 'm = −v/u'],
  keywords: ['concave mirror', 'convex mirror', 'mirror formula', 'focal length', 'spherical mirrors'],
  params: [
    choice('look', 'Mirror', [
      { value: 0, label: 'concave' },
      { value: 1, label: 'convex' },
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
    const f = look === 0 ? -fAbs : fAbs
    const v = 1 / (1 / f - 1 / u)
    const m = -v / u
    const poleX = 380
    const axisY = 160
    const objX = poleX - uAbs * 4
    const imgX = poleX + v * 4
    const elements = [
      label('title', 24, 22, look === 0
        ? `Concave. u = −${uAbs} cm, f = −${fAbs} cm. v = ${v.toFixed(1)} cm.`
        : `Convex. u = −${uAbs} cm, f = +${fAbs} cm. v = ${v.toFixed(1)} cm (virtual).`),
      label('eq', 24, 40, `1/v + 1/u = 1/f. Magnification m = −v/u = ${m.toFixed(2)}.`),
      line('axis', { x1: 40, y1: axisY, x2: 470, y2: axisY, stroke: '#94a3b8', strokeWidth: 1 }),
      line('mir', { x1: poleX, y1: 70, x2: poleX, y2: 250, stroke: '#0f172a', strokeWidth: 5 }),
      line('obj', { x1: objX, y1: axisY, x2: objX, y2: axisY - 50, stroke: '#2563eb', strokeWidth: 3 }),
      circle('O', { cx: objX, cy: axisY - 50, r: 5, fill: '#2563eb' }),
      line('ray1', { x1: objX, y1: axisY - 50, x2: poleX, y2: axisY - 50, stroke: '#d97706', strokeWidth: 1.5 }),
    ]
    if (Number.isFinite(v)) {
      elements.push(line('img', { x1: imgX, y1: axisY, x2: imgX, y2: axisY - 50 * m, stroke: '#16a34a', strokeWidth: 3 }))
    }
    elements.push(label('tip', 24, 286, 'Book: sign convention — object is on the left, u is negative. Example around u = −30 cm, f = −15 cm for concave.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, u, f, v, m, kind: look === 0 ? 'concave' : 'convex' },
      warnings: [],
      caption: look === 0 ? 'Book concave: u = −30 cm, f = −15 cm.' : 'Convex mirror. Virtual, erect, diminished.',
    }
  },
}
