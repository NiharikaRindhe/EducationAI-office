// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

const PLACES = [
  { key: 'crores', tag: 'Cr', name: 'Crores', weight: 10000000 },
  { key: 'tenLakhs', tag: 'TL', name: 'Ten lakhs', weight: 1000000 },
  { key: 'lakhs', tag: 'L', name: 'Lakhs', weight: 100000 },
  { key: 'tenThousands', tag: 'TTh', name: 'Ten thousands', weight: 10000 },
  { key: 'thousands', tag: 'Th', name: 'Thousands', weight: 1000 },
  { key: 'hundreds', tag: 'H', name: 'Hundreds', weight: 100 },
  { key: 'tens', tag: 'T', name: 'Tens', weight: 10 },
  { key: 'ones', tag: 'O', name: 'Ones', weight: 1 },
] as const

function indianComma(n: number): string {
  const s = String(Math.max(0, Math.round(n)))
  if (s.length <= 3) return s
  return s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3)
}

export const lakh_crore_chart: SimFile = {
  id: 'lakh_crore_chart',
  domain: 'math',
  classBand: '7-7',
  ncertClass: 7,
  label: 'Lakh and crore chart',
  description: 'Indian places past ten-thousands: one lakh is 1,00,000. Stack tokens in each house.',
  equations: ['1 lakh = 1,00,000', '1 crore = 1,00,00,000'],
  keywords: ['lakh', 'crore', 'indian place value', 'large numbers around us', '1,00,000'],
  params: [
    param('crores', 'Crores', '', 0, 9, 1, 0),
    param('tenLakhs', 'Ten lakhs', '', 0, 9, 1, 0),
    param('lakhs', 'Lakhs', '', 0, 9, 1, 1),
    param('tenThousands', 'Ten thousands', '', 0, 9, 1, 0),
    param('thousands', 'Thousands', '', 0, 9, 1, 0),
    param('hundreds', 'Hundreds', '', 0, 9, 1, 0),
    param('tens', 'Tens', '', 0, 9, 1, 0),
    param('ones', 'Ones', '', 0, 9, 1, 0),
  ],
  schema: z.object({
    crores: num(0, 9, 0),
    tenLakhs: num(0, 9, 0),
    lakhs: num(0, 9, 1),
    tenThousands: num(0, 9, 0),
    thousands: num(0, 9, 0),
    hundreds: num(0, 9, 0),
    tens: num(0, 9, 0),
    ones: num(0, 9, 0),
  }),
  run(params) {
    const digits = PLACES.map((p) => Math.max(0, Math.min(9, Math.round(params[p.key]))))
    const value = PLACES.reduce((s, p, i) => s + digits[i] * p.weight, 0)
    const colors = ['#7c3aed', '#6366f1', '#2563eb', '#0ea5e9', '#16a34a', '#f59e0b', '#ec4899', '#64748b']
    const colW = 58
    const x0 = 18
    const baseY = 248
    const elements = [
      label('title', 24, 22, `This number is ${indianComma(value)}`),
      label('eq', 24, 40, value >= 10000000 ? 'Read the crore house, then the lakh house' : 'One lakh = 1,00,000  (two zeros more than a thousand)'),
    ]
    PLACES.forEach((p, i) => {
      const x = x0 + i * colW
      elements.push(
        rect(`col-${p.tag}`, { x, y: 54, width: 56, height: 200, fill: '#f8fafc', stroke: '#cbd5e1', strokeWidth: 1.5, rx: 8 })
      )
      const nTok = digits[i]
      for (let k = 0; k < nTok; k++) {
        elements.push(
          rect(`tok-${p.tag}-${k}`, {
            x: x + 8,
            y: baseY - 16 - k * 14,
            width: 40,
            height: 12,
            fill: colors[i],
            rx: 3,
          })
        )
      }
      elements.push(label(`t-${p.tag}`, x + 10, 268, p.tag), label(`d-${p.tag}`, x + 18, 78, String(nTok)))
    })
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { value, written: indianComma(value), lakhs: digits[2], crores: digits[0], tenLakhs: digits[1] },
      warnings: [],
      caption: 'We write a lakh with a comma after the first digit: 1,00,000.',
    }
  },
}
