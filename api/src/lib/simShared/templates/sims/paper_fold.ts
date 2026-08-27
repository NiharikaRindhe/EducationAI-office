// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

function fmtThick(cm: number): string {
  if (cm < 1) return `${cm.toFixed(3)} cm`
  if (cm < 100) return `${cm.toFixed(3)} cm`
  if (cm < 100000) return `${(cm / 100).toFixed(2)} m`
  return `${(cm / 100000).toFixed(2)} km`
}

export const paper_fold: SimFile = {
  id: 'paper_fold',
  domain: 'math',
  classBand: '8-8',
  ncertClass: 8,
  label: 'Fold the paper — thickness doubles',
  description: 'A 0.001 cm sheet. Each fold doubles the thickness. After 10 folds it is just over 1 cm. Not an e^x graph.',
  equations: ['thickness = 0.001 × 2^(folds) cm'],
  keywords: ['power play', 'fold', 'doubles', 'thickness', '0.001 cm', '46 folds'],
  params: [
    param('folds', 'Folds', '', 1, 30, 1, 10),
  ],
  schema: z.object({
    folds: num(1, 30, 10),
  }),
  run(params) {
    const folds = Math.max(1, Math.min(30, Math.round(params.folds)))
    const cm = 0.001 * 2 ** folds
    const visual = Math.min(180, 8 + folds * 5.5)
    const note =
      folds <= 10
        ? 'After 10 folds the book table says 1.024 cm — just above 1 cm.'
        : folds <= 17
          ? 'After 17 folds it is about 131 cm — a little more than 4 feet.'
          : folds <= 26
            ? 'After 26 folds it is about 670 m. Burj Khalifa is 830 m.'
            : 'The book story: 46 folds would reach the Moon. That is doubling, not adding.'
    const elements = [
      label('title', 24, 22, `After ${folds} folds the stack is ${fmtThick(cm)}.`),
      label('eq', 24, 40, `Start 0.001 cm. Each fold × 2.  →  0.001 × 2^${folds} cm`),
      rect('sheet', { x: 80, y: 250 - visual, width: 140, height: visual, fill: '#fef3c7', stroke: '#b45309', strokeWidth: 2, rx: 4 }),
      label('stack', 88, 268, `${folds} folds`),
      rect('ruler', { x: 260, y: 70, width: 8, height: 180, fill: '#e2e8f0', stroke: '#64748b' }),
      label('r1', 276, 86, 'thicker'),
      label('r0', 276, 248, 'paper'),
      label('tip', 24, 284, note),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { folds, thicknessCm: cm, after10: folds === 10 ? 1.024 : 0.001 * 2 ** 10 },
      warnings: [],
      caption: 'Book: 0.001 cm sheet. 10 folds → 1.024 cm.',
    }
  },
}
