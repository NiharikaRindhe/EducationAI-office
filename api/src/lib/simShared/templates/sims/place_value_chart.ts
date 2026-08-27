// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

const PLACES = [
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

export const place_value_chart: SimFile = {
  id: 'place_value_chart',
  domain: 'math',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Indian place-value chart',
  description: 'Build a number with ten-thousands to ones. Tokens stack in each place.',
  equations: ['N = 10000a + 1000b + 100c + 10d + e'],
  keywords: ['place value', 'ten thousand', 'indian place value', 'TTh', 'number name'],
  params: [
    param('tenThousands', 'Ten thousands', '', 0, 9, 1, 1),
    param('thousands', 'Thousands', '', 0, 9, 1, 3),
    param('hundreds', 'Hundreds', '', 0, 9, 1, 5),
    param('tens', 'Tens', '', 0, 9, 1, 2),
    param('ones', 'Ones', '', 0, 9, 1, 0),
  ],
  schema: z.object({
    tenThousands: num(0, 9, 1),
    thousands: num(0, 9, 3),
    hundreds: num(0, 9, 5),
    tens: num(0, 9, 2),
    ones: num(0, 9, 0),
  }),
  run(params) {
    const digits = PLACES.map((p) => Math.max(0, Math.min(9, Math.round(params[p.key]))))
    const value = PLACES.reduce((s, p, i) => s + digits[i] * p.weight, 0)
    const colors = ['#2563eb', '#0ea5e9', '#16a34a', '#f59e0b', '#ec4899']
    const colW = 78
    const x0 = 48
    const baseY = 248
    const elements = [
      label('title', 28, 24, `Number = ${indianComma(value)}`),
      label('eq', 28, 42, PLACES.map((p, i) => `${digits[i]} × ${p.weight.toLocaleString('en-IN')}`).join('  +  ')),
    ]
    PLACES.forEach((p, i) => {
      const x = x0 + i * colW
      elements.push(
        rect(`col-${p.tag}`, {
          x,
          y: 58,
          width: 68,
          height: 196,
          fill: '#f8fafc',
          stroke: '#cbd5e1',
          strokeWidth: 1.5,
          rx: 8,
        })
      )
      const n = digits[i]
      for (let k = 0; k < n; k++) {
        elements.push(
          rect(`tok-${p.tag}-${k}`, {
            x: x + 10,
            y: baseY - 18 - k * 16,
            width: 48,
            height: 14,
            fill: colors[i],
            rx: 3,
          })
        )
      }
      elements.push(
        label(`d-${p.tag}`, x + 26, 78, String(n), colors[i]),
        label(`t-${p.tag}`, x + 16, 270, p.tag)
      )
    })
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { value, written: indianComma(value) },
      warnings: [],
      caption: 'Each column is a place. Ten tokens in Ones make 1 Ten.',
    }
  },
}
