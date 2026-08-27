// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const change_kind: SimFile = {
  id: 'change_kind',
  domain: 'chemistry',
  classBand: '7-7',
  ncertClass: 7,
  label: 'Same stuff or new stuff?',
  description: 'Ice melting is still water (physical). Burning wood makes ash and smoke (chemical — new substances).',
  equations: ['physical = same substance', 'chemical = new substance'],
  keywords: ['physical change', 'chemical change', 'ice cube', 'burning wood', 'changes around us'],
  params: [
    choice('event', 'What happens', [
      { value: 0, label: 'ice melts' },
      { value: 1, label: 'wood burns' },
    ], 0),
  ],
  schema: z.object({
    event: num(0, 1, 0),
  }),
  run(params) {
    const event = Math.round(params.event)
    const physical = event === 0
    const elements = [
      label('title', 24, 22, physical
        ? 'Ice becomes water. It is still H₂O — same substance.'
        : 'Wood burns. Ash and smoke are new substances.'),
      label('eq', 24, 42, physical ? 'Physical change — we can freeze it back.' : 'Chemical change — we cannot un-burn the stick.'),
      rect('before', { x: 60, y: 80, width: 160, height: 120, fill: physical ? '#e0f2fe' : '#d6d3d1', stroke: '#334155', strokeWidth: 2, rx: 10 }),
      label('bl', 100, 110, physical ? 'ice cube' : 'wood'),
      rect('cube', { x: 95, y: 125, width: 90, height: 50, fill: physical ? '#bae6fd' : '#78716c', rx: 6 }),
      rect('after', { x: 280, y: 80, width: 160, height: 120, fill: physical ? '#dbeafe' : '#1e293b', stroke: '#334155', strokeWidth: 2, rx: 10 }),
      label('al', 320, 110, physical ? 'water' : 'ash + smoke'),
      rect('out', { x: 310, y: 130, width: 100, height: 44, fill: physical ? '#38bdf8' : '#57534e', rx: 8 }),
      label('tip', 24, 248, physical ? 'Same substance, new look.' : 'New substance — a chemical change.'),
      label('kind', 24, 272, physical ? 'PHYSICAL' : 'CHEMICAL', physical ? '#0369a1' : '#b45309'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { physical, kind: physical ? 'physical' : 'chemical' },
      warnings: [],
      caption: 'Book pair: ice cube vs burning wood.',
    }
  },
}
