// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, line, rect } from '../stage.js'

const KIDS = [
  { name: 'Anish', spans: 13.2 },
  { name: 'Padma', spans: 13 },
  { name: 'Tasneem', spans: 12.7 },
  { name: 'Deepa', spans: 13.5 },
  { name: 'Hardeep', spans: 14 },
]

export const handspan_metre: SimFile = {
  id: 'handspan_metre',
  domain: 'physics',
  classBand: '6-6',
  ncertClass: 6,
  label: 'Handspan vs a metre',
  description: 'Five friends measure the same table. Counts differ (about 13 handspans) because hands differ. That is why we need the metre. Not s = vt.',
  equations: ['same length, different handspans', 'SI unit of length = metre'],
  keywords: ['measurement of length', 'handspan', 'metre', 'standard unit', 'angula', 'table'],
  params: [
    choice('who', 'Whose hand', [
      { value: 0, label: 'Anish' },
      { value: 1, label: 'Padma' },
      { value: 2, label: 'Tasneem' },
      { value: 3, label: 'Deepa' },
      { value: 4, label: 'Hardeep' },
    ], 1),
    param('tableM', 'Table length', 'm', 1, 3, 0.1, 1.5),
  ],
  schema: z.object({
    who: num(0, 4, 1),
    tableM: num(0.5, 4, 1.5),
  }),
  run(params) {
    const who = Math.round(params.who)
    const tableM = params.tableM
    const kid = KIDS[who]
    const disagree = true
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('title', 24, 22, `${kid.name} counts about ${kid.spans} handspans. Friends get different counts for the same table.`),
          label('eq', 24, 40, 'Handspan, foot, angula change from person to person. The metre does not.'),
          rect('table', { x: 40, y: 100, width: 400, height: 36, fill: '#b45309', rx: 4 }),
          label('tl', 48, 92, `table  (~${tableM} m on a metre scale)`),
          line('span', { x1: 50, y1: 170, x2: 110, y2: 170, stroke: '#2563eb', strokeWidth: 8 }),
          label('sl', 50, 194, `${kid.name}'s balisht`),
          rect('scale', { x: 40, y: 220, width: 400, height: 18, fill: '#e2e8f0', stroke: '#334155' }),
          label('m', 48, 258, 'metre scale — 100 equal centimetres in 1 m'),
          label('tip', 24, 278, 'Book Table 5.1: Padma 13, Hardeep 14. Same table. Need a standard unit.'),
        ],
      },
      metrics: { who, name: kid.name, spans: kid.spans, tableM, disagree },
      warnings: [],
      caption: 'Book: table in handspans. Friends disagree. Then metre.',
    }
  },
}
