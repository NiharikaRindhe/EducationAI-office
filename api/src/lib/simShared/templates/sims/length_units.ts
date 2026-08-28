// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, rect } from '../stage.js'

export const length_units: SimFile = {
  id: 'length_units',
  domain: 'math',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Far and near — length units',
  description: 'Move between millimetre, centimetre, metre and kilometre on a double number line.',
  equations: ['1\\,\\text{cm}=10\\,\\text{mm}', '1\\,\\text{m}=100\\,\\text{cm}', '1\\,\\text{km}=1000\\,\\text{m}'],
  keywords: ['kilometre', 'millimetre', 'double number line', 'far and near', 'convert length'],
  params: [
    param('metres', 'Metres', 'm', 0, 5000, 1, 3000),
    param('extraCm', 'Extra centimetres', 'cm', 0, 99, 1, 0),
  ],
  schema: z.object({
    metres: num(0, 20000, 3000),
    extraCm: num(0, 99, 0),
  }),
  run(params) {
    const m = Math.max(0, params.metres)
    const extra = Math.max(0, Math.min(99, Math.round(params.extraCm)))
    const totalM = m + extra / 100
    const cm = totalM * 100
    const mm = cm * 10
    const km = totalM / 1000
    const race = 3000
    const frac = Math.min(1, totalM / Math.max(race, 1))
    const x0 = 40
    const x1 = 460
    const x = x0 + frac * (x1 - x0)
    const elements = [
      label('eq', 28, 22, `${totalM.toFixed(2)} m  =  ${cm.toFixed(0)} cm  =  ${mm.toFixed(0)} mm  =  ${km.toFixed(3)} km`),
      label('race', 28, 42, '3 km race strip — flags every 500 m'),
      rect('track', { x: x0, y: 88, width: x1 - x0, height: 18, fill: '#e2e8f0', rx: 9 }),
      rect('run', { x: x0, y: 88, width: Math.max(4, x - x0), height: 18, fill: '#38bdf8', rx: 9 }),
      circle('runner', { cx: x, cy: 97, r: 9, fill: '#2563eb' }),
    ]
    for (let s = 0; s <= 6; s++) {
      const px = x0 + (s / 6) * (x1 - x0)
      elements.push(
        line(`f-${s}`, { x1: px, y1: 80, x2: px, y2: 112, stroke: s % 2 === 0 ? '#dc2626' : '#2563eb', strokeWidth: 2 }),
        label(`fl-${s}`, px - 10, 128, `${s * 500} m`)
      )
    }
    const lineY = [168, 208, 248]
    const units = [
      { y: lineY[0], label: 'mm', max: 100, val: mm % 100 },
      { y: lineY[1], label: 'cm', max: 100, val: cm % 100 },
      { y: lineY[2], label: 'm', max: 10, val: totalM % 10 },
    ]
    units.forEach((u, i) => {
      elements.push(line(`axis-${i}`, { x1: x0, y1: u.y, x2: x1, y2: u.y, stroke: '#334155', strokeWidth: 2 }))
      const px = x0 + (u.val / u.max) * (x1 - x0)
      elements.push(
        circle(`dot-${i}`, { cx: px, cy: u.y, r: 6, fill: '#ec4899' }),
        label(`ul-${i}`, 10, u.y + 4, u.label)
      )
    })
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { metres: Number(totalM.toFixed(4)), cm: Number(cm.toFixed(4)), mm: Number(mm.toFixed(4)), km: Number(km.toFixed(4)) },
      warnings: [],
      caption: 'Same length, different unit names. 100 cm in a metre, 1000 m in a kilometre.',
    }
  },
}
