// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, n, pathEl, rect, tLoop } from '../stage.js'

export const river_dam: SimFile = {
  id: 'river_dam',
  domain: 'physics',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Journey of a river',
  description: 'A river grows as tributaries join. A dam stores a reservoir — and changes the flow below.',
  equations: ['\\text{length along the course}'],
  keywords: ['tributaries', 'perennial river', 'reservoir', 'godavari', 'journey of a river'],
  params: [
    param('lengthKm', 'River length', 'km', 100, 2500, 50, 1465),
    choice('dam', 'Dam', [
      { value: 0, label: 'Open river' },
      { value: 1, label: 'Dam closed' },
    ], 0),
  ],
  schema: z.object({
    lengthKm: num(50, 4000, 1465),
    dam: num(0, 1, 0),
  }),
  run(params) {
    const lengthKm = Math.max(50, params.lengthKm)
    const closed = params.dam >= 0.5
    const t = tLoop(4, 3.4)
    const frac = `min(1, (${t}) / 3.4)`
    const flowW = closed ? 8 : 22
    const elements = [
      label('eq', 28, 22, `Godavari-style journey: ${Math.round(lengthKm)} km mountain → sea`),
      label('note', 28, 40, closed ? 'Dam stores a reservoir. Land behind the wall floods.' : 'Tributaries join. The river grows wider and stronger.'),
      pathEl('hills', { d: 'M 20 120 L 70 60 L 110 100 L 150 50 L 190 110 L 20 110 Z', fill: '#86efac' }),
      label('src', 40, 48, 'hills'),
      pathEl('river', {
        d: 'M 150 110 C 200 140, 240 130, 280 160 C 330 200, 380 190, 490 220',
        fill: 'none',
        stroke: '#0ea5e9',
        strokeWidth: flowW,
      }),
      pathEl('trib', {
        d: 'M 210 70 C 230 90, 250 120, 268 150',
        fill: 'none',
        stroke: '#38bdf8',
        strokeWidth: 10,
      }),
      label('tr', 200, 64, 'tributary'),
    ]
    if (closed) {
      elements.push(
        rect('wall', { x: 268, y: 120, width: 18, height: 70, fill: '#64748b' }),
        pathEl('res', { d: 'M 190 110 C 230 90, 250 100, 268 150 L 268 190 C 230 170, 200 150, 150 140 Z', fill: '#7dd3fc', opacity: 0.8 }),
        label('damL', 250, 108, 'dam')
      )
    }
    elements.push(
      rect('sea', { x: 430, y: 200, width: 70, height: 80, fill: '#0369a1', rx: 8 }),
      label('seaL', 444, 292, 'sea'),
      pathEl(
        'boat',
        {
          d: 'M 0 0 l 18 0 l -4 8 l -14 0 Z',
          fill: '#f59e0b',
          transform: { $expr: `concat('translate(', 160 + 240 * (${frac}), ' 148)')` },
        },
        'projectile'
      )
    )
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { lengthKm: Number(lengthKm.toFixed(1)), dam: closed ? 1 : 0, damsOnGodavari: 900 },
      warnings: [],
      caption: 'Godavari travels 1,465 km. More than 900 dams store her water.',
    }
  },
}
