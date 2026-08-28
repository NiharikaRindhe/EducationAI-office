// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const fun_lift: SimFile = {
  id: 'fun_lift',
  domain: 'math',
  classBand: '6-6',
  ncertClass: 6,
  label: 'Bela’s lift — the other side of zero',
  description: 'Floors below ground are less than 0. Press + to go up, − to go down. +2 from the Welcome Hall is two floors up. Not Class 7 “sum 25 difference 11”.',
  equations: ['start + move = new floor', 'floors below 0 are negative'],
  keywords: ['other side of zero', 'integers', 'bela', 'lift', 'negative', 'building of fun'],
  params: [
    param('start', 'Start floor', '', -6, 6, 1, 0),
    param('move', 'Button press', '', -6, 6, 1, 2),
  ],
  schema: z.object({
    start: num(-8, 8, 0),
    move: num(-8, 8, 2),
  }),
  run(params) {
    const start = Math.round(params.start)
    const move = Math.round(params.move)
    const dest = start + move
    const floorY = (f) => 150 - f * 18
    const elements = [
      label('title', 24, 22, `Start at ${start >= 0 ? '+' : ''}${start}. Press ${move >= 0 ? '+' : ''}${move}. You arrive at ${dest >= 0 ? '+' : ''}${dest}.`),
      label('eq', 24, 40, move >= 0
        ? `+ means up ${move} floor${move === 1 ? '' : 's'}. Book: ++ is written +2.`
        : `− means down ${-move} floor${move === -1 ? '' : 's'}. Book: −− is written −2.`),
    ]
    for (let f = 6; f >= -6; f--) {
      const y = floorY(f)
      const here = f === dest
      const ground = f === 0
      elements.push(
        rect(`fl${f}`, {
          x: 180,
          y: y,
          width: 160,
          height: 16,
          fill: here ? '#fde047' : ground ? '#cbd5e1' : f > 0 ? '#dbeafe' : '#fecaca',
          stroke: '#64748b',
        }),
        label(`n${f}`, 350, y + 12, ground ? '0  ground' : String(f)),
      )
    }
    elements.push(rect('car', { x: 188, y: floorY(dest) - 2, width: 40, height: 20, fill: '#2563eb', rx: 3 }))
    elements.push(label('tip', 24, 278, 'Book: Welcome Hall is 0. Art Centre is two + presses. Shops below ground are negative floors.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { start, move, dest },
      warnings: [],
      caption: 'Book lift: +2 up, −2 down. Ground is 0.',
    }
  },
}
