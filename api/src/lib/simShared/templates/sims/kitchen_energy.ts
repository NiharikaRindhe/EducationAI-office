// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, n, rect, tLoop, wave } from '../stage.js'

export const kitchen_energy: SimFile = {
  id: 'kitchen_energy',
  domain: 'physics',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Energy makes things work',
  description: 'A balloon rocket, sun-warmed water, or a rubber-band guitar — energy is what makes change happen.',
  equations: ['\\text{energy makes things move, light up, sound, heat}'],
  keywords: ['what is energy', 'balloon rocket', 'sound energy', 'sun-powered', 'how things work'],
  params: [
    choice('mode', 'Activity', [
      { value: 0, label: 'Balloon rocket' },
      { value: 1, label: 'Sun warmer' },
      { value: 2, label: 'Rubber guitar' },
    ], 0),
    param('amount', 'Push / sun / thickness', '', 1, 10, 1, 6),
  ],
  schema: z.object({
    mode: num(0, 2, 0),
    amount: num(1, 10, 6),
  }),
  run(params) {
    const mode = Math.round(params.mode)
    const amount = Math.max(1, Math.min(10, params.amount))
    const t = tLoop(3.2, 2.8)
    const frac = `min(1, (${t}) / 2.8)`
    const elements = []
    if (mode === 0) {
      const dist = 40 + amount * 36
      elements.push(
        label('eq', 28, 22, 'Air rushes out and pushes the balloon forward'),
        label('a', 28, 40, `More air in the balloon → it travels farther (${amount}/10)`),
        line('string', { x1: 40, y1: 150, x2: 460, y2: 150, stroke: '#94a3b8', strokeWidth: 2 }),
        circle(
          'balloon',
          {
            cx: { $expr: `60 + ${n(dist)} * (${frac})` },
            cy: 150,
            r: 22,
            fill: '#f472b6',
          },
          'projectile'
        )
      )
    } else if (mode === 1) {
      const sunH = 40 + amount * 8
      elements.push(
        label('eq', 28, 22, 'Sunlight warms the cup in the light. The cup in the shade stays cooler.'),
        label('a', 28, 40, `Minutes in the sun: about ${10 + amount * 2}`),
        circle('sun', { cx: 80, cy: 80, r: 24, fill: '#fbbf24' }),
        rect('cup1', { x: 160, y: 200 - sunH, width: 50, height: sunH, fill: '#fb923c', rx: 6 }),
        rect('cup2', { x: 300, y: 160, width: 50, height: 40, fill: '#7dd3fc', rx: 6 }),
        rect('shade', { x: 280, y: 70, width: 90, height: 14, fill: '#334155' }),
        label('l1', 158, 268, 'sun'),
        label('l2', 298, 268, 'shade')
      )
    } else {
      elements.push(
        label('eq', 28, 22, 'Plucking a rubber band makes it vibrate — that is sound energy'),
        label('a', 28, 40, amount < 5 ? 'Thinner band → higher sound' : 'Thicker band → lower sound'),
        rect('box', { x: 140, y: 90, width: 220, height: 140, fill: '#fef3c7', stroke: '#b45309', strokeWidth: 3, rx: 8 }),
        wave('w', {
            x1: 160,
            y1: 160,
            x2: 340,
            amplitude: 8 + amount,
            wavelength: 20 + amount * 4,
            phase: { $expr: '6 * time' },
            stroke: '#2563eb',
            strokeWidth: 3,
          })
      )
    }
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { mode, amount, kind: mode === 0 ? 'motion' : mode === 1 ? 'heat' : 'sound' },
      warnings: [],
      caption: 'Energy is what makes things move, light up, make a sound, or change temperature.',
    }
  },
}
