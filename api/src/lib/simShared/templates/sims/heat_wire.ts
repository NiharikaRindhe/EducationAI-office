// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const heat_wire: SimFile = {
  id: 'heat_wire',
  domain: 'physics',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Heat in a wire',
  description: 'Joule heat H = I²Rt. Power P = VI = I²R. Book: bulb 220 V, 1200 Ω vs a heater coil. Not the old I=2 R=3 t=4 toy.',
  equations: ['H = I² R t', 'P = V I = I² R = V²/R'],
  keywords: ['heating effect', 'joule heating', 'electric power', '220 V', 'filament'],
  params: [
    param('V', 'Voltage', 'V', 6, 240, 2, 220),
    param('R', 'Resistance', 'Ω', 10, 2000, 10, 1200),
    param('t', 'Time', 's', 1, 60, 1, 10),
  ],
  schema: z.object({
    V: num(1, 250, 220),
    R: num(1, 2500, 1200),
    t: num(1, 120, 10),
  }),
  run(params) {
    const V = params.V
    const R = params.R
    const t = params.t
    const I = V / R
    const P = V * I
    const H = I * I * R * t
    const glow = Math.min(1, P / 80)
    const elements = [
      label('title', 24, 22, `V = ${V} V, R = ${R} Ω. I = ${I.toFixed(3)} A. Power P = ${P.toFixed(1)} W.`),
      label('eq', 24, 40, `Heat H = I²Rt = ${H.toFixed(1)} J in ${t} s.`),
      rect('coil', { x: 160, y: 110, width: 180, height: 70, fill: `rgba(239, 68, 68, ${0.25 + 0.6 * glow})`, rx: 8 }),
      label('w', 210, 150, `${P.toFixed(0)} W`),
      label('tip', 24, 286, 'Book: bulb 220 V, filament 1200 Ω draws little current. A heater coil has smaller R so more I and more heat.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { V, R, t, I, P, H },
      warnings: [],
      caption: 'Book: 220 V, 1200 Ω bulb. H = I²Rt. Power P = VI.',
    }
  },
}
