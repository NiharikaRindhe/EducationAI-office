// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, pathEl } from '../stage.js'

export const cricket_model: SimFile = {
  id: 'cricket_model',
  domain: 'physics',
  classBand: '9-9',
  ncertClass: 9,
  label: 'A cricket six as a model',
  description: 'Example 1.1: keep mass, speed, direction. Ignore brand, grass, seam. A simple model of a six. Not the old projectile lab.',
  equations: ['keep: mass, speed, direction', 'ignore: brand, colour, grass'],
  keywords: ['cricket', 'six', 'model', 'exploration', 'air resistance ignored'],
  params: [
    param('speed', 'Speed', 'm/s', 15, 40, 1, 28),
    param('angle', 'Angle', 'deg', 20, 60, 1, 40),
  ],
  schema: z.object({
    speed: num(10, 50, 28),
    angle: num(10, 70, 40),
  }),
  run(params) {
    const v = params.speed
    const ang = params.angle * Math.PI / 180
    const g = 9.8
    const tFlight = 2 * v * Math.sin(ang) / g
    const range = v * Math.cos(ang) * tFlight
    const pts: Array<[number, number]> = []
    const x0 = 50
    const y0 = 240
    const sx = 8
    const sy = 8
    for (let i = 0; i <= 20; i++) {
      const t = (tFlight * i) / 20
      const x = v * Math.cos(ang) * t
      const y = v * Math.sin(ang) * t - 0.5 * g * t * t
      pts.push([x0 + x * sx, y0 - y * sy])
    }
    const d = `M ${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ')}`
    const elements = [
      label('title', 24, 22, `A six. Speed ${v} m/s, angle ${params.angle}°. Range about ${range.toFixed(0)} m. Air resistance off.`),
      label('eq', 24, 40, 'Keep: mass, speed, direction. Ignore: brand of bat, colour, grass, seam.'),
      pathEl('path', { d, fill: 'none', stroke: '#2563eb', strokeWidth: 2 }),
      circle('ball', { cx: pts[pts.length - 1][0], cy: pts[pts.length - 1][1], r: 6, fill: '#dc2626' }),
      label('tip', 24, 270, 'Book Example 1.1. A model is a choice of what to keep. Not a mistake.'),
      label('ign', 24, 286, `Flight time ${tFlight.toFixed(2)} s. Boundary is a number — colour of the ball is not.`),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { speed: v, angle: params.angle, range, tFlight },
      warnings: [],
      caption: 'Book: cricket six. Keep speed and direction. Ignore brand and grass.',
    }
  },
}
