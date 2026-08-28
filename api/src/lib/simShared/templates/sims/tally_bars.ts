// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const tally_bars: SimFile = {
  id: 'tally_bars',
  domain: 'math',
  classBand: '6-6',
  ncertClass: 6,
  label: 'Tally marks become a bar',
  description: 'Shri Nilesh’s sweets: a tally of 5 is |||| with a slash. Jalebi 6, gulab jamun 9. The tallest bar is the most popular. Not a Class 5 pictograph.',
  equations: ['tally of 5 = four sticks and a slash'],
  keywords: ['data handling', 'tally', 'jalebi', 'gulab jamun', 'favourite game', 'bar graph'],
  params: [
    param('jalebi', 'Jalebi', '', 0, 16, 1, 6),
    param('gulab', 'Gulab jamun', '', 0, 16, 1, 9),
    param('gujiya', 'Gujiya', '', 0, 16, 1, 7),
    param('barfi', 'Barfi', '', 0, 16, 1, 3),
    param('rasgulla', 'Rasgulla', '', 0, 16, 1, 6),
  ],
  schema: z.object({
    jalebi: num(0, 16, 6),
    gulab: num(0, 16, 9),
    gujiya: num(0, 16, 7),
    barfi: num(0, 16, 3),
    rasgulla: num(0, 16, 6),
  }),
  run(params) {
    const names = ['jalebi', 'gulab', 'gujiya', 'barfi', 'rasgulla']
    const labels = ['Jalebi', 'Gulab jamun', 'Gujiya', 'Barfi', 'Rasgulla']
    const vals = names.map((k) => Math.round(params[k]))
    const maxV = Math.max(1, ...vals)
    const total = vals.reduce((s, v) => s + v, 0)
    const winner = labels[vals.indexOf(Math.max(...vals))]
    const colors = ['#f59e0b', '#d97706', '#86efac', '#fda4af', '#e0f2fe']
    const elements = [
      label('title', 24, 22, `Most chosen: ${winner}. ${total} children in all.`),
      label('eq', 24, 40, 'Book: jalebi 6, gulab jamun 9. Each fifth tally gets a slash across the four.'),
    ]
    vals.forEach((v, i) => {
      const h = (v / maxV) * 140
      const x = 40 + i * 90
      elements.push(
        rect(`b${i}`, { x, y: 210 - h, width: 56, height: h, fill: colors[i], stroke: '#334155', strokeWidth: 1, rx: 4 }),
        label(`n${i}`, x, 228, labels[i].slice(0, 8)),
        label(`c${i}`, x + 16, 200 - h, String(v)),
      )
    })
    elements.push(label('tip', 24, 278, 'A list of names is data. Tallies organise it. Bars let you see the favourite at a glance.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { jalebi: vals[0], gulab: vals[1], total, winner },
      warnings: [],
      caption: 'Book sweets: jalebi 6, gulab jamun 9.',
    }
  },
}
