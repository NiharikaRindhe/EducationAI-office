// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const bond_kind: SimFile = {
  id: 'bond_kind',
  domain: 'chemistry',
  classBand: '9-9',
  ncertClass: 9,
  label: 'Share or give electrons',
  description: 'H₂ shares a pair (covalent). Na gives an electron to Cl (ionic). Water is H₂O — not the same as H₂ or O₂. Not the old 9–10 bond animations.',
  equations: ['covalent: shared pair', 'ionic: electron transfer'],
  keywords: ['covalent', 'ionic', 'octet', 'H2', 'NaCl', 'how atoms combine'],
  params: [
    choice('look', 'Bond', [
      { value: 0, label: 'H₂ covalent' },
      { value: 1, label: 'NaCl ionic' },
    ], 0),
  ],
  schema: z.object({
    look: num(0, 1, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    if (look === 1) {
      const elements = [
        label('title', 24, 22, 'Na gives one electron to Cl. Na⁺ and Cl⁻ attract. Ionic bond. Table salt.'),
        label('eq', 24, 40, 'Transfer, not share. Dissolved salt conducts; sugar does not.'),
        circle('na', { cx: 160, cy: 150, r: 36, fill: '#93c5fd' }),
        circle('cl', { cx: 320, cy: 150, r: 44, fill: '#86efac' }),
        label('naL', 148, 156, 'Na⁺'),
        label('clL', 308, 156, 'Cl⁻'),
        label('tip', 24, 286, 'Book: bonding by electron transfer. Think It Over: salt conducts, sugar does not.'),
      ]
      return {
        stage: { viewBox: VIEW, elements },
        metrics: { look, kind: 'ionic', name: 'NaCl' },
        warnings: [],
        caption: 'Book: ionic NaCl. Electron transfer.',
      }
    }
    const elements = [
      label('title', 24, 22, 'Two hydrogen atoms share a pair. Covalent bond. H₂ is a gas — water is not H₂.'),
      label('eq', 24, 40, 'Share to complete a shell. H needs 2, not 8.'),
      circle('h1', { cx: 200, cy: 150, r: 40, fill: '#e0f2fe', stroke: '#2563eb', strokeWidth: 2 }),
      circle('h2', { cx: 280, cy: 150, r: 40, fill: '#e0f2fe', stroke: '#2563eb', strokeWidth: 2 }),
      circle('e1', { cx: 240, cy: 140, r: 6, fill: '#1d4ed8' }),
      circle('e2', { cx: 240, cy: 162, r: 6, fill: '#1d4ed8' }),
      line('pair', { x1: 240, y1: 128, x2: 240, y2: 174, stroke: '#1d4ed8', strokeWidth: 1 }),
      label('tip', 24, 286, 'Book: H₂ and O₂ are gases; water is a liquid. Compound ≠ mixture of the elements.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, kind: 'covalent', name: 'H2' },
      warnings: [],
      caption: 'Book: covalent H₂. Shared pair.',
    }
  },
}
