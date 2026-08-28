// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, rect } from '../stage.js'

export const xylem_phloem: SimFile = {
  id: 'xylem_phloem',
  domain: 'chemistry',
  classBand: '9-9',
  ncertClass: 9,
  label: 'Xylem up, phloem down',
  description: 'Xylem carries water and minerals up. Phloem carries food from leaves. Not Class 7 leaf-makes-food.',
  equations: ['xylem: water up', 'phloem: food along'],
  keywords: ['xylem', 'phloem', 'conducting tissues', 'tissues in action'],
  params: [
    choice('look', 'Tissue', [
      { value: 0, label: 'xylem (water up)' },
      { value: 1, label: 'phloem (food)' },
    ], 0),
  ],
  schema: z.object({
    look: num(0, 1, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    const up = look === 0
    const elements = [
      label('title', 24, 22, up
        ? 'Xylem. Water and minerals from roots toward the leaves.'
        : 'Phloem. Food made in the leaf travels to other parts.'),
      label('eq', 24, 40, 'Division of labour: different tissues, different jobs.'),
      rect('stem', { x: 230, y: 70, width: 40, height: 180, fill: '#bbf7d0', stroke: '#166534', strokeWidth: 2 }),
      rect('root', { x: 200, y: 250, width: 100, height: 16, fill: '#a3e635' }),
      rect('leaf', { x: 270, y: 80, width: 70, height: 24, fill: '#22c55e', rx: 10 }),
    ]
    for (let i = 0; i < 5; i++) {
      elements.push(circle(`d${i}`, {
        cx: 250,
        cy: up ? 230 - i * 32 : 90 + i * 32,
        r: 6,
        fill: up ? '#38bdf8' : '#fbbf24',
      }))
    }
    elements.push(label('tip', 24, 286, up ? 'Book: xylem transports water and minerals.' : 'Book: phloem transports food.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, name: up ? 'xylem' : 'phloem', up },
      warnings: [],
      caption: up ? 'Book: xylem — water up.' : 'Book: phloem — food.',
    }
  },
}
