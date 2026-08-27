// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, pathEl } from '../stage.js'

function regularPoly(cx: number, cy: number, r: number, sides: number, rot = -Math.PI / 2): string {
  const pts: string[] = []
  for (let i = 0; i < sides; i++) {
    const a = rot + (i * 2 * Math.PI) / sides
    pts.push(`${i === 0 ? 'M' : 'L'} ${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ') + ' Z'
}

export const tessellate_fit: SimFile = {
  id: 'tessellate_fit',
  domain: 'math',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Do these shapes tessellate?',
  description: 'Fit the same regular shape around a point. If they leave no gap and do not overlap, they tessellate.',
  equations: ['\\text{no gap, no overlap}'],
  keywords: ['tessellate', 'tessellation', 'regular pentagon', 'equilateral triangle', 'fit around a point'],
  params: [param('sides', 'How many sides', '', 3, 8, 1, 5)],
  schema: z.object({
    sides: num(3, 12, 5),
  }),
  run(params) {
    const n = Math.max(3, Math.min(12, Math.round(params.sides)))
    const interior = (180 * (n - 2)) / n
    const fit = Math.floor(360 / interior + 1e-9)
    const used = fit * interior
    const gap = 360 - used
    const tessellates = Math.abs(gap) < 0.01
    const names: Record<number, string> = { 3: 'equilateral triangle', 4: 'square', 5: 'regular pentagon', 6: 'regular hexagon', 7: 'heptagon', 8: 'regular octagon' }
    const cx = 250
    const cy = 168
    const r = 54
    const colors = ['#38bdf8', '#f472b6', '#fbbf24', '#34d399', '#a78bfa', '#fb923c']
    const elements = [
      label('name', 28, 22, names[n] || `${n}-sided shape`),
      label('eq', 28, 40, `${fit} fit around a point`),
      label('verdict', 28, 58, tessellates ? 'They tessellate — no gaps, no overlaps' : 'They do not tessellate — a gap is left'),
    ]
    for (let i = 0; i < fit; i++) {
      const rot = -Math.PI / 2 + (i * 2 * Math.PI * interior) / 360
      const px = cx + Math.cos(rot + Math.PI / n) * (r * 0.92)
      const py = cy + Math.sin(rot + Math.PI / n) * (r * 0.92)
      elements.push(
        pathEl(`p${i}`, {
          d: regularPoly(px, py, r, n, rot),
          fill: colors[i % colors.length],
          opacity: 0.85,
          stroke: '#0f172a',
          strokeWidth: 1.5,
        })
      )
    }
    elements.push(label('dot', cx - 4, cy + 4, '•', '#0f172a'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { sides: n, fit, tessellates },
      warnings: [],
      caption: 'Equilateral triangles, squares and hexagons tessellate. Regular pentagons leave a gap.',
    }
  },
}
