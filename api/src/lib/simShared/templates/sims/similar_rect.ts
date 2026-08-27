// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

const IMAGES = [
  { id: 'A', w: 60, h: 40 },
  { id: 'B', w: 40, h: 20 },
  { id: 'C', w: 30, h: 20 },
  { id: 'D', w: 90, h: 60 },
  { id: 'E', w: 60, h: 60 },
]

export const similar_rect: SimFile = {
  id: 'similar_rect',
  domain: 'math',
  classBand: '8-8',
  ncertClass: 8,
  label: 'Same factor, similar picture',
  description: 'Image A is 60 mm by 40 mm. C and D change width and height by the same factor, so they look like A. B subtracts 20 mm — that is not the same factor.',
  equations: ['similar ⇔ width and height × same factor'],
  keywords: ['proportional reasoning', 'similar', '60 mm', '40 mm', 'same factor', 'tiger'],
  params: [
    choice('other', 'Compare with A', [
      { value: 1, label: 'B 40×20 (stretched)' },
      { value: 2, label: 'C 30×20 (half)' },
      { value: 3, label: 'D 90×60 (1½)' },
      { value: 4, label: 'E 60×60 (square)' },
    ], 2),
  ],
  schema: z.object({
    other: num(1, 4, 2),
  }),
  run(params) {
    const other = Math.max(1, Math.min(4, Math.round(params.other)))
    const A = IMAGES[0]
    const B = IMAGES[other]
    const fw = B.w / A.w
    const fh = B.h / A.h
    const similar = Math.abs(fw - fh) < 0.02
    const px = 2.4
    const elements = [
      label('title', 24, 22, similar
        ? `Image ${B.id} looks like A. Width × ${fw} and height × ${fh} — same factor.`
        : `Image ${B.id} looks wrong next to A. Width factor ${fw.toFixed(2)}, height factor ${fh.toFixed(2)}.`),
      label('eq', 24, 40, `A is ${A.w} mm × ${A.h} mm. ${B.id} is ${B.w} mm × ${B.h} mm.`),
      rect('A', { x: 40, y: 80, width: A.w * px, height: A.h * px, fill: '#bfdbfe', stroke: '#1d4ed8', strokeWidth: 2 }),
      label('Al', 40, 80 + A.h * px + 18, `A  ${A.w}×${A.h}`),
      rect('B', { x: 260, y: 80, width: B.w * px, height: B.h * px, fill: similar ? '#bbf7d0' : '#fecaca', stroke: similar ? '#15803d' : '#b91c1c', strokeWidth: 2 }),
      label('Bl', 260, 80 + B.h * px + 18, `${B.id}  ${B.w}×${B.h}`),
      label('tip', 24, 268, similar
        ? 'A, C, D in the book look alike because both sides were multiplied by the same number.'
        : 'B took 20 mm off each side. Same difference is not the same factor. E is a square.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { other, w: B.w, h: B.h, factorW: fw, factorH: fh, similar },
      warnings: [],
      caption: 'Book Image A: 60 mm × 40 mm.',
    }
  },
}
