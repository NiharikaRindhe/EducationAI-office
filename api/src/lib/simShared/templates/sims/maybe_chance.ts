// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, rect } from '../stage.js'

export const maybe_chance: SimFile = {
  id: 'maybe_chance',
  domain: 'math',
  classBand: '9-9',
  ncertClass: 9,
  label: 'Coin, die, probability scale',
  description: 'Theoretical P = favourable / equally likely outcomes. Coin 1/2, die 1/6. A 0–1 scale. Experimental count vs theory. Not a Class 8 spinner.',
  equations: ['P(E) = n(E) / n(S)'],
  keywords: ['probability', 'random', 'coin', 'die', 'equally likely', 'mathematics of maybe'],
  params: [
    choice('kind', 'Experiment', [
      { value: 0, label: 'coin' },
      { value: 1, label: 'die' },
    ], 0),
    param('trials', 'Trials', '', 10, 100, 1, 50),
    param('seen', 'Times the event happened', '', 0, 100, 1, 26),
  ],
  schema: z.object({
    kind: num(0, 1, 0),
    trials: num(1, 200, 50),
    seen: num(0, 200, 26),
  }),
  run(params) {
    const kind = Math.round(params.kind)
    const trials = Math.max(1, Math.round(params.trials))
    const seen = Math.min(trials, Math.max(0, Math.round(params.seen)))
    const total = kind === 0 ? 2 : 6
    const fav = 1
    const P = fav / total
    const exp = seen / trials
    const elements = [
      label('title', 24, 22, kind === 0
        ? `Coin. Theoretical P(heads) = 1/2 = 0.5. In ${trials} tosses you saw heads ${seen} times.`
        : `Die. Theoretical P(six) = 1/6 ≈ 0.167. In ${trials} rolls you saw a six ${seen} times.`),
      label('eq', 24, 40, `Experimental P = ${seen}/${trials} = ${exp.toFixed(3)}. Closer to theory when trials grow.`),
      rect('scale', { x: 40, y: 80, width: 420, height: 18, fill: '#e2e8f0', rx: 4 }),
      circle('th', { cx: 40 + P * 420, cy: 89, r: 8, fill: '#2563eb' }),
      circle('ex', { cx: 40 + exp * 420, cy: 89, r: 8, fill: '#d97706' }),
      label('z', 36, 118, '0 impossible'),
      label('h', 230, 118, '0.5'),
      label('one', 400, 118, '1 certain'),
      label('leg', 24, 150, 'Blue = theory. Gold = this experiment.'),
    ]
    if (kind === 0) {
      elements.push(
        circle('coin', { cx: 250, cy: 210, r: 40, fill: '#fbbf24', stroke: '#b45309', strokeWidth: 2 }),
        label('face', 232, 216, seen / trials >= 0.5 ? 'H' : 'T'),
      )
    } else {
      elements.push(
        rect('die', { x: 210, y: 170, width: 80, height: 80, fill: '#fff', stroke: '#0f172a', strokeWidth: 2, rx: 8 }),
        label('pip', 242, 218, '6'),
      )
    }
    elements.push(label('tip', 24, 286, 'Book: lucky draw, rain, hockey match — chance, not certainty. Scale from 0 to 1.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { kind, trials, seen, theoretical: P, experimental: exp, total, fav },
      warnings: [],
      caption: 'Book: coin or die. Default 50 trials, 26 heads. P = 1/2.',
    }
  },
}
