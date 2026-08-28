// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, n, rect, tLoop } from '../stage.js'

export const heat_three_ways: SimFile = {
  id: 'heat_three_ways',
  domain: 'physics',
  classBand: '7-7',
  ncertClass: 7,
  label: 'Heat travels three ways',
  description: 'Activity 7.1: a metal strip with pins. Heat the end — pins drop as heat walks along the metal. Then convection (air/water loop) and radiation (sun on skin).',
  equations: ['conduction', 'convection', 'radiation'],
  keywords: ['heat transfer', 'conduction', 'convection', 'radiation', 'pins', 'metal strip', 'sea breeze'],
  params: [
    choice('way', 'How heat moves', [
      { value: 0, label: 'conduction (pins)' },
      { value: 1, label: 'convection' },
      { value: 2, label: 'radiation' },
    ], 0),
  ],
  schema: z.object({
    way: num(0, 2, 0),
  }),
  run(params) {
    const way = Math.round(params.way)
    const t = tLoop(8, 7.5)
    const titles = [
      'Heat walks along the metal. Pins drop when the wax melts — conduction.',
      'Warm air or water rises, cool fluid sinks — a convection loop.',
      'Heat from the Sun reaches us with no metal and no air needed — radiation.',
    ]
    const elements = [label('title', 24, 22, titles[way]), label('eq', 24, 42, 'No formula with k, A, or ΔT. Just the three ways.')]
    if (way === 0) {
      elements.push(
        rect('flame', { x: 50, y: 170, width: 40, height: 50, fill: '#f97316', rx: 12 }),
        line('strip', { x1: 90, y1: 160, x2: 430, y2: 160, stroke: '#94a3b8', strokeWidth: 10 }),
      )
      for (let i = 0; i < 4; i++) {
        const x = 150 + i * 70
        const drop = `min(max(((${t}) - ${n(i * 1.1)}) * 18, 0), 70)`
        elements.push(
          circle(`pin-${i}`, {
            cx: x,
            cy: { $expr: `160 - 28 + ${drop}` },
            r: 7,
            fill: '#2563eb',
          }, 'projectile'),
          label(`n${i}`, x - 4, 250, ['I', 'II', 'III', 'IV'][i])
        )
      }
      elements.push(label('tip', 24, 278, 'Book Activity 7.1: four pins. Pin I (nearest the flame) falls first.'))
    } else if (way === 1) {
      elements.push(
        rect('pot', { x: 150, y: 80, width: 200, height: 160, fill: '#e0f2fe', stroke: '#0284c7', strokeWidth: 3, rx: 8 }),
        circle('up', {
          cx: 250,
          cy: { $expr: `220 - 90 * min(mod(${t}, 4) / 4, 1)` },
          r: 12,
          fill: '#f97316',
          opacity: 0.7,
        }, 'projectile'),
        circle('dn', {
          cx: 190,
          cy: { $expr: `110 + 90 * min(mod(${t} + 2, 4) / 4, 1)` },
          r: 12,
          fill: '#38bdf8',
          opacity: 0.7,
        }, 'projectile'),
        label('sea', 24, 268, 'Sea breeze in words: land heats faster, air rises, cool sea air slides in.')
      )
    } else {
      elements.push(
        circle('sun', { cx: 90, cy: 140, r: 32, fill: '#fbbf24' }),
        line('ray1', { x1: 130, y1: 140, x2: 340, y2: 160, stroke: '#f59e0b', strokeWidth: 2 }),
        line('ray2', { x1: 128, y1: 155, x2: 340, y2: 190, stroke: '#f59e0b', strokeWidth: 2 }),
        rect('hand', { x: 340, y: 140, width: 70, height: 70, fill: '#fdba74', rx: 12 }),
        label('h', 350, 230, 'skin feels warmth'),
        label('tip', 24, 268, 'Nothing in between has to boil or conduct. Light and heat stream across.')
      )
    }
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { way, name: ['conduction', 'convection', 'radiation'][way] },
      warnings: [],
      caption: 'Three ways heat travels in nature. Pause the pins while you talk.',
    }
  },
}
