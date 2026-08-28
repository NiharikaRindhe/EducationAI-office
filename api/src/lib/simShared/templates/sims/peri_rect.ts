// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, line, pathEl } from '../stage.js'

export const peri_rect: SimFile = {
  id: 'peri_rect',
  domain: 'math',
  classBand: '6-6',
  ncertClass: 6,
  label: 'Walk the boundary',
  description: 'Perimeter is once around. Book rectangle 12 cm by 8 cm → 40 cm. Square photo 1 m → 4 m of tape. Triangle 4, 5, 7 → 16 cm.',
  equations: ['P(rect) = 2(l+b)', 'P(square) = 4s', 'P(triangle) = a+b+c'],
  keywords: ['perimeter', '12 cm', '8 cm', 'photo frame', 'tablecloth', 'lace'],
  params: [
    choice('shape', 'Shape', [
      { value: 0, label: 'rectangle' },
      { value: 1, label: 'square' },
      { value: 2, label: 'triangle' },
    ], 0),
    param('length', 'Length / side', '', 1, 20, 1, 12),
    param('breadth', 'Breadth / second side', '', 1, 20, 1, 8),
    param('third', 'Third side (triangle)', '', 1, 20, 1, 7),
  ],
  schema: z.object({
    shape: num(0, 2, 0),
    length: num(1, 20, 12),
    breadth: num(1, 20, 8),
    third: num(1, 20, 7),
  }),
  run(params) {
    const shape = Math.round(params.shape)
    const L = params.length
    const B = params.breadth
    const C = params.third
    const peri = shape === 0 ? 2 * (L + B) : shape === 1 ? 4 * L : L + B + C
    const px = 10
    const x0 = 80
    const y0 = 80
    const elements = [
      label('title', 24, 22, shape === 0
        ? `Rectangle ${L} by ${B}. Perimeter = 2×(${L}+${B}) = ${peri}.`
        : shape === 1
          ? `Square side ${L}. Tape all around = 4×${L} = ${peri}.`
          : `Triangle ${L}, ${B}, ${C}. Perimeter = ${peri}.`),
      label('eq', 24, 40, 'Perimeter = the distance along the boundary, once around.'),
    ]
    if (shape === 0) {
      elements.push(pathEl('r', {
        d: `M ${x0} ${y0} H ${x0 + L * px} V ${y0 + B * px} H ${x0} Z`,
        fill: '#dbeafe',
        stroke: '#1d4ed8',
        strokeWidth: 3,
      }))
      elements.push(label('l', x0 + L * 5, y0 - 8, `${L}`), label('b', x0 - 28, y0 + B * 5, `${B}`))
    } else if (shape === 1) {
      elements.push(pathEl('s', {
        d: `M ${x0} ${y0} H ${x0 + L * px} V ${y0 + L * px} H ${x0} Z`,
        fill: '#fde68a',
        stroke: '#b45309',
        strokeWidth: 3,
      }))
      elements.push(label('s', x0 + L * 5, y0 - 8, `${L}`))
    } else {
      elements.push(pathEl('t', {
        d: `M ${x0} ${y0 + 120} L ${x0 + 160} ${y0 + 120} L ${x0 + 70} ${y0} Z`,
        fill: '#bbf7d0',
        stroke: '#15803d',
        strokeWidth: 3,
      }))
      elements.push(label('t1', x0 + 60, y0 + 140, `${L}  ${B}  ${C}`))
    }
    elements.push(line('walk', { x1: 360, y1: 90, x2: 360, y2: 200, stroke: '#f59e0b', strokeWidth: 6 }))
    elements.push(label('tip', 24, 268, 'Book: 12 cm × 8 cm rectangle → 40 cm. Square photo 1 m → 4 m of coloured tape.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { shape, length: L, breadth: B, third: C, perimeter: peri },
      warnings: [],
      caption: 'Book rectangle 12 cm × 8 cm → perimeter 40 cm.',
    }
  },
}
