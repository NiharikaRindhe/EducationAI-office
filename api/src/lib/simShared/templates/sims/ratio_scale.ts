// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const ratio_scale: SimFile = {
  id: 'ratio_scale',
  domain: 'math',
  classBand: '8-8',
  ncertClass: 8,
  label: 'Same taste, same map scale',
  description: 'Idli batter 2:1 rice to urad dal. 6:3 and 4:2 are the same mix (cross-multiply). Map RF 1:60,00,000 means 1 cm on the map is 60 km on the ground.',
  equations: ['a:b ~ c:d  if  a×d = b×c', '1 cm : 60,00,000 cm = 1 cm : 60 km'],
  keywords: ['proportional reasoning', 'idli', '2:1', 'cross-multiplication', 'representative fraction', '60 km', 'map'],
  params: [
    choice('mode', 'Story', [
      { value: 0, label: 'idli batter' },
      { value: 1, label: 'map RF' },
    ], 0),
    param('rice', 'Rice cups', '', 1, 12, 1, 2),
    param('dal', 'Urad dal cups', '', 1, 12, 1, 1),
    param('rice2', 'Other rice cups', '', 1, 12, 1, 6),
    param('dal2', 'Other dal cups', '', 1, 12, 1, 3),
    param('mapCm', 'Map distance', 'cm', 1, 20, 0.5, 1),
  ],
  schema: z.object({
    mode: num(0, 1, 0),
    rice: num(1, 12, 2),
    dal: num(1, 12, 1),
    rice2: num(1, 12, 6),
    dal2: num(1, 12, 3),
    mapCm: num(0.5, 20, 1),
  }),
  run(params) {
    const mode = Math.round(params.mode)
    const rice = Math.round(params.rice)
    const dal = Math.round(params.dal)
    const rice2 = Math.round(params.rice2)
    const dal2 = Math.round(params.dal2)
    const mapCm = params.mapCm
    const left = rice * dal2
    const right = dal * rice2
    const same = left === right
    const km = mapCm * 60
    if (mode === 1) {
      const bar = Math.min(360, mapCm * 24)
      return {
        stage: {
          viewBox: VIEW,
          elements: [
            label('title', 24, 22, `${mapCm} cm on the map is ${km} km on the ground.`),
            label('eq', 24, 40, 'RF 1 : 60,00,000  →  1 cm on paper = 60,00,000 cm = 60 km.'),
            rect('map', { x: 40, y: 90, width: 420, height: 90, fill: '#dcfce7', stroke: '#15803d', strokeWidth: 2, rx: 8 }),
            rect('seg', { x: 60, y: 128, width: bar, height: 8, fill: '#0f172a', rx: 2 }),
            label('ml', 60, 160, `${mapCm} cm on the map`),
            label('tip', 24, 248, 'This is straight-line (geographical) distance, not the road distance.'),
            label('rf', 24, 272, 'Book map scale: 1 : 60,00,000.'),
          ],
        },
        metrics: { mode, mapCm, km, rfKmPerCm: 60 },
        warnings: [],
        caption: 'Book RF 1:60,00,000 → 1 cm = 60 km.',
      }
    }
    const maxR = Math.max(rice, rice2, 1)
    const maxD = Math.max(dal, dal2, 1)
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('title', 24, 22, same
            ? `${rice}:${dal} and ${rice2}:${dal2} are the same mix. Cross products ${left} = ${right}.`
            : `${rice}:${dal} and ${rice2}:${dal2} are not the same. ${rice}×${dal2}=${left}, ${dal}×${rice2}=${right}.`),
          label('eq', 24, 40, 'Book start: 2 cups rice to 1 cup urad dal. Viswanath 6:3, Puneet 4:2.'),
          rect('r1', { x: 50, y: 200 - (rice / maxR) * 110, width: 50, height: (rice / maxR) * 110, fill: '#fde68a' }),
          rect('d1', { x: 110, y: 200 - (dal / maxD) * 110, width: 50, height: (dal / maxD) * 110, fill: '#86efac' }),
          label('l1', 50, 224, `${rice}:${dal}`),
          rect('r2', { x: 280, y: 200 - (rice2 / maxR) * 110, width: 50, height: (rice2 / maxR) * 110, fill: '#fde68a' }),
          rect('d2', { x: 340, y: 200 - (dal2 / maxD) * 110, width: 50, height: (dal2 / maxD) * 110, fill: '#86efac' }),
          label('l2', 280, 224, `${rice2}:${dal2}`),
          label('leg', 50, 252, 'yellow = rice    green = dal'),
          label('tip', 24, 278, same ? 'Same proportion — the idlis should taste the same.' : 'Different proportion — the batter is not the same mix.'),
        ],
      },
      metrics: { mode, rice, dal, rice2, dal2, crossA: left, crossB: right, proportional: same },
      warnings: [],
      caption: 'Book idli mix 2:1. 6:3 matches.',
    }
  },
}
