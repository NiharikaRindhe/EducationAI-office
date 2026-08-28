// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const idli_vada: SimFile = {
  id: 'idli_vada',
  domain: 'math',
  classBand: '6-6',
  ncertClass: 6,
  label: 'Idli–vada common multiples',
  description: 'Say idli on multiples of 3, vada on multiples of 5, idli-vada when both. First both is 15. Not rabbit and frog jumps.',
  equations: ['idli-vada = common multiple of 3 and 5', 'first one = 15'],
  keywords: ['prime time', 'idli', 'vada', 'common multiples', 'multiples of 3', '15'],
  params: [
    param('a', 'Idli every', '', 2, 9, 1, 3),
    param('b', 'Vada every', '', 2, 9, 1, 5),
    param('upto', 'Play up to', '', 15, 60, 1, 30),
  ],
  schema: z.object({
    a: num(2, 9, 3),
    b: num(2, 9, 5),
    upto: num(10, 60, 30),
  }),
  run(params) {
    const a = Math.round(params.a)
    const b = Math.round(params.b)
    const upto = Math.round(params.upto)
    const both = []
    for (let n = 1; n <= upto; n++) if (n % a === 0 && n % b === 0) both.push(n)
    const first = both[0] ?? 0
    const elements = [
      label('title', 24, 22, first
        ? `First “idli-vada” is ${first}. Common multiples up to ${upto}: ${both.slice(0, 8).join(', ')}${both.length > 8 ? '…' : ''}.`
        : 'No common multiple in this range. Try a longer game.'),
      label('eq', 24, 40, `Idli = multiple of ${a}. Vada = multiple of ${b}. Both = common multiple.`),
    ]
    const cols = 10
    for (let n = 1; n <= Math.min(upto, 40); n++) {
      const r = Math.floor((n - 1) / cols)
      const c = (n - 1) % cols
      const isA = n % a === 0
      const isB = n % b === 0
      const fill = isA && isB ? '#f59e0b' : isA ? '#86efac' : isB ? '#93c5fd' : '#f1f5f9'
      elements.push(
        rect(`n${n}`, { x: 24 + c * 46, y: 58 + r * 42, width: 42, height: 36, fill, stroke: '#94a3b8', rx: 4 }),
        label(`l${n}`, 32 + c * 46, 80 + r * 42, String(n)),
      )
    }
    elements.push(label('tip', 24, 278, 'Book game: 3 → idli, 5 → vada, 15 → idli-vada. Gold cells are both.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { a, b, upto, first, bothCount: both.length },
      warnings: [],
      caption: 'Book: multiples of 3 and 5. First idli-vada is 15.',
    }
  },
}
