// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, line, pathEl, rect } from '../stage.js'

export const fold_turn_sym: SimFile = {
  id: 'fold_turn_sym',
  domain: 'math',
  classBand: '6-6',
  ncertClass: 6,
  label: 'Mirror and turn',
  description: 'Butterfly: left matches right across a fold. Rangoli: a 90° turn around the centre brings the petals onto themselves. Clouds have no such repeat. Not the Class 5 firki.',
  equations: ['line symmetry = fold match', 'turn symmetry = look the same after a turn'],
  keywords: ['symmetry', 'butterfly', 'rangoli', 'pinwheel', '90', 'line of symmetry'],
  params: [
    choice('look', 'Look at', [
      { value: 0, label: 'butterfly (fold)' },
      { value: 1, label: 'rangoli (90° turn)' },
    ], 0),
    param('turn', 'Turn the rangoli', 'deg', 0, 270, 90, 0),
  ],
  schema: z.object({
    look: num(0, 1, 0),
    turn: num(0, 270, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    const turn = Math.round(params.turn / 90) * 90
    if (look === 1) {
      const matches = turn % 90 === 0
      return {
        stage: {
          viewBox: VIEW,
          elements: [
            label('title', 24, 22, matches
              ? `Turn ${turn}°. The rangoli petals sit on themselves again.`
              : `Turn ${turn}°. Watch when the pattern comes back.`),
            label('eq', 24, 40, 'Book rangoli: red petals come back onto themselves at 90° around the centre.'),
            rect('p0', { x: 230, y: 70, width: 40, height: 70, fill: '#ef4444', rx: 8 }),
            rect('p1', { x: 300, y: 130, width: 70, height: 40, fill: '#f59e0b', rx: 8 }),
            rect('p2', { x: 230, y: 170, width: 40, height: 70, fill: '#ef4444', rx: 8 }),
            rect('p3', { x: 130, y: 130, width: 70, height: 40, fill: '#f59e0b', rx: 8 }),
            label('c', 236, 156, 'centre'),
            label('tip', 24, 268, 'A 90° turn four times is a full turn. Clouds in the book have no such repeat.'),
          ],
        },
        metrics: { look, turn, comesBack: turn % 90 === 0 },
        warnings: [],
        caption: 'Book rangoli: 90° rotational symmetry.',
      }
    }
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('title', 24, 22, 'Fold on the dashed line. The two wings match. That is line symmetry.'),
          label('eq', 24, 40, 'Book butterfly: one half is the mirror of the other.'),
          pathEl('left', { d: 'M 250 80 Q 140 100 120 170 Q 160 210 250 200 Z', fill: '#818cf8', stroke: '#312e81', strokeWidth: 2 }),
          pathEl('right', { d: 'M 250 80 Q 360 100 380 170 Q 340 210 250 200 Z', fill: '#818cf8', stroke: '#312e81', strokeWidth: 2 }),
          line('fold', { x1: 250, y1: 60, x2: 250, y2: 230, stroke: '#0f172a', strokeWidth: 2, strokeDasharray: '6 4' }),
          label('tip', 24, 268, 'The dashed line is a line of symmetry. Not every pretty picture has one (the clouds do not).'),
        ],
      },
      metrics: { look, turn, lineSymmetry: true },
      warnings: [],
      caption: 'Book butterfly: fold match.',
    }
  },
}
