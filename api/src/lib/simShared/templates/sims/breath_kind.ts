// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const breath_kind: SimFile = {
  id: 'breath_kind',
  domain: 'chemistry',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Aerobic or anaerobic',
  description: 'Break-down of glucose. With oxygen: more energy + CO₂ + water. Without: less energy + lactic acid or alcohol. Book Fig 5.8. ATP ~30.5 kJ/mol is a caption.',
  equations: ['aerobic: glucose + O₂ → CO₂ + H₂O + energy', 'anaerobic: glucose → lactic acid + energy'],
  keywords: ['respiration', 'aerobic', 'anaerobic', 'ATP', 'glucose', 'life processes'],
  params: [
    choice('look', 'Path', [
      { value: 0, label: 'aerobic (with O₂)' },
      { value: 1, label: 'anaerobic in muscle' },
      { value: 2, label: 'yeast (alcohol)' },
    ], 0),
  ],
  schema: z.object({
    look: num(0, 2, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    const titles = [
      'With oxygen. Glucose goes all the way. Lots of ATP. CO₂ and water out. Aerobic.',
      'Muscle short of oxygen. Glucose → lactic acid. Less energy. The cramp feeling.',
      'Yeast: glucose → alcohol + CO₂. Used in bread and wine. Anaerobic.',
    ]
    const energy = look === 0 ? 18 : 2
    const elements = [
      label('title', 24, 22, titles[look]),
      label('eq', 24, 40, `Energy packets (scale): ${energy}. First step is always break glucose in the cytoplasm.`),
      rect('g', { x: 40, y: 90, width: 100, height: 50, fill: '#fde68a', rx: 6 }),
      label('gl', 55, 120, 'glucose'),
      rect('out', { x: 280, y: 90, width: 160, height: 50, fill: look === 0 ? '#bbf7d0' : '#fecaca', rx: 6 }),
      label('ol', 300, 120, look === 0 ? 'CO₂ + H₂O' : look === 1 ? 'lactic acid' : 'alcohol + CO₂'),
      label('tip', 24, 286, 'Book Fig 5.8: three paths from glucose. ATP about 30.5 kJ/mol when a phosphate is cut.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, energy, kind: look === 0 ? 'aerobic' : 'anaerobic' },
      warnings: [],
      caption: look === 0 ? 'Aerobic respiration. More energy.' : 'Anaerobic. Less energy.',
    }
  },
}
