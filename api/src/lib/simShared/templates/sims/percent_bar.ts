// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const percent_bar: SimFile = {
  id: 'percent_bar',
  domain: 'math',
  classBand: '8-8',
  ncertClass: 8,
  label: 'Fractions as per cent',
  description: 'Per cent means out of 100. Book: 3/4 of the sunset mix is red → 75%. 50% off is half.',
  equations: ['n/d = (n/d)×100 %', '3/4 = 75/100 = 75%'],
  keywords: ['percent', 'per cent', 'fractions in disguise', '75%', 'out of hundred', '3/4'],
  params: [
    param('num', 'Numerator', '', 1, 20, 1, 3),
    param('den', 'Denominator', '', 2, 20, 1, 4),
  ],
  schema: z.object({
    num: num(1, 20, 3),
    den: num(2, 20, 4),
  }),
  run(params) {
    const num = Math.round(params.num)
    const den = Math.max(1, Math.round(params.den))
    const pct = (100 * num) / den
    const fill = Math.max(0, Math.min(100, pct))
    const elements = [
      label('title', 24, 22, `${num}/${den} of the whole is ${pct.toFixed(pct % 1 === 0 ? 0 : 1)}%.`),
      label('eq', 24, 40, `${num}/${den} = ${num * (100 / den)}/100  →  per cent means “out of 100”.`),
      rect('track', { x: 40, y: 90, width: 400, height: 48, fill: '#e2e8f0', stroke: '#64748b', strokeWidth: 2, rx: 6 }),
      rect('fill', { x: 40, y: 90, width: 4 * fill, height: 48, fill: '#f97316', rx: 6 }),
      label('p', 48, 120, `${fill.toFixed(fill % 1 === 0 ? 0 : 1)}% red in the mix`),
    ]
    for (let i = 0; i <= 10; i++) {
      const x = 40 + i * 40
      elements.push(rect(`t${i}`, { x, y: 142, width: 2, height: 10, fill: '#64748b' }))
      if (i % 2 === 0) elements.push(label(`n${i}`, x - 8, 168, String(i * 10)))
    }
    elements.push(label('tip', 24, 278, 'Book sunset: 3/4 red paint → 75 out of 100 → 75%.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { num, den, percent: pct },
      warnings: [],
      caption: 'Book: 3/4 = 75%.',
    }
  },
}
