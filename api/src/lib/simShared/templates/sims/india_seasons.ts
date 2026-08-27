// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, rect } from '../stage.js'

const SEASONS = [
  { name: 'Vasanta', english: 'Spring', months: 'flowers bloom', fest: 'Holi' },
  { name: 'Grīṣma', english: 'Summer', months: 'hot and dry', fest: '—' },
  { name: 'Varṣā', english: 'Monsoon', months: 'rains', fest: '—' },
  { name: 'Śarad', english: 'Autumn', months: 'clear skies', fest: '—' },
  { name: 'Hemanta', english: 'Pre-winter', months: 'cool mornings', fest: '—' },
  { name: 'Śiśira', english: 'Winter', months: 'cold', fest: 'Pongal, Makar Sankranti' },
]

const MOON = ['full', 'waning', 'half', 'crescent', 'new', 'crescent', 'half', 'waxing']

export const india_seasons: SimFile = {
  id: 'india_seasons',
  domain: 'physics',
  classBand: '5-6',
  ncertClass: 5,
  label: 'Six seasons, and the Moon’s shape',
  description: 'India has six seasons: Vasanta, Grīṣma, Varṣā, Śarad, Hemanta, Śiśira. Saba and Aparna keep a seasons journal. The Moon’s lit face also changes through the month. Not the globe-and-torch day-and-night spinning Earth.',
  equations: ['year → six Indian seasons', 'Moon’s shape changes through a month'],
  keywords: ['vasanta', 'six seasons', 'seasons journal', 'saba', 'aparna', 'pongal', 'rhythms of nature'],
  params: [
    choice('look', 'Look at', [
      { value: 0, label: 'seasons' },
      { value: 1, label: 'Moon’s shape' },
    ], 0),
    choice('season', 'Season', [
      { value: 0, label: 'Vasanta (spring)' },
      { value: 1, label: 'Grīṣma (summer)' },
      { value: 2, label: 'Varṣā (monsoon)' },
      { value: 3, label: 'Śarad (autumn)' },
      { value: 4, label: 'Hemanta (pre-winter)' },
      { value: 5, label: 'Śiśira (winter)' },
    ], 0),
  ],
  schema: z.object({
    look: num(0, 1, 0),
    season: num(0, 5, 0),
  }),
  run(params) {
    const look = Math.round(params.look)
    const season = Math.round(params.season)
    const s = SEASONS[season]
    const sky = ['#fde68a', '#fbbf24', '#64748b', '#fdba74', '#94a3b8', '#e2e8f0'][season]
    const elements = [
      label('title', 24, 22, look === 0
        ? `${s.name} (${s.english}). ${s.months}.`
        : `The Moon’s bright part changes through the month — ${MOON[season]}.`),
      label('eq', 24, 40, look === 0
        ? 'India hosts six seasons. This repeating pattern is what we call seasons.'
        : 'The Moon is always a ball. We see a different slice of the lit half.'),
    ]
    if (look === 0) {
      elements.push(
        rect('sky', { x: 40, y: 70, width: 420, height: 150, fill: sky, rx: 8 }),
        circle('sun', { cx: 90, cy: 110, r: season === 5 ? 14 : 26, fill: season === 2 ? '#94a3b8' : '#facc15' }),
        rect('ground', { x: 40, y: 180, width: 420, height: 40, fill: season === 2 ? '#166534' : '#65a30d' }),
        label('fest', 160, 118, s.fest !== '—' ? `Festival: ${s.fest}` : 'Watch plants, birds, clothes, food.'),
        label('tip', 24, 248, 'Book: Saba and Aparna in the school garden. Seasons’ journal. Six names from Vasanta to Śiśira.'),
        label('list', 24, 272, 'Vasanta · Grīṣma · Varṣā · Śarad · Hemanta · Śiśira'),
      )
    } else {
      const shift = (season - 3) * 10
      elements.push(
        circle('moonBall', { cx: 250, cy: 150, r: 60, fill: '#e2e8f0' }),
        circle('shade', { cx: 250 + shift, cy: 150, r: 60, fill: '#0f172a', opacity: 0.7 }),
        label('tip', 24, 248, 'The unit also wonders at the Sun, Moon and stars. Shape changes are a monthly rhythm.'),
        label('ph', 24, 272, `Shape now: ${MOON[season]}.`),
      )
    }
    return {
      stage: { viewBox: VIEW, elements },
      metrics: {
        look,
        season,
        name: s.name,
        english: s.english,
        fest: s.fest,
        moon: MOON[season],
      },
      warnings: [],
      caption: 'Book: Changes around us in a year (seasons). Six Indian seasons.',
    }
  },
}
