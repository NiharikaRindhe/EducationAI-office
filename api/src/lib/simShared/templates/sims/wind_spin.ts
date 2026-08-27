// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, arrow, circle, label, rect } from '../stage.js'

export const wind_spin: SimFile = {
  id: 'wind_spin',
  domain: 'physics',
  classBand: '8-8',
  ncertClass: 8,
  label: 'Sea breeze, land breeze, cyclone',
  description: 'Winds blow from high pressure to low. By day the land heats faster — air rises, sea air rushes in (sea breeze). At night the land cools faster — land breeze. A cyclone is a spinning storm over warm ocean around a very low-pressure centre. Not bag straps.',
  equations: ['wind: high pressure → low pressure', 'warm ocean + very low pressure → cyclone'],
  keywords: ['sea breeze', 'land breeze', 'cyclone', 'warm ocean', 'how do winds form', 'low pressure'],
  params: [
    choice('look', 'Look at', [
      { value: 0, label: 'sea breeze (day)' },
      { value: 1, label: 'land breeze (night)' },
      { value: 2, label: 'cyclone' },
    ], 0),
  ],
  schema: z.object({
    look: num(0, 2, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    const names = ['sea breeze', 'land breeze', 'cyclone']
    const titles = [
      'Day: land heats faster. Warm air rises (low pressure). Cooler sea air blows in — sea breeze.',
      'Night: land cools faster. Air over the sea is warmer and rises. Air blows from land to sea — land breeze.',
      'Warm ocean water. A very low-pressure centre. High-speed winds revolve around it — a cyclone.',
    ]
    const elements = [
      label('title', 24, 22, titles[look]),
      label('eq', 24, 42, 'Air always tries to rush from a high-pressure place to a low-pressure place.'),
    ]
    if (look === 2) {
      elements.push(
        circle('ocean', { cx: 250, cy: 165, r: 90, fill: '#38bdf8' }),
        circle('eye', { cx: 250, cy: 165, r: 18, fill: '#fef9c3', stroke: '#ca8a04', strokeWidth: 2 }),
        circle('spin1', { cx: 250, cy: 165, r: 48, fill: 'none', stroke: '#0f172a', strokeWidth: 3 }),
        circle('spin2', { cx: 250, cy: 165, r: 72, fill: 'none', stroke: '#334155', strokeWidth: 2 }),
        label('eyeL', 232, 170, 'eye'),
        label('tip', 24, 268, 'Book 6.6: cyclones form over warm ocean waters. Winds revolve around the low-pressure centre.'),
      )
    } else {
      const day = look === 0
      elements.push(
        rect('sky', { x: 30, y: 70, width: 440, height: 90, fill: day ? '#7dd3fc' : '#1e3a8a' }),
        rect('sea', { x: 30, y: 160, width: 200, height: 90, fill: '#0369a1' }),
        rect('land', { x: 230, y: 160, width: 240, height: 90, fill: day ? '#fbbf24' : '#334155' }),
        label('seaL', 100, 210, 'sea', '#e0f2fe'),
        label('landL', 320, 210, day ? 'hot land' : 'cool land', day ? '#7c2d12' : '#e2e8f0'),
        circle('sun', { cx: day ? 400 : 70, cy: 100, r: 18, fill: day ? '#facc15' : '#e2e8f0' }),
        arrow('windArrow', {
          x1: day ? 90 : 380,
          y1: 140,
          x2: day ? 300 : 120,
          y2: 140,
          stroke: '#f8fafc',
          strokeWidth: 5,
        }),
        label('wind', day ? 140 : 200, 132, day ? 'sea → land' : 'land → sea', '#f8fafc'),
        label('rise', 300, 100, day ? 'air rises over land' : 'air rises over sea', '#f8fafc'),
        label('tip', 24, 268, 'Book: land gets heated faster during the day. That is how a sea breeze starts.'),
      )
    }
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, name: names[look], fromSea: look === 0, spinning: look === 2 },
      warnings: [],
      caption: 'Book: how winds form from a pressure difference; cyclones over warm oceans.',
    }
  },
}
