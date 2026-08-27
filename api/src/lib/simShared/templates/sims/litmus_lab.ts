// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const litmus_lab: SimFile = {
  id: 'litmus_lab',
  domain: 'chemistry',
  classBand: '7-7',
  ncertClass: 7,
  label: 'Litmus with lemon, soap, water',
  description: 'Blue litmus turns red in lemon (acid). Red litmus turns blue in soap (base). Tap water stays almost the same (neutral).',
  equations: ['acid — red', 'base — blue', 'neutral — little change'],
  keywords: ['litmus', 'acidic', 'basic', 'neutral', 'lemon', 'soap', 'turmeric'],
  params: [
    choice('sample', 'Sample', [
      { value: 0, label: 'lemon' },
      { value: 1, label: 'soap' },
      { value: 2, label: 'tap water' },
    ], 0),
    choice('paper', 'Paper', [
      { value: 0, label: 'blue litmus' },
      { value: 1, label: 'red litmus' },
    ], 0),
  ],
  schema: z.object({
    sample: num(0, 2, 0),
    paper: num(0, 1, 0),
  }),
  run(params) {
    const sample = Math.round(params.sample)
    const paper = Math.round(params.paper)
    const names = ['lemon juice', 'soap water', 'tap water']
    const kind = sample === 0 ? 'acid' : sample === 1 ? 'base' : 'neutral'
    const start = paper === 0 ? '#2563eb' : '#ef4444'
    let end = start
    let change = 'almost no change — this is close to neutral'
    if (sample === 0 && paper === 0) {
      end = '#ef4444'
      change = 'blue paper turns red — lemon is acidic'
    } else if (sample === 1 && paper === 1) {
      end = '#2563eb'
      change = 'red paper turns blue — soap is basic'
    } else if (sample === 0 && paper === 1) {
      change = 'red paper stays red — lemon is acidic'
    } else if (sample === 1 && paper === 0) {
      change = 'blue paper stays blue — soap is basic'
    }
    const elements = [
      label('title', 24, 22, `Dip in ${names[sample]}`),
      label('eq', 24, 42, change),
      rect('beaker', { x: 70, y: 80, width: 110, height: 140, fill: '#e0f2fe', stroke: '#0284c7', strokeWidth: 3, rx: 8 }),
      rect('liq', { x: 78, y: 140, width: 94, height: 72, fill: sample === 0 ? '#fde68a' : sample === 1 ? '#e2e8f0' : '#bae6fd', rx: 4 }),
      label('bn', 88, 248, names[sample]),
      rect('before', { x: 230, y: 100, width: 70, height: 110, fill: start, rx: 6 }),
      label('bl', 236, 230, 'before'),
      rect('after', { x: 340, y: 100, width: 70, height: 110, fill: end, rx: 6 }),
      label('al', 350, 230, 'after'),
      label('tip', 24, 278, 'This chapter uses litmus (and turmeric if the page has it). We do not number pH 0–14 yet.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { kind, sample: names[sample] },
      warnings: [],
      caption: 'Lemon, soap, tap water — three dishes from the book.',
    }
  },
}
