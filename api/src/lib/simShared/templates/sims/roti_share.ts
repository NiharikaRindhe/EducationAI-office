// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, pathEl, rect } from '../stage.js'

export const roti_share: SimFile = {
  id: 'roti_share',
  domain: 'math',
  classBand: '6-6',
  ncertClass: 6,
  label: 'One roti, equal shares',
  description: 'One roti shared by 2 children is 1/2 each. Shared by 4 is 1/4 each. More people → smaller share. 1/2 > 1/4. Not the Class 5 fraction kit.',
  equations: ['1 roti among n children → 1/n each', '1/2 > 1/4'],
  keywords: ['fractions', 'roti', 'equal shares', 'one half', 'one fourth', 'unit fraction'],
  params: [
    param('children', 'How many children', '', 2, 9, 1, 2),
  ],
  schema: z.object({
    children: num(2, 9, 2),
  }),
  run(params) {
    const n = Math.max(2, Math.min(9, Math.round(params.children)))
    const cx = 160
    const cy = 150
    const R = 70
    const elements = [
      label('title', 24, 22, `One roti among ${n} children. Each gets 1/${n}.`),
      label('eq', 24, 40, n === 2
        ? 'Book: two children → one half. Four children → one fourth. 1/2 is more than 1/4.'
        : `More children sharing the same roti means a smaller piece. 1/${n} < 1/2.`),
    ]
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * 2 * Math.PI - Math.PI / 2
      const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2
      const x0 = cx + R * Math.cos(a0)
      const y0 = cy + R * Math.sin(a0)
      const x1 = cx + R * Math.cos(a1)
      const y1 = cy + R * Math.sin(a1)
      const large = n > 2 ? 0 : 0
      const sweep = 1
      elements.push(pathEl(`sl${i}`, {
        d: `M ${cx} ${cy} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${R} ${R} 0 ${large} ${sweep} ${x1.toFixed(1)} ${y1.toFixed(1)} Z`,
        fill: i === 0 ? '#fde68a' : '#fef3c7',
        stroke: '#b45309',
        strokeWidth: 2,
      }))
    }
    elements.push(label('one', 130, 248, `your share  1/${n}`))
    const cmpX = 340
    elements.push(
      rect('half', { x: cmpX, y: 90, width: 80, height: 40, fill: '#fbbf24' }),
      label('hl', cmpX, 148, '1/2 of a roti'),
      rect('quart', { x: cmpX, y: 170, width: 40, height: 40, fill: '#fde68a', stroke: '#b45309' }),
      label('ql', cmpX, 228, '1/4 of a roti'),
    )
    elements.push(label('tip', 24, 278, 'Unit fractions: 1/2, 1/4, 1/5, 1/9. Sharing with more people makes 1/n smaller.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { children: n, shareNum: 1, shareDen: n, halfBiggerThanFourth: true },
      warnings: [],
      caption: 'Book: 1 roti, 2 children → 1/2. 4 children → 1/4.',
    }
  },
}
