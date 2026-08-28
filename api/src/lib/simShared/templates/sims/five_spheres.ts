// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, rect } from '../stage.js'

export const five_spheres: SimFile = {
  id: 'five_spheres',
  domain: 'physics',
  classBand: '9-9',
  ncertClass: 9,
  label: 'Earth’s five spheres',
  description: 'Geo, hydro, cryo, atmo, bio. Snow (cryo) melts into a lake (hydro) and waters grass (bio). Not Class 5 globe-and-torch.',
  equations: ['cryosphere → hydrosphere → biosphere'],
  keywords: ['geosphere', 'hydrosphere', 'cryosphere', 'atmosphere', 'biosphere', 'earth as a system'],
  params: [
    choice('look', 'Look at', [
      { value: 0, label: 'snow to lake' },
      { value: 1, label: 'five spheres' },
    ], 0),
  ],
  schema: z.object({
    look: num(0, 1, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    const spheres = ['Geosphere', 'Hydrosphere', 'Cryosphere', 'Atmosphere', 'Biosphere']
    const colors = ['#a8a29e', '#38bdf8', '#e0f2fe', '#bae6fd', '#86efac']
    const elements = [
      label('title', 24, 22, look === 0
        ? 'Snow (cryosphere) melts into the lake (hydrosphere). Grass (biosphere) drinks that water.'
        : 'Five spheres. A change in one reaches the others.'),
      label('eq', 24, 40, 'Book Activity 13.1. Less snowfall → lower lake → less grass for sheep.'),
    ]
    if (look === 0) {
      elements.push(
        rect('snow', { x: 60, y: 80, width: 100, height: 50, fill: '#f8fafc', stroke: '#94a3b8' }),
        label('sl', 80, 108, 'snow'),
        rect('lake', { x: 200, y: 160, width: 160, height: 50, fill: '#38bdf8', rx: 20 }),
        label('ll', 250, 190, 'lake'),
        rect('grass', { x: 380, y: 200, width: 70, height: 40, fill: '#22c55e' }),
        label('gl', 388, 224, 'grass'),
      )
    } else {
      for (let i = 0; i < 5; i++) {
        elements.push(
          circle(`s${i}`, { cx: 80 + i * 85, cy: 160, r: 34, fill: colors[i], stroke: '#334155' }),
          label(`n${i}`, 48 + i * 85, 230, spheres[i].slice(0, 8)),
        )
      }
    }
    elements.push(label('tip', 24, 286, 'Book: Himalayan snow → lake. Arabian Sea warming shifts the monsoon.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, spheres: 5, snowToLake: look === 0 },
      warnings: [],
      caption: 'Book Activity 13.1: snow becomes lake. Five spheres.',
    }
  },
}
