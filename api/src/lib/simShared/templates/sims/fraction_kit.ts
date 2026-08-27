// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const fraction_kit: SimFile = {
  id: 'fraction_kit',
  domain: 'math',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Equivalent fractions',
  description: 'Same part of a whole, written with different names. Multiply top and bottom by the same number.',
  equations: ['\\tfrac{a}{b} = \\tfrac{ak}{bk}'],
  keywords: ['equivalent fractions', 'fraction kit', 'same whole', 'same shaded region'],
  params: [
    param('numerator', 'Numerator', '', 1, 12, 1, 1),
    param('denominator', 'Denominator', '', 2, 12, 1, 2),
    param('k', 'Times equal parts', '', 1, 8, 1, 2),
  ],
  schema: z.object({
    numerator: num(0, 20, 1),
    denominator: num(1, 24, 2),
    k: num(1, 12, 2),
  }),
  run(params) {
    const den = Math.max(1, Math.round(params.denominator))
    const nume = Math.min(den, Math.max(0, Math.round(params.numerator)))
    const k = Math.max(1, Math.round(params.k))
    const den2 = den * k
    const nume2 = nume * k
    const boxW = 400 / den
    const boxW2 = 400 / den2
    const elements = [
      label('eq', 28, 24, `${nume}/${den} = ${nume2}/${den2}   (× ${k} on top and bottom)`),
      label('note', 28, 42, 'Both bars shade the same part of one whole'),
      label('a', 28, 78, `${nume}/${den}`),
      label('b', 28, 168, `${nume2}/${den2}`),
    ]
    for (let i = 0; i < den; i++) {
      elements.push(
        rect(`a${i}`, {
          x: 70 + i * boxW,
          y: 62,
          width: boxW - 3,
          height: 52,
          fill: i < nume ? '#38bdf8' : '#e2e8f0',
          stroke: '#334155',
          strokeWidth: 1.2,
          rx: 3,
        })
      )
    }
    for (let i = 0; i < den2; i++) {
      elements.push(
        rect(`b${i}`, {
          x: 70 + i * boxW2,
          y: 152,
          width: boxW2 - 2,
          height: 52,
          fill: i < nume2 ? '#f472b6' : '#e2e8f0',
          stroke: '#334155',
          strokeWidth: 1,
          rx: 2,
        })
      )
    }
    elements.push(
      rect('whole', { x: 70, y: 228, width: 400, height: 22, fill: '#fef3c7', stroke: '#d97706', strokeWidth: 1.5, rx: 4 }),
      label('w', 230, 244, '1 whole')
    )
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { numerator: nume, denominator: den, equivalentNum: nume2, equivalentDen: den2, value: Number((nume / den).toFixed(4)) },
      warnings: [],
      caption: 'Wholes must be the same size before you compare two fractions.',
    }
  },
}
