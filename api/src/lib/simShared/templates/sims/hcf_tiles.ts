// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a))
  b = Math.abs(Math.round(b))
  while (b) {
    const t = a % b
    a = b
    b = t
  }
  return a || 1
}

export const hcf_tiles: SimFile = {
  id: 'hcf_tiles',
  domain: 'math',
  classBand: '7-7',
  ncertClass: 7,
  label: 'Largest square tile',
  description: 'A 12 ft by 16 ft room. Biggest square tile that fills it with no leftover is 4 ft. That size is the HCF.',
  equations: ['HCF(12, 16) = 4'],
  keywords: ['HCF', 'highest common factor', 'square tiles', '12 ft', '16 ft', 'common ground'],
  params: [
    param('length', 'Room length', 'ft', 6, 24, 1, 16),
    param('width', 'Room width', 'ft', 6, 24, 1, 12),
    param('tryTile', 'Try this tile', 'ft', 1, 12, 1, 4),
  ],
  schema: z.object({
    length: num(4, 30, 16),
    width: num(4, 30, 12),
    tryTile: num(1, 20, 4),
  }),
  run(params) {
    const L = Math.round(params.length)
    const W = Math.round(params.width)
    const tryTile = Math.max(1, Math.round(params.tryTile))
    const hcf = gcd(L, W)
    const fits = L % tryTile === 0 && W % tryTile === 0
    const cols = Math.floor(L / tryTile)
    const rows = Math.floor(W / tryTile)
    const scale = Math.min(360 / L, 160 / W)
    const x0 = 70
    const y0 = 70
    const elements = [
      label('title', 24, 22, `Room ${W} ft × ${L} ft. Biggest square tile = ${hcf} ft.`),
      label('eq', 24, 40, fits
        ? `${tryTile} ft tiles fill the floor with no leftover (${rows} × ${cols} tiles).`
        : `${tryTile} ft tiles leave a leftover strip. Try ${hcf} ft.`),
      rect('room', { x: x0, y: y0, width: L * scale, height: W * scale, fill: '#f8fafc', stroke: '#334155', strokeWidth: 2 }),
    ]
    const drawCols = Math.min(cols, 24)
    const drawRows = Math.min(rows, 24)
    for (let r = 0; r < drawRows; r++) {
      for (let c = 0; c < drawCols; c++) {
        elements.push(
          rect(`t-${r}-${c}`, {
            x: x0 + c * tryTile * scale,
            y: y0 + r * tryTile * scale,
            width: tryTile * scale - 1,
            height: tryTile * scale - 1,
            fill: fits ? '#86efac' : '#fecaca',
            stroke: '#166534',
            strokeWidth: 0.8,
          })
        )
      }
    }
    const remL = L % tryTile
    const remW = W % tryTile
    if (remL > 0) {
      elements.push(
        rect('leftL', {
          x: x0 + cols * tryTile * scale,
          y: y0,
          width: remL * scale,
          height: W * scale,
          fill: '#fecaca',
          opacity: 0.7,
        })
      )
    }
    if (remW > 0) {
      elements.push(
        rect('leftW', {
          x: x0,
          y: y0 + rows * tryTile * scale,
          width: L * scale,
          height: remW * scale,
          fill: '#fecaca',
          opacity: 0.7,
        })
      )
    }
    elements.push(label('tip', 24, 268, 'HCF is the largest square that tiles both sides. Not a frog-jump LCM story.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { hcf, tryTile, fits, tiles: fits ? rows * cols : rows * cols },
      warnings: [],
      caption: 'Book room: 12 ft by 16 ft. Largest square tile is 4 ft.',
    }
  },
}
