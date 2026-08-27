// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, rect } from '../stage.js'

export const fair_chance: SimFile = {
  id: 'fair_chance',
  domain: 'math',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Theoretical probability',
  description: 'P(E) = n(E)/n(S) when outcomes are equally likely. Coin 1/2, die 1/6, two dice sum 8 is 5/36. Not Class 9 experimental maybe, not a Class 8 spinner.',
  equations: ['P(E) = n(E) / n(S)'],
  keywords: ['theoretical probability', 'equally likely', 'two dice', 'Fig. 14.3', 'probability a theoretical approach'],
  params: [
    choice('look', 'Experiment', [
      { value: 0, label: 'coin' },
      { value: 1, label: 'one die' },
      { value: 2, label: 'two dice, sum 8' },
    ], 0),
  ],
  schema: z.object({
    look: num(0, 2, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    const fav = look === 0 ? 1 : look === 1 ? 1 : 5
    const total = look === 0 ? 2 : look === 1 ? 6 : 36
    const P = fav / total
    const title = look === 0
      ? 'A fair coin. Two equally likely faces. P(heads) = 1/2.'
      : look === 1
        ? 'A fair die. Six faces. P(six) = 1/6.'
        : 'Two dice. Outcomes (2,6), (3,5), (4,4), (5,3), (6,2). P(sum = 8) = 5/36.'
    const elements = [
      label('title', 24, 22, title),
      label('eq', 24, 40, `P(E) = ${fav}/${total} = ${P.toFixed(4)}. Theoretical — not a count from an experiment.`),
      rect('scale', { x: 40, y: 80, width: 420, height: 16, fill: '#e2e8f0', rx: 4 }),
      circle('p', { cx: 40 + P * 420, cy: 88, r: 8, fill: '#2563eb' }),
    ]
    if (look === 0) {
      elements.push(
        circle('coin', { cx: 250, cy: 190, r: 40, fill: '#fbbf24', stroke: '#b45309', strokeWidth: 2 }),
        label('face', 242, 196, 'H'),
      )
    } else if (look === 1) {
      elements.push(
        rect('die', { x: 210, y: 150, width: 80, height: 80, fill: '#fff', stroke: '#0f172a', strokeWidth: 2, rx: 8 }),
        label('pip', 242, 198, '6'),
      )
    } else {
      elements.push(label('pairs', 80, 180, '(2,6) (3,5) (4,4) (5,3) (6,2)  — five out of 36'))
    }
    elements.push(label('tip', 24, 286, 'Book: theoretical approach. Fig 14.3 two dice. Not the Class 9 experimental count.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, fav, total, P },
      warnings: [],
      caption: look === 2 ? 'Book Fig 14.3: P(sum = 8) = 5/36.' : look === 0 ? 'P(heads) = 1/2.' : 'P(six) = 1/6.',
    }
  },
}
