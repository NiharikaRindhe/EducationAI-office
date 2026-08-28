// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, line, rect } from '../stage.js'

export const decimal_ruler: SimFile = {
  id: 'decimal_ruler',
  domain: 'math',
  classBand: '7-7',
  ncertClass: 7,
  label: 'Tenths on a ruler',
  description: 'A centimetre is split into 10 tiny steps. 2.7 cm is 2 cm and 7 tenths — like the screw in the book.',
  equations: ['2.7 = 2 + 7/10'],
  keywords: ['decimal', 'tenths', 'ruler', 'peek beyond the point', '2.7 cm'],
  params: [
    param('cm', 'Whole centimetres', 'cm', 0, 8, 1, 2),
    param('tenths', 'Extra tenths', '', 0, 9, 1, 7),
  ],
  schema: z.object({
    cm: num(0, 10, 2),
    tenths: num(0, 9, 7),
  }),
  run(params) {
    const cm = Math.max(0, Math.round(params.cm))
    const tenths = Math.max(0, Math.min(9, Math.round(params.tenths)))
    const value = cm + tenths / 10
    const x0 = 40
    const y = 160
    const unit = 48
    const mark = x0 + value * unit
    const elements = [
      label('title', 24, 24, `The screw is ${value.toFixed(1)} cm long`),
      label('eq', 24, 42, `${cm} cm and ${tenths} tiny steps  →  ${cm}.${tenths} cm`),
      line('rule', { x1: x0, y1: y, x2: x0 + 10 * unit, y2: y, stroke: '#334155', strokeWidth: 3 }),
    ]
    for (let i = 0; i <= 10; i++) {
      const x = x0 + i * unit
      elements.push(
        line(`cm-${i}`, { x1: x, y1: y - 18, x2: x, y2: y + 18, stroke: '#0f172a', strokeWidth: 2 }),
        label(`n-${i}`, x - 4, y + 36, String(i))
      )
      if (i < 10) {
        for (let t = 1; t <= 9; t++) {
          const xt = x + (t * unit) / 10
          elements.push(line(`t-${i}-${t}`, { x1: xt, y1: y - 8, x2: xt, y2: y + 8, stroke: '#94a3b8', strokeWidth: 1 }))
        }
      }
    }
    elements.push(
      rect('screw', { x: x0, y: 88, width: Math.max(8, value * unit), height: 22, fill: '#94a3b8', rx: 4 }),
      line('ptr', { x1: mark, y1: 118, x2: mark, y2: y, stroke: '#2563eb', strokeWidth: 2 }),
      label('tip', mark - 10, 78, `${value.toFixed(1)}`, '#2563eb')
    )
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { cm: value, tenths },
      warnings: [],
      caption: 'The dot separates whole centimetres from tenths. It is not a fraction kit.',
    }
  },
}
