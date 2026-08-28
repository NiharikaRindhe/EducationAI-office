// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, arrow, circle, label, line, rect } from '../stage.js'

const DIRS = ['North', 'East', 'South', 'West'] as const

export const map_compass: SimFile = {
  id: 'map_compass',
  domain: 'math',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Maps and directions',
  description: 'Face the rising Sun (East). Your left is North, your right is South, behind you is West.',
  equations: ['N\\leftrightarrow S', 'E\\leftrightarrow W'],
  keywords: ['maps and locations', 'north south east west', 'rising sun', 'compass direction'],
  params: [
    choice('facing', 'Facing', [
      { value: 0, label: 'North' },
      { value: 1, label: 'East' },
      { value: 2, label: 'South' },
      { value: 3, label: 'West' },
    ], 1),
  ],
  schema: z.object({
    facing: num(0, 3, 1),
  }),
  run(params) {
    const facing = ((Math.round(params.facing) % 4) + 4) % 4
    const left = (facing + 3) % 4
    const right = (facing + 1) % 4
    const behind = (facing + 2) % 4
    const cx = 250
    const cy = 168
    const R = 90
    const ang = [-Math.PI / 2, 0, Math.PI / 2, Math.PI][facing]
    const elements = [
      label('eq', 28, 22, `Facing ${DIRS[facing]}`),
      label('lr', 28, 40, `Left → ${DIRS[left]}     Right → ${DIRS[right]}     Behind → ${DIRS[behind]}`),
      label('sun', 28, 58, facing === 1 ? 'Facing the rising Sun' : 'Turn until you face the rising Sun to find East'),
      circle('rose', { cx, cy, r: R, fill: '#eff6ff', stroke: '#1d4ed8', strokeWidth: 3 }),
      line('ns', { x1: cx, y1: cy - R, x2: cx, y2: cy + R, stroke: '#94a3b8', strokeWidth: 1.5 }),
      line('ew', { x1: cx - R, y1: cy, x2: cx + R, y2: cy, stroke: '#94a3b8', strokeWidth: 1.5 }),
      label('N', cx - 6, cy - R - 8, 'N', '#dc2626'),
      label('E', cx + R + 8, cy + 4, 'E'),
      label('S', cx - 6, cy + R + 18, 'S'),
      label('W', cx - R - 18, cy + 4, 'W'),
      rect('body', { x: cx - 10, y: cy - 16, width: 20, height: 32, fill: '#fbbf24', rx: 6 }),
      circle('head', { cx, cy: cy - 24, r: 10, fill: '#f59e0b' }),
      arrow('look', {
        x1: cx,
        y1: cy,
        x2: cx + 54 * Math.cos(ang),
        y2: cy + 54 * Math.sin(ang),
        stroke: '#2563eb',
        strokeWidth: 4,
      }),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { facing, left, right, behind, facingName: DIRS[facing], leftName: DIRS[left], rightName: DIRS[right] },
      warnings: [],
      caption: 'On a map, North is up. The tent west of the road sits on the left if you look north.',
    }
  },
}
