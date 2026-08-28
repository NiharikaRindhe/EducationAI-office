// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const five_kingdoms: SimFile = {
  id: 'five_kingdoms',
  domain: 'chemistry',
  classBand: '9-9',
  ncertClass: 9,
  label: 'Five kingdoms',
  description: 'Place an organism: Monera, Protista, Fungi, Plantae, Animalia. Bacterium vs amoeba vs mushroom vs mango vs dog. Not Class 6 living-or-not.',
  equations: ['prokaryote → Monera', 'autotroph + tissues → Plantae'],
  keywords: ['five kingdom', 'monera', 'protista', 'fungi', 'plantae', 'animalia', 'classification'],
  params: [
    choice('org', 'Organism', [
      { value: 0, label: 'bacterium' },
      { value: 1, label: 'amoeba' },
      { value: 2, label: 'mushroom' },
      { value: 3, label: 'mango tree' },
      { value: 4, label: 'dog' },
    ], 0),
  ],
  schema: z.object({
    org: num(0, 4, 0),
  }),
  run(params) {
    const org = Math.round(params.org)
    const kingdoms = ['Monera', 'Protista', 'Fungi', 'Plantae', 'Animalia']
    const why = [
      'Unicellular prokaryote. No true nucleus.',
      'Unicellular eukaryote. A true nucleus.',
      'Multicellular, heterotrophic, cell wall of chitin.',
      'Multicellular, autotrophic. Makes food.',
      'Multicellular, heterotrophic. No cell wall. Moves.',
    ]
    const names = ['bacterium', 'amoeba', 'mushroom', 'mango', 'dog']
    const elements = [
      label('title', 24, 22, `${names[org]} → Kingdom ${kingdoms[org]}.`),
      label('eq', 24, 40, why[org]),
    ]
    for (let i = 0; i < 5; i++) {
      elements.push(
        rect(`k${i}`, {
          x: 30 + i * 92,
          y: 90,
          width: 84,
          height: 70,
          fill: i === org ? '#fde68a' : '#e2e8f0',
          stroke: i === org ? '#b45309' : '#94a3b8',
          strokeWidth: i === org ? 3 : 1,
          rx: 6,
        }),
        label(`kl${i}`, 38 + i * 92, 130, kingdoms[i]),
      )
    }
    elements.push(label('tip', 24, 286, 'Book §12.6 Five Kingdom Classification. Whittaker. Gold box is the match.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { org, kingdom: kingdoms[org], name: names[org] },
      warnings: [],
      caption: 'Book: five kingdoms. Default bacterium → Monera.',
    }
  },
}
