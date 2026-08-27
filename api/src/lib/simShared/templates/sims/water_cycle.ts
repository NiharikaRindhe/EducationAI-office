// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, n, pathEl, tLoop } from '../stage.js'

export const water_cycle: SimFile = {
  id: 'water_cycle',
  domain: 'physics',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Water cycle',
  description: 'Heat turns water to vapour. Cool air makes clouds. Rain fills rivers and the sea again.',
  equations: ['\\text{liquid}\\leftrightarrow\\text{ice}\\leftrightarrow\\text{vapour}'],
  keywords: ['water cycle', 'evaporation', 'condensation', 'water vapour', 'essence of life'],
  params: [param('heat', 'Sun heat', '', 1, 10, 1, 6)],
  schema: z.object({
    heat: num(1, 10, 6),
  }),
  run(params) {
    const heat = Math.max(1, Math.min(10, params.heat))
    const period = Math.max(2.4, 8 - heat * 0.5)
    const t = tLoop(period + 0.4, period)
    const frac = `min(1, (${t}) / ${n(period)})`
    const seaY = 250
    const sunX = 80
    const cloudX = 300
    const dropX = `${n(320)} + 40 * sin((${t}) * 4)`
    const dropY = `90 + 140 * (${frac})`
    const vapourY = `${n(seaY - 20)} - 90 * (${frac})`
    const elements = [
      label('eq', 28, 22, 'Sun heats water → vapour rises → cools into cloud → rain'),
      label('h', 28, 40, `Stronger sun: water changes form faster (heat ${heat}/10)`),
      pathEl('sea', {
        d: 'M 20 250 C 80 230, 140 270, 220 250 C 300 230, 380 270, 490 248 L 490 300 L 20 300 Z',
        fill: '#38bdf8',
      }),
      circle('sun', { cx: sunX, cy: 70, r: 22 + heat, fill: '#fbbf24' }),
      circle('cloud1', { cx: cloudX, cy: 72, r: 22, fill: '#e2e8f0' }),
      circle('cloud2', { cx: cloudX + 28, cy: 68, r: 26, fill: '#cbd5e1' }),
      circle('cloud3', { cx: cloudX + 54, cy: 76, r: 18, fill: '#e2e8f0' }),
      circle(
        'vapour',
        { cx: 150, cy: { $expr: vapourY }, r: 6, fill: '#7dd3fc', opacity: 0.7 },
        'projectile'
      ),
      circle(
        'drop',
        { cx: { $expr: dropX }, cy: { $expr: dropY }, r: 5, fill: '#2563eb' },
        'projectile'
      ),
      label('evap', 120, 200, 'evaporation'),
      label('cond', 330, 50, 'condensation'),
      label('rain', 350, 140, 'rain'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { heat, cycleSeconds: Number(period.toFixed(2)) },
      warnings: [],
      caption: 'Ice, water and steam are the same water wearing different forms.',
    }
  },
}
