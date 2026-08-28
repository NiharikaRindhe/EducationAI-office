import type { ChapterSimTags, PageSimTag } from './ncertPageTags.js'

const lockers: PageSimTag = { templateId: 'locker_squares', params: { lockers: 100 } }
const folds10: PageSimTag = { templateId: 'paper_fold', params: { folds: 10 } }
const carpenter: PageSimTag = { templateId: 'rect_diagonals', params: { d1: 8, d2: 8, tilt: 70 } }
const times2327: PageSimTag = { templateId: 'distribute_grid', params: { a: 23, b: 27, bump: 1 } }
const imageC: PageSimTag = { templateId: 'similar_rect', params: { other: 2 } }
const imageB: PageSimTag = { templateId: 'similar_rect', params: { other: 1 } }
const sunset: PageSimTag = { templateId: 'percent_bar', params: { num: 3, den: 4 } }
const doubleSq: PageSimTag = { templateId: 'baudhayana_square', params: { side: 4, look: 0 } }
const idli: PageSimTag = { templateId: 'ratio_scale', params: { mode: 0, rice: 2, dal: 1, rice2: 6, dal2: 3 } }
const mapRf: PageSimTag = { templateId: 'ratio_scale', params: { mode: 1, mapCm: 1 } }
const carpet: PageSimTag = { templateId: 'sierpinski_step', params: { step: 2 } }
const mean57: PageSimTag = { templateId: 'mean_balance', params: { a: 3, b: 7, c: 0 } }
const always2: PageSimTag = { templateId: 'think_number', params: { x: 5 } }
const rangoli: PageSimTag = { templateId: 'rect_area', params: { w1: 8, h1: 4, w2: 6, h2: 6 } }
const flask: PageSimTag = { templateId: 'water_lens', params: { zoom: 2 } }
const nailOn: PageSimTag = { templateId: 'electromagnet_nail', params: { look: 0, switch: 1, clips: 5 } }
const nailOff: PageSimTag = { templateId: 'electromagnet_nail', params: { look: 0, switch: 0, clips: 5 } }
const heatWire: PageSimTag = { templateId: 'electromagnet_nail', params: { look: 1, switch: 1, clips: 0 } }
const pushBox: PageSimTag = { templateId: 'push_pull_box', params: { action: 0, ground: 0 } }
const downhill: PageSimTag = { templateId: 'push_pull_box', params: { action: 0, ground: 2 } }
const narrow: PageSimTag = { templateId: 'bag_straps', params: { weight: 40, width: 2 } }
const broad: PageSimTag = { templateId: 'bag_straps', params: { weight: 40, width: 8 } }
const chalk: PageSimTag = { templateId: 'chalk_bits', params: { breaks: 2 } }
const salad: PageSimTag = { templateId: 'mix_kinds', params: { kind: 0 } }
const ors: PageSimTag = { templateId: 'dissolve_ors', params: { stuff: 0, amount: 3 } }
const chalkWater: PageSimTag = { templateId: 'dissolve_ors', params: { stuff: 2, amount: 4 } }
const innerSpoon: PageSimTag = { templateId: 'spoon_mirror', params: { side: 0, distance: 8 } }
const outerSpoon: PageSimTag = { templateId: 'spoon_mirror', params: { side: 1, distance: 8 } }
const convexClose: PageSimTag = { templateId: 'two_lenses', params: { kind: 0, distance: 8 } }
const concaveLens: PageSimTag = { templateId: 'two_lenses', params: { kind: 1, distance: 8 } }
const seaDay: PageSimTag = { templateId: 'wind_spin', params: { look: 0 } }
const landNight: PageSimTag = { templateId: 'wind_spin', params: { look: 1 } }
const cyclone: PageSimTag = { templateId: 'wind_spin', params: { look: 2 } }
const afterFull: PageSimTag = { templateId: 'moon_month', params: { day: 1 } }

function on(pages: number[], tag: PageSimTag): Record<number, PageSimTag[]> {
  return Object.fromEntries(pages.map((p) => [p, [tag]]))
}

function merge(...maps: Record<number, PageSimTag[]>[]): Record<number, PageSimTag[]> {
  const out: Record<number, PageSimTag[]> = {}
  for (const m of maps) {
    for (const [k, v] of Object.entries(m)) {
      const p = Number(k)
      out[p] = [...(out[p] ?? []), ...v]
    }
  }
  return out
}

/** 2026–27 Class 8 Ganita Prakash + Curiosity. One dedicated template per lesson. Not stamped on every page. */
export const CLASS8_PAGE_TAGS: ChapterSimTags[] = [
  {
    classNum: 8,
    subject: 'Mathematics',
    match: ['a square and a cube'],
    pages: on([2, 3], lockers),
    whenText: [{ any: ['100 lockers', 'odd number of factors', 'square number'], tags: [lockers] }],
  },
  {
    classNum: 8,
    subject: 'Mathematics',
    match: ['power play'],
    pages: on([2, 3], folds10),
    whenText: [{ any: ['0.001 cm', '46 folds', 'fold it once', '1.024 cm'], tags: [folds10] }],
  },
  {
    classNum: 8,
    subject: 'Mathematics',
    match: ['quadrilaterals'],
    pages: on([2, 3], carpenter),
    whenText: [{ any: ['8 cm long strip', 'carpenter', 'diagonals of the rectangle'], tags: [carpenter] }],
  },
  {
    classNum: 8,
    subject: 'Mathematics',
    match: ['we distribute, yet things multiply'],
    pages: on([2, 3], times2327),
    whenText: [{ any: ['23 × 27', '23 x 27', 'distributive property'], tags: [times2327] }],
  },
  {
    classNum: 8,
    subject: 'Mathematics',
    match: ['proportional reasoning-1', 'proportional reasoning 1'],
    pages: merge(on([2, 3], imageC), on([5], imageB)),
    whenText: [
      { any: ['60 mm', 'images a, c, and d', 'same factor'], tags: [imageC] },
      { any: ['image b', '20 millimetre', 'elongated'], tags: [imageB] },
    ],
  },
  {
    classNum: 8,
    subject: 'Mathematics',
    match: ['fractions in disguise'],
    pages: on([2, 3], sunset),
    whenText: [{ any: ['3/4', '75%', 'per cent', 'sunset'], tags: [sunset] }],
  },
  {
    classNum: 8,
    subject: 'Mathematics',
    match: ['baudhayana', 'pythagoras theorem'],
    pages: on([2, 3], doubleSq),
    whenText: [{ any: ['doubling a square', 'diagonal of a square', 'sulba'], tags: [doubleSq] }],
  },
  {
    classNum: 8,
    subject: 'Mathematics',
    match: ['proportional reasoning-2', 'proportional reasoning 2'],
    pages: merge(on([2, 3], idli), on([5], mapRf)),
    whenText: [
      { any: ['idli', '2 cups of rice', 'urad dal', '6 : 3'], tags: [idli] },
      { any: ['60,00,000', 'representative fraction', '1 cm on the map'], tags: [mapRf] },
    ],
  },
  {
    classNum: 8,
    subject: 'Mathematics',
    match: ['exploring some geometric themes'],
    pages: on([2, 3], carpet),
    whenText: [{ any: ['sierpinski', 'fractal', 'remaining squares'], tags: [carpet] }],
  },
  {
    classNum: 8,
    subject: 'Mathematics',
    match: ['tales by dots and lines'],
    pages: on([2, 3], mean57),
    whenText: [{ any: ['3 and 7', 'arithmetic mean', 'halfway between'], tags: [mean57] }],
  },
  {
    classNum: 8,
    subject: 'Mathematics',
    match: ['algebra play'],
    pages: on([2, 3], always2),
    whenText: [{ any: ['think of a number', 'always end up with the same value, 2', 'double it'], tags: [always2] }],
  },
  {
    classNum: 8,
    subject: 'Mathematics',
    match: ['area', 'rangoli powder', 'rectangle and squares'],
    pages: on([2, 3], rangoli),
    whenText: [{ any: ['rangoli', 'equal area', 'more rangoli powder'], tags: [rangoli] }],
  },
  {
    classNum: 8,
    subject: 'Science',
    match: ['invisible living world', 'beyond our naked eye'],
    pages: on([2, 3], flask),
    whenText: [{ any: ['round-bottom flask', 'magnifying', 'microscope', 'naked eye'], tags: [flask] }],
  },
  {
    classNum: 8,
    subject: 'Science',
    match: ['electricity', 'magnetic and heating'],
    pages: merge(on([2, 3], nailOn), on([5], nailOff), on([7], heatWire)),
    whenText: [
      { any: ['electromagnet', 'paper clips', 'iron nail wrapped'], tags: [nailOn] },
      { any: ['opened the circuit', 'clips fell'], tags: [nailOff] },
      { any: ['heating effect', 'heat generated in various electrical'], tags: [heatWire] },
    ],
  },
  {
    classNum: 8,
    subject: 'Science',
    match: ['exploring forces'],
    pages: merge(on([2, 3], pushBox), on([6], downhill)),
    whenText: [
      { any: ['cardboard box', 'push or pull', 'what is a force'], tags: [pushBox] },
      { any: ['down the slope', 'not pedalling', 'pulling us downhill'], tags: [downhill] },
    ],
  },
  {
    classNum: 8,
    subject: 'Science',
    match: ['pressure, winds, storms', 'pressure winds'],
    pages: merge(on([2, 3], narrow), on([5], broad), on([9, 10], seaDay), on([13], cyclone)),
    whenText: [
      { any: ['narrow straps', 'hurting my shoulders'], tags: [narrow] },
      { any: ['broad straps', 'force per unit area'], tags: [broad] },
      { any: ['sea breeze', 'how do winds form', 'land gets heated faster'], tags: [seaDay] },
      { any: ['land breeze'], tags: [landNight] },
      { any: ['cyclone', 'warm ocean waters', 'revolving around'], tags: [cyclone] },
    ],
  },
  {
    classNum: 8,
    subject: 'Science',
    match: ['particulate nature of matter'],
    pages: on([2, 3], chalk),
    whenText: [{ any: ['stick of chalk', 'grind', 'mortar and pestle'], tags: [chalk] }],
  },
  {
    classNum: 8,
    subject: 'Science',
    match: ['elements, compounds, and mixtures', 'nature of matter'],
    pages: on([2, 3], salad),
    whenText: [{ any: ['sprout salad', 'poha', 'mixture', 'components'], tags: [salad] }],
  },
  {
    classNum: 8,
    subject: 'Science',
    match: ['solutes, solvents, and solutions'],
    pages: merge(on([2, 3], ors), on([5], chalkWater)),
    whenText: [
      { any: ['oral rehydration', 'ors', 'salt and sugar'], tags: [ors] },
      { any: ['chalk powder', 'non-uniform'], tags: [chalkWater] },
    ],
  },
  {
    classNum: 8,
    subject: 'Science',
    match: ['light', 'mirrors and lenses'],
    pages: merge(on([2, 3], innerSpoon), on([6], outerSpoon), on([11, 12], convexClose), on([12], concaveLens)),
    whenText: [
      { any: ['inner side of the spoon', 'inverted', 'curved inwards'], tags: [innerSpoon] },
      { any: ['outer side of the spoon', 'bulges outwards', 'erect but smaller'], tags: [outerSpoon] },
      { any: ['convex lens', 'magnifying glass', 'thicker at the middle', 'converging lens'], tags: [convexClose] },
      { any: ['concave lens', 'thicker at the edges', 'diverging lens'], tags: [concaveLens] },
    ],
  },
  {
    classNum: 8,
    subject: 'Science',
    match: ['keeping time with the skies'],
    pages: on([2, 3], afterFull),
    whenText: [{ any: ['full moon', 'activity 11.1', 'bright portion of the moon'], tags: [afterFull] }],
  },
]
