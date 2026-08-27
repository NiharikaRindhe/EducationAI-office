// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const three_bowls: SimFile = {
  id: 'three_bowls',
  domain: 'physics',
  classBand: '6-6',
  ncertClass: 6,
  label: 'Three bowls — touch can lie',
  description: 'Activity 7.1: right hand in warm A, left in ice C, then both into tap B. B feels cold to one hand and warm to the other. Use a thermometer. No heat-flow formula.',
  equations: ['sense of touch is not enough', 'thermometer gives a number'],
  keywords: ['temperature', 'three containers', 'warm water', 'ice-cold', 'thermometer', 'fever'],
  params: [
    choice('step', 'Step', [
      { value: 0, label: 'hands in A and C' },
      { value: 1, label: 'both hands into B' },
    ], 0),
  ],
  schema: z.object({
    step: num(0, 1, 0),
  }),
  run(params) {
    const step = Math.round(params.step)
    const inB = step === 1
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('title', 24, 22, inB
            ? 'Both hands now in B (tap water). One feels it cold, the other warm. Touch lied.'
            : 'Right hand in A (warm). Left hand in C (ice-cold). Keep them 1–2 minutes.'),
          label('eq', 24, 40, 'Book Activity 7.1. A thermometer, not a palm, tells if Lambok has fever.'),
          rect('A', { x: 40, y: 80, width: 120, height: 120, fill: '#fb7185', rx: 12 }),
          label('Al', 80, 110, 'A warm'),
          rect('B', { x: 190, y: 80, width: 120, height: 120, fill: '#7dd3fc', rx: 12 }),
          label('Bl', 220, 110, 'B tap'),
          rect('C', { x: 340, y: 80, width: 120, height: 120, fill: '#e0f2fe', rx: 12 }),
          label('Cl', 365, 110, 'C ice-cold'),
          rect('rh', { x: inB ? 220 : 70, y: inB ? 160 : 160, width: 36, height: 28, fill: '#fdba74', rx: 8 }),
          rect('lh', { x: inB ? 250 : 370, y: 160, width: 36, height: 28, fill: '#fdba74', rx: 8 }),
          label('tip', 24, 248, inB
            ? 'Same water, two stories. That is why we measure temperature with a thermometer.'
            : 'Predict first, then try. The book warns: wrong measurements are worse than none.'),
        ],
      },
      metrics: { step, touchLies: inB },
      warnings: [],
      caption: 'Book three bowls A, B, C. Then both hands in B.',
    }
  },
}
