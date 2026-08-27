import type { ChapterSimTags, PageSimTag } from './ncertPageTags.js'

const lakh: PageSimTag = {
  templateId: 'lakh_crore_chart',
  params: { crores: 0, lakhs: 1, tenThousands: 0, thousands: 0, hundreds: 0, tens: 0, ones: 0 },
}
const times5x25: PageSimTag = { templateId: 'arith_expression', params: { a: 5, b: 25, op: 1, c: 10, d: 2 } }
const compareSums: PageSimTag = { templateId: 'arith_expression', params: { a: 5, b: 25, op: 2, c: 10, d: 2, e: 7, f: 1 } }
const screw: PageSimTag = { templateId: 'decimal_ruler', params: { cm: 2, tenths: 7 } }
const letterS: PageSimTag = { templateId: 'letter_number', params: { a: 4, add: 3 } }
const cross120: PageSimTag = { templateId: 'intersecting_angles', params: { angleDeg: 120 } }
const parallel120: PageSimTag = { templateId: 'parallel_transversal', params: { angleDeg: 120 } }
const equilateral: PageSimTag = { templateId: 'triangle_build', params: { side: 4, angleA: 60, angleB: 60 } }
const tortoise: PageSimTag = { templateId: 'fraction_multiply', params: { copies: 3, den: 4, story: 0 } }
const aaron: PageSimTag = { templateId: 'fraction_multiply', params: { copies: 3, den: 5, story: 1 } }
const sas: PageSimTag = { templateId: 'congruence_sas', params: { ab: 4, bc: 8, angleB: 80 } }
const integers: PageSimTag = { templateId: 'integer_ops', params: { sum: 25, diff: 11 } }
const tiles: PageSimTag = { templateId: 'hcf_tiles', params: { length: 16, width: 12, tryTile: 4 } }
const spices: PageSimTag = { templateId: 'decimal_ops', params: { grams: 50, op: 0 } }
const bars: PageSimTag = { templateId: 'stat_picture', params: { v1: 12, v2: 15, v3: 18 } }
const compass: PageSimTag = { templateId: 'perp_bisector', params: { length: 8 } }
const sacks: PageSimTag = { templateId: 'pan_unknown', params: { sacks: 2, known: 10 } }
const lemon: PageSimTag = { templateId: 'litmus_lab', params: { sample: 0, paper: 0 } }
const soap: PageSimTag = { templateId: 'litmus_lab', params: { sample: 1, paper: 1 } }
const circuit: PageSimTag = { templateId: 'simple_circuit', params: { switch: 1, gap: 0 } }
const openSw: PageSimTag = { templateId: 'simple_circuit', params: { switch: 0, gap: 0 } }
const tawa: PageSimTag = { templateId: 'metal_traits', params: { test: 0 } }
const rust: PageSimTag = { templateId: 'metal_traits', params: { test: 2 } }
const ice: PageSimTag = { templateId: 'change_kind', params: { event: 0 } }
const burn: PageSimTag = { templateId: 'change_kind', params: { event: 1 } }
const pins: PageSimTag = { templateId: 'heat_three_ways', params: { way: 0 } }
const conv: PageSimTag = { templateId: 'heat_three_ways', params: { way: 1 } }
const sprint: PageSimTag = { templateId: 'sprint_speed', params: { distance: 100, timeSec: 12, pace: 0 } }
const mouth: PageSimTag = { templateId: 'digest_path', params: { stop: 0, mode: 0 } }
const stomach: PageSimTag = { templateId: 'digest_path', params: { stop: 2, mode: 0 } }
const sapling: PageSimTag = { templateId: 'leaf_food', params: { light: 1, water: 1 } }
const dark: PageSimTag = { templateId: 'leaf_food', params: { light: 0, water: 1 } }
const shadow: PageSimTag = { templateId: 'light_path', params: { mode: 0, card: 140 } }
const mirror: PageSimTag = { templateId: 'light_path', params: { mode: 1, card: 140 } }
const spin: PageSimTag = { templateId: 'earth_spin_moon', params: { spin: 40, look: 0 } }

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

/** 2026–27 Class 7 Ganita Prakash + Curiosity. Same template only when the page is the same idea; different book stories get the same template with different defaults. Not stamped on every page. */
export const CLASS7_PAGE_TAGS: ChapterSimTags[] = [
  {
    classNum: 7,
    subject: 'Mathematics',
    match: ['large numbers around us'],
    pages: on([2, 3], lakh),
    whenText: [{ any: ['one lakh', '1,00,000', 'crore'], tags: [lakh] }],
  },
  {
    classNum: 7,
    subject: 'Mathematics',
    match: ['arithmetic expressions'],
    pages: merge(on([2], times5x25), on([4], compareSums)),
    whenText: [
      { any: ['5 × 25', '5 x 25'], tags: [times5x25] },
      { any: ['10 + 2', 'different phrases'], tags: [compareSums] },
    ],
  },
  {
    classNum: 7,
    subject: 'Mathematics',
    match: ['a peek beyond the point'],
    pages: on([2, 3], screw),
    whenText: [{ any: ['2.7 cm', 'tenths', 'screw'], tags: [screw] }],
  },
  {
    classNum: 7,
    subject: 'Mathematics',
    match: ['letter-numbers', 'expressions using letter-numbers'],
    pages: on([2, 3], letterS),
    whenText: [{ any: ['s = a + 3', 'letter-numbers'], tags: [letterS] }],
  },
  {
    classNum: 7,
    subject: 'Mathematics',
    match: ['parallel and intersecting lines'],
    pages: merge(on([2, 3], cross120), on([5, 6], parallel120)),
    whenText: [
      { any: ['vertically opposite', 'linear pair', 'two lines intersect'], tags: [cross120] },
      { any: ['transversal', 'corresponding', 'parallel lines'], tags: [parallel120] },
    ],
  },
  {
    classNum: 7,
    subject: 'Mathematics',
    match: ['a tale of three intersecting lines'],
    pages: on([2, 3], equilateral),
    whenText: [{ any: ['equilateral', '4 cm', 'angles of a triangle'], tags: [equilateral] }],
  },
  {
    classNum: 7,
    subject: 'Mathematics',
    match: ['working with fractions'],
    pages: merge(on([2, 3], tortoise), on([5], aaron)),
    whenText: [
      { any: ['tortoise', '3 × 1/4', '3/4'], tags: [tortoise] },
      { any: ['aaron', '1/5 × 3'], tags: [aaron] },
    ],
  },
  {
    classNum: 7,
    subject: 'Mathematics',
    match: ['geometric twins'],
    pages: on([2, 3], sas),
    whenText: [{ any: ['sas', 'ab = 4', '80°', 'signboard'], tags: [sas] }],
  },
  {
    classNum: 7,
    subject: 'Mathematics',
    match: ['operations with integers'],
    pages: on([2, 3], integers),
    whenText: [{ any: ['sum 25', 'difference 11', 'negative'], tags: [integers] }],
  },
  {
    classNum: 7,
    subject: 'Mathematics',
    match: ['finding common ground'],
    pages: on([2, 3], tiles),
    whenText: [{ any: ['12 ft', '16 ft', 'square tile', 'hcf'], tags: [tiles] }],
  },
  {
    classNum: 7,
    subject: 'Mathematics',
    match: ['another peek beyond the point'],
    pages: on([2, 3], spices),
    whenText: [{ any: ['50 g', '0.050 kg', 'spices'], tags: [spices] }],
  },
  {
    classNum: 7,
    subject: 'Mathematics',
    match: ['connecting the dots'],
    pages: on([2, 3], bars),
    whenText: [{ any: ['statistical question', '15 minutes', 'mean'], tags: [bars] }],
  },
  {
    classNum: 7,
    subject: 'Mathematics',
    match: ['constructions and tilings'],
    pages: on([2, 3], compass),
    whenText: [{ any: ['perpendicular bisector', 'compass', 'midpoint'], tags: [compass] }],
  },
  {
    classNum: 7,
    subject: 'Mathematics',
    match: ['finding the unknown'],
    pages: on([2, 3], sacks),
    whenText: [{ any: ['sacks', 'pan', 'unknown weight'], tags: [sacks] }],
  },
  {
    classNum: 7,
    subject: 'Science',
    match: ['acidic, basic, and neutral', 'exploring substances'],
    pages: merge(on([2, 3], lemon), on([5], soap)),
    whenText: [
      { any: ['lemon', 'blue litmus'], tags: [lemon] },
      { any: ['soap', 'red litmus'], tags: [soap] },
    ],
  },
  {
    classNum: 7,
    subject: 'Science',
    match: ['circuits and their components', 'electricity'],
    pages: merge(on([2, 3], circuit), on([5], openSw)),
    whenText: [
      { any: ['closed', 'bulb glows'], tags: [circuit] },
      { any: ['open switch', 'conductor', 'insulator'], tags: [openSw] },
    ],
  },
  {
    classNum: 7,
    subject: 'Science',
    match: ['metals and non-metals', 'the world of metals'],
    pages: merge(on([2, 3], tawa), on([5], rust)),
    whenText: [
      { any: ['tawa', 'hammer', 'malleable'], tags: [tawa] },
      { any: ['rust'], tags: [rust] },
    ],
  },
  {
    classNum: 7,
    subject: 'Science',
    match: ['physical and chemical', 'changes around us'],
    pages: merge(on([2], ice), on([4], burn)),
    whenText: [
      { any: ['ice cube', 'melting'], tags: [ice] },
      { any: ['burning wood', 'chemical change'], tags: [burn] },
    ],
  },
  {
    classNum: 7,
    subject: 'Science',
    match: ['heat transfer in nature'],
    pages: merge(on([2, 3], pins), on([6], conv)),
    whenText: [
      { any: ['activity 7.1', 'pins', 'metal strip'], tags: [pins] },
      { any: ['convection', 'sea breeze'], tags: [conv] },
    ],
  },
  {
    classNum: 7,
    subject: 'Science',
    match: ['measurement of time and motion', 'time and motion'],
    pages: on([2, 3], sprint),
    whenText: [{ any: ['100 m', 'stopwatch', 'speed'], tags: [sprint] }],
  },
  {
    classNum: 7,
    subject: 'Science',
    match: ['life processes in animals'],
    pages: merge(on([2], mouth), on([4], stomach)),
    whenText: [
      { any: ['mouth', 'food pipe'], tags: [mouth] },
      { any: ['stomach', 'intestine'], tags: [stomach] },
    ],
  },
  {
    classNum: 7,
    subject: 'Science',
    match: ['life processes in plants'],
    pages: merge(on([2, 3], sapling), on([5], dark)),
    whenText: [
      { any: ['sunlight', 'sapling', 'water up the stem'], tags: [sapling] },
      { any: ['kept in the dark'], tags: [dark] },
    ],
  },
  {
    classNum: 7,
    subject: 'Science',
    match: ['shadows and reflections', 'light - shadows'],
    pages: merge(on([2, 3], shadow), on([6], mirror)),
    whenText: [
      { any: ['torch', 'opaque', 'shadow'], tags: [shadow] },
      { any: ['plane mirror', 'one image'], tags: [mirror] },
    ],
  },
  {
    classNum: 7,
    subject: 'Science',
    match: ['earth, moon, and the sun'],
    pages: on([2, 3], spin),
    whenText: [{ any: ['merry-go-round', 'morning shadows', 'earth turns'], tags: [spin] }],
  },
]
