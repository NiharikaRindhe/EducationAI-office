// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, pathEl } from '../stage.js'

export const blood_loop: SimFile = {
  id: 'blood_loop',
  domain: 'chemistry',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Two loops of blood',
  description: 'Double circulation: heart → lungs → heart → body → heart. Oxygen-rich and oxygen-poor blood stay apart. Book 5.4.1.',
  equations: ['right side → lungs', 'left side → body'],
  keywords: ['double circulation', 'heart', 'pulmonary', 'transportation in human beings', 'blood'],
  params: [
    choice('look', 'Follow', [
      { value: 0, label: 'lungs loop' },
      { value: 1, label: 'body loop' },
    ], 0),
  ],
  schema: z.object({
    look: num(0, 1, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    const elements = [
      label('title', 24, 22, look === 0
        ? 'Right heart sends blood to the lungs. It picks up oxygen and comes back to the left heart.'
        : 'Left heart sends oxygen-rich blood to the body. It returns poor in oxygen to the right heart.'),
      label('eq', 24, 40, 'Two loops. Blood goes through the heart twice in one full trip. That is double circulation.'),
      circle('heart', { cx: 250, cy: 160, r: 40, fill: '#fecaca', stroke: '#b91c1c', strokeWidth: 2 }),
      label('h', 232, 166, 'heart'),
      circle('lungs', { cx: 250, cy: 70, r: 28, fill: '#bae6fd' }),
      label('lu', 232, 76, 'lungs'),
      circle('body', { cx: 250, cy: 250, r: 28, fill: '#fde68a' }),
      label('bo', 236, 256, 'body'),
      pathEl('p1', { d: look === 0 ? 'M 250 120 Q 180 100 250 70' : 'M 250 200 Q 180 230 250 250', fill: 'none', stroke: look === 0 ? '#2563eb' : '#dc2626', strokeWidth: 3 }),
      pathEl('p2', { d: look === 0 ? 'M 250 70 Q 320 100 250 120' : 'M 250 250 Q 320 230 250 200', fill: 'none', stroke: look === 0 ? '#dc2626' : '#2563eb', strokeWidth: 3 }),
      label('tip', 24, 286, 'Book: four chambers. Valves stop back-flow. Arteries away, veins back.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, kind: look === 0 ? 'pulmonary' : 'systemic' },
      warnings: [],
      caption: 'Book: double circulation. Heart, lungs, body.',
    }
  },
}
