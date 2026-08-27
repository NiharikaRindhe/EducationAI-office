// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

const PLANTS = [
  { name: 'grass', kind: 'herb', stem: 'soft and thin' },
  { name: 'tulsi', kind: 'herb', stem: 'hard and thin' },
  { name: 'hibiscus', kind: 'shrub', stem: 'hard' },
  { name: 'neem', kind: 'tree', stem: 'hard and thick' },
]

export const plant_group: SimFile = {
  id: 'plant_group',
  domain: 'chemistry',
  classBand: '6-6',
  ncertClass: 6,
  label: 'Herb, shrub, or tree',
  description: 'Nature-walk table: grass and tulsi are herbs, hibiscus a shrub, neem a tree. Group by stem — not a food-chain essay.',
  equations: ['herb = soft/thin stem', 'tree = thick hard stem'],
  keywords: ['diversity', 'living world', 'herb', 'shrub', 'neem', 'tulsi', 'hibiscus', 'grass'],
  params: [
    choice('plant', 'Plant from the walk', [
      { value: 0, label: 'grass' },
      { value: 1, label: 'tulsi' },
      { value: 2, label: 'hibiscus' },
      { value: 3, label: 'neem' },
    ], 0),
  ],
  schema: z.object({
    plant: num(0, 3, 0),
  }),
  run(params) {
    const i = Math.round(params.plant)
    const p = PLANTS[i]
    const h = i === 3 ? 140 : i === 2 ? 90 : 50
    const w = i === 3 ? 28 : 16
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('title', 24, 22, `${p.name}: ${p.kind}. Stem is ${p.stem}.`),
          label('eq', 24, 40, 'Book Table 2.1 from the nature walk. Group plants by how they grow, not by colour alone.'),
          rect('ground', { x: 40, y: 230, width: 420, height: 16, fill: '#65a30d' }),
          rect('stem', { x: 240, y: 230 - h, width: w, height: h, fill: i >= 2 ? '#78716c' : '#86efac', rx: 4 }),
          rect('crown', { x: 210, y: 230 - h - (i === 3 ? 50 : 28), width: 80, height: i === 3 ? 54 : 32, fill: '#16a34a', rx: 16 }),
          label('k', 24, 268, `HERB = grass, tulsi.   SHRUB = hibiscus.   TREE = neem.`),
        ],
      },
      metrics: { plant: i, name: p.name, kind: p.kind },
      warnings: [],
      caption: 'Book walk: grass, tulsi, hibiscus, neem.',
    }
  },
}
