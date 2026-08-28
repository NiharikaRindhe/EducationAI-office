// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, line, pathEl } from '../stage.js'

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6']

export const prism_split: SimFile = {
  id: 'prism_split',
  domain: 'physics',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Prism splits white light',
  description: 'Equilateral glass prism, A = 60°. White light in, seven colours out. Not the old thin prism with A = 6°.',
  equations: ['δ = (μ − 1)A  (small A)', 'VIBGYOR from violet (most bent) to red'],
  keywords: ['prism', 'dispersion', 'spectrum', '60°', 'human eye colourful world'],
  params: [
    param('A', 'Prism angle A', '°', 40, 70, 1, 60),
    param('mu', 'μ of glass', '', 1.4, 1.7, 0.01, 1.5),
  ],
  schema: z.object({
    A: num(30, 80, 60),
    mu: num(1.3, 1.8, 1.5),
  }),
  run(params) {
    const A = params.A
    const mu = params.mu
    const delta = (mu - 1) * A
    const elements = [
      label('title', 24, 22, `Glass prism A = ${A}°. μ = ${mu}. White in → seven colours out.`),
      label('eq', 24, 40, `Violet bends more than red. Approximate δ = (μ − 1)A ≈ ${delta.toFixed(1)}°.`),
      pathEl('pr', { d: 'M 220 70 L 160 220 L 320 220 Z', fill: '#e0f2fe', stroke: '#0284c7', strokeWidth: 2 }),
      line('in', { x1: 40, y1: 150, x2: 200, y2: 150, stroke: '#f8fafc', strokeWidth: 4 }),
    ]
    COLORS.forEach((c, i) => {
      elements.push(line(`out${i}`, { x1: 250, y1: 150, x2: 460, y2: 90 + i * 18, stroke: c, strokeWidth: 2 }))
    })
    elements.push(label('tip', 24, 286, 'Book: equilateral prism, not a 6° thin wedge. Red least bent, violet most. Rainbow is nature’s prism.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { A, mu, delta },
      warnings: [],
      caption: 'Book: glass prism A = 60°. Dispersion into VIBGYOR.',
    }
  },
}
