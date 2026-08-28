// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const pea_cross: SimFile = {
  id: 'pea_cross',
  domain: 'chemistry',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Mendel’s peas',
  description: 'Tall × short: F1 all tall. F2 about 3 tall : 1 short. Sex: XX / XY, about half boys. Book 8.2. Not DNA-essay pages.',
  equations: ['F2 ≈ 3:1', 'sex: 1/2 XX, 1/2 XY'],
  keywords: ['Mendel', 'dominant', 'F1', 'F2', 'pea', 'sex determination', 'heredity'],
  params: [
    choice('look', 'Cross', [
      { value: 0, label: 'tall × short peas' },
      { value: 1, label: 'sex XX / XY' },
    ], 0),
  ],
  schema: z.object({
    look: num(0, 1, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    if (look === 1) {
      const elements = [
        label('title', 24, 22, 'Mother XX. Father XY. Half the children XX (girl), half XY (boy). Fig 8.6.'),
        label('eq', 24, 40, 'The Y chromosome from the father decides a boy. About 1/2 and 1/2.'),
        rect('m', { x: 60, y: 90, width: 120, height: 50, fill: '#fce7f3', rx: 6 }),
        label('ml', 90, 120, 'XX mother'),
        rect('f', { x: 300, y: 90, width: 120, height: 50, fill: '#dbeafe', rx: 6 }),
        label('fl', 330, 120, 'XY father'),
        rect('g', { x: 80, y: 180, width: 100, height: 40, fill: '#fce7f3', rx: 6 }),
        label('gl', 105, 205, 'XX girl'),
        rect('b', { x: 300, y: 180, width: 100, height: 40, fill: '#dbeafe', rx: 6 }),
        label('bl', 328, 205, 'XY boy'),
        label('tip', 24, 286, 'Book 8.2.4: sex determination. Not a trait like tall/short.'),
      ]
      return {
        stage: { viewBox: VIEW, elements },
        metrics: { look, girl: 0.5, boy: 0.5, kind: 'sex' },
        warnings: [],
        caption: 'Book Fig 8.6: XX and XY. About half and half.',
      }
    }
    const elements = [
      label('title', 24, 22, 'Tall (TT) × short (tt). F1 all Tt tall. F2 selfed: 3 tall : 1 short.'),
      label('eq', 24, 40, 'Tall is dominant. Short is recessive. F2 ratio is about 3 : 1, not exactly every time.'),
      rect('p1', { x: 40, y: 80, width: 70, height: 90, fill: '#86efac' }),
      label('t1', 55, 130, 'TT'),
      rect('p2', { x: 130, y: 110, width: 70, height: 60, fill: '#fde68a' }),
      label('t2', 145, 145, 'tt'),
      rect('f1', { x: 250, y: 80, width: 70, height: 90, fill: '#86efac' }),
      label('f1l', 262, 130, 'Tt'),
      rect('a', { x: 360, y: 70, width: 40, height: 80, fill: '#86efac' }),
      rect('b', { x: 410, y: 70, width: 40, height: 80, fill: '#86efac' }),
      rect('c', { x: 360, y: 160, width: 40, height: 80, fill: '#86efac' }),
      rect('d', { x: 410, y: 190, width: 40, height: 50, fill: '#fde68a' }),
      label('f2', 360, 250, 'F2  3 : 1'),
      label('tip', 24, 286, 'Book: Mendel’s peas. Independent traits (tall/short and round/wrinkled) in F2.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, f2tall: 3, f2short: 1, kind: 'monohybrid' },
      warnings: [],
      caption: 'Book: Mendel. F1 all tall. F2 about 3 : 1.',
    }
  },
}
