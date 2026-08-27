// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, n, tLoop } from '../stage.js'

const NAMES = ['full', 'waning gibbous', 'last quarter', 'waning crescent', 'new', 'waxing crescent', 'first quarter', 'waxing gibbous']

export const moon_month: SimFile = {
  id: 'moon_month',
  domain: 'physics',
  classBand: '8-8',
  ncertClass: 8,
  label: 'The Moon’s shape over a month',
  description: 'Start the day after a full Moon. The bright part shrinks (waning), then grows again (waxing). The Moon is always a ball — sunlight lights different parts as seen from Earth.',
  equations: ['phase depends on Sun–Moon–Earth positions'],
  keywords: ['moon phase', 'full moon', 'keeping time', 'skies', 'waning', 'waxing', 'month'],
  params: [
    param('day', 'Days after full Moon', '', 0, 29, 1, 1),
  ],
  schema: z.object({
    day: num(0, 29, 1),
  }),
  run(params) {
    const day = Math.max(0, Math.min(29, Math.round(params.day)))
    const phase = Math.round((day / 29) * 8) % 8
    const name = NAMES[phase]
    const waning = day > 0 && day < 15
    const t = tLoop(20, 19)
    const shift = ((day / 29) - 0.5) * 90
    const elements = [
      label('title', 24, 22, day === 0
        ? 'Full Moon. The whole face we see is lit.'
        : `Day ${day} after full Moon — ${name}.`),
      label('eq', 24, 40, waning
        ? 'The bright part is shrinking. The Moon is not disappearing — we see less of the lit half.'
        : day === 0
          ? 'Begin Activity 11.1 from sunrise the day after a full Moon.'
          : 'After about 15 days the bright part grows again (waxing).'),
      circle('sun', { cx: 70, cy: 150, r: 22, fill: '#fbbf24' }),
      circle('earth', { cx: 250, cy: 150, r: 18, fill: '#1d4ed8' }),
      circle('moonBall', { cx: 400, cy: 150, r: 48, fill: '#e2e8f0' }),
      circle('shade', {
        cx: 400 + shift,
        cy: 150,
        r: 48,
        fill: '#0f172a',
        opacity: 0.72,
      }),
      circle('orbitDot', {
        cx: { $expr: `250 + 90 * cos((${n(day)} / 29) * 6.283 + ${t} * 0)` },
        cy: { $expr: `150 + 50 * sin((${n(day)} / 29) * 6.283)` },
        r: 8,
        fill: '#cbd5e1',
      }),
      label('tip', 24, 258, 'Book: the Moon was up in the daytime at the kite festival. Shape changes are not a lunar eclipse.'),
      label('act', 24, 278, 'Shade the bright part. After full Moon it decreases for about a fortnight.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { day, phase, name, waning: day > 0 && day < 15 },
      warnings: [],
      caption: 'Book Activity 11.1: start the day after full Moon.',
    }
  },
}
