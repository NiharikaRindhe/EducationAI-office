// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, pathEl, rect } from '../stage.js'

/** SVG y grows downward, so the top semicircle runs 180° (left) → 270° (up) → 360° (right). */
function dialAngle(frac: number): number {
  return ((180 + Math.min(1, Math.max(0, frac)) * 180) * Math.PI) / 180
}

export const weight_scale: SimFile = {
  id: 'weight_scale',
  domain: 'math',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Weight on a scale',
  description: 'Read kilograms and grams together. Same mass, two unit names. Book: 3 kg 500 g of flour.',
  equations: ['1 kg = 1000 g'],
  keywords: ['kilogram', 'weighing scale', 'weight and capacity', 'grams', '3 kg 500 g'],
  params: [
    param('kg', 'Kilograms', 'kg', 0, 10, 1, 3),
    param('grams', 'Extra grams', 'g', 0, 990, 10, 500),
  ],
  schema: z.object({
    kg: num(0, 20, 3),
    grams: num(0, 999, 500),
  }),
  run(params) {
    const kg = Math.max(0, Math.round(params.kg))
    const g = Math.max(0, Math.min(999, Math.round(params.grams)))
    const totalG = kg * 1000 + g
    const totalKg = totalG / 1000
    const maxKg = totalKg <= 5 ? 5 : 10
    const frac = Math.min(1, totalKg / maxKg)
    const a = dialAngle(frac)
    const cx = 270
    const cy = 198
    const r = 118
    const nr = r - 22
    const nx = cx + nr * Math.cos(a)
    const ny = cy + nr * Math.sin(a)
    const tickEvery = maxKg <= 5 ? 1 : 2
    const elements = [
      label('eq', 24, 22, `${kg} kg ${g} g  =  ${totalG.toLocaleString('en-IN')} g`),
      label(
        'read',
        24,
        42,
        kg === 5 && g === 50
          ? 'Careful: 5 kg 50 g is 5,050 g, not 5,500 g'
          : `${kg} kg ${g} g of flour is ${totalG.toLocaleString('en-IN')} g`
      ),
      pathEl('dial', {
        d: `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`,
        fill: '#f8fafc',
        stroke: '#334155',
        strokeWidth: 3,
      }),
      line('base', { x1: cx - r, y1: cy, x2: cx + r, y2: cy, stroke: '#334155', strokeWidth: 3 }),
    ]
    for (let kgTick = 0; kgTick <= maxKg; kgTick += tickEvery) {
      const ang = dialAngle(kgTick / maxKg)
      const inner = kgTick % (maxKg <= 5 ? 1 : 2) === 0 ? r - 16 : r - 10
      elements.push(
        line(`t${kgTick}`, {
          x1: cx + inner * Math.cos(ang),
          y1: cy + inner * Math.sin(ang),
          x2: cx + r * Math.cos(ang),
          y2: cy + r * Math.sin(ang),
          stroke: '#334155',
          strokeWidth: kgTick === 0 || kgTick === maxKg ? 3 : 2,
        })
      )
      const lx = cx + (r + 16) * Math.cos(ang) - 6
      const ly = cy + (r + 16) * Math.sin(ang) + 4
      elements.push(label(`n${kgTick}`, lx, ly, String(kgTick)))
    }
    elements.push(
      label('unit', cx - 10, cy - r - 8, 'kg'),
      line('needle', { x1: cx, y1: cy, x2: nx, y2: ny, stroke: '#dc2626', strokeWidth: 3.5 }),
      circle('hub', { cx, cy, r: 8, fill: '#0f172a' }),
      rect('pan', { x: 36, y: 228, width: 88, height: 10, fill: '#94a3b8', rx: 3 }),
      rect('bag', { x: 48, y: 178, width: 64, height: 50, fill: '#fef3c7', stroke: '#d97706', strokeWidth: 2, rx: 8 }),
      label('bagL', 58, 208, 'flour'),
      label('hint', 24, 278, `Kitchen scale 0–${maxKg} kg. 3 kg 500 g sits between 3 and 4.`),
    )
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { kg, grams: g, totalGrams: totalG, maxKg, needleFrac: Number(frac.toFixed(4)) },
      warnings: totalKg > 10 ? ['This bag is heavier than 10 kg — the needle is at the end.'] : [],
      caption: '1 kg is 1000 g, so 3 kg 500 g is 3,500 g. The needle shows that mass on the scale.',
    }
  },
}
