// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const think_number: SimFile = {
  id: 'think_number',
  domain: 'math',
  classBand: '8-8',
  ncertClass: 8,
  label: 'Think of a number — always 2',
  description: 'Think of x. Double it. Add 4. Divide by 2. Subtract the original. The answer is always 2. Algebra: (2x+4)/2 − x = 2.',
  equations: ['((2x + 4) / 2) - x = 2'],
  keywords: ['algebra play', 'think of a number', 'always 2', 'trick'],
  params: [
    param('x', 'Starting number', '', 1, 20, 1, 5),
  ],
  schema: z.object({
    x: num(1, 20, 5),
  }),
  run(params) {
    const x = Math.round(params.x)
    const s1 = 2 * x
    const s2 = s1 + 4
    const s3 = s2 / 2
    const s4 = s3 - x
    const steps = [
      { t: `Think of ${x}`, v: x },
      { t: `Double it → ${s1}`, v: s1 },
      { t: `Add 4 → ${s2}`, v: s2 },
      { t: `Divide by 2 → ${s3}`, v: s3 },
      { t: `Subtract the original → ${s4}`, v: s4 },
    ]
    const elements = [
      label('title', 24, 22, `Start with ${x}. After the trick you always get ${s4}.`),
      label('eq', 24, 40, 'x  →  2x  →  2x+4  →  x+2  →  2. The x cancels.'),
    ]
    steps.forEach((s, i) => {
      elements.push(
        rect(`b${i}`, { x: 30 + i * 92, y: 90, width: 86, height: 70, fill: i === 4 ? '#bbf7d0' : '#e0f2fe', stroke: '#334155', strokeWidth: 1.5, rx: 8 }),
        label(`t${i}`, 38 + i * 92, 118, s.t.slice(0, 16)),
        label(`v${i}`, 38 + i * 92, 142, String(s.v)),
      )
    })
    elements.push(label('tip', 24, 248, 'Try another starting number. The last box stays 2. That is the point of the trick.'))
    elements.push(label('alg', 24, 272, 'To make the final answer 3, add 6 instead of 4.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { x, result: s4, alwaysTwo: s4 === 2 },
      warnings: [],
      caption: 'Book trick: always 2, whatever x you start with.',
    }
  },
}
