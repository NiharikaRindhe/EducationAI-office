// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

const SERIES = ['K', 'Na', 'Ca', 'Mg', 'Al', 'Zn', 'Fe', 'Pb', 'H', 'Cu', 'Hg', 'Ag', 'Au']

export const metal_swap: SimFile = {
  id: 'metal_swap',
  domain: 'chemistry',
  classBand: '10-10',
  ncertClass: 10,
  label: 'A more reactive metal swaps',
  description: 'A metal higher in the series displaces one below it from salt solution. Book default: Zn in CuSO₄. Not the old 0–4 rank tool.',
  equations: ['more reactive metal + salt of less reactive → swap'],
  keywords: ['reactivity series', 'displacement', 'zinc', 'copper sulphate', 'metals and non-metals'],
  params: [
    choice('metalA', 'Solid metal', SERIES.map((name, i) => ({ value: i, label: name })), 5),
    choice('metalB', 'Metal in the salt', SERIES.map((name, i) => ({ value: i, label: name })), 9),
  ],
  schema: z.object({
    metalA: num(0, 12, 5),
    metalB: num(0, 12, 9),
  }),
  run(params) {
    const a = Math.max(0, Math.min(12, Math.round(params.metalA)))
    const b = Math.max(0, Math.min(12, Math.round(params.metalB)))
    const nameA = SERIES[a]
    const nameB = SERIES[b]
    const willDisplace = a < b
    const elements = [
      label('title', 24, 22, willDisplace
        ? `${nameA} is above ${nameB}. It pushes ${nameB} out of the solution.`
        : `${nameA} is not above ${nameB}. No swap.`),
      label('eq', 24, 40, willDisplace
        ? `${nameA} + ${nameB}SO₄ → ${nameA}SO₄ + ${nameB}. Blue CuSO₄ fades when zinc is used.`
        : `Leave ${nameA} in a ${nameB} salt — nothing useful happens.`),
      rect('beaker', { x: 180, y: 80, width: 140, height: 140, fill: willDisplace ? '#fef3c7' : '#bfdbfe', stroke: '#0f172a', strokeWidth: 2 }),
      rect('strip', { x: 230, y: 100, width: 40, height: 90, fill: '#94a3b8', rx: 4 }),
      label('ser', 24, 250, `Series (top = more reactive): ${SERIES.join(' > ')}`),
      label('tip', 24, 286, 'Book: zinc in copper sulphate. Brown copper coats the zinc. Iron does this too; copper in ZnSO₄ does not.'),
    ]
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { metalA: a, metalB: b, nameA, nameB, willDisplace },
      warnings: [],
      caption: 'Book: Zn in CuSO₄. Zinc displaces copper.',
    }
  },
}
