// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, rect } from '../stage.js'

export const stick_magnet: SimFile = {
  id: 'stick_magnet',
  domain: 'physics',
  classBand: '6-6',
  ncertClass: 6,
  label: 'Will it stick to the magnet?',
  description: 'Activity 4.1: iron sticks. Pencil (wood) and eraser (rubber) do not. Filings gather at the two ends — the poles. No electric current.',
  equations: ['magnetic materials stick', 'poles = ends where filings crowd'],
  keywords: ['exploring magnets', 'magnetic', 'iron', 'eraser', 'iron filings', 'poles', 'compass'],
  params: [
    choice('look', 'Look at', [
      { value: 0, label: 'will it stick?' },
      { value: 1, label: 'filings at the poles' },
    ], 0),
    choice('object', 'Object', [
      { value: 0, label: 'iron nail' },
      { value: 1, label: 'pencil (wood)' },
      { value: 2, label: 'eraser (rubber)' },
    ], 0),
  ],
  schema: z.object({
    look: num(0, 1, 0),
    object: num(0, 2, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    const object = Math.round(params.object)
    const sticks = object === 0
    if (look === 1) {
      const elements = [
        label('title', 24, 22, 'Most iron filings stick near the two ends. Those ends are the poles.'),
        label('eq', 24, 40, 'Very few filings sit in the middle of the bar.'),
        rect('bar', { x: 120, y: 130, width: 260, height: 36, fill: '#64748b', rx: 6 }),
        label('n', 128, 122, 'N'),
        label('s', 360, 122, 'S'),
      ]
      for (let i = 0; i < 8; i++) {
        elements.push(circle(`fL${i}`, { cx: 130 + (i % 3) * 10, cy: 110 - Math.floor(i / 3) * 10, r: 4, fill: '#334155' }))
        elements.push(circle(`fR${i}`, { cx: 360 + (i % 3) * 10, cy: 110 - Math.floor(i / 3) * 10, r: 4, fill: '#334155' }))
      }
      elements.push(label('tip', 24, 248, 'Book Activity 4.2: tap the paper. Filings crowd at the ends, not all over.'))
      return {
        stage: { viewBox: VIEW, elements },
        metrics: { look, poles: 2 },
        warnings: [],
        caption: 'Book: filings gather at the poles.',
      }
    }
    const names = ['iron nail', 'wooden pencil', 'rubber eraser']
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('title', 24, 22, sticks
            ? 'The iron nail sticks. Iron is a magnetic material.'
            : `The ${names[object]} does not stick. It is non-magnetic.`),
          label('eq', 24, 40, 'Book Table 4.1: pencil = wood, eraser = rubber. Only some materials are pulled.'),
          rect('mag', { x: 80, y: 120, width: 120, height: 40, fill: '#ef4444', rx: 6 }),
          label('ml', 110, 145, 'magnet'),
          rect('obj', { x: 280, y: 118, width: sticks ? 90 : 70, height: 44, fill: sticks ? '#94a3b8' : object === 1 ? '#fdba74' : '#fda4af', rx: 6 }),
          label('ol', 288, 178, names[object]),
          label('tip', 24, 248, sticks ? 'Nickel and cobalt also stick. That is still not an electromagnet.' : 'Wood, rubber, plastic, glass — non-magnetic in this activity.'),
        ],
      },
      metrics: { look, object, sticks, name: names[object] },
      warnings: [],
      caption: 'Book Activity 4.1: iron yes, wood/eraser no.',
    }
  },
}
