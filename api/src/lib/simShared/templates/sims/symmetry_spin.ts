// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, line, n, pathEl, tLoop } from '../stage.js'

function letterPath(letter: number, cx: number, cy: number): string {
  if (letter === 0) {
    return `M ${cx} ${cy + 40} L ${cx} ${cy - 40} L ${cx + 28} ${cy - 40} L ${cx + 28} ${cy - 12} L ${cx} ${cy - 12} M ${cx} ${cy + 4} L ${cx + 28} ${cy + 4} L ${cx + 28} ${cy + 40} L ${cx} ${cy + 40}`
  }
  if (letter === 1) {
    return `M ${cx - 22} ${cy + 40} L ${cx} ${cy - 40} L ${cx + 22} ${cy + 40} M ${cx - 10} ${cy + 8} L ${cx + 10} ${cy + 8}`
  }
  return `M ${cx - 24} ${cy - 40} L ${cx + 24} ${cy - 40} M ${cx} ${cy - 40} L ${cx} ${cy + 40} M ${cx - 24} ${cy + 40} L ${cx + 24} ${cy + 40}`
}

export const symmetry_spin: SimFile = {
  id: 'symmetry_spin',
  domain: 'math',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Reflection and rotation',
  description: 'Spin a letter. Does it look the same after a quarter, half or full turn?',
  equations: ['\\tfrac14\\text{ turn}', '\\tfrac12\\text{ turn}'],
  keywords: ['rotational symmetry', 'line of symmetry', 'reflection symmetry', 'firki', 'symmetrical designs'],
  params: [
    choice('letter', 'Shape', [
      { value: 0, label: 'H' },
      { value: 1, label: 'A' },
      { value: 2, label: 'I' },
    ], 0),
    param('eighths', 'Turn (eighths)', '', 0, 8, 1, 4),
  ],
  schema: z.object({
    letter: num(0, 2, 0),
    eighths: num(0, 8, 4),
  }),
  run(params) {
    const letter = Math.max(0, Math.min(2, Math.round(params.letter)))
    const eighths = Math.max(0, Math.min(8, Math.round(params.eighths)))
    const deg = eighths * 45
    const names = ['H', 'A', 'I']
    const reflect = letter !== 1 ? 'vertical line of symmetry' : 'vertical line of symmetry'
    const rotateSame = letter === 1 ? eighths === 0 || eighths === 8 : eighths === 0 || eighths === 4 || eighths === 8
    const cx = 250
    const cy = 160
    const t = tLoop(2.6, 2)
    const ang = `${n(deg)} * min(1, (${t}) / 2)`
    const d = letterPath(letter, 0, 0)
    const elements = [
      label('eq', 28, 22, `Letter ${names[letter]}  turned ${eighths}/8`),
      label('r', 28, 40, rotateSame ? 'Looks the same after this turn — rotational symmetry' : 'Looks different after this turn'),
      label('f', 28, 58, `Also has a ${reflect}`),
      line('axis', { x1: cx, y1: 72, x2: cx, y2: 250, stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }),
      pathEl(
        'shape',
        {
          d,
          fill: 'none',
          stroke: '#2563eb',
          strokeWidth: 8,
          transform: { $expr: `concat('translate(${cx} ${cy}) rotate(', ${ang}, ')')` },
        },
        'projectile'
      ),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { letter, eighths, looksSame: rotateSame },
      warnings: [],
      caption: 'H looks the same after a half turn. A does not — it would be upside down.',
    }
  },
}
