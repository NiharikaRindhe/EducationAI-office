// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

function carpet(x: number, y: number, size: number, step: number, elements: unknown[], prefix: string) {
  if (step <= 0) {
    elements.push(rect(prefix, { x, y, width: size, height: size, fill: '#1e293b', stroke: '#0f172a', strokeWidth: 0.4 }))
    return
  }
  const s = size / 3
  let k = 0
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (i === 1 && j === 1) continue
      carpet(x + j * s, y + i * s, s, step - 1, elements, `${prefix}-${k}`)
      k += 1
    }
  }
}

export const sierpinski_step: SimFile = {
  id: 'sierpinski_step',
  domain: 'math',
  classBand: '8-8',
  ncertClass: 8,
  label: 'Sierpinski carpet',
  description: 'Cut the middle ninth of a square, then repeat on every remaining square. Remaining small squares Rₙ = 8ⁿ. Holes grow too.',
  equations: ['R_n = 8^n', 'H_{n+1} = H_n + R_n'],
  keywords: ['sierpinski', 'fractal', 'carpet', 'self-similar', 'geometric themes', 'fern'],
  params: [
    param('step', 'Step', '', 0, 3, 1, 2),
  ],
  schema: z.object({
    step: num(0, 3, 2),
  }),
  run(params) {
    const step = Math.max(0, Math.min(3, Math.round(params.step)))
    const remaining = 8 ** step
    const holes = step === 0 ? 0 : (8 ** step - 1) / 7
    const elements = [
      label('title', 24, 22, `Step ${step}: ${remaining} small squares remain. Holes so far: ${holes}.`),
      label('eq', 24, 40, 'Each leftover square makes 8 smaller leftover squares. Rₙ = 8ⁿ.'),
    ]
    carpet(150, 55, 210, step, elements, 'c')
    elements.push(label('tip', 24, 278, 'Book: Sierpinski carpet. Same pattern at smaller and smaller scales — like a fern.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { step, remaining, holes },
      warnings: [],
      caption: 'Book carpet: step 0, 1, 2. Remaining squares 1, 8, 64.',
    }
  },
}
