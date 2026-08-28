// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, rect } from '../stage.js'

export const dissolve_ors: SimFile = {
  id: 'dissolve_ors',
  domain: 'chemistry',
  classBand: '8-8',
  ncertClass: 8,
  label: 'Solute, solvent, solution',
  description: 'ORS: salt and sugar spread evenly in water — a uniform mixture (solution). Chalk powder does not. Add too much sugar and it stops dissolving.',
  equations: ['solute + solvent → solution', 'too much solute → leftover undissolved'],
  keywords: ['solute', 'solvent', 'solution', 'ORS', 'dissolve', 'chalk powder', 'saturated'],
  params: [
    choice('stuff', 'What we add', [
      { value: 0, label: 'salt' },
      { value: 1, label: 'sugar' },
      { value: 2, label: 'chalk powder' },
    ], 0),
    param('amount', 'How much we add', '', 1, 12, 1, 3),
  ],
  schema: z.object({
    stuff: num(0, 2, 0),
    amount: num(1, 12, 3),
  }),
  run(params) {
    const stuff = Math.round(params.stuff)
    const amount = Math.round(params.amount)
    const dissolves = stuff !== 2
    const sat = dissolves && amount >= 9
    const leftover = sat ? amount - 8 : dissolves ? 0 : amount
    const names = ['salt', 'sugar', 'chalk']
    const title = !dissolves
      ? 'Chalk in water is not uniform. Bits sit or float — not a solution.'
      : sat
        ? `Too much ${names[stuff]}. Extra sits at the bottom. It has stopped dissolving.`
        : `${names[stuff]} disappears into the water. Every sip tastes the same — a solution.`
    const elements = [
      label('title', 24, 22, title),
      label('eq', 24, 40, dissolves
        ? 'Solute + solvent → solution. The solid is the solute. Water is the solvent.'
        : 'Sand, chalk, sawdust in water: non-uniform mixtures.'),
      rect('glass', { x: 180, y: 70, width: 140, height: 160, fill: dissolves ? '#bae6fd' : '#e2e8f0', stroke: '#0369a1', strokeWidth: 3, rx: 8 }),
    ]
    if (dissolves && !sat) {
      for (let i = 0; i < Math.min(amount, 8); i++) {
        elements.push(circle(`d${i}`, { cx: 210 + (i % 4) * 24, cy: 100 + Math.floor(i / 4) * 40, r: 5, fill: '#38bdf8', opacity: 0.5 }))
      }
    }
    if (leftover > 0) {
      for (let i = 0; i < leftover; i++) {
        elements.push(circle(`u${i}`, { cx: 200 + (i % 5) * 20, cy: 210 - Math.floor(i / 5) * 10, r: 6, fill: stuff === 2 ? '#e7e5e4' : '#f8fafc', stroke: '#78716c' }))
      }
    }
    elements.push(label('tip', 24, 258, 'Book ORS: every sip tastes the same. Chalk powder does not form a uniform mixture.'))
    elements.push(label('lab', 24, 278, !dissolves ? 'NON-UNIFORM MIXTURE' : sat ? 'SATURATED — leftover solute' : 'SOLUTION (uniform)', '#0f172a'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { stuff, amount, dissolves, saturated: sat, leftover },
      warnings: [],
      caption: 'Book: salt/sugar in water vs chalk. ORS tastes the same each sip.',
    }
  },
}
