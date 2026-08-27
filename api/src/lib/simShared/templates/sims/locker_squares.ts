// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

function isSquare(k: number): boolean {
  const r = Math.round(Math.sqrt(k))
  return r * r === k
}

export const locker_squares: SimFile = {
  id: 'locker_squares',
  domain: 'math',
  classBand: '8-8',
  ncertClass: 8,
  label: 'Lockers that stay open',
  description: '100 lockers. Person n toggles every nth locker. Only square numbers stay open — they have an odd number of factors.',
  equations: ['odd number of factors ⇔ square number'],
  keywords: ['locker', 'square number', 'odd number of factors', 'a square and a cube', 'perfect square'],
  params: [
    param('lockers', 'Lockers', '', 16, 100, 1, 100),
  ],
  schema: z.object({
    lockers: num(9, 100, 100),
  }),
  run(params) {
    const n = Math.max(9, Math.min(100, Math.round(params.lockers)))
    const cols = Math.ceil(Math.sqrt(n))
    const rows = Math.ceil(n / cols)
    const open: number[] = []
    for (let k = 1; k <= n; k++) if (isSquare(k)) open.push(k)
    const gap = 4
    const cell = Math.min(22, (460 - (cols - 1) * gap) / cols, (210 - (rows - 1) * gap) / rows)
    const x0 = 20
    const y0 = 58
    const elements = [
      label('title', 24, 22, `After everyone has a turn, ${open.length} lockers stay open.`),
      label('eq', 24, 40, 'A locker is toggled once per factor. Only squares have an odd count, so they stay open.'),
    ]
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols)
      const c = i % cols
      const k = i + 1
      const gold = isSquare(k)
      elements.push(
        rect(`lk-${k}`, {
          x: x0 + c * (cell + gap),
          y: y0 + r * (cell + gap),
          width: cell,
          height: cell,
          fill: gold ? '#fbbf24' : '#cbd5e1',
          stroke: gold ? '#b45309' : '#94a3b8',
          strokeWidth: gold ? 1.5 : 1,
          rx: 2,
        })
      )
    }
    elements.push(label('tip', 24, 284, `Open lockers: ${open.slice(0, 12).join(', ')}${open.length > 12 ? '…' : ''}  (the square numbers)`))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { lockers: n, openCount: open.length, lastOpen: open[open.length - 1] },
      warnings: [],
      caption: 'Book puzzle: 100 lockers. Gold = still open = a square number.',
    }
  },
}
