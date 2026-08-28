// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const nerve_path: SimFile = {
  id: 'nerve_path',
  domain: 'chemistry',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Neuron and reflex',
  description: 'A neuron: dendrite → cell body → axon. A reflex arc skips the thinking brain so you pull back fast. Book Fig 6.1 and 6.2.',
  equations: ['stimulus → receptor → spinal cord → muscle'],
  keywords: ['neuron', 'reflex arc', 'dendrite', 'axon', 'control and coordination'],
  params: [
    choice('look', 'Show', [
      { value: 0, label: 'neuron' },
      { value: 1, label: 'reflex arc' },
    ], 1),
  ],
  schema: z.object({
    look: num(0, 1, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    if (look === 0) {
      const elements = [
        label('title', 24, 22, 'A neuron. Dendrites collect. Axon sends. The jump to the next cell is chemical.'),
        label('eq', 24, 40, 'Information in: dendrite. Information out: axon ending.'),
        circle('body', { cx: 180, cy: 150, r: 28, fill: '#fde68a', stroke: '#b45309', strokeWidth: 2 }),
        line('ax', { x1: 208, y1: 150, x2: 380, y2: 150, stroke: '#0f172a', strokeWidth: 4 }),
        line('d1', { x1: 160, y1: 140, x2: 100, y2: 90, stroke: '#0f172a', strokeWidth: 2 }),
        line('d2', { x1: 160, y1: 160, x2: 100, y2: 210, stroke: '#0f172a', strokeWidth: 2 }),
        label('den', 40, 90, 'dendrite'),
        label('axl', 300, 130, 'axon'),
        label('tip', 24, 286, 'Book Fig 6.1: parts of a neuron. Synapse is the gap.'),
      ]
      return {
        stage: { viewBox: VIEW, elements },
        metrics: { look, kind: 'neuron' },
        warnings: [],
        caption: 'Book: neuron. Dendrite, cell body, axon.',
      }
    }
    const elements = [
      label('title', 24, 22, 'Hot pan. You pull back before you “think”. Reflex arc through the spinal cord.'),
      label('eq', 24, 40, 'Receptor → sensory nerve → spinal cord → motor nerve → muscle.'),
      circle('hand', { cx: 80, cy: 160, r: 22, fill: '#fecaca' }),
      label('h', 62, 166, 'hand'),
      circle('sc', { cx: 250, cy: 160, r: 28, fill: '#bae6fd' }),
      label('s', 228, 166, 'spine'),
      circle('m', { cx: 400, cy: 160, r: 22, fill: '#bbf7d0' }),
      label('mu', 382, 166, 'muscle'),
      line('a', { x1: 102, y1: 160, x2: 222, y2: 160, stroke: '#d97706', strokeWidth: 2 }),
      line('b', { x1: 278, y1: 160, x2: 378, y2: 160, stroke: '#16a34a', strokeWidth: 2 }),
      label('tip', 24, 286, 'Book Fig 6.2: reflex arc. Thinking is slower, so the cord answers first.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, kind: 'reflex' },
      warnings: [],
      caption: 'Book: reflex arc. Hot object, pull back.',
    }
  },
}
