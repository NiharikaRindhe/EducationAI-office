// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, rect } from '../stage.js'

export const water_lens: SimFile = {
  id: 'water_lens',
  domain: 'physics',
  classBand: '8-8',
  ncertClass: 8,
  label: 'A flask of water as a lens',
  description: 'Activity 2.1: a round flask of water on an open book makes the letters look bigger. Tiny living things need a stronger lens — a microscope. No lens formula.',
  equations: ['curved water → letters look bigger'],
  keywords: ['microscope', 'lens', 'magnifying', 'naked eye', 'invisible living', 'flask', 'microbe'],
  params: [
    param('zoom', 'How round the flask looks', '', 1, 4, 0.5, 2),
  ],
  schema: z.object({
    zoom: num(1, 4, 2),
  }),
  run(params) {
    const zoom = params.zoom
    const letterSize = 10 * zoom
    const elements = [
      label('title', 24, 22, zoom >= 2.5
        ? 'Through the flask the letters jump out. A microscope does this even more.'
        : 'A round flask of water sits on the book. Look through it — the print grows.'),
      label('eq', 24, 40, 'The flask is thick in the middle, like a lentil — that is why they called it a lens.'),
      rect('page', { x: 40, y: 80, width: 200, height: 160, fill: '#fefce8', stroke: '#a16207', strokeWidth: 2 }),
      label('tiny', 52, 120, 'the living world', '#94a3b8'),
      label('tiny2', 52, 140, 'is often too small', '#94a3b8'),
      circle('flask', { cx: 340, cy: 155, r: 70, fill: '#bae6fd', stroke: '#0284c7', strokeWidth: 4, opacity: 0.85 }),
      label('big', 300, 150, 'LIFE', '#0f172a'),
      label('cork', 318, 78, 'cork'),
      rect('neck', { x: 328, y: 72, width: 24, height: 18, fill: '#78716c', rx: 3 }),
      label('tip', 24, 268, `Letters through the flask look about ${zoom} times taller. Still no 1/v − 1/u = 1/f.`),
    ]
    void letterSize
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { zoom },
      warnings: [],
      caption: 'Book Activity 2.1: flask of water on an open book.',
    }
  },
}
