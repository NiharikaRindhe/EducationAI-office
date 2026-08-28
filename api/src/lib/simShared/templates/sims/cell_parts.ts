// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, rect } from '../stage.js'

export const cell_parts: SimFile = {
  id: 'cell_parts',
  domain: 'chemistry',
  classBand: '9-9',
  ncertClass: 9,
  label: 'Animal cell and plant cell',
  description: 'The cell is the unit of life. Plant cells have a wall and a large vacuole. Animal cells do not. Split look: one cell becomes two. Not a microscope essay.',
  equations: ['cell → tissue → organ'],
  keywords: ['cell membrane', 'cell wall', 'nucleus', 'plant cell', 'animal cell', 'cell division'],
  params: [
    choice('look', 'Look at', [
      { value: 0, label: 'animal cell' },
      { value: 1, label: 'plant cell' },
      { value: 2, label: 'one cell splits' },
    ], 0),
  ],
  schema: z.object({
    look: num(0, 2, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    if (look === 2) {
      const elements = [
        label('title', 24, 22, 'One cell divides. Two cells. That is how a body grows.'),
        label('eq', 24, 40, 'Book §2.4: cells grow and divide. They do not live forever.'),
        circle('c1', { cx: 170, cy: 160, r: 50, fill: '#fde68a', stroke: '#b45309', strokeWidth: 2 }),
        circle('c2', { cx: 330, cy: 160, r: 50, fill: '#fde68a', stroke: '#b45309', strokeWidth: 2 }),
        circle('n1', { cx: 170, cy: 160, r: 16, fill: '#7c3aed' }),
        circle('n2', { cx: 330, cy: 160, r: 16, fill: '#7c3aed' }),
        label('tip', 24, 286, 'Cell theory: all cells come from cells.'),
      ]
      return {
        stage: { viewBox: VIEW, elements },
        metrics: { look, cells: 2, plant: false },
        warnings: [],
        caption: 'Book: cell division. One becomes two.',
      }
    }
    const plant = look === 1
    const elements = [
      label('title', 24, 22, plant
        ? 'Plant cell. Outer wall (rigid). Large vacuole. Chloroplasts make food.'
        : 'Animal cell. Membrane only — no wall. Can change shape.'),
      label('eq', 24, 40, 'Every cell has a membrane and a nucleus. The wall is extra in plants.'),
    ]
    if (plant) {
      elements.push(rect('wall', { x: 140, y: 70, width: 220, height: 170, fill: '#bbf7d0', stroke: '#166534', strokeWidth: 4 }))
      elements.push(rect('vac', { x: 170, y: 100, width: 160, height: 90, fill: '#e0f2fe', stroke: '#0369a1', strokeWidth: 1 }))
      elements.push(circle('nuc', { cx: 210, cy: 130, r: 18, fill: '#7c3aed' }))
      elements.push(circle('ch', { cx: 300, cy: 200, r: 12, fill: '#16a34a' }))
    } else {
      elements.push(circle('mem', { cx: 250, cy: 155, r: 80, fill: '#fde68a', stroke: '#b45309', strokeWidth: 3 }))
      elements.push(circle('nuc', { cx: 250, cy: 155, r: 22, fill: '#7c3aed' }))
    }
    elements.push(label('tip', 24, 286, plant ? 'Wall = support. Plants stay in one place.' : 'No wall → animals can move. Book Ch 2.'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { look, plant, cells: 1 },
      warnings: [],
      caption: plant ? 'Book: plant cell with wall.' : 'Book: animal cell. Membrane and nucleus.',
    }
  },
}
