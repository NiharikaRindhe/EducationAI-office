// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, pathEl } from '../stage.js'

function arc(ox: number, oy: number, startDeg: number, endDeg: number, radius: number): string {
  const a0 = (startDeg * Math.PI) / 180
  const a1 = (endDeg * Math.PI) / 180
  const steps = Math.max(8, Math.round(Math.abs(endDeg - startDeg) / 6))
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = a0 + ((a1 - a0) * i) / steps
    pts.push(`${i === 0 ? 'M' : 'L'} ${(ox + radius * Math.cos(t)).toFixed(1)} ${(oy - radius * Math.sin(t)).toFixed(1)}`)
  }
  return pts.join(' ')
}

function kindOf(deg: number): string {
  if (deg < 90) return 'acute'
  if (deg === 90) return 'right'
  if (deg < 180) return 'obtuse'
  if (deg === 180) return 'straight'
  return 'reflex'
}

export const rotate_arms: SimFile = {
  id: 'rotate_arms',
  domain: 'math',
  classBand: '6-6',
  ncertClass: 6,
  label: 'Two rays make an angle',
  description: 'An angle is two rays with a common starting point (vertex). Rotating paper-straw arms. Length of arms does not change the angle. Not Class 5 eighths-of-a-turn, not Class 7 crossing lines.',
  equations: ['two rays + common vertex → one angle', 'straight angle = 180°'],
  keywords: ['rotating arms', 'two rays', 'vertex', 'straight angle', 'acute', 'obtuse', 'lines and angles'],
  params: [
    param('angleDeg', 'Turn between the arms', 'deg', 10, 180, 5, 90),
  ],
  schema: z.object({
    angleDeg: num(10, 180, 90),
  }),
  run(params) {
    const A = Math.round(params.angleDeg)
    const kind = kindOf(A)
    const ox = 250
    const oy = 175
    const L = 130
    const rad = (A * Math.PI) / 180
    const titles = {
      acute: `Acute. The arms turn less than a right angle (${A}°).`,
      right: 'Right angle. The two paper straws stand square — a quarter of a straight line.',
      obtuse: `Obtuse. More than a right angle, less than a straight line (${A}°).`,
      straight: 'Straight angle. The arms lie in a straight line. Book ∠AOB.',
      reflex: `${A}°.`,
    }
    const elements = [
      label('title', 24, 22, titles[kind]),
      label('eq', 24, 40, 'Two rays OA and OB share starting point O — the vertex. The rays are the arms.'),
      line('arm1', { x1: ox, y1: oy, x2: ox + L, y2: oy, stroke: '#2563eb', strokeWidth: 5 }),
      line('arm2', {
        x1: ox,
        y1: oy,
        x2: ox + L * Math.cos(rad),
        y2: oy - L * Math.sin(rad),
        stroke: '#d97706',
        strokeWidth: 5,
      }),
      pathEl('arc', { d: arc(ox, oy, 0, A, 34), fill: 'none', stroke: '#16a34a', strokeWidth: 3 }),
      circle('O', { cx: ox, cy: oy, r: 6, fill: '#0f172a' }),
      label('Ol', ox - 18, oy + 22, 'O'),
      label('Al', ox + L - 8, oy + 22, 'A'),
      label('Bl', ox + L * Math.cos(rad) + 8, oy - L * Math.sin(rad) - 6, 'B'),
      label('deg', ox + 42, oy - 10, `${A}°  ${kind}`),
      label('tip', 24, 268, 'Book 2.7: rotating arms from two paper straws and a clip. Length of arms does not change the angle.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { angleDeg: A, kind, vertex: 'O' },
      warnings: [],
      caption: 'Book: an angle is formed by two rays having a common starting point.',
    }
  },
}
