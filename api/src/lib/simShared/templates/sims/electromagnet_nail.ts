// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, rect } from '../stage.js'

export const electromagnet_nail: SimFile = {
  id: 'electromagnet_nail',
  domain: 'physics',
  classBand: '8-8',
  ncertClass: 8,
  label: 'Nail magnet and a hot wire',
  description: 'Sumana’s model: an iron nail wrapped in wire. Close the circuit — it picks up clips. Open it — clips fall. Other look: a wire warms when current flows. No V=IR, no H=I²Rt.',
  equations: ['current in a coil → temporary magnet', 'current in a wire → heat'],
  keywords: ['electromagnet', 'magnetic effect', 'heating effect', 'paper clips', 'iron nail', 'electricity'],
  params: [
    choice('look', 'Look at', [
      { value: 0, label: 'electromagnet' },
      { value: 1, label: 'heating wire' },
    ], 0),
    choice('switch', 'Switch', [
      { value: 0, label: 'open' },
      { value: 1, label: 'closed' },
    ], 1),
    param('clips', 'Paper clips nearby', '', 0, 8, 1, 5),
  ],
  schema: z.object({
    look: num(0, 1, 0),
    switch: num(0, 1, 1),
    clips: num(0, 8, 5),
  }),
  run(params) {
    const look = Math.round(params.look)
    const sw = Math.round(params.switch)
    const clips = Math.round(params.clips)
    const on = sw === 1
    if (look === 1) {
      return {
        stage: {
          viewBox: VIEW,
          elements: [
            label('title', 24, 22, on ? 'Current is flowing. The wire warms up.' : 'Switch open. The wire stays cool.'),
            label('eq', 24, 40, 'Heat from electricity — no I²Rt formula on this page.'),
            rect('cell', { x: 50, y: 140, width: 46, height: 24, fill: '#fbbf24', rx: 4 }),
            line('w', { x1: 96, y1: 152, x2: 400, y2: 152, stroke: on ? '#ef4444' : '#64748b', strokeWidth: on ? 8 : 4 }),
            line('sw', { x1: 400, y1: 152, x2: on ? 430 : 418, y2: on ? 152 : 128, stroke: '#2563eb', strokeWidth: 3 }),
            label('tip', 24, 248, on ? 'Toasters and irons use this heating effect.' : 'Open the path and the heating stops.'),
            label('warn', 24, 272, 'Not Joule’s law. Just: current on → wire gets hot.'),
          ],
        },
        metrics: { look, switch: sw, hot: on },
        warnings: [],
        caption: 'Heating effect of current — qualitative.',
      }
    }
    const elements = [
      label('title', 24, 22, on
        ? 'Circuit closed. The nail acts like a magnet. Clips stick.'
        : 'Circuit open. The nail is just a nail. Clips fall.'),
      label('eq', 24, 40, 'No separate magnet — only a coil and a cell. Temporary magnet.'),
      rect('cell', { x: 40, y: 120, width: 50, height: 26, fill: '#fbbf24', rx: 4 }),
      line('coil', { x1: 90, y1: 133, x2: 220, y2: 133, stroke: '#334155', strokeWidth: 3 }),
      rect('nail', { x: 210, y: 90, width: 18, height: 90, fill: '#94a3b8', rx: 3 }),
      line('sw', { x1: 240, y1: 133, x2: on ? 300 : 280, y2: on ? 133 : 108, stroke: '#2563eb', strokeWidth: 3 }),
      line('back', { x1: 300, y1: 133, x2: 300, y2: 200, stroke: '#334155', strokeWidth: 3 }),
      line('back2', { x1: 300, y1: 200, x2: 40, y2: 200, stroke: '#334155', strokeWidth: 3 }),
      line('back3', { x1: 40, y1: 200, x2: 40, y2: 146, stroke: '#334155', strokeWidth: 3 }),
    ]
    for (let i = 0; i < clips; i++) {
      const stuck = on
      elements.push(
        circle(`clip-${i}`, {
          cx: stuck ? 219 : 360,
          cy: stuck ? 188 + (i % 4) * 10 : 160 + i * 14,
          r: 6,
          fill: '#64748b',
        })
      )
    }
    elements.push(label('tip', 24, 278, 'Book crane: wrap a nail, close the switch, pick up iron clips. Open — they drop.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, switch: sw, clips, holding: on ? clips : 0 },
      warnings: [],
      caption: 'Book electromagnet: nail + wire + cell + clips.',
    }
  },
}
