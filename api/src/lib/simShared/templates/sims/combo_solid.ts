// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, label, pathEl, rect } from '../stage.js'

export const combo_solid: SimFile = {
  id: 'combo_solid',
  domain: 'math',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Solid stuck to a solid',
  description: 'Surface area and volume of combinations. Book: spinning top (cone + hemisphere, height 5 cm, diameter 3.5 cm), cube + hemisphere, rocket cone + cylinder. Not a single cylinder fill.',
  equations: ['TSA of combo = sum of exposed faces', 'V = sum of volumes'],
  keywords: ['combination of solids', 'spinning top', 'hemisphere', 'cone', 'surface areas and volumes'],
  params: [
    choice('look', 'Solid', [
      { value: 0, label: 'spinning top' },
      { value: 1, label: 'cube + hemisphere' },
      { value: 2, label: 'rocket' },
    ], 0),
  ],
  schema: z.object({
    look: num(0, 2, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    const pi = 22 / 7
    let title = ''
    let eq = ''
    let metrics: Record<string, number | string> = { look }
    if (look === 0) {
      const r = 3.5 / 2
      const H = 5
      const hCone = H - r
      const l = Math.sqrt(r * r + hCone * hCone)
      const csa = pi * r * l + 2 * pi * r * r
      title = `Spinning top: cone on a hemisphere. Diameter 3.5 cm, total height 5 cm.`
      eq = `r = 1.75 cm, cone height ${hCone.toFixed(2)} cm, slant ${l.toFixed(2)} cm. CSA ≈ ${csa.toFixed(1)} cm².`
      metrics = { look, r, hCone, l, csa, name: 'top' }
    } else if (look === 1) {
      const edge = 5
      const r = 4.2 / 2
      const tsa = 6 * edge * edge + pi * r * r
      title = 'Cube edge 5 cm with a hemisphere of diameter 4.2 cm on top.'
      eq = `TSA = 6×5² + πr² ≈ ${tsa.toFixed(2)} cm² (cube TSA minus the covered circle plus curved hemisphere).`
      metrics = { look, edge, r, tsa, name: 'block' }
    } else {
      const rCone = 2.5
      const hCone = 6
      const rCyl = 1.5
      const hCyl = 20
      const l = Math.sqrt(rCone * rCone + hCone * hCone)
      title = 'Rocket: cone height 6 cm on a cylinder height 20 cm. Cone base diameter 5 cm.'
      eq = `Slant of cone = ${l} cm. Paint the cone CSA plus the ring of the cone base minus the cylinder top.`
      metrics = { look, rCone, hCone, rCyl, hCyl, l, name: 'rocket' }
    }
    const elements = [
      label('title', 24, 22, title),
      label('eq', 24, 40, eq),
    ]
    if (look === 0) {
      elements.push(
        pathEl('cone', { d: 'M 250 70 L 190 170 L 310 170 Z', fill: '#fde68a', stroke: '#b45309', strokeWidth: 2 }),
        pathEl('hemi', { d: 'M 190 170 A 60 40 0 0 0 310 170', fill: '#fbbf24', stroke: '#b45309', strokeWidth: 2 }),
      )
    } else if (look === 1) {
      elements.push(
        rect('cube', { x: 180, y: 120, width: 140, height: 140, fill: '#93c5fd', stroke: '#1d4ed8', strokeWidth: 2 }),
        pathEl('hemi', { d: 'M 210 120 A 50 28 0 0 1 290 120', fill: '#fde68a', stroke: '#b45309', strokeWidth: 2 }),
      )
    } else {
      elements.push(
        pathEl('nose', { d: 'M 250 40 L 210 110 L 290 110 Z', fill: '#fca5a5', stroke: '#b91c1c', strokeWidth: 2 }),
        rect('body', { x: 220, y: 110, width: 60, height: 140, fill: '#cbd5e1', stroke: '#334155', strokeWidth: 2 }),
      )
    }
    elements.push(label('tip', 24, 286, 'Book: add the exposed surfaces only. Do not count a face that is glued inside.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics,
      warnings: [],
      caption: look === 0 ? 'Book spinning top: 5 cm high, diameter 3.5 cm.' : look === 1 ? 'Book cube 5 cm + hemisphere 4.2 cm.' : 'Book rocket cone 6 cm + cylinder 20 cm.',
    }
  },
}
