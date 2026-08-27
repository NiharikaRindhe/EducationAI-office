// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const field_wire: SimFile = {
  id: 'field_wire',
  domain: 'physics',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Field around a current',
  description: 'Magnetic field of a straight wire, a loop, or a solenoid. Stronger current → tighter circles. Right-hand thumb rule. Not the old magnetic_wire / solenoid ids.',
  equations: ['field circles a straight current', 'solenoid ≈ bar magnet'],
  keywords: ['magnetic field', 'straight conductor', 'circular loop', 'solenoid', 'right-hand thumb'],
  params: [
    choice('look', 'Shape', [
      { value: 0, label: 'straight wire' },
      { value: 1, label: 'loop' },
      { value: 2, label: 'solenoid' },
    ], 0),
    param('I', 'Current', 'A', 1, 10, 1, 5),
  ],
  schema: z.object({
    look: num(0, 2, 0),
    I: num(1, 12, 5),
  }),
  run(params) {
    const look = Math.round(params.look)
    const I = params.I
    const titles = [
      'Straight wire. Field circles. Right-hand thumb along I; fingers show the circles.',
      'A circular loop. Field through the middle is stronger.',
      'Solenoid: many loops. Nearly uniform inside. N and S outside, like a bar magnet.',
    ]
    const elements = [
      label('title', 24, 22, titles[look]),
      label('eq', 24, 40, `Current I = ${I} A. Bigger I → stronger field (circles packed closer).`),
    ]
    if (look === 0) {
      elements.push(line('wire', { x1: 250, y1: 60, x2: 250, y2: 250, stroke: '#0f172a', strokeWidth: 4 }))
      for (let k = 1; k <= 3; k++) {
        const rr = 18 + k * (28 - I)
        elements.push(circle(`c${k}`, { cx: 250, cy: 160, r: Math.max(16, rr), fill: 'none', stroke: '#2563eb', strokeWidth: 1.5 }))
      }
    } else if (look === 1) {
      elements.push(circle('loop', { cx: 250, cy: 160, r: 70, fill: 'none', stroke: '#0f172a', strokeWidth: 4 }))
      elements.push(label('x', 244, 166, '×'))
    } else {
      for (let i = 0; i < 8; i++) {
        elements.push(circle(`t${i}`, { cx: 140 + i * 28, cy: 160, r: 28, fill: 'none', stroke: '#0f172a', strokeWidth: 2 }))
      }
      elements.push(label('N', 120, 100, 'N'), label('S', 370, 100, 'S'))
    }
    elements.push(label('tip', 24, 286, 'Book Ch 12: iron filings around a current. Compass needle. Solenoid is an electromagnet.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, I, kind: look === 0 ? 'straight' : look === 1 ? 'loop' : 'solenoid' },
      warnings: [],
      caption: look === 2 ? 'Solenoid field. Current I.' : look === 1 ? 'Loop field. Current I.' : 'Straight wire. Right-hand thumb rule.',
    }
  },
}
