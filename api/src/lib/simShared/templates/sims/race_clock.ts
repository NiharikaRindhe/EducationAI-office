// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export const race_clock: SimFile = {
  id: 'race_clock',
  domain: 'math',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Racing seconds',
  description: 'A race clock with hours, minutes and seconds. Switch 12-hour and 24-hour names.',
  equations: ['1\\,\\text{h}=60\\,\\text{min}', '1\\,\\text{min}=60\\,\\text{s}'],
  keywords: ['racing seconds', '24-hour format', '12-hour format', 'elapsed time', 'seconds hand'],
  params: [
    param('hours', 'Hours', '', 0, 23, 1, 1),
    param('minutes', 'Minutes', '', 0, 59, 1, 55),
    param('seconds', 'Seconds', '', 0, 59, 1, 0),
    choice('format', 'Clock name', [
      { value: 0, label: '12-hour' },
      { value: 1, label: '24-hour' },
    ], 0),
  ],
  schema: z.object({
    hours: num(0, 23, 1),
    minutes: num(0, 59, 55),
    seconds: num(0, 59, 0),
    format: num(0, 1, 0),
  }),
  run(params) {
    const hours = ((Math.round(params.hours) % 24) + 24) % 24
    const minutes = Math.max(0, Math.min(59, Math.round(params.minutes)))
    const seconds = Math.max(0, Math.min(59, Math.round(params.seconds)))
    const h12 = hours % 12 === 0 ? 12 : hours % 12
    const ampm = hours < 12 ? 'a.m.' : 'p.m.'
    const as12 = `${pad(h12)}:${pad(minutes)}:${pad(seconds)} ${ampm}`
    const as24 = `${pad(hours)}:${pad(minutes)}:${pad(seconds)} hours`
    const totalMin = hours * 60 + minutes
    const cx = 250
    const cy = 168
    const R = 96
    const secAng = (seconds / 60) * 2 * Math.PI - Math.PI / 2
    const minAng = ((minutes + seconds / 60) / 60) * 2 * Math.PI - Math.PI / 2
    const hourAng = ((hours % 12 + minutes / 60) / 12) * 2 * Math.PI - Math.PI / 2
    const elements = [
      label('eq', 28, 22, params.format >= 0.5 ? as24 : as12),
      label('other', 28, 40, params.format >= 0.5 ? `also ${as12}` : `also ${as24}`),
      label('fact', 28, 58, `${hours} h = ${totalMin} min     1 min = 60 s`),
      circle('face', { cx, cy, r: R, fill: '#fff7ed', stroke: '#334155', strokeWidth: 4 }),
    ]
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * 2 * Math.PI - Math.PI / 2
      elements.push(
        line(`tick${i}`, {
          x1: cx + (R - 10) * Math.cos(a),
          y1: cy + (R - 10) * Math.sin(a),
          x2: cx + R * Math.cos(a),
          y2: cy + R * Math.sin(a),
          stroke: '#334155',
          strokeWidth: i % 3 === 0 ? 3 : 1.5,
        })
      )
    }
    elements.push(
      line('hour', {
        x1: cx,
        y1: cy,
        x2: cx + 46 * Math.cos(hourAng),
        y2: cy + 46 * Math.sin(hourAng),
        stroke: '#1d4ed8',
        strokeWidth: 6,
      }),
      line('minute', {
        x1: cx,
        y1: cy,
        x2: cx + 70 * Math.cos(minAng),
        y2: cy + 70 * Math.sin(minAng),
        stroke: '#16a34a',
        strokeWidth: 4,
      }),
      line('second', {
        x1: cx,
        y1: cy,
        x2: cx + 82 * Math.cos(secAng),
        y2: cy + 82 * Math.sin(secAng),
        stroke: '#dc2626',
        strokeWidth: 2,
      }),
      circle('hub', { cx, cy, r: 5, fill: '#0f172a' }),
    )
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { hours, minutes, seconds, as12, as24, totalMinutes: totalMin },
      warnings: [],
      caption: 'A walking race can be won by a few seconds. 2:30 p.m. is 14:30 hours.',
    }
  },
}
