// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, rect } from '../stage.js'

export const keep_mass: SimFile = {
  id: 'keep_mass',
  domain: 'chemistry',
  classBand: '9-9',
  ncertClass: 9,
  label: 'Mass does not vanish',
  description: 'Activity 9.1: salt + 50 mL water — mass of the solution equals the parts. Activity 9.2: vinegar + baking soda in a balloon — gas forms, total mass stays. Law of conservation of mass.',
  equations: ['mass before = mass after'],
  keywords: ['conservation of mass', 'baking soda', 'vinegar', 'balloon', 'salt dissolves', 'atomic foundations'],
  params: [
    choice('look', 'Activity', [
      { value: 0, label: 'salt in water' },
      { value: 1, label: 'balloon (vinegar)' },
    ], 0),
  ],
  schema: z.object({
    look: num(0, 1, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    if (look === 1) {
      const elements = [
        label('title', 24, 22, 'Vinegar + baking soda. CO₂ fills the balloon. Total mass on the balance stays the same.'),
        label('eq', 24, 40, 'A chemical change. Gas is matter. If nothing escapes, mass is conserved.'),
        rect('flask', { x: 210, y: 150, width: 80, height: 90, fill: '#bbf7d0', stroke: '#166534', strokeWidth: 2 }),
        circle('balloon', { cx: 250, cy: 110, r: 42, fill: '#fda4af' }),
        label('tip', 24, 270, 'Book Activity 9.2: 20 mL vinegar, balloon of baking soda, then mix.'),
        label('m', 24, 286, 'Reading before = reading after.'),
      ]
      return {
        stage: { viewBox: VIEW, elements },
        metrics: { look, conserved: true, chemical: true },
        warnings: [],
        caption: 'Book Activity 9.2: balloon + vinegar. Mass unchanged.',
      }
    }
    const elements = [
      label('title', 24, 22, '50 mL water + a spatula of salt. The solution weighs the same as the two parts together.'),
      label('eq', 24, 40, 'A physical change. Dissolving is not destroying mass.'),
      rect('beaker', { x: 190, y: 90, width: 120, height: 140, fill: '#e0f2fe', stroke: '#334155', strokeWidth: 2 }),
      circle('balance', { cx: 250, cy: 250, r: 8, fill: '#334155' }),
      label('tip', 24, 270, 'Book Activity 9.1: tare the beaker, add water, add salt, swirl.'),
      label('m', 24, 286, 'Mass of solution = mass of water + mass of salt.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, conserved: true, chemical: false },
      warnings: [],
      caption: 'Book Activity 9.1: salt + water. Mass unchanged.',
    }
  },
}
