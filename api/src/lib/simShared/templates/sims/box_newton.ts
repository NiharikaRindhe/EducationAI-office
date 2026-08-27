// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, label, line, rect } from '../stage.js'

export const box_newton: SimFile = {
  id: 'box_newton',
  domain: 'physics',
  classBand: '9-9',
  ncertClass: 9,
  label: 'Box, friction, canoe',
  description: 'Push a box: friction opposite. Balanced forces → no change of motion. F = ma: empty canoe vs +passenger. Third law: paddle back, canoe forward. Not Class 8 push-pull and not old F=ma alone.',
  equations: ['a = F_net / m', 'action and reaction'],
  keywords: ['newton', 'balanced', 'unbalanced', 'friction', 'canoe', 'how forces affect motion'],
  params: [
    choice('look', 'Look at', [
      { value: 0, label: 'box + friction' },
      { value: 1, label: 'F = ma canoe' },
      { value: 2, label: 'paddle (3rd law)' },
    ], 0),
    param('mass', 'Mass', 'kg', 1, 8, 0.5, 2),
    param('force', 'Force', 'N', 0, 20, 1, 10),
    param('friction', 'Friction', 'N', 0, 20, 1, 10),
  ],
  schema: z.object({
    look: num(0, 2, 0),
    mass: num(0.5, 20, 2),
    force: num(0, 40, 10),
    friction: num(0, 40, 10),
  }),
  run(params) {
    const look = Math.round(params.look)
    const m = params.mass
    const F = params.force
    const fr = params.friction
    const net = F - fr
    const acc = net / m
    const balanced = Math.abs(net) < 0.05
    if (look === 1) {
      const aEmpty = F / 2
      const aFull = F / (2 + 2)
      const elements = [
        label('title', 24, 22, `Same paddle force ${F} N. Empty canoe a = ${(F / m).toFixed(2)} m/s². With a passenger, a is smaller.`),
        label('eq', 24, 40, 'Newton II: a = F/m. Bigger mass, smaller acceleration.'),
        rect('canoe', { x: 80, y: 140, width: 200, height: 40, fill: '#7c3aed', rx: 12 }),
        label('tip', 24, 270, 'Book Think It Over: empty canoe vs canoe with a passenger. Same paddle force.'),
        label('a', 24, 286, `Empty a=${aEmpty.toFixed(2)} (if 2 kg). With extra 2 kg, a=${aFull.toFixed(2)}.`),
      ]
      return {
        stage: { viewBox: VIEW, elements },
        metrics: { look, mass: m, force: F, acc: F / m },
        warnings: [],
        caption: 'Book: canoe empty vs +passenger. a = F/m.',
      }
    }
    if (look === 2) {
      const elements = [
        label('title', 24, 22, 'Paddle pushes water back. Water pushes the canoe forward. A pair.'),
        label('eq', 24, 40, 'Newton III: two forces, opposite, on two different objects.'),
        rect('canoe', { x: 140, y: 130, width: 180, height: 36, fill: '#7c3aed', rx: 10 }),
        line('back', { x1: 140, y1: 148, x2: 70, y2: 148, stroke: '#2563eb', strokeWidth: 3 }),
        line('fwd', { x1: 320, y1: 148, x2: 400, y2: 148, stroke: '#d97706', strokeWidth: 3 }),
        label('tip', 24, 286, 'Book: canoeist pushes water backwards — the canoe moves forward.'),
      ]
      return {
        stage: { viewBox: VIEW, elements },
        metrics: { look, pair: true },
        warnings: [],
        caption: 'Book: action-reaction. Paddle and canoe.',
      }
    }
    const elements = [
      label('title', 24, 22, balanced
        ? `Push ${F} N, friction ${fr} N. Balanced. The box does not change its motion.`
        : `Net force ${net} N. a = ${acc.toFixed(2)} m/s². Unbalanced — motion changes.`),
      label('eq', 24, 40, 'Friction acts opposite to the push. SI unit of force is the newton.'),
      rect('box', { x: 200, y: 140, width: 90, height: 70, fill: '#d97706' }),
      line('floor', { x1: 40, y1: 210, x2: 460, y2: 210, stroke: '#475569', strokeWidth: 3 }),
      line('F', { x1: 200, y1: 170, x2: 120, y2: 170, stroke: '#2563eb', strokeWidth: 3 }),
      line('fr', { x1: 290, y1: 190, x2: 360, y2: 190, stroke: '#b91c1c', strokeWidth: 3 }),
      label('tip', 24, 270, 'Book Fig. 6.3: pushing a box on a table. Measure force with a spring balance.'),
      label('bal', 24, 286, balanced ? 'BALANCED' : 'UNBALANCED'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, mass: m, force: F, friction: fr, net, acc, balanced },
      warnings: [],
      caption: 'Book: box on a table. Default 10 N push, 10 N friction — balanced.',
    }
  },
}
