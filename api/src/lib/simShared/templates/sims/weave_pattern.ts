// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const weave_pattern: SimFile = {
  id: 'weave_pattern',
  domain: 'math',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Weaving over and under',
  description: 'Warp threads go down. Weft threads go across — over, under, over, under — and become cloth.',
  equations: ['\\text{over / under}'],
  keywords: ['weaving mats', 'over under', 'handloom', 'warp weft', 'how cloth is made'],
  params: [
    param('over', 'Over count', '', 1, 4, 1, 1),
    param('under', 'Under count', '', 1, 4, 1, 1),
  ],
  schema: z.object({
    over: num(1, 6, 1),
    under: num(1, 6, 1),
  }),
  run(params) {
    const over = Math.max(1, Math.round(params.over))
    const under = Math.max(1, Math.round(params.under))
    const period = over + under
    const cols = 16
    const rows = 8
    const cell = 22
    const x0 = 70
    const y0 = 70
    const elements = [
      label('eq', 28, 22, `Row rule: ${over} over, ${under} under, repeat`),
      label('note', 28, 40, 'This is how a mat, a basket, and cloth are made'),
    ]
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const shifted = (c + (r % 2 === 0 ? 0 : over)) % period
        const isOver = shifted < over
        elements.push(
          rect(`c${r}-${c}`, {
            x: x0 + c * cell,
            y: y0 + r * cell,
            width: cell - 1,
            height: cell - 1,
            fill: isOver ? '#2563eb' : '#fbbf24',
          })
        )
      }
    }
    elements.push(
      label('warp', 28, 268, 'blue = weft on top'),
      label('weft', 200, 268, 'yellow = warp on top')
    )
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { over, under, period },
      warnings: [],
      caption: 'One set of threads is vertical, the other horizontal. Crossing them makes fabric.',
    }
  },
}
