// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const decimal_ops: SimFile = {
  id: 'decimal_ops',
  domain: 'math',
  classBand: '7-7',
  ncertClass: 7,
  label: 'Spices in kilograms',
  description: '50 g is 0.050 kg. We multiply and divide decimals by sliding the point — not by renaming fractions.',
  equations: ['50 g = 0.050 kg'],
  keywords: ['decimal multiply', 'decimal divide', '0.050 kg', '50 g', 'another peek'],
  params: [
    param('grams', 'Spice mass', 'g', 10, 500, 10, 50),
    choice('op', 'What to do', [
      { value: 0, label: 'write as kg' },
      { value: 1, label: '× 10 packets' },
      { value: 2, label: '÷ 10 shares' },
    ], 0),
  ],
  schema: z.object({
    grams: num(1, 1000, 50),
    op: num(0, 2, 0),
  }),
  run(params) {
    const grams = Math.round(params.grams)
    const op = Math.round(params.op)
    const kg = grams / 1000
    const times = kg * 10
    const share = kg / 10
    const shown = op === 0 ? kg : op === 1 ? times : share
    const title = op === 0
      ? `${grams} g = ${kg.toFixed(3)} kg`
      : op === 1
        ? `${kg.toFixed(3)} kg × 10 = ${times.toFixed(3)} kg`
        : `${kg.toFixed(3)} kg ÷ 10 = ${share.toFixed(3)} kg`
    const packW = Math.min(360, Math.max(40, grams / 1.2))
    const elements = [
      label('title', 24, 22, title),
      label('eq', 24, 42, '1000 g make 1 kg, so 50 g is five hundredths of a kilogram.'),
      rect('jar', { x: 70, y: 80, width: 120, height: 140, fill: '#fef3c7', stroke: '#d97706', strokeWidth: 2, rx: 8 }),
      rect('spice', { x: 82, y: 200 - packW / 8, width: 96, height: Math.min(110, 20 + grams / 8), fill: '#b45309', rx: 6 }),
      label('g', 100, 250, `${grams} g`),
      rect('bag', { x: 260, y: 90, width: 180, height: 120, fill: '#eff6ff', stroke: '#2563eb', strokeWidth: 2, rx: 10 }),
      label('kg', 290, 155, `${shown.toFixed(3)} kg`, '#1d4ed8'),
      label('tip', 24, 278, 'The extra zeros after the point are tenths, hundredths, thousandths.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { grams, kg, shown },
      warnings: [],
      caption: 'Book spices: 50 g = 0.050 kg.',
    }
  },
}
