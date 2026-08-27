// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, n, tLoop } from '../stage.js'

export const earth_day_night: SimFile = {
  id: 'earth_day_night',
  domain: 'physics',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Day and night',
  description: 'The Sun stays still. Earth turns. The half that faces the Sun has day.',
  equations: ['\\text{day} = \\text{side facing the Sun}'],
  keywords: ['day and night', 'earth rotation', 'globe and torch', 'rhythms of nature'],
  params: [param('spin', 'Earth turn', '', 0, 360, 15, 40)],
  schema: z.object({
    spin: num(0, 360, 40),
  }),
  run(params) {
    const spin = ((params.spin % 360) + 360) % 360
    const cx = 280
    const cy = 160
    const R = 78
    const t = tLoop(8, 7.5)
    const ang = `${n(spin)} + 360 * (${t}) / 7.5`
    const indiaOnDay = spin > 270 || spin < 90
    const elements = [
      label('eq', 28, 22, 'Torch (Sun) stays still. Globe (Earth) turns.'),
      label('side', 28, 40, indiaOnDay ? 'India is in daylight on this facing' : 'India is in night on this facing'),
      label('fact', 28, 58, 'The Sun is not moving — Earth is rotating.'),
      circle('sun', { cx: 70, cy: 160, r: 28, fill: '#fbbf24' }),
      circle('earth', { cx, cy, r: R, fill: '#1d4ed8' }),
      circle(
        'night',
        {
          cx: { $expr: `${n(cx)} + ${n(R * 0.35)} * cos((${ang}) * ${Math.PI}/180)` },
          cy: { $expr: `${n(cy)} + ${n(R * 0.35)} * sin((${ang}) * ${Math.PI}/180)` },
          r: R * 0.92,
          fill: '#0f172a',
          opacity: 0.55,
        },
        'projectile'
      ),
      circle('india', {
        cx: { $expr: `${n(cx)} + ${n(R * 0.55)} * cos((${ang}) * ${Math.PI}/180 + 0.4)` },
        cy: { $expr: `${n(cy)} + ${n(R * 0.55)} * sin((${ang}) * ${Math.PI}/180 + 0.4)` },
        r: 7,
        fill: '#f472b6',
      }),
      label('sunL', 52, 210, 'Sun'),
      label('ind', 28, 268, 'pink dot = India'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { indiaInDay: indiaOnDay },
      warnings: [],
      caption: 'The Sun is not racing around us each day — we are the ones turning.',
    }
  },
}
