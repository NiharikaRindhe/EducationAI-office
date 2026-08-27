import type { ChapterSimTags, PageSimTag } from './ncertPageTags.js'

const squares: PageSimTag = { templateId: 'seq_pictures', params: { kind: 0, n: 5 } }
const triangleNums: PageSimTag = { templateId: 'seq_pictures', params: { kind: 1, n: 5 } }
const segment: PageSimTag = { templateId: 'line_ray_segment', params: { kind: 1 } }
const ray: PageSimTag = { templateId: 'line_ray_segment', params: { kind: 2 } }
const rightArm: PageSimTag = { templateId: 'rotate_arms', params: { angleDeg: 90 } }
const straightArm: PageSimTag = { templateId: 'rotate_arms', params: { angleDeg: 180 } }
const land120: PageSimTag = { templateId: 'flower_beds', params: { look: 0, length: 12, width: 10, side: 4 } }
const bed16: PageSimTag = { templateId: 'flower_beds', params: { look: 1, length: 12, width: 10, side: 4 } }
const grass56: PageSimTag = { templateId: 'flower_beds', params: { look: 2, length: 12, width: 10, side: 4 } }
const linearDrop: PageSimTag = { templateId: 'kind_of_move', params: { look: 1 } }
const circularSpin: PageSimTag = { templateId: 'kind_of_move', params: { look: 2 } }
const swingOsc: PageSimTag = { templateId: 'kind_of_move', params: { look: 3 } }
const sweets: PageSimTag = { templateId: 'tally_bars', params: { jalebi: 6, gulab: 9 } }
const idli: PageSimTag = { templateId: 'idli_vada', params: { a: 3, b: 5, upto: 30 } }
const rect12: PageSimTag = { templateId: 'peri_rect', params: { shape: 0, length: 12, breadth: 8 } }
const square1: PageSimTag = { templateId: 'peri_rect', params: { shape: 1, length: 1, breadth: 1 } }
const roti2: PageSimTag = { templateId: 'roti_share', params: { children: 2 } }
const roti4: PageSimTag = { templateId: 'roti_share', params: { children: 4 } }
const circle4: PageSimTag = { templateId: 'compass_circle', params: { radius: 4, look: 0 } }
const wave8: PageSimTag = { templateId: 'compass_circle', params: { radius: 4, look: 1 } }
const butterfly: PageSimTag = { templateId: 'fold_turn_sym', params: { look: 0, turn: 0 } }
const rangoli: PageSimTag = { templateId: 'fold_turn_sym', params: { look: 1, turn: 90 } }
const liftUp: PageSimTag = { templateId: 'fun_lift', params: { start: 0, move: 2 } }
const grass: PageSimTag = { templateId: 'plant_group', params: { plant: 0 } }
const neem: PageSimTag = { templateId: 'plant_group', params: { plant: 3 } }
const ironYes: PageSimTag = { templateId: 'stick_magnet', params: { look: 0, object: 0 } }
const woodNo: PageSimTag = { templateId: 'stick_magnet', params: { look: 0, object: 1 } }
const poles: PageSimTag = { templateId: 'stick_magnet', params: { look: 1, object: 0 } }
const padma: PageSimTag = { templateId: 'handspan_metre', params: { who: 1, tableM: 1.5 } }
const tumbler: PageSimTag = { templateId: 'material_sort', params: { thing: 1 } }
const bowls: PageSimTag = { templateId: 'three_bowls', params: { step: 0 } }
const bothB: PageSimTag = { templateId: 'three_bowls', params: { step: 1 } }
const ice: PageSimTag = { templateId: 'water_three', params: { state: 0 } }
const puddle: PageSimTag = { templateId: 'water_three', params: { state: 2 } }
const settle: PageSimTag = { templateId: 'everyday_separate', params: { method: 0 } }
const filter: PageSimTag = { templateId: 'everyday_separate', params: { method: 1 } }
const magSep: PageSimTag = { templateId: 'everyday_separate', params: { method: 2 } }
const pigeon: PageSimTag = { templateId: 'living_or_not', params: { thing: 0 } }
const car: PageSimTag = { templateId: 'living_or_not', params: { thing: 2 } }
const stars: PageSimTag = { templateId: 'star_pattern', params: { join: 1 } }

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

/** 2026–27 Class 6 Ganita Prakash + Curiosity. One dedicated template per lesson. Not stamped on every page. */
export const CLASS6_PAGE_TAGS: ChapterSimTags[] = [
  {
    classNum: 6,
    subject: 'Mathematics',
    match: ['patterns in mathematics'],
    pages: merge(on([3, 4], squares), on([5], triangleNums)),
    whenText: [
      { any: ['1, 4, 9, 16, 25', 'square numbers', 'pictorial representation'], tags: [squares] },
      { any: ['triangular numbers', '1, 3, 6, 10, 15'], tags: [triangleNums] },
    ],
  },
  {
    classNum: 6,
    subject: 'Mathematics',
    match: ['lines and angles'],
    pages: merge(on([2, 3], segment), on([4], ray), on([5, 6, 13], rightArm), on([15], straightArm)),
    whenText: [
      { any: ['line segment', 'crease', 'shortest route'], tags: [segment] },
      { any: ['ray of light', 'lighthouse', 'torch beam', 'starts at one point'], tags: [ray] },
      { any: ['two rays having a common', 'rotating arms', 'paper straws', 'vertex'], tags: [rightArm] },
      { any: ['straight angle', 'lie in a straight line'], tags: [straightArm] },
    ],
  },
  {
    classNum: 6,
    subject: 'Mathematics',
    match: ['data handling and presentation'],
    pages: on([2, 3], sweets),
    whenText: [{ any: ['jalebi', 'gulab jamun', 'tally marks'], tags: [sweets] }],
  },
  {
    classNum: 6,
    subject: 'Mathematics',
    match: ['prime time'],
    pages: on([2, 3], idli),
    whenText: [{ any: ['idli-vada', 'idli', 'multiples of 3', 'multiples of 5'], tags: [idli] }],
  },
  {
    classNum: 6,
    subject: 'Mathematics',
    match: ['perimeter and area'],
    pages: merge(on([2, 3], rect12), on([4], square1), on([9, 10], land120), on([10], bed16)),
    whenText: [
      { any: ['12 cm', '8 cm', 'perimeter of a rectangle'], tags: [rect12] },
      { any: ['photo frame', '1 m', 'coloured tape'], tags: [square1] },
      { any: ['12 m', '10 m', '120 sq m', 'area of the whole land'], tags: [land120] },
      { any: ['flower bed', '4 m', '16 sq m'], tags: [bed16] },
      { any: ['grass left', 'remaining', 'four flower'], tags: [grass56] },
    ],
  },
  {
    classNum: 6,
    subject: 'Mathematics',
    match: ['fractions'],
    pages: merge(on([2], roti2), on([3], roti4)),
    whenText: [
      { any: ['one roti', 'two children', 'one half'], tags: [roti2] },
      { any: ['4 children', '1/4', 'smaller share'], tags: [roti4] },
    ],
  },
  {
    classNum: 6,
    subject: 'Mathematics',
    match: ['playing with constructions'],
    pages: merge(on([2, 3], circle4), on([5], wave8)),
    whenText: [
      { any: ['4 cm away from p', 'radius of the circle', 'compass'], tags: [circle4] },
      { any: ['wavy wave', 'ab = 8 cm', 'half circle'], tags: [wave8] },
    ],
  },
  {
    classNum: 6,
    subject: 'Mathematics',
    match: ['symmetry'],
    pages: merge(on([2], butterfly), on([3], rangoli)),
    whenText: [
      { any: ['butterfly', 'line of symmetry'], tags: [butterfly] },
      { any: ['rangoli', 'rotated by 90'], tags: [rangoli] },
    ],
  },
  {
    classNum: 6,
    subject: 'Mathematics',
    match: ['the other side of zero'],
    pages: on([2, 3], liftUp),
    whenText: [{ any: ['bela', 'building of fun', 'lift', '+ 2'], tags: [liftUp] }],
  },
  {
    classNum: 6,
    subject: 'Science',
    match: ['diversity in the living world'],
    pages: merge(on([2, 3], grass), on([5], neem)),
    whenText: [
      { any: ['common grass', 'tulsi', 'nature walk'], tags: [grass] },
      { any: ['neem', 'hard and thick'], tags: [neem] },
    ],
  },
  {
    classNum: 6,
    subject: 'Science',
    match: ['exploring magnets'],
    pages: merge(on([2, 3], ironYes), on([4], woodNo), on([6], poles)),
    whenText: [
      { any: ['attracted by the magnet', 'iron', 'magnetic materials'], tags: [ironYes] },
      { any: ['pencil', 'wood', 'eraser'], tags: [woodNo] },
      { any: ['iron filings', 'poles of magnet'], tags: [poles] },
    ],
  },
  {
    classNum: 6,
    subject: 'Science',
    match: ['measurement of length and motion'],
    pages: merge(on([2, 3], padma), on([12, 13], linearDrop), on([14], circularSpin), on([15, 16], swingOsc)),
    whenText: [
      { any: ['handspan', '13', 'metre scale', 'standard units'], tags: [padma] },
      { any: ['linear motion', 'orange drops', 'straight line', 'reference point'], tags: [linearDrop] },
      { any: ['circular motion', 'merry-go-round', 'whirl'], tags: [circularSpin] },
      { any: ['oscillatory', 'swing', 'to and fro'], tags: [swingOsc] },
    ],
  },
  {
    classNum: 6,
    subject: 'Science',
    match: ['materials around us'],
    pages: on([2, 3], tumbler),
    whenText: [{ any: ['tumbler', 'classification', 'holding water'], tags: [tumbler] }],
  },
  {
    classNum: 6,
    subject: 'Science',
    match: ['temperature and its measurement'],
    pages: merge(on([2, 3], bowls), on([5], bothB)),
    whenText: [
      { any: ['container a', 'ice-cold', 'three large containers'], tags: [bowls] },
      { any: ['both hands', 'place both hands simultaneously'], tags: [bothB] },
    ],
  },
  {
    classNum: 6,
    subject: 'Science',
    match: ['states of water', 'journey through states'],
    pages: merge(on([2], ice), on([4], puddle)),
    whenText: [
      { any: ['ice cube', 'same substance'], tags: [ice] },
      { any: ['puddles', 'disappeared', 'evaporation'], tags: [puddle] },
    ],
  },
  {
    classNum: 6,
    subject: 'Science',
    match: ['methods of separation'],
    pages: merge(on([2, 3], settle), on([5], filter), on([7], magSep)),
    whenText: [
      { any: ['sedimentation', 'settle'], tags: [settle] },
      { any: ['filtration', 'filter paper', 'tea'], tags: [filter] },
      { any: ['magnetic separation', 'magnet'], tags: [magSep] },
    ],
  },
  {
    classNum: 6,
    subject: 'Science',
    match: ['living creatures'],
    pages: merge(on([2], pigeon), on([4], car)),
    whenText: [
      { any: ['pigeon', 'living or non-living'], tags: [pigeon] },
      { any: ['car is living', 'does not grow'], tags: [car] },
    ],
  },
  {
    classNum: 6,
    subject: 'Science',
    match: ['beyond earth'],
    pages: on([2, 3], stars),
    whenText: [{ any: ['constellation', 'join', 'night sky', 'ladakh'], tags: [stars] }],
  },
]
