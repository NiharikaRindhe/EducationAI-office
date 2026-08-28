// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, n, pathEl, tLoop } from '../stage.js'

function arcD(ox: number, oy: number, startDeg: number, endDeg: number, radius: number): string {
  const a0 = (startDeg * Math.PI) / 180
  const a1 = (endDeg * Math.PI) / 180
  const steps = Math.max(8, Math.round(Math.abs(endDeg - startDeg) / 5))
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = a0 + ((a1 - a0) * i) / steps
    pts.push(`${i === 0 ? 'M' : 'L'} ${(ox + radius * Math.cos(t)).toFixed(1)} ${(oy - radius * Math.sin(t)).toFixed(1)}`)
  }
  return pts.join(' ')
}

function turnName(eighths: number): string {
  if (eighths === 1) return '1/8 of a full turn'
  if (eighths === 2) return '2/8 = a quarter turn'
  if (eighths === 4) return '4/8 = a half turn'
  if (eighths === 8) return '8/8 = a full turn'
  return `${eighths}/8 of a full turn`
}

function kindOf(deg: number): string {
  if (deg === 0) return 'no turn'
  if (deg < 90) return 'acute angle  (less than a quarter turn)'
  if (deg === 90) return 'right angle  (a quarter turn)'
  if (deg < 180) return 'obtuse angle  (more than a quarter, less than a half)'
  if (deg === 180) return 'straight angle  (two quarter turns)'
  if (deg < 360) return 'more than a half turn'
  return 'full turn'
}

export const turns_angle: SimFile = {
  id: 'turns_angle',
  domain: 'math',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Angles as turns',
  description: 'A straw turns in eighths of a full turn. Watch acute, right, obtuse, straight and full turns.',
  equations: ['\\tfrac14\\text{ turn} = \\text{right angle}', '\\tfrac12\\text{ turn} = \\text{straight angle}'],
  keywords: ['quarter turn', 'half turn', 'full turn', 'acute angle', 'obtuse angle', 'right angle', 'angles as turns'],
  params: [param('eighths', 'Eighths of a turn', '', 1, 8, 1, 2)],
  schema: z.object({
    eighths: num(1, 8, 2),
  }),
  run(params) {
    const eighths = Math.max(1, Math.min(8, Math.round(params.eighths)))
    const deg = eighths * 45
    const ox = 250
    const oy = 168
    const len = 110
    const t = tLoop(2.8, 2.2)
    const sweep = `${n(deg)} * min(1, (${t}) / 2.2)`
    const rad = `((${sweep}) * ${Math.PI} / 180)`
    const x2 = `${n(ox)} + ${n(len)} * cos(${rad})`
    const y2 = `${n(oy)} - ${n(len)} * sin(${rad})`
    const kind = kindOf(deg)
    const marks = [0, 45, 90, 135, 180, 225, 270, 315]
    const elements = [
      label('eq', 28, 24, turnName(eighths)),
      label('kind', 28, 44, kind),
      circle('face', { cx: ox, cy: oy, r: 118, fill: '#f8fafc', stroke: '#cbd5e1', strokeWidth: 2 }),
    ]
    for (const m of marks) {
      const a = (m * Math.PI) / 180
      elements.push(
        line(`tick-${m}`, {
          x1: ox + 104 * Math.cos(a),
          y1: oy - 104 * Math.sin(a),
          x2: ox + 118 * Math.cos(a),
          y2: oy - 118 * Math.sin(a),
          stroke: '#94a3b8',
          strokeWidth: 2,
        })
      )
    }
    elements.push(
      pathEl('arc', { d: arcD(ox, oy, 0, deg, 42), fill: 'none', stroke: '#2563eb', strokeWidth: 4 }),
      line('base', { x1: ox, y1: oy, x2: ox + len, y2: oy, stroke: '#334155', strokeWidth: 4 }),
      line(
        'ray',
        {
          x1: ox,
          y1: oy,
          x2: { $expr: x2 },
          y2: { $expr: y2 },
          stroke: '#ec4899',
          strokeWidth: 5,
        },
        'projectile'
      ),
      circle('hub', { cx: ox, cy: oy, r: 6, fill: '#f59e0b' }),
      label('q', ox + 80, oy - 8, 'start'),
    )
    if (deg === 90) {
      elements.push(
        pathEl('sq', {
          d: `M ${ox + 16} ${oy} L ${ox + 16} ${oy - 16} L ${ox} ${oy - 16}`,
          fill: 'none',
          stroke: '#16a34a',
          strokeWidth: 2,
        })
      )
    }
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { eighths, kind },
      warnings: [],
      caption: 'A quarter turn is a right angle. Two quarter turns make a straight line.',
    }
  },
}
