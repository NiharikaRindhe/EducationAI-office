// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, line, rect } from '../stage.js'

export const pan_unknown: SimFile = {
  id: 'pan_unknown',
  domain: 'math',
  classBand: '7-7',
  ncertClass: 7,
  label: 'Unknown sacks on a pan',
  description: 'Two same sacks balance a 10 kg weight. Each sack is 5 kg. We find the unknown weight — we do not write ax + b = c.',
  equations: ['same sacks share the known weight equally'],
  keywords: ['finding the unknown', 'pan balance', 'sacks', 'unknown weight'],
  params: [
    param('sacks', 'Same sacks', '', 1, 6, 1, 2),
    param('known', 'Known weight', 'kg', 4, 30, 1, 10),
  ],
  schema: z.object({
    sacks: num(1, 8, 2),
    known: num(1, 40, 10),
  }),
  run(params) {
    const sacks = Math.max(1, Math.round(params.sacks))
    const known = Math.round(params.known)
    const each = known / sacks
    const whole = Number.isInteger(each)
    const elements = [
      label('title', 24, 22, `${sacks} same sacks balance ${known} kg`),
      label('eq', 24, 42, whole
        ? `Each sack is ${each} kg.`
        : `Each sack is ${each.toFixed(1)} kg.`),
      line('post', { x1: 250, y1: 70, x2: 250, y2: 130, stroke: '#64748b', strokeWidth: 5 }),
      line('beam', { x1: 80, y1: 130, x2: 420, y2: 130, stroke: '#94a3b8', strokeWidth: 6 }),
    ]
    for (let i = 0; i < sacks; i++) {
      elements.push(
        rect(`s${i}`, {
          x: 90 + i * 28,
          y: 150,
          width: 24,
          height: 36,
          fill: '#d97706',
          rx: 4,
        })
      )
    }
    elements.push(
      rect('w', { x: 340, y: 148, width: 56, height: 40, fill: '#38bdf8', rx: 4 }),
      label('wl', 348, 174, `${known}`),
      label('sl', 90, 210, 'sacks'),
      label('wr', 338, 210, 'known kg'),
      label('tip', 24, 268, 'The pans match, so the hidden weights share the known pile fairly. Not “solve for x”.'),
    )
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { sacks, known, eachSack: Number(each.toFixed(2)) },
      warnings: [],
      caption: 'Book idea: unknown sacks on one pan, known weights on the other.',
    }
  },
}
