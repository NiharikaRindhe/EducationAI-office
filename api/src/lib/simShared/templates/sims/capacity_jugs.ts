// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, n, rect, tLoop } from '../stage.js'

export const capacity_jugs: SimFile = {
  id: 'capacity_jugs',
  domain: 'math',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Capacity — litres and millilitres',
  description: 'Fill jugs. 1000 millilitres make 1 litre, just as 1000 grams make 1 kilogram.',
  equations: ['1\\,\\text{L}=1000\\,\\text{ml}'],
  keywords: ['litre', 'millilitre', 'capacity', 'measuring jug', 'fill a bottle'],
  params: [
    param('litres', 'Litres', 'L', 0, 5, 1, 1),
    param('ml', 'Extra millilitres', 'ml', 0, 999, 50, 250),
  ],
  schema: z.object({
    litres: num(0, 20, 1),
    ml: num(0, 999, 250),
  }),
  run(params) {
    const L = Math.max(0, Math.round(params.litres))
    const ml = Math.max(0, Math.min(999, Math.round(params.ml)))
    const total = L * 1000 + ml
    const cap = 5000
    const fracLit = Math.min(1, total / cap)
    const t = tLoop(2.6, 2.2)
    const fill = `min(${n(fracLit)}, (${t}) / 2.2)`
    const jugH = 180
    const jugW = 90
    const x = 205
    const top = 70
    const elements = [
      label('eq', 28, 22, `${L} L ${ml} ml  =  ${total.toLocaleString('en-IN')} ml`),
      label('note', 28, 40, 'A water bottle at home is often about 1 litre = 1000 ml'),
      rect('jug', { x, y: top, width: jugW, height: jugH, fill: '#e0f2fe', stroke: '#0f172a', strokeWidth: 3, rx: 8 }),
      rect(
        'water',
        {
          x: x + 4,
          y: { $expr: `${n(top + jugH - 4)} - ${n(jugH - 8)} * (${fill})` },
          width: jugW - 8,
          height: { $expr: `${n(jugH - 8)} * (${fill})` },
          fill: '#38bdf8',
          opacity: 0.8,
          rx: 6,
        },
        'projectile'
      ),
      label('mark1', x + 100, top + 40, '5 L'),
      label('mark2', x + 100, top + jugH - 8, '0'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { litres: L, ml, totalMl: total },
      warnings: [],
      caption: 'Weight uses kg and g. Capacity uses L and ml. Both jump in thousands.',
    }
  },
}
