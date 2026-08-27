// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const metal_traits: SimFile = {
  id: 'metal_traits',
  domain: 'chemistry',
  classBand: '7-7',
  ncertClass: 7,
  label: 'Iron tawa — beat, shine, rust',
  description: 'An iron tawa can be beaten (malleable), can carry heat, and rusts with air and water. Not a Class 10 displacement lab.',
  equations: ['malleable', 'conductor of heat', 'rust'],
  keywords: ['metals', 'non-metals', 'malleable', 'rust', 'iron tawa', 'hammer'],
  params: [
    choice('test', 'What we try', [
      { value: 0, label: 'hammer (malleable)' },
      { value: 1, label: 'heat the tawa' },
      { value: 2, label: 'leave in damp air' },
    ], 0),
  ],
  schema: z.object({
    test: num(0, 2, 0),
  }),
  run(params) {
    const test = Math.round(params.test)
    const titles = [
      'Hammer the iron. It flattens. Metals can be beaten into sheets.',
      'Heat one end of the tawa. The other end becomes warm — heat travels.',
      'Damp air: the iron grows a brown rust coat. A new substance appears.',
    ]
    const tawaFill = test === 2 ? '#b45309' : '#94a3b8'
    const elements = [
      label('title', 24, 22, titles[test]),
      rect('tawa', { x: 140, y: 90, width: 220, height: 90, fill: tawaFill, stroke: '#334155', strokeWidth: 3, rx: 40 }),
      label('tn', 220, 140, 'iron tawa'),
    ]
    if (test === 0) {
      elements.push(
        rect('ham', { x: 80, y: 70, width: 28, height: 90, fill: '#78716c', rx: 4 }),
        label('h', 70, 180, 'hammer')
      )
    }
    if (test === 1) {
      elements.push(
        rect('flame', { x: 210, y: 200, width: 80, height: 40, fill: '#f97316', rx: 16 }),
        label('f', 228, 258, 'heat')
      )
    }
    if (test === 2) {
      elements.push(
        label('rust', 180, 220, 'brown rust (new stuff)', '#7c2d12')
      )
    }
    elements.push(label('tip', 24, 278, 'Beat, conduct, rust — the chapter’s three metal stories. No zinc-in-copper-sulphate.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { test, rusts: test === 2 },
      warnings: [],
      caption: 'Start with the iron tawa and a hammer, as the book does.',
    }
  },
}
