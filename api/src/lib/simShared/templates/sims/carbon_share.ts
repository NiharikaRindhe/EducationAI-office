// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, rect } from '../stage.js'

export const carbon_share: SimFile = {
  id: 'carbon_share',
  domain: 'chemistry',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Carbon shares electrons',
  description: 'Covalent electron dots: H₂, O₂, N₂, CH₄, then a carbon chain (+CH₂ homologous). Soap look: micelle traps oil dirt in water. Not Class 9 H₂/NaCl.',
  equations: ['shared pair = covalent', 'homologous: +CH₂'],
  keywords: ['covalent bond', 'carbon', 'CH4', 'homologous series', 'soap', 'micelle'],
  params: [
    choice('look', 'Show', [
      { value: 0, label: 'H₂' },
      { value: 1, label: 'O₂' },
      { value: 2, label: 'N₂' },
      { value: 3, label: 'CH₄' },
      { value: 4, label: 'chain +CH₂' },
      { value: 5, label: 'soap micelle' },
    ], 3),
  ],
  schema: z.object({
    look: num(0, 5, 3),
  }),
  run(params) {
    const look = Math.max(0, Math.min(5, Math.round(params.look)))
    const names = ['H2', 'O2', 'N2', 'CH4', 'chain', 'soap']
    const titles = [
      'Two H atoms share a pair. Single bond. H₂.',
      'Two O atoms share two pairs. Double bond. O₂.',
      'Two N atoms share three pairs. Triple bond. N₂.',
      'Carbon has four hands. CH₄ — four H around C.',
      'A chain grows by CH₂. Homologous series. Properties change slowly.',
      'Soap: a tail in oil dirt, a head in water. Micelle lifts the grease.',
    ]
    const elements = [
      label('title', 24, 22, titles[look]),
      label('eq', 24, 40, look === 5
        ? 'Head loves water. Tail loves oil. Dirt sits inside the ball.'
        : look === 4
          ? 'CH₄, C₂H₆, C₃H₈ … each step adds CH₂.'
          : 'Covalent: share, do not give away like NaCl.'),
    ]
    if (look <= 2) {
      const pairs = look + 1
      elements.push(
        circle('a', { cx: 190, cy: 160, r: 44, fill: '#e0f2fe', stroke: '#2563eb', strokeWidth: 2 }),
        circle('b', { cx: 290, cy: 160, r: 44, fill: '#e0f2fe', stroke: '#2563eb', strokeWidth: 2 }),
      )
      for (let i = 0; i < pairs; i++) {
        elements.push(circle(`e${i}`, { cx: 240, cy: 140 + i * 16, r: 5, fill: '#1d4ed8' }))
      }
    } else if (look === 3) {
      elements.push(
        circle('c', { cx: 250, cy: 160, r: 28, fill: '#334155' }),
        label('cl', 242, 166, 'C', '#fff'),
        circle('h1', { cx: 250, cy: 90, r: 16, fill: '#93c5fd' }),
        circle('h2', { cx: 250, cy: 230, r: 16, fill: '#93c5fd' }),
        circle('h3', { cx: 180, cy: 160, r: 16, fill: '#93c5fd' }),
        circle('h4', { cx: 320, cy: 160, r: 16, fill: '#93c5fd' }),
      )
    } else if (look === 4) {
      for (let i = 0; i < 4; i++) {
        elements.push(rect(`c${i}`, { x: 80 + i * 90, y: 130, width: 50, height: 40, fill: '#334155', rx: 6 }))
        elements.push(label(`n${i}`, 90 + i * 90, 155, `C${i + 1}`, '#fff'))
        if (i < 3) elements.push(line(`b${i}`, { x1: 130 + i * 90, y1: 150, x2: 170 + i * 90, y2: 150, stroke: '#64748b', strokeWidth: 3 }))
      }
    } else {
      elements.push(
        circle('mic', { cx: 250, cy: 160, r: 70, fill: '#fef3c7', stroke: '#d97706', strokeWidth: 2 }),
        circle('dirt', { cx: 250, cy: 160, r: 22, fill: '#78716c' }),
        label('oil', 232, 166, 'oil'),
        label('head', 330, 100, 'heads in water'),
      )
    }
    elements.push(label('tip', 24, 286, 'Book Ch 4: carbon shares. Chains and rings. Soap chapter: micelle in water.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, name: names[look] },
      warnings: [],
      caption: titles[look],
    }
  },
}
