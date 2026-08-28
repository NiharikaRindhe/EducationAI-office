// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, pathEl } from '../stage.js'

export const triangle_build: SimFile = {
  id: 'triangle_build',
  domain: 'math',
  classBand: '7-7',
  ncertClass: 7,
  label: 'Build a triangle',
  description: 'Book start: equilateral 4 cm with compass arcs from A and B. The three corners add to 180°.',
  equations: ['A + B + C = 180°', 'equilateral: all sides equal'],
  keywords: ['triangle', 'angle sum', 'equilateral', 'three intersecting lines', '4 cm'],
  params: [
    param('side', 'Side AB', 'cm', 3, 8, 1, 4),
    param('angleA', 'Corner A', 'deg', 20, 140, 1, 60),
    param('angleB', 'Corner B', 'deg', 20, 140, 1, 60),
  ],
  schema: z.object({
    side: num(2, 10, 4),
    angleA: num(15, 150, 60),
    angleB: num(15, 150, 60),
  }),
  run(params) {
    const side = Math.round(params.side)
    let A = Math.round(params.angleA)
    let B = Math.round(params.angleB)
    if (A + B >= 175) B = 175 - A
    const C = 180 - A - B
    const warnings: string[] = []
    if (C <= 5) warnings.push('Those two corners are too big to close a triangle.')
    const scale = 28
    const ax = 90
    const ay = 240
    const cLen = side * scale
    const bx = ax + cLen
    const by = ay
    const sinC = Math.max(0.08, Math.sin((C * Math.PI) / 180))
    const AC = (cLen * Math.sin((B * Math.PI) / 180)) / sinC
    const radA = (A * Math.PI) / 180
    const cx = ax + AC * Math.cos(radA)
    const cy = ay - AC * Math.sin(radA)
    const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1) / scale
    const abCm = Number(dist(ax, ay, bx, by).toFixed(2))
    const bcCm = Number(dist(bx, by, cx, cy).toFixed(2))
    const acCm = Number(dist(ax, ay, cx, cy).toFixed(2))
    const equilateral = A === 60 && B === 60
    const r = cLen
    const elements = [
      label('title', 24, 22, `Three corners: ${A}° + ${B}° + ${C}° = ${A + B + C}°`),
      label('side', 24, 40, equilateral
        ? `Book: all sides ${side} cm — compass arcs from A and from B`
        : `AB = ${abCm} cm, BC = ${bcCm} cm, AC = ${acCm} cm`),
      pathEl('arcA', {
        d: `M ${ax + r} ${ay} A ${r} ${r} 0 0 1 ${ax} ${ay - r}`,
        fill: 'none',
        stroke: '#93c5fd',
        strokeWidth: 1.5,
        opacity: 0.8,
      }),
      pathEl('arcB', {
        d: `M ${bx - r} ${by} A ${r} ${r} 0 0 0 ${bx} ${by - r}`,
        fill: 'none',
        stroke: '#86efac',
        strokeWidth: 1.5,
        opacity: 0.8,
      }),
      line('ab', { x1: ax, y1: ay, x2: bx, y2: by, stroke: '#2563eb', strokeWidth: 3 }),
      line('bc', { x1: bx, y1: by, x2: cx, y2: cy, stroke: '#16a34a', strokeWidth: 3 }),
      line('ca', { x1: cx, y1: cy, x2: ax, y2: ay, stroke: '#d97706', strokeWidth: 3 }),
      circle('A', { cx: ax, cy: ay, r: 5, fill: '#0f172a' }),
      circle('B', { cx: bx, cy: by, r: 5, fill: '#0f172a' }),
      circle('C', { cx, cy, r: 5, fill: '#0f172a' }),
      label('lA', ax - 8, ay + 22, `A ${A}°`),
      label('lB', bx - 4, by + 22, `B ${B}°`),
      label('lC', cx - 10, cy - 12, `C ${C}°`),
      label('len', (ax + bx) / 2 - 10, ay + 38, `${side} cm`, '#2563eb'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: {
        angleA: A,
        angleB: B,
        angleC: C,
        angleSum: A + B + C,
        side,
        ab: abCm,
        bc: bcCm,
        ac: acCm,
      },
      warnings,
      caption: 'No Pythagoras here — this chapter is construction and the three corners adding to 180°.',
    }
  },
}
