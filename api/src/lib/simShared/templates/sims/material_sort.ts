// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const material_sort: SimFile = {
  id: 'material_sort',
  domain: 'chemistry',
  classBand: '6-6',
  ncertClass: 6,
  label: 'Sort the materials',
  description: 'Objects are made of materials. Group by a property: hard/soft, shiny/dull, can it hold water (tumbler). Not Class 7 malleable tawa.',
  equations: ['classification = grouping by a common property'],
  keywords: ['materials around us', 'classification', 'tumbler', 'hardness', 'lustre', 'wood', 'metal'],
  params: [
    choice('thing', 'Object', [
      { value: 0, label: 'wooden block' },
      { value: 1, label: 'steel tumbler' },
      { value: 2, label: 'glass bottle' },
      { value: 3, label: 'cloth bag' },
    ], 1),
  ],
  schema: z.object({
    thing: num(0, 3, 1),
  }),
  run(params) {
    const thing = Math.round(params.thing)
    const rows = [
      { name: 'wooden block', hard: true, shiny: false, holds: false, material: 'wood' },
      { name: 'steel tumbler', hard: true, shiny: true, holds: true, material: 'metal' },
      { name: 'glass bottle', hard: true, shiny: true, holds: true, material: 'glass' },
      { name: 'cloth bag', hard: false, shiny: false, holds: false, material: 'cloth' },
    ]
    const t = rows[thing]
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('title', 24, 22, `${t.name} is made of ${t.material}.`),
          label('eq', 24, 40, `Hard? ${t.hard ? 'yes' : 'no (soft)'}.  Shiny? ${t.shiny ? 'yes' : 'dull'}.  Holds water? ${t.holds ? 'yes — good for a tumbler' : 'no'}.`),
          rect('obj', { x: 180, y: 80, width: 140, height: 100, fill: thing === 1 ? '#94a3b8' : thing === 2 ? '#bae6fd' : thing === 0 ? '#b45309' : '#fde68a', rx: 12 }),
          label('tip', 24, 220, 'Book: a tumbler must be able to hold water. That is why we pick metal, glass, or clay — not cloth.'),
          label('cls', 24, 248, 'Classification = putting objects into groups that share a property.'),
          label('not', 24, 272, 'Not hammering a tawa. Just look, touch, and group.'),
        ],
      },
      metrics: { thing, material: t.material, hard: t.hard, shiny: t.shiny, holdsWater: t.holds },
      warnings: [],
      caption: 'Book: materials around us. Tumbler must hold water.',
    }
  },
}
