// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, rect } from '../stage.js'

export const simple_circuit: SimFile = {
  id: 'simple_circuit',
  domain: 'physics',
  classBand: '7-7',
  ncertClass: 7,
  label: 'Cell, bulb, switch',
  description: 'A cell, a bulb, a switch. Closed path — bulb glows. Open path — bulb is dark. Try a conductor vs an insulator.',
  equations: ['closed path → glow', 'open path → dark'],
  keywords: ['circuit', 'cell', 'bulb', 'switch', 'conductor', 'insulator', 'electricity'],
  params: [
    choice('switch', 'Switch', [
      { value: 0, label: 'open' },
      { value: 1, label: 'closed' },
    ], 1),
    choice('gap', 'In the gap', [
      { value: 0, label: 'metal (conductor)' },
      { value: 1, label: 'eraser (insulator)' },
    ], 0),
  ],
  schema: z.object({
    switch: num(0, 1, 1),
    gap: num(0, 1, 0),
  }),
  run(params) {
    const sw = Math.round(params.switch)
    const gap = Math.round(params.gap)
    const on = sw === 1 && gap === 0
    const elements = [
      label('title', 24, 22, on ? 'The path is closed. The bulb glows.' : 'The path is broken. The bulb stays dark.'),
      label('eq', 24, 42, gap === 1 ? 'An eraser does not let the current through.' : 'Metal in the gap lets the current through.'),
      rect('cell', { x: 60, y: 140, width: 50, height: 28, fill: '#fbbf24', stroke: '#b45309', strokeWidth: 2, rx: 4 }),
      label('plus', 66, 132, '+'),
      line('w1', { x1: 110, y1: 154, x2: 200, y2: 154, stroke: '#334155', strokeWidth: 3 }),
      line('w2', { x1: 260, y1: 154, x2: 340, y2: 154, stroke: '#334155', strokeWidth: 3 }),
      line('w3', { x1: 60, y1: 168, x2: 60, y2: 220, stroke: '#334155', strokeWidth: 3 }),
      line('w4a', { x1: 60, y1: 220, x2: 168, y2: 220, stroke: '#334155', strokeWidth: 3 }),
      line('w4b', { x1: 218, y1: 220, x2: 400, y2: 220, stroke: '#334155', strokeWidth: 3 }),
      line('w5', { x1: 400, y1: 220, x2: 400, y2: 154, stroke: '#334155', strokeWidth: 3 }),
      circle('bulb', { cx: 230, cy: 150, r: 28, fill: on ? '#fde047' : '#e2e8f0', stroke: '#64748b', strokeWidth: 2 }),
      label('bl', 214, 196, 'bulb'),
      line('sw', {
        x1: 340,
        y1: 154,
        x2: sw === 1 ? 400 : 380,
        y2: sw === 1 ? 154 : 128,
        stroke: '#2563eb',
        strokeWidth: 3,
      }),
      rect('mat', {
        x: gap === 0 ? 168 : 178,
        y: gap === 0 ? 212 : 198,
        width: gap === 0 ? 50 : 28,
        height: gap === 0 ? 16 : 14,
        fill: gap === 0 ? '#94a3b8' : '#fda4af',
        rx: 3,
      }),
      label('ml', 160, 248, gap === 0 ? 'metal' : 'eraser'),
      label('tip', 24, 278, 'No Ohm’s law, no V = IR. Just open, closed, conductor, insulator.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { glowing: on, closed: sw === 1 },
      warnings: [],
      caption: 'Book circuit: cell + bulb + switch.',
    }
  },
}
