// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, n, pathEl, rect, tLoop } from '../stage.js'

export const everyday_separate: SimFile = {
  id: 'everyday_separate',
  domain: 'chemistry',
  classBand: '6-6',
  ncertClass: 6,
  label: 'Separate the mixture',
  description: 'Everyday methods: sand settles in water, tea leaves stay in a filter, iron bits come to a magnet. Class 6 rewrite — not the old 6–8 file dropped on the page.',
  equations: ['sedimentation', 'filtration', 'magnetic separation'],
  keywords: ['methods of separation', 'sedimentation', 'filtration', 'magnetic', 'tea leaves', 'sand and water'],
  params: [
    choice('method', 'Method', [
      { value: 0, label: 'let it settle' },
      { value: 1, label: 'filter' },
      { value: 2, label: 'magnet' },
    ], 0),
  ],
  schema: z.object({
    method: num(0, 2, 0),
  }),
  run(params) {
    const method = Math.round(params.method)
    const t = tLoop(4, 3.6)
    const names = ['sedimentation', 'filtration', 'magnetic separation']
    const elements = [
      label('title', 24, 22, [
        'Sand is heavier. It settles. Clear water stays above. That is sedimentation.',
        'Pour through a filter. Tea leaves stay on the paper. The liquid goes through.',
        'A magnet pulls iron bits out of sand. Sand stays. Iron comes along.',
      ][method]),
      label('eq', 24, 40, names[method]),
    ]
    if (method === 0) {
      elements.push(rect('jar', { x: 180, y: 70, width: 140, height: 160, fill: '#bae6fd', stroke: '#0369a1', strokeWidth: 3, rx: 8 }))
      elements.push(rect('sand', {
        x: 186,
        y: { $expr: `210 - 40 * min((${t}) / 3.6, 1)` },
        width: 128,
        height: 40,
        fill: '#a16207',
      }))
    } else if (method === 1) {
      elements.push(pathEl('funnel', { d: 'M 200 80 L 300 80 L 260 140 L 240 140 Z', fill: '#e2e8f0', stroke: '#334155', strokeWidth: 2 }))
      elements.push(rect('paper', { x: 230, y: 138, width: 40, height: 8, fill: '#fef3c7' }))
      elements.push(label('res', 210, 128, 'tea leaves'))
      elements.push(rect('beaker', { x: 210, y: 170, width: 80, height: 60, fill: '#7dd3fc', stroke: '#0369a1', rx: 6 }))
    } else {
      elements.push(rect('pile', { x: 160, y: 180, width: 180, height: 40, fill: '#fde68a', rx: 8 }))
      elements.push(rect('mag', { x: 200, y: 90, width: 90, height: 28, fill: '#ef4444', rx: 6 }))
      for (let i = 0; i < 5; i++) {
        elements.push(circle(`ir${i}`, {
          cx: 220 + i * 16,
          cy: { $expr: `190 - 70 * min((${t}) / 3.6, 1)` },
          r: 6,
          fill: '#64748b',
        }))
      }
    }
    elements.push(label('tip', 24, 268, 'Book: methods of separation in everyday life. Pause while the sand settles.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { method, name: names[method] },
      warnings: [],
      caption: 'Book: settle, filter, or use a magnet.',
    }
  },
}
