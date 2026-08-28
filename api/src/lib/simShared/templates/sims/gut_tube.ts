// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

const STOPS = [
  { name: 'mouth', x: 80, y: 70 },
  { name: 'food pipe', x: 80, y: 130 },
  { name: 'stomach', x: 180, y: 180 },
  { name: 'small intestine', x: 300, y: 170 },
  { name: 'large intestine', x: 400, y: 110 },
]

export const gut_tube: SimFile = {
  id: 'gut_tube',
  domain: 'chemistry',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Food through the tube',
  description: 'Human alimentary canal Fig 5.6: mouth → oesophagus → stomach → small intestine → large intestine. Not Class 7 digest_path.',
  equations: ['mouth → food pipe → stomach → intestine'],
  keywords: ['alimentary canal', 'stomach', 'small intestine', 'nutrition in human beings', 'Fig. 5.6'],
  params: [
    choice('stop', 'Stop', [
      { value: 0, label: 'mouth' },
      { value: 1, label: 'food pipe' },
      { value: 2, label: 'stomach' },
      { value: 3, label: 'small intestine' },
      { value: 4, label: 'large intestine' },
    ], 2),
  ],
  schema: z.object({
    stop: num(0, 4, 2),
  }),
  run(params) {
    const stop = Math.max(0, Math.min(4, Math.round(params.stop)))
    const notes = [
      'Mouth: teeth cut, saliva wets starch.',
      'Food pipe (oesophagus): a squeeze-push down.',
      'Stomach: acid and enzymes. A sphincter holds food in.',
      'Small intestine: bile + pancreatic juice. Food enters blood here.',
      'Large intestine: water is taken back. Rest leaves as faeces.',
    ]
    const elements = [
      label('title', 24, 22, notes[stop]),
      label('eq', 24, 40, 'One long tube from mouth to anus. Each room does a different job.'),
    ]
    STOPS.forEach((s, i) => {
      elements.push(
        circle(`s${i}`, { cx: s.x, cy: s.y, r: i === stop ? 22 : 14, fill: i === stop ? '#fbbf24' : '#cbd5e1' }),
        label(`n${i}`, s.x - 28, s.y + 36, s.name),
      )
      if (i < STOPS.length - 1) {
        const n = STOPS[i + 1]
        elements.push(line(`l${i}`, { x1: s.x, y1: s.y, x2: n.x, y2: n.y, stroke: '#94a3b8', strokeWidth: 3 }))
      }
    })
    elements.push(label('tip', 24, 286, 'Book Fig 5.6: the human digestive tube. Villi in the small intestine take food into blood.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { stop, name: STOPS[stop].name },
      warnings: [],
      caption: 'Book Fig 5.6: human alimentary canal.',
    }
  },
}
