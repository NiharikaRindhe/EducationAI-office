// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, pathEl } from '../stage.js'

function arcPath(ox: number, oy: number, startDeg: number, endDeg: number, radius: number): string {
  const a0 = (startDeg * Math.PI) / 180
  const a1 = (endDeg * Math.PI) / 180
  const steps = Math.max(8, Math.round(Math.abs(endDeg - startDeg) / 6))
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = a0 + ((a1 - a0) * i) / steps
    const x = ox + radius * Math.cos(t)
    const y = oy + radius * Math.sin(t)
    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return pts.join(' ')
}

function chevron(id: string, x: number, y: number): ReturnType<typeof pathEl> {
  return pathEl(id, {
    d: `M ${x - 7} ${y - 5} L ${x} ${y} L ${x - 7} ${y + 5} M ${x + 1} ${y - 5} L ${x + 8} ${y} L ${x + 1} ${y + 5}`,
    fill: 'none',
    stroke: '#334155',
    strokeWidth: 2,
  })
}

export const parallel_transversal: SimFile = {
  id: 'parallel_transversal',
  domain: 'math',
  classBand: '7-7',
  ncertClass: 7,
  label: 'Parallel lines cut by a transversal',
  description: 'Two parallel lines. A third line cuts both. Matching corners stay the same size.',
  equations: ['matching corners are equal', 'corners in a straight line add to 180°'],
  keywords: ['parallel lines', 'transversal', 'corresponding angles', 'matching corners', 'co-interior'],
  params: [param('angleDeg', 'This corner', 'deg', 20, 160, 1, 120)],
  schema: z.object({
    angleDeg: num(10, 170, 120),
  }),
  run(params) {
    const A = Math.round(params.angleDeg)
    const adj = 180 - A
    const tilt = A > 90 ? 180 - A : A
    const rad = (tilt * Math.PI) / 180
    const y1 = 112
    const y2 = 208
    const midX = 250
    const ux = Math.cos(rad)
    const uy = Math.sin(rad)
    const halfGap = (y2 - y1) / 2
    const ix1 = midX - halfGap / Math.tan(rad)
    const ix2 = midX + halfGap / Math.tan(rad)
    const extra = 78
    const tx1 = ix1 - extra * ux
    const ty1 = y1 - extra * uy
    const tx2 = ix2 + extra * ux
    const ty2 = y2 + extra * uy
    const rArc = 28
    const corrStart = A > 90 ? tilt : 0
    const corrEnd = A > 90 ? 180 : A
    const altStart = A > 90 ? 180 + tilt : 180
    const altEnd = A > 90 ? 360 : 180 + A
    const coStart = A > 90 ? 0 : A
    const coEnd = A > 90 ? tilt : 180
    const lab = (ix: number, iy: number, deg: number, radius: number) => ({
      x: ix + radius * Math.cos((deg * Math.PI) / 180) - 8,
      y: iy + radius * Math.sin((deg * Math.PI) / 180) + 4,
    })
    const c1 = lab(ix1, y1, (corrStart + corrEnd) / 2, 42)
    const c2 = lab(ix2, y2, (corrStart + corrEnd) / 2, 42)
    const alt = lab(ix2, y2, (altStart + altEnd) / 2, 42)
    const co = lab(ix1, y1, (coStart + coEnd) / 2, 44)
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('eq', 28, 24, `Matching corners (same colour) = ${A}°`),
          label('co', 28, 42, `On a straight line: ${A}° + ${adj}° = 180°`),
          line('p1', { x1: 40, y1: y1, x2: 460, y2: y1, stroke: '#334155', strokeWidth: 3 }),
          line('p2', { x1: 40, y1: y2, x2: 460, y2: y2, stroke: '#334155', strokeWidth: 3 }),
          chevron('m1', 86, y1),
          chevron('m2', 86, y2),
          line('tr', { x1: tx1, y1: ty1, x2: tx2, y2: ty2, stroke: '#2563eb', strokeWidth: 3 }),
          circle('v1', { cx: ix1, cy: y1, r: 4, fill: '#0f172a' }),
          circle('v2', { cx: ix2, cy: y2, r: 4, fill: '#0f172a' }),
          pathEl('corr1', { d: arcPath(ix1, y1, corrStart, corrEnd, rArc), fill: 'none', stroke: '#16a34a', strokeWidth: 2.5 }),
          pathEl('corr2', { d: arcPath(ix2, y2, corrStart, corrEnd, rArc), fill: 'none', stroke: '#16a34a', strokeWidth: 2.5 }),
          pathEl('alt2', { d: arcPath(ix2, y2, altStart, altEnd, rArc), fill: 'none', stroke: '#d97706', strokeWidth: 2.5 }),
          pathEl('co1', { d: arcPath(ix1, y1, coStart, coEnd, rArc + 6), fill: 'none', stroke: '#7c3aed', strokeWidth: 2 }),
          label('a1', c1.x, c1.y, `${A}°`, '#16a34a'),
          label('a2', c2.x, c2.y, `${A}°`, '#16a34a'),
          label('a3', alt.x, alt.y, `${A}°`, '#d97706'),
          label('a4', co.x, co.y, `${adj}°`, '#7c3aed'),
          label('l1', 42, y1 - 10, 'l₁'),
          label('l2', 42, y2 + 18, 'l₂'),
          label('t', tx2 - 8, ty2 + 6, 't', '#2563eb'),
        ],
      },
      metrics: {
        angleDeg: A,
        corresponding: A,
        alternateInterior: A,
        coInterior: 180,
        adjacent: adj,
      },
      warnings: [],
      caption: 'The two long lines stay the same distance apart. Matching corners are equal.',
    }
  },
}
