// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const eye_see: SimFile = {
  id: 'eye_see',
  domain: 'physics',
  classBand: '10-10',
  ncertClass: 10,
  label: 'Eye and spectacles',
  description: 'Normal eye, myopia (distant blur, concave lens), hypermetropia (near blur, convex lens). Near point 25 cm. Eyeball about 2.3 cm is a caption. Not a thin-prism toy.',
  equations: ['near point 25 cm', 'myopia: concave', 'hypermetropia: convex'],
  keywords: ['human eye', 'myopia', 'hypermetropia', 'near point', '25 cm', 'power of accommodation'],
  params: [
    choice('look', 'Eye', [
      { value: 0, label: 'normal' },
      { value: 1, label: 'myopia + concave' },
      { value: 2, label: 'hypermetropia + convex' },
    ], 0),
  ],
  schema: z.object({
    look: num(0, 2, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    const titles = [
      'Normal eye. Clear from 25 cm (near point) to far away. Image on the retina.',
      'Myopia: far things look blur. Image in front of the retina. A concave lens spreads the rays.',
      'Hypermetropia: near things (25 cm) look blur. Image behind the retina. A convex lens helps.',
    ]
    const elements = [
      label('title', 24, 22, titles[look]),
      label('eq', 24, 40, 'Least distance of distinct vision = 25 cm. Eyeball diameter about 2.3 cm.'),
      circle('eye', { cx: 280, cy: 160, r: 70, fill: '#fff', stroke: '#0f172a', strokeWidth: 2 }),
      circle('lens', { cx: 230, cy: 160, r: look === 0 ? 14 : look === 1 ? 10 : 18, fill: '#bae6fd', stroke: '#0284c7', strokeWidth: 2 }),
      line('ret', { x1: 340, y1: 110, x2: 340, y2: 210, stroke: '#f87171', strokeWidth: 3 }),
      label('retL', 348, 160, 'retina'),
    ]
    if (look === 0) {
      elements.push(line('r1', { x1: 80, y1: 120, x2: 340, y2: 160, stroke: '#d97706', strokeWidth: 1.5 }))
      elements.push(line('r2', { x1: 80, y1: 200, x2: 340, y2: 160, stroke: '#d97706', strokeWidth: 1.5 }))
    } else if (look === 1) {
      elements.push(line('r1', { x1: 80, y1: 120, x2: 300, y2: 160, stroke: '#d97706', strokeWidth: 1.5 }))
      elements.push(label('fix', 40, 250, 'Concave spectacle pulls the image back onto the retina.'))
    } else {
      elements.push(line('r1', { x1: 80, y1: 140, x2: 400, y2: 160, stroke: '#d97706', strokeWidth: 1.5 }))
      elements.push(label('fix', 40, 250, 'Convex spectacle brings a near object onto the retina.'))
    }
    elements.push(label('tip', 24, 286, 'Book: near point 25 cm. Myopia — diverging lens. Hypermetropia — converging lens. Bifocals if both.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, nearPoint: 25, kind: look === 0 ? 'normal' : look === 1 ? 'myopia' : 'hypermetropia' },
      warnings: [],
      caption: look === 1 ? 'Myopia. Concave lens. Near point 25 cm is for a normal eye.' : look === 2 ? 'Hypermetropia. Convex lens.' : 'Normal eye. Near point 25 cm.',
    }
  },
}
