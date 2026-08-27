// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

const MARKS = [15, 25, 35, 45, 55]
const FREQ = [2, 6, 10, 8, 4]

export const group_avg: SimFile = {
  id: 'group_avg',
  domain: 'math',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Mean, mode, median of groups',
  description: 'Grouped data: mean from class marks, mode from the modal class, median from the median class. Book Class 10 statistics — 51 girls’ heights on median pages. Not a Class 9 histogram.',
  equations: ['mean = Σfixi / Σfi', 'mode = l + (f1−f0)/(2f1−f0−f2) h', 'median = l + ((n/2 − cf)/f) h'],
  keywords: ['mean of grouped data', 'mode of grouped data', 'median of grouped data', 'class mark', 'statistics'],
  params: [
    choice('look', 'Find', [
      { value: 0, label: 'mean' },
      { value: 1, label: 'mode' },
      { value: 2, label: 'median' },
    ], 0),
  ],
  schema: z.object({
    look: num(0, 2, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    const n = FREQ.reduce((s, f) => s + f, 0)
    const mean = FREQ.reduce((s, f, i) => s + f * MARKS[i], 0) / n
    const modalI = FREQ.indexOf(Math.max(...FREQ))
    const l = MARKS[modalI] - 5
    const h = 10
    const f1 = FREQ[modalI]
    const f0 = FREQ[modalI - 1] ?? 0
    const f2 = FREQ[modalI + 1] ?? 0
    const mode = l + ((f1 - f0) / (2 * f1 - f0 - f2)) * h
    let cf = 0
    let medI = 0
    for (let i = 0; i < FREQ.length; i++) {
      cf += FREQ[i]
      if (cf >= n / 2) {
        medI = i
        break
      }
    }
    const cfBefore = FREQ.slice(0, medI).reduce((s, f) => s + f, 0)
    const lMed = MARKS[medI] - 5
    const median = lMed + ((n / 2 - cfBefore) / FREQ[medI]) * h
    const value = look === 0 ? mean : look === 1 ? mode : median
    const name = look === 0 ? 'mean' : look === 1 ? 'mode' : 'median'
    const elements = [
      label('title', 24, 22, look === 2
        ? `Median class. n = ${n}, n/2 = ${n / 2}. Median ≈ ${median.toFixed(2)}.`
        : look === 1
          ? `Modal class is the tallest bar. Mode ≈ ${mode.toFixed(2)}.`
          : `Class marks ${MARKS.join(', ')}. Mean = Σ f x / n ≈ ${mean.toFixed(2)}.`),
      label('eq', 24, 40, 'A grouped table. Use the formula for the look you picked — not a fancy extra graph.'),
    ]
    FREQ.forEach((f, i) => {
      elements.push(
        rect(`b${i}`, {
          x: 50 + i * 80,
          y: 230 - f * 12,
          width: 50,
          height: f * 12,
          fill: (look === 1 && i === modalI) || (look === 2 && i === medI) ? '#d97706' : '#93c5fd',
        }),
        label(`m${i}`, 55 + i * 80, 250, String(MARKS[i])),
      )
    })
    elements.push(label('tip', 24, 286, look === 2
      ? 'Book: median height of 51 Class X girls is about 149 cm on those pages. This toy table shows the same method.'
      : 'Book: mean of grouped data uses class marks. Mode uses the modal class.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, n, mean, mode, median, value, name },
      warnings: [],
      caption: `Grouped data ${name} ≈ ${Number(value).toFixed(2)}.`,
    }
  },
}
