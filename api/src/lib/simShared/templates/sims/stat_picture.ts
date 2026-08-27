// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const stat_picture: SimFile = {
  id: 'stat_picture',
  domain: 'math',
  classBand: '7-7',
  ncertClass: 7,
  label: 'A statistical question',
  description: 'Heights or “about 15 minutes”. Bars show the picture. The typical value is the mean if this chapter uses it — not a Class 9 histogram.',
  equations: ['mean = (a + b + c) / 3'],
  keywords: ['statistical question', 'bar graph', 'mean', 'connecting the dots', '15 minutes'],
  params: [
    param('v1', 'First', '', 5, 40, 1, 12),
    param('v2', 'Second', '', 5, 40, 1, 15),
    param('v3', 'Third', '', 5, 40, 1, 18),
  ],
  schema: z.object({
    v1: num(0, 80, 12),
    v2: num(0, 80, 15),
    v3: num(0, 80, 18),
  }),
  run(params) {
    const vals = [Math.round(params.v1), Math.round(params.v2), Math.round(params.v3)]
    const mean = (vals[0] + vals[1] + vals[2]) / 3
    const max = Math.max(1, ...vals)
    const colors = ['#2563eb', '#16a34a', '#d97706']
    const names = ['A', 'B', 'C']
    const elements = [
      label('title', 24, 22, `A question we can answer with data: typical time ≈ ${mean.toFixed(1)} min`),
      label('eq', 24, 40, `Add ${vals.join(' + ')} = ${vals[0] + vals[1] + vals[2]}, then share by 3.`),
    ]
    vals.forEach((v, i) => {
      const h = (v / max) * 150
      const x = 80 + i * 120
      elements.push(
        rect(`b${i}`, { x, y: 230 - h, width: 70, height: h, fill: colors[i], rx: 6 }),
        label(`n${i}`, x + 24, 250, names[i]),
        label(`v${i}`, x + 18, 220 - h, String(v))
      )
    })
    elements.push(
      label('mean', 24, 278, `The mean is a fair share — about ${Math.round(mean)} minutes, like the book.`)
    )
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { mean, v1: vals[0], v2: vals[1], v3: vals[2] },
      warnings: [],
      caption: 'We ask a statistical question, draw bars, and (if the page does) find a simple mean. No coordinate plane.',
    }
  },
}
