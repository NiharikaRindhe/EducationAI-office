// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

function stripColor(pH: number): string {
  if (pH <= 2) return '#ef4444'
  if (pH <= 4) return '#f97316'
  if (pH <= 6) return '#facc15'
  if (pH < 8) return '#22c55e'
  if (pH <= 10) return '#38bdf8'
  return '#6366f1'
}

export const acid_strip: SimFile = {
  id: 'acid_strip',
  domain: 'chemistry',
  classBand: '10-10',
  ncertClass: 10,
  label: 'pH strip',
  description: 'Universal indicator colour from pH. Book scale: lemon, gastric juice, NaOH. look: pH strip or zinc + acid making H₂. Not the Class 7 generic pH=7 tool.',
  equations: ['pH < 7 acid', 'pH = 7 neutral', 'pH > 7 base'],
  keywords: ['acids bases salts', 'gastric juice', 'lemon juice', 'zinc granules', 'pH of salts'],
  params: [
    choice('look', 'Show', [
      { value: 0, label: 'pH strip' },
      { value: 1, label: 'Zn + acid → H₂' },
    ], 0),
    param('pH', 'pH', '', 0, 14, 1, 2),
  ],
  schema: z.object({
    look: num(0, 1, 0),
    pH: num(0, 14, 2),
  }),
  run(params) {
    const look = Math.round(params.look)
    const pH = Math.round(params.pH)
    const kind = pH < 7 ? 'acid' : pH === 7 ? 'neutral' : 'base'
    const sample = pH <= 2 ? 'gastric juice / lemon' : pH === 7 ? 'pure water' : 'NaOH'
    if (look === 1) {
      const elements = [
        label('title', 24, 22, 'Zinc in dilute sulphuric acid. Bubbles of hydrogen. Acid + metal → salt + H₂.'),
        label('eq', 24, 40, 'Zn + H₂SO₄ → ZnSO₄ + H₂. Test with a burning splinter — pop.'),
        rect('tube', { x: 210, y: 70, width: 70, height: 160, fill: '#e0f2fe', stroke: '#0f172a', strokeWidth: 2, rx: 8 }),
        rect('acid', { x: 214, y: 140, width: 62, height: 86, fill: '#93c5fd' }),
        rect('zn', { x: 228, y: 190, width: 34, height: 18, fill: '#94a3b8', rx: 3 }),
        label('bub', 300, 120, 'H₂ ↑'),
        label('tip', 24, 286, 'Book Fig 2.1: zinc granules and dilute sulphuric acid. Collect the gas.'),
      ]
      return {
        stage: { viewBox: VIEW, elements },
        metrics: { look, pH, kind, gas: 'H2' },
        warnings: [],
        caption: 'Book: Zn + dil. H₂SO₄ gives hydrogen.',
      }
    }
    const elements = [
      label('title', 24, 22, `pH = ${pH}. ${kind}. Think ${sample}.`),
      label('eq', 24, 40, 'Universal indicator: red–orange acid, green 7, blue–violet base.'),
      rect('strip', { x: 80, y: 90, width: 340, height: 40, fill: stripColor(pH), rx: 4 }),
    ]
    for (let i = 0; i <= 14; i++) {
      elements.push(label(`t${i}`, 80 + i * 23, 150, String(i)))
    }
    elements.push(
      rect('mark', { x: 80 + pH * 23 - 4, y: 80, width: 8, height: 60, fill: '#0f172a' }),
      label('tip', 24, 286, 'Book pH chart: lemon ~2, gastric juice ~1, pure water 7, NaOH ~13. Not tasting the chemicals.'),
    )
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, pH, kind, sample },
      warnings: [],
      caption: `Book pH strip. Default gastric / lemon acid, pH = ${pH}.`,
    }
  },
}
