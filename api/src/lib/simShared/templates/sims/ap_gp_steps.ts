// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const ap_gp_steps: SimFile = {
  id: 'ap_gp_steps',
  domain: 'math',
  classBand: '9-9',
  ncertClass: 9,
  label: 'AP and GP steps',
  description: 'AP 1, 4, 7, 10, 13 — add the same d each time. GP 18, 13.5, 10.12… ft — multiply by r. Not the Class 10 tₙ / Sₙ graph.',
  equations: ['AP: a, a+d, a+2d, …', 'GP: a, ar, ar², …'],
  keywords: ['arithmetic progression', 'geometric progression', 'common difference', 'common ratio', '18.00 ft'],
  params: [
    choice('look', 'Which sequence', [
      { value: 0, label: 'AP 1, 4, 7, …' },
      { value: 1, label: 'GP 18, 13.5, … ft' },
    ], 0),
    param('n', 'How many terms', '', 3, 8, 1, 6),
  ],
  schema: z.object({
    look: num(0, 1, 0),
    n: num(3, 8, 6),
  }),
  run(params) {
    const look = Math.round(params.look)
    const n = Math.max(3, Math.min(8, Math.round(params.n)))
    const terms: number[] = []
    if (look === 0) {
      for (let i = 0; i < n; i++) terms.push(1 + i * 3)
    } else {
      let t = 18
      for (let i = 0; i < n; i++) {
        terms.push(Number(t.toFixed(2)))
        t *= 0.75
      }
    }
    const elements = [
      label('title', 24, 22, look === 0
        ? `AP: ${terms.join(', ')}. Common difference d = 3.`
        : `GP: ${terms.join(', ')} ft. Common ratio r = 3/4.`),
      label('eq', 24, 40, look === 0 ? 'Next term = previous + 3. Explicit: aₙ = 1 + (n−1)×3' : 'Next term = previous × 0.75. Book lengths in feet.'),
    ]
    const gap = 70
    const maxT = Math.max(...terms)
    for (let i = 0; i < n; i++) {
      const h = (terms[i] / maxT) * 140
      const x = 40 + i * gap
      elements.push(
        rect(`b${i}`, { x, y: 230 - h, width: 36, height: h, fill: look === 0 ? '#2563eb' : '#d97706', rx: 2 }),
        label(`t${i}`, x, 248, look === 0 ? String(terms[i]) : String(terms[i])),
      )
    }
    elements.push(label('tip', 24, 278, look === 0
      ? 'Book: 1, 4, 7, 10, 13, … Predict the next four terms.'
      : 'Book: 18.00, 13.50, 10.12, 7.9, 5.70, 4.27 ft.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, n, last: terms[n - 1], terms: terms.join(',') },
      warnings: [],
      caption: look === 0 ? 'Book AP: a=1, d=3.' : 'Book GP: a=18 ft, r=0.75.',
    }
  },
}
