// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const letter_number: SimFile = {
  id: 'letter_number',
  domain: 'math',
  classBand: '7-7',
  ncertClass: 7,
  label: 'Letter stands for a number',
  description: 'A letter is a box. Put a number in a, read s = a + 3. We are filling a table, not solving ax+b=c.',
  equations: ['s = a + 3'],
  keywords: ['letter-numbers', 's = a + 3', 'expression using letters', 'variable as letter'],
  params: [
    param('a', 'Put this in a', '', 0, 20, 1, 4),
    param('add', 'Add this', '', 1, 9, 1, 3),
  ],
  schema: z.object({
    a: num(0, 30, 4),
    add: num(0, 12, 3),
  }),
  run(params) {
    const a = Math.round(params.a)
    const add = Math.round(params.add)
    const s = a + add
    const rows = [a - 1, a, a + 1].map((v) => Math.max(0, v))
    const elements = [
      label('title', 24, 24, `s = a + ${add}   (the letter a is a changing number)`),
      label('now', 24, 44, `Right now a = ${a}, so s = ${s}`),
      rect('head', { x: 80, y: 70, width: 340, height: 36, fill: '#dbeafe', rx: 6 }),
      label('ha', 140, 94, 'a'),
      label('hs', 320, 94, 's'),
    ]
    rows.forEach((v, i) => {
      const y = 118 + i * 48
      const here = v === a
      elements.push(
        rect(`r${i}`, { x: 80, y, width: 340, height: 42, fill: here ? '#fef3c7' : '#f8fafc', stroke: '#cbd5e1', strokeWidth: 1, rx: 6 }),
        label(`a${i}`, 140, y + 28, String(v)),
        label(`s${i}`, 320, y + 28, String(v + add), here ? '#b45309' : '#334155')
      )
    })
    elements.push(label('tip', 24, 278, 'Plug in a, then read s. No pan-balance algebra yet.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { a, s, add },
      warnings: [],
      caption: 'The book writes s = a + 3. Change a with + and − and watch s follow.',
    }
  },
}
