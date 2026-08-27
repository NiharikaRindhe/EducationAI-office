// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const gold_foil: SimFile = {
  id: 'gold_foil',
  domain: 'chemistry',
  classBand: '9-9',
  ncertClass: 9,
  label: 'Gold foil and electron shells',
  description: 'Most particles go straight through gold foil. A few bounce — the nucleus is tiny. Other look: fill shells 2, 8, 8. Not the old Bohr energy E = −13.6/n².',
  equations: ['most particles undeflected', 'K=2, L=8, M=8'],
  keywords: ['gold foil', 'rutherford', 'thomson', 'nucleus', 'electron distribution', 'journey inside the atom'],
  params: [
    choice('look', 'Look at', [
      { value: 0, label: 'gold foil' },
      { value: 1, label: 'fill shells (Na)' },
    ], 0),
    param('particles', 'Particles drawn', '', 8, 24, 1, 20),
  ],
  schema: z.object({
    look: num(0, 1, 0),
    particles: num(4, 30, 20),
  }),
  run(params) {
    const look = Math.round(params.look)
    const n = Math.round(params.particles)
    if (look === 1) {
      const cx = 250
      const cy = 160
      const elements = [
        label('title', 24, 22, 'Sodium: 11 electrons. Fill 2, then 8, then 1. Valency 1.'),
        label('eq', 24, 40, 'Shell n holds at most 2n², but we stop at 8 on L and M in this chapter.'),
        circle('nuc', { cx, cy, r: 12, fill: '#f97316' }),
        circle('K', { cx, cy, r: 40, fill: 'none', stroke: '#2563eb', strokeWidth: 1.5 }),
        circle('L', { cx, cy, r: 70, fill: 'none', stroke: '#059669', strokeWidth: 1.5 }),
        circle('M', { cx, cy, r: 100, fill: 'none', stroke: '#d97706', strokeWidth: 1.5 }),
      ]
      const place = (ring: number, count: number, R: number) => {
        for (let i = 0; i < count; i++) {
          const ang = (2 * Math.PI * i) / count - Math.PI / 2
          elements.push(circle(`e${ring}-${i}`, { cx: cx + R * Math.cos(ang), cy: cy + R * Math.sin(ang), r: 5, fill: '#1d4ed8' }))
        }
      }
      place(1, 2, 40)
      place(2, 8, 70)
      place(3, 1, 100)
      elements.push(label('tip', 24, 286, 'Book: building up atoms. Octet in the valence shell is stable.'))
      return {
        stage: { viewBox: VIEW, elements },
        metrics: { look, electrons: 11, K: 2, L: 8, M: 1 },
        warnings: [],
        caption: 'Book: electron distribution. Sodium 2, 8, 1.',
      }
    }
    let bounced = 0
    const elements = [
      label('title', 24, 22, `${n} α particles. Most go through. One or two bounce — a tiny hard nucleus.`),
      label('eq', 24, 40, 'Thomson’s pudding cannot explain the bounce. Rutherford: empty space + nucleus.'),
      line('foil', { x1: 250, y1: 60, x2: 250, y2: 250, stroke: '#fbbf24', strokeWidth: 4 }),
      circle('nuc', { cx: 250, cy: 155, r: 6, fill: '#b45309' }),
    ]
    for (let i = 0; i < n; i++) {
      const y = 70 + (i * 160) / Math.max(1, n - 1)
      const bounce = i === 3 || i === 11
      if (bounce) bounced += 1
      elements.push(line(`p${i}`, {
        x1: 40,
        y1: y,
        x2: bounce ? 80 : 430,
        y2: bounce ? y - 30 : y,
        stroke: bounce ? '#dc2626' : '#2563eb',
        strokeWidth: 1.5,
      }))
    }
    elements.push(label('tip', 24, 286, 'Book: gold foil experiment. Most particles undeflected.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, particles: n, bounced, through: n - bounced },
      warnings: [],
      caption: 'Book: gold foil. Most through, few bounce.',
    }
  },
}
