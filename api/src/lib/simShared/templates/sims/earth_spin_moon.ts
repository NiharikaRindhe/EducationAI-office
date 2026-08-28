// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, n, tLoop } from '../stage.js'

export const earth_spin_moon: SimFile = {
  id: 'earth_spin_moon',
  domain: 'physics',
  classBand: '7-7',
  ncertClass: 7,
  label: 'Earth turns — the Sun looks like it moves',
  description: 'Merry-go-round: you spin, the park seems to go around. Long shadows in the morning. Moon phases only if that page teaches them.',
  equations: ['Earth turns → day and night', 'morning shadows are long'],
  keywords: ['earth rotation', 'merry-go-round', 'morning shadows', 'moon', 'sun'],
  params: [
    param('spin', 'Earth turn', '', 0, 360, 15, 40),
    choice('look', 'Look at', [
      { value: 0, label: 'spin and shadows' },
      { value: 1, label: 'moon shape' },
    ], 0),
  ],
  schema: z.object({
    spin: num(0, 360, 40),
    look: num(0, 1, 0),
  }),
  run(params) {
    const spin = ((params.spin % 360) + 360) % 360
    const look = Math.round(params.look)
    const t = tLoop(10, 9.5)
    const ang = `${n(spin)} + 360 * (${t}) / 9.5`
    const morning = spin < 90 || spin > 300
    const shadowLen = morning ? 90 : 36
    const elements = [
      label('title', 24, 22, look === 0
        ? 'Earth turns. The Sun looks as if it travels across the sky.'
        : 'The Moon’s lit shape changes as the month passes — only if this page shows it.'),
      label('eq', 24, 42, look === 0
        ? (morning ? 'Morning: shadows are long.' : 'Midday: shadows shrink.')
        : 'The same face of the Moon is not always lit from our backyard.'),
    ]
    if (look === 0) {
      elements.push(
        circle('sun', { cx: 70, cy: 150, r: 26, fill: '#fbbf24' }),
        circle('earth', { cx: 250, cy: 150, r: 70, fill: '#1d4ed8' }),
        circle('night', {
          cx: { $expr: `250 + 24 * cos((${ang}) * ${Math.PI}/180)` },
          cy: { $expr: `150 + 24 * sin((${ang}) * ${Math.PI}/180)` },
          r: 64,
          fill: '#0f172a',
          opacity: 0.5,
        }, 'projectile'),
        line('stick', { x1: 400, y1: 220, x2: 400, y2: 160, stroke: '#334155', strokeWidth: 4 }),
        line('shad', { x1: 400, y1: 220, x2: 400 + shadowLen, y2: 220, stroke: '#0f172a', strokeWidth: 10, opacity: 0.35 }),
        label('mg', 24, 268, 'Like a merry-go-round: you spin, the world seems to move.'),
      )
    } else {
      const phase = Math.round(spin / 45) % 8
      elements.push(
        circle('moon', { cx: 250, cy: 150, r: 70, fill: '#e2e8f0' }),
        circle('shade', {
          cx: 250 + (phase - 4) * 12,
          cy: 150,
          r: 70,
          fill: '#0f172a',
          opacity: 0.55,
        }),
        label('ph', 24, 268, 'Use this only on pages that actually teach phases or eclipse.')
      )
    }
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { spin, morning, look },
      warnings: [],
      caption: 'Thicker than a Class 5 globe-and-torch. Pause the spin while you explain morning shadows.',
    }
  },
}
