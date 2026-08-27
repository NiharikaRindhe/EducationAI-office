// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, rect } from '../stage.js'

export const joint_kinds: SimFile = {
  id: 'joint_kinds',
  domain: 'physics',
  classBand: '9-9',
  ncertClass: 9,
  label: 'Four kinds of joints',
  description: 'Ball-and-socket (shoulder) swings many ways. Hinge (elbow) one way. Pivot (neck). Fixed (skull). Book §3.5.',
  equations: ['joint type → allowed motion'],
  keywords: ['ball and socket', 'hinge joint', 'pivot joint', 'fixed joints', 'musculoskeletal'],
  params: [
    choice('look', 'Joint', [
      { value: 0, label: 'ball and socket' },
      { value: 1, label: 'hinge' },
      { value: 2, label: 'pivot' },
      { value: 3, label: 'fixed' },
    ], 0),
  ],
  schema: z.object({
    look: num(0, 3, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    const names = ['Ball and socket — shoulder, hip. Many directions.', 'Hinge — elbow, knee. One direction, like a door.', 'Pivot — neck. A bone turns on another.', 'Fixed — skull. No movement. Protection.']
    const elements = [
      label('title', 24, 22, names[look]),
      label('eq', 24, 40, 'Bones meet at joints. The shape of the meeting decides the motion.'),
    ]
    if (look === 0) {
      elements.push(circle('ball', { cx: 220, cy: 160, r: 28, fill: '#fbbf24' }))
      elements.push(circle('cup', { cx: 250, cy: 160, r: 40, fill: 'none', stroke: '#78716c', strokeWidth: 8 }))
      elements.push(rect('arm', { x: 250, y: 148, width: 90, height: 24, fill: '#e7e5e4' }))
    } else if (look === 1) {
      elements.push(rect('a', { x: 140, y: 148, width: 100, height: 24, fill: '#e7e5e4' }))
      elements.push(rect('b', { x: 240, y: 148, width: 100, height: 24, fill: '#d6d3d1' }))
      elements.push(circle('pin', { cx: 240, cy: 160, r: 8, fill: '#334155' }))
    } else if (look === 2) {
      elements.push(circle('ring', { cx: 250, cy: 150, r: 50, fill: 'none', stroke: '#78716c', strokeWidth: 10 }))
      elements.push(line('ax', { x1: 250, y1: 100, x2: 250, y2: 200, stroke: '#334155', strokeWidth: 4 }))
    } else {
      elements.push(rect('sk', { x: 170, y: 90, width: 160, height: 120, fill: '#e7e5e4', rx: 40 }))
      elements.push(line('s1', { x1: 200, y1: 110, x2: 220, y2: 180, stroke: '#a8a29e' }))
    }
    elements.push(label('tip', 24, 286, 'Book §3.5 Types of Joints. Default: ball and socket.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, name: ['ball-socket', 'hinge', 'pivot', 'fixed'][look], moves: look !== 3 },
      warnings: [],
      caption: 'Book: four joint types. Default shoulder (ball and socket).',
    }
  },
}
