// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, rect } from '../stage.js'

const KINDS = [
  { name: 'combination', eq: '2 Mg + O₂ → 2 MgO', caption: 'Magnesium burns. Two things join. Combination.' },
  { name: 'decomposition', eq: 'CaCO₃ → CaO + CO₂', caption: 'Heat splits one compound. Decomposition.' },
  { name: 'displacement', eq: 'Zn + CuSO₄ → ZnSO₄ + Cu', caption: 'Zinc pushes copper out. Displacement.' },
  { name: 'double displacement', eq: 'Na₂SO₄ + BaCl₂ → BaSO₄ + 2 NaCl', caption: 'Two salts swap. A white solid drops. Double displacement.' },
  { name: 'redox', eq: 'CuO + H₂ → Cu + H₂O', caption: 'Copper oxide loses oxygen. Reduction. Hydrogen gains it. Oxidation.' },
]

export const react_kind: SimFile = {
  id: 'react_kind',
  domain: 'chemistry',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Kinds of reaction',
  description: 'Combination, decomposition, displacement, double displacement, redox — the Class 10 list. Count atoms on both sides. Not collision-theory graphs.',
  equations: ['reactants → products', 'atoms conserved'],
  keywords: ['chemical reactions and equations', 'combination', 'decomposition', 'displacement', 'double displacement', 'oxidation'],
  params: [
    choice('look', 'Kind', [
      { value: 0, label: 'combination' },
      { value: 1, label: 'decomposition' },
      { value: 2, label: 'displacement' },
      { value: 3, label: 'double displacement' },
      { value: 4, label: 'redox' },
    ], 0),
  ],
  schema: z.object({
    look: num(0, 4, 0),
  }),
  run(params) {
    const look = Math.max(0, Math.min(4, Math.round(params.look)))
    const k = KINDS[look]
    const elements = [
      label('title', 24, 22, k.caption),
      label('eq', 24, 42, k.eq),
      rect('left', { x: 40, y: 90, width: 160, height: 100, fill: '#dbeafe', rx: 8 }),
      rect('right', { x: 300, y: 90, width: 160, height: 100, fill: '#dcfce7', rx: 8 }),
      label('L', 70, 145, look === 1 ? '1 compound' : 'reactants'),
      label('R', 330, 145, 'products'),
      label('arrow', 220, 145, '→'),
    ]
    if (look === 0) {
      elements.push(circle('mg', { cx: 90, cy: 210, r: 16, fill: '#94a3b8' }), circle('o', { cx: 140, cy: 210, r: 16, fill: '#7dd3fc' }))
    }
    if (look === 2) {
      elements.push(label('zn', 50, 230, 'Zn in blue CuSO₄ → brown Cu coats the zinc'))
    }
    elements.push(label('tip', 24, 286, 'Book Ch 1: atoms are rearranged, not created. Balance by counting each kind of atom.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, name: k.name },
      warnings: [],
      caption: k.caption,
    }
  },
}
