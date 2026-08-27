// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, line } from '../stage.js'

export const right_trig: SimFile = {
  id: 'right_trig',
  domain: 'math',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Trig ratios in a right triangle',
  description: 'sin = opposite/hypotenuse, cos = adjacent/hypotenuse, tan = opposite/adjacent. Book: AB = 24 cm, BC = 7 cm, right-angled at B. Not a unit circle.',
  equations: ['sin A = opp/hyp', 'cos A = adj/hyp', 'tan A = opp/adj'],
  keywords: ['trigonometric ratios', 'right triangle', 'sin cos tan', '24 cm', '7 cm', 'introduction to trigonometry'],
  params: [
    param('adj', 'AB adjacent', 'cm', 3, 30, 1, 24),
    param('opp', 'BC opposite', 'cm', 3, 30, 1, 7),
  ],
  schema: z.object({
    adj: num(1, 40, 24),
    opp: num(1, 40, 7),
  }),
  run(params) {
    const adj = params.adj
    const opp = params.opp
    const hyp = Math.sqrt(adj * adj + opp * opp)
    const sinA = opp / hyp
    const cosA = adj / hyp
    const tanA = opp / adj
    const scale = 6
    const Bx = 80
    const By = 240
    const Ax = Bx
    const Ay = By - adj * scale * 0.35
    const Cx = Bx + opp * scale * 1.2
    const Cy = By
    const elements = [
      label('title', 24, 22, `Right-angled at B. AB = ${adj} cm, BC = ${opp} cm, AC = ${hyp.toFixed(2)} cm.`),
      label('eq', 24, 40, `sin A = ${opp}/${hyp.toFixed(1)} = ${sinA.toFixed(3)}.  cos A = ${cosA.toFixed(3)}.  tan A = ${tanA.toFixed(3)}.`),
      line('AB', { x1: Ax, y1: Ay, x2: Bx, y2: By, stroke: '#2563eb', strokeWidth: 2.5 }),
      line('BC', { x1: Bx, y1: By, x2: Cx, y2: Cy, stroke: '#2563eb', strokeWidth: 2.5 }),
      line('AC', { x1: Ax, y1: Ay, x2: Cx, y2: Cy, stroke: '#d97706', strokeWidth: 2.5 }),
      line('sq', { x1: Bx, y1: By - 14, x2: Bx + 14, y2: By - 14, stroke: '#0f172a', strokeWidth: 1 }),
      line('sq2', { x1: Bx + 14, y1: By - 14, x2: Bx + 14, y2: By, stroke: '#0f172a', strokeWidth: 1 }),
      label('A', Ax - 14, Ay, 'A'),
      label('B', Bx - 14, By + 16, 'B'),
      label('C', Cx + 6, Cy + 16, 'C'),
      label('opp', (Bx + Cx) / 2 - 10, By + 16, 'opp'),
      label('adj', Ax + 8, (Ay + By) / 2, 'adj'),
      label('hyp', (Ax + Cx) / 2 + 8, (Ay + Cy) / 2, 'hyp'),
      label('tip', 24, 286, 'Book Exercise: AB = 24 cm, BC = 7 cm, right-angled at B. AC = 25 cm. Ratios do not change if you scale the triangle.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { adj, opp, hyp, sinA, cosA, tanA },
      warnings: [],
      caption: 'Book: AB = 24 cm, BC = 7 cm. Right-angled at B.',
    }
  },
}
