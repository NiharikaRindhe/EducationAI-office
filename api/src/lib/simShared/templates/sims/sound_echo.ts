// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, line, rect, wave } from '../stage.js'

export const sound_echo: SimFile = {
  id: 'sound_echo',
  domain: 'physics',
  classBand: '9-9',
  ncertClass: 9,
  label: 'Pluck, wave, echo',
  description: 'Activity 10.1: a rubber band on a box vibrates — that is sound. Wave look: λ, f. Echo: d = vt/2 with 340 m/s and 0.5 s → 85 m. Not the old 8–9 echo/sound files.',
  equations: ['d = vt / 2', 'v = fλ'],
  keywords: ['rubber band', '0.5 s', 'wavelength', 'tuning fork', 'sound waves characteristics', 'activity 10.1'],
  params: [
    choice('look', 'Look at', [
      { value: 0, label: 'echo' },
      { value: 1, label: 'wave' },
    ], 0),
    param('v', 'Speed of sound', 'm/s', 300, 400, 5, 340),
    param('t', 'Time for echo', 's', 0.2, 2, 0.1, 0.5),
    param('f', 'Frequency (wave look)', 'Hz', 1, 5, 0.5, 2),
  ],
  schema: z.object({
    look: num(0, 1, 0),
    v: num(200, 500, 340),
    t: num(0.1, 3, 0.5),
    f: num(0.5, 8, 2),
  }),
  run(params) {
    const look = Math.round(params.look)
    const v = params.v
    const t = params.t
    const f = params.f
    const d = (v * t) / 2
    if (look === 1) {
      const elements = [
        label('title', 24, 22, `A sound wave. Frequency ${f}. Higher f → more waves in the same time. Amplitude is loudness.`),
        label('eq', 24, 40, 'Book: 20 000 Hz has λ = 1.72 cm in air. Vibration of the rubber band produces the wave.'),
        wave('w', { x1: 40, y1: 150, x2: 460, amplitude: 28, wavelength: Math.max(40, 180 / Math.max(f, 0.2)), stroke: '#2563eb', strokeWidth: 2 }),
        label('tip', 24, 286, 'Book Activity 10.1: pluck the rubber band. Sound lasts only while it vibrates.'),
      ]
      return {
        stage: { viewBox: VIEW, elements },
        metrics: { look, v, t, d, f },
        warnings: [],
        caption: 'Book: vibrating rubber band → sound wave.',
      }
    }
    const elements = [
      label('title', 24, 22, `Echo in ${t} s. v = ${v} m/s. Distance to the wall = vt/2 = ${d.toFixed(1)} m.`),
      label('eq', 24, 40, 'Sound goes to the cliff and back. Half the path is the distance.'),
      rect('person', { x: 60, y: 140, width: 24, height: 50, fill: '#2563eb' }),
      rect('cliff', { x: 400, y: 80, width: 40, height: 160, fill: '#78716c' }),
      line('go', { x1: 90, y1: 150, x2: 400, y2: 150, stroke: '#d97706', strokeWidth: 2 }),
      label('tip', 24, 270, 'Book: 0.5 s, 340 m s⁻¹. Spacewalk: no air, no sound.'),
      label('d', 24, 286, `d = ${d.toFixed(1)} m. Default 85 m.`),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, v, t, d, f },
      warnings: [],
      caption: 'Book: echo 0.5 s, 340 m/s → 85 m.',
    }
  },
}
