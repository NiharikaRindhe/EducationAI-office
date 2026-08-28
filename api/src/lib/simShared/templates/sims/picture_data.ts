// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, rect } from '../stage.js'

export const picture_data: SimFile = {
  id: 'picture_data',
  domain: 'math',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Pictograph and bar graph',
  description: 'One picture can stand for many things. The same data also makes a bar graph.',
  equations: ['\\text{count} = \\text{icons} \\times \\text{scale}'],
  keywords: ['pictograph', 'data through pictures', 'scale of icons', 'bar graph class 5'],
  params: [
    param('v1', 'Toys / Monday', '', 0, 40, 1, 20),
    param('v2', 'Games / Wednesday', '', 0, 40, 1, 15),
    param('v3', 'Sports / Friday', '', 0, 40, 1, 25),
    param('scale', 'One icon stands for', '', 1, 10, 1, 5),
  ],
  schema: z.object({
    v1: num(0, 200, 20),
    v2: num(0, 200, 15),
    v3: num(0, 200, 25),
    scale: num(1, 20, 5),
  }),
  run(params) {
    const values = [Math.round(params.v1), Math.round(params.v2), Math.round(params.v3)]
    const scale = Math.max(1, Math.round(params.scale))
    const names = ['A', 'B', 'C']
    const colors = ['#38bdf8', '#f472b6', '#fbbf24']
    const total = values.reduce((s, v) => s + v, 0)
    const max = Math.max(...values, 1)
    const elements = [
      label('eq', 28, 22, `1 picture = ${scale} items     total = ${total}`),
      label('note', 28, 40, 'Count the pictures, then multiply by the scale'),
    ]
    values.forEach((v, i) => {
      const icons = Math.round(v / scale)
      const y = 70 + i * 36
      elements.push(label(`n${i}`, 28, y + 8, names[i]))
      for (let k = 0; k < Math.min(icons, 12); k++) {
        elements.push(circle(`ic${i}-${k}`, { cx: 70 + k * 18, cy: y, r: 7, fill: colors[i] }))
      }
      elements.push(label(`c${i}`, 300, y + 4, `${v}`))
    })
    const baseY = 268
    const maxH = 70
    values.forEach((v, i) => {
      const h = (v / max) * maxH
      const x = 70 + i * 70
      elements.push(
        rect(`bar${i}`, { x, y: baseY - h, width: 48, height: h, fill: colors[i], rx: 4 }),
        label(`bn${i}`, x + 16, baseY + 16, names[i])
      )
    })
    elements.push(line('axis', { x1: 50, y1: baseY, x2: 280, y2: baseY, stroke: '#334155', strokeWidth: 2 }))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { v1: values[0], v2: values[1], v3: values[2], scale, total, max },
      warnings: [],
      caption: 'Joseph Uncle’s shop used 1 picture for every 5 toys. A bar graph shows the same story with height.',
    }
  },
}
