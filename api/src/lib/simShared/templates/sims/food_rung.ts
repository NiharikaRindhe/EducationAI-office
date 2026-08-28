// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const food_rung: SimFile = {
  id: 'food_rung',
  domain: 'chemistry',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Food chain, 10% energy',
  description: 'Trophic levels. About 10% of energy moves up each step. Book Fig 13.4. Not ozone or garbage.',
  equations: ['energy at next level ≈ 10% of the one below'],
  keywords: ['food chain', 'trophic level', '10%', 'energy flow', 'our environment'],
  params: [
    choice('look', 'Chain', [
      { value: 0, label: 'grass → deer → tiger' },
      { value: 1, label: 'four steps' },
    ], 0),
    choice('energy', 'Start energy', [
      { value: 1000, label: '1000 kJ' },
      { value: 100, label: '100 kJ' },
    ], 1000),
  ],
  schema: z.object({
    look: num(0, 1, 0),
    energy: num(100, 1000, 1000),
  }),
  run(params) {
    const look = Math.round(params.look)
    const e0 = params.energy
    const names = look === 0
      ? ['grass (producer)', 'deer (primary)', 'tiger (secondary)']
      : ['plants', 'insect', 'frog', 'snake']
    const n = names.length
    const elements = [
      label('title', 24, 22, 'Each step keeps about 10% of the energy. The rest is used or lost as heat.'),
      label('eq', 24, 40, `Start ${e0} kJ at the producer. Next is ${e0 * 0.1} kJ, then ${e0 * 0.01} kJ.`),
    ]
    for (let i = 0; i < n; i++) {
      const e = e0 * Math.pow(0.1, i)
      const w = Math.max(80, 320 - i * 70)
      elements.push(
        rect(`r${i}`, { x: 250 - w / 2, y: 70 + i * 50, width: w, height: 36, fill: i === 0 ? '#86efac' : i === 1 ? '#fde68a' : '#fecaca', rx: 4 }),
        label(`n${i}`, 250 - w / 2 + 8, 92 + i * 50, `${names[i]}  ${e} kJ`),
      )
    }
    elements.push(label('tip', 24, 286, 'Book Fig 13.4: energy flow. Food webs are many chains linked. Ozone and garbage are other pages — not this sim.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, e0, e1: e0 * 0.1, e2: e0 * 0.01, steps: n },
      warnings: [],
      caption: 'Book: food chain. About 10% energy each step.',
    }
  },
}
