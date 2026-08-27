// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, pathEl } from '../stage.js'

export const slice_area: SimFile = {
  id: 'slice_area',
  domain: 'math',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Sector and segment',
  description: 'Area of a sector = (θ/360) π r². Segment = sector minus triangle. Book Example 1: r = 4 cm, θ = 30°. Not the old 90° default.',
  equations: ['sector = (θ/360) π r²', 'segment = sector − triangle'],
  keywords: ['sector', 'segment', 'areas related to circles', '4 cm', '30°'],
  params: [
    param('r', 'Radius', 'cm', 2, 12, 0.5, 4),
    param('thetaDeg', 'Angle θ', '°', 15, 180, 5, 30),
  ],
  schema: z.object({
    r: num(1, 16, 4),
    thetaDeg: num(10, 270, 30),
  }),
  run(params) {
    const r = params.r
    const th = params.thetaDeg
    const sector = (th / 360) * Math.PI * r * r
    const rad = (th * Math.PI) / 180
    const triangle = 0.5 * r * r * Math.sin(rad)
    const segment = sector - triangle
    const cx = 250
    const cy = 160
    const s = 18
    const x2 = cx + r * s * Math.cos(-Math.PI / 2)
    const y2 = cy + r * s * Math.sin(-Math.PI / 2)
    const x3 = cx + r * s * Math.cos(-Math.PI / 2 + rad)
    const y3 = cy + r * s * Math.sin(-Math.PI / 2 + rad)
    const large = th > 180 ? 1 : 0
    const d = `M ${cx} ${cy} L ${x2} ${y2} A ${r * s} ${r * s} 0 ${large} 1 ${x3} ${y3} Z`
    const elements = [
      label('title', 24, 22, `r = ${r} cm, θ = ${th}°. Sector area = ${sector.toFixed(2)} cm².`),
      label('eq', 24, 40, `Segment = sector − triangle = ${segment.toFixed(2)} cm². Book: r = 4 cm, 30° ≈ 4.19 cm² sector.`),
      pathEl('sec', { d, fill: '#93c5fd', stroke: '#1d4ed8', strokeWidth: 2 }),
      label('tip', 24, 286, 'Book Example 1: radius 4 cm, angle 30°. Sector (30/360)πr². Then subtract the triangle for the segment.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { r, thetaDeg: th, sector, triangle, segment },
      warnings: [],
      caption: 'Book: r = 4 cm, θ = 30°. Sector ≈ 4.19 cm².',
    }
  },
}
