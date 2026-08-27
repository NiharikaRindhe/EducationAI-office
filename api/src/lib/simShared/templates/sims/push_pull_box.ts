// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, label, line, rect } from '../stage.js'

export const push_pull_box: SimFile = {
  id: 'push_pull_box',
  domain: 'physics',
  classBand: '8-8',
  ncertClass: 8,
  label: 'Push, pull, lift a box',
  description: 'A force is a push or a pull. Pedalling uphill is harder. Coming downhill, something pulls you even when you stop pedalling. No F = ma.',
  equations: ['force = a push or a pull'],
  keywords: ['force', 'push', 'pull', 'exploring forces', 'uphill', 'downhill', 'friction'],
  params: [
    choice('action', 'What you do', [
      { value: 0, label: 'push' },
      { value: 1, label: 'pull' },
      { value: 2, label: 'lift' },
    ], 0),
    choice('ground', 'The ground', [
      { value: 0, label: 'flat' },
      { value: 1, label: 'uphill' },
      { value: 2, label: 'downhill' },
    ], 0),
  ],
  schema: z.object({
    action: num(0, 2, 0),
    ground: num(0, 2, 0),
  }),
  run(params) {
    const action = Math.round(params.action)
    const ground = Math.round(params.ground)
    const names = ['Pushing the box', 'Pulling the box', 'Lifting the box']
    const floors = ['on flat ground', 'up the slope — harder', 'down the slope — something pulls you']
    const slope = ground === 1 ? -18 : ground === 2 ? 18 : 0
    const x0 = 180
    const y0 = 170
    const elements = [
      label('title', 24, 22, `${names[action]} ${floors[ground]}.`),
      label('eq', 24, 40, 'In science, that push or pull is called a force. No F = ma on this page.'),
      line('floor', { x1: 40, y1: 230 + slope * 0.3, x2: 460, y2: 230 - slope, stroke: '#475569', strokeWidth: 6 }),
      rect('box', { x: x0, y: y0, width: 90, height: 60, fill: '#fdba74', stroke: '#c2410c', strokeWidth: 2, rx: 4 }),
    ]
    if (action === 0) {
      elements.push(line('arr', { x1: x0 - 50, y1: 200, x2: x0 - 8, y2: 200, stroke: '#2563eb', strokeWidth: 5 }))
      elements.push(label('al', x0 - 70, 188, 'push'))
    } else if (action === 1) {
      elements.push(line('arr', { x1: x0 + 98, y1: 200, x2: x0 + 140, y2: 200, stroke: '#2563eb', strokeWidth: 5 }))
      elements.push(label('al', x0 + 110, 188, 'pull'))
    } else {
      elements.push(line('arr', { x1: 225, y1: y0 - 8, x2: 225, y2: y0 - 50, stroke: '#2563eb', strokeWidth: 5 }))
      elements.push(label('al', 200, y0 - 58, 'lift'))
    }
    if (ground === 2) {
      elements.push(label('g', 24, 268, 'Downhill: you are not pedalling, yet the bicycle speeds up — a pull toward the Earth.'))
    } else if (ground === 1) {
      elements.push(label('g', 24, 268, 'Uphill you push harder. The slope and the ground both matter.'))
    } else {
      elements.push(label('g', 24, 268, 'Book Activity 5.1: move a cardboard box — push, pull, lift.'))
    }
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { action, ground, name: ['push', 'pull', 'lift'][action] },
      warnings: [],
      caption: 'Book: force is a push or a pull.',
    }
  },
}
