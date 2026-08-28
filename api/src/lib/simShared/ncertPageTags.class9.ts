import type { ChapterSimTags, PageSimTag } from './ncertPageTags.js'

const plot34: PageSimTag = { templateId: 'four_quadrant', params: { x: 3, y: 4 } }
const plotDown: PageSimTag = { templateId: 'four_quadrant', params: { x: 0, y: -4.5 } }
const dist12: PageSimTag = { templateId: 'coord_distance', params: { x1: 1, y1: 2, x2: 4, y2: 6 } }
const line23: PageSimTag = { templateId: 'linear_poly', params: { a: 2, b: 3 } }
const wire7: PageSimTag = { templateId: 'wire_area', params: { x: 7 } }
const sqrt2: PageSimTag = { templateId: 'sqrt2_line', params: { side: 1 } }
const ab102: PageSimTag = { templateId: 'ab_square', params: { a: 10, b: 2, look: 0 } }
const chord4: PageSimTag = { templateId: 'circle_chord', params: { radius: 4, dist: 2, look: 0 } }
const track: PageSimTag = { templateId: 'track_stagger', params: { laneWidth: 1.22, track: 400 } }
const heron: PageSimTag = { templateId: 'heron_area', params: { a: 13, b: 14, c: 15 } }
const coin: PageSimTag = { templateId: 'maybe_chance', params: { kind: 0, trials: 50, seen: 26 } }
const tri5: PageSimTag = { templateId: 'dot_sequence', params: { kind: 0, n: 5 } }
const ap13: PageSimTag = { templateId: 'ap_gp_steps', params: { look: 0, n: 6 } }
const gp18: PageSimTag = { templateId: 'ap_gp_steps', params: { look: 1, n: 6 } }
const six: PageSimTag = { templateId: 'cricket_model', params: { speed: 28, angle: 40 } }
const animal: PageSimTag = { templateId: 'cell_parts', params: { look: 0 } }
const plant: PageSimTag = { templateId: 'cell_parts', params: { look: 1 } }
const xylem: PageSimTag = { templateId: 'xylem_phloem', params: { look: 0 } }
const socket: PageSimTag = { templateId: 'joint_kinds', params: { look: 0 } }
const athlete: PageSimTag = { templateId: 'dist_displace', params: { out: 100, back: 40 } }
const fall: PageSimTag = { templateId: 'motion_graphs', params: { u: 0, a: 9.8, t: 3, look: 0 } }
const salt: PageSimTag = { templateId: 'mix_three', params: { look: 0, laser: 1 } }
const chalk: PageSimTag = { templateId: 'mix_three', params: { look: 1, laser: 1 } }
const milk: PageSimTag = { templateId: 'mix_three', params: { look: 2, laser: 1 } }
const boxBal: PageSimTag = { templateId: 'box_newton', params: { look: 0, mass: 2, force: 10, friction: 10 } }
const wheat: PageSimTag = { templateId: 'lift_work', params: { mass: 5, h: 1, bags: 1, look: 0 } }
const incline: PageSimTag = { templateId: 'machine_help', params: { look: 0, load: 50, length: 4, h: 1 } }
const foil: PageSimTag = { templateId: 'gold_foil', params: { look: 0, particles: 20 } }
const saltMass: PageSimTag = { templateId: 'keep_mass', params: { look: 0 } }
const h2: PageSimTag = { templateId: 'bond_kind', params: { look: 0 } }
const echo: PageSimTag = { templateId: 'sound_echo', params: { look: 0, v: 340, t: 0.5, f: 2 } }
const bryo: PageSimTag = { templateId: 'one_parent', params: { look: 0 } }
const monera: PageSimTag = { templateId: 'five_kingdoms', params: { org: 0 } }
const snow: PageSimTag = { templateId: 'five_spheres', params: { look: 0 } }

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

/** 2026–27 Class 9 Ganita Manjari + Exploration. One dedicated template per lesson. Not stamped on every page. */
export const CLASS9_PAGE_TAGS: ChapterSimTags[] = [
  {
    classNum: 9,
    subject: 'Mathematics',
    match: ['orienting yourself', 'use of coordinates'],
    pages: merge(on([3, 4], plot34), on([4], plotDown), on([8, 9], dist12)),
    whenText: [
      { any: ['(0, – 4.5)', '(0, -4.5)', 'negative y-axis', 'four-quadrant'], tags: [plotDown] },
      { any: ['distance between two points', '1.4'], tags: [dist12] },
      { any: ['cartesian', 'origin o', 'coordinates'], tags: [plot34] },
    ],
  },
  {
    classNum: 9,
    subject: 'Mathematics',
    match: ['introduction to linear polynomials', 'linear polynomials'],
    pages: merge(on([4, 5, 6], line23), on([2, 3], wire7)),
    whenText: [
      { any: ['20 cm', '10 − x', '10x – x', 'bent in different ways'], tags: [wire7] },
      { any: ['linear polynomial', 'linear growth', 'linear decay', 'degree 1'], tags: [line23] },
    ],
  },
  {
    classNum: 9,
    subject: 'Mathematics',
    match: ['the world of numbers'],
    pages: on([13, 14, 15], sqrt2),
    whenText: [{ any: ['√2', 'square root of 2', 'construction of length', 'irrational'], tags: [sqrt2] }],
  },
  {
    classNum: 9,
    subject: 'Mathematics',
    match: ['exploring algebraic identities', 'algebraic identities'],
    pages: on([2, 3, 4], ab102),
    whenText: [{ any: ['(a + b)²', '(a+b)^2', 'a = 10', 'visualising identities', 'algebra tiles'], tags: [ab102] }],
  },
  {
    classNum: 9,
    subject: 'Mathematics',
    match: ['up and down', 'round and round'],
    pages: on([2, 3, 7], chord4),
    whenText: [{ any: ['chord', 'centre of the circle', 'perpendicular bisector of chords'], tags: [chord4] }],
  },
  {
    classNum: 9,
    subject: 'Mathematics',
    match: ['measuring space', 'perimeter and area'],
    pages: merge(on([1, 2, 3], track), on([17, 18], heron)),
    whenText: [
      { any: ['stagger', '4 × 100', '400 m', 'c/d ratio'], tags: [track] },
      { any: ['heron', 'semi-perimeter', 'three sides'], tags: [heron] },
    ],
  },
  {
    classNum: 9,
    subject: 'Mathematics',
    match: ['mathematics of maybe', 'introduction to probability'],
    pages: on([2, 3, 6], coin),
    whenText: [{ any: ['tossing a coin', 'rolling a die', 'probability scale', 'equally likely'], tags: [coin] }],
  },
  {
    classNum: 9,
    subject: 'Mathematics',
    match: ['predicting what comes next', 'sequences and progressions'],
    pages: merge(on([1, 2], tri5), on([7, 8], ap13), on([13, 14], gp18)),
    whenText: [
      { any: ['triangular numbers', 'fig. 8.1', 'square numbers'], tags: [tri5] },
      { any: ['arithmetic progression', '1, 4, 7, 10, 13'], tags: [ap13] },
      { any: ['geometric progression', '18.00 ft', '13.50'], tags: [gp18] },
    ],
  },
  {
    classNum: 9,
    subject: 'Science',
    match: ['entering the world of secondary science'],
    pages: on([2, 3], six),
    whenText: [{ any: ['cricket', 'a six', 'example 1.1', 'simple model'], tags: [six] }],
  },
  {
    classNum: 9,
    subject: 'Science',
    match: ['cell - the building block', 'building block of life', 'the building block of life'],
    pages: merge(on([4, 5], animal), on([6, 7], plant)),
    whenText: [
      { any: ['plant cell', 'cell wall'], tags: [plant] },
      { any: ['animal cell', 'cell membrane', 'nucleus'], tags: [animal] },
    ],
  },
  {
    classNum: 9,
    subject: 'Science',
    match: ['tissues in action'],
    pages: merge(on([2, 3], xylem), on([13, 14], socket)),
    whenText: [
      { any: ['xylem', 'phloem', 'conducting tissues'], tags: [xylem] },
      { any: ['ball and socket', 'hinge joint', 'types of joints'], tags: [socket] },
    ],
  },
  {
    classNum: 9,
    subject: 'Science',
    match: ['describing motion around us'],
    pages: merge(on([2, 3], athlete), on([9, 12, 14], fall)),
    whenText: [
      { any: ['distance travelled', 'displacement', 'reference point'], tags: [athlete] },
      { any: ['9.8', 'velocity-time', 'position-time', 'kinematic'], tags: [fall] },
    ],
  },
  {
    classNum: 9,
    subject: 'Science',
    match: ['exploring mixtures', 'mixtures and their separation'],
    pages: merge(on([2], salt), on([2], chalk), on([15, 16], milk)),
    whenText: [
      { any: ['chalk powder', 'suspension'], tags: [chalk] },
      { any: ['tyndall', 'colloid', 'milk'], tags: [milk] },
      { any: ['common salt', 'homogeneous', 'activity 5.1'], tags: [salt] },
    ],
  },
  {
    classNum: 9,
    subject: 'Science',
    match: ['how forces affect motion'],
    pages: on([2, 3, 7], boxBal),
    whenText: [{ any: ['pushing a box', 'balanced', 'newton', 'canoe', 'friction'], tags: [boxBal] }],
  },
  {
    classNum: 9,
    subject: 'Science',
    match: ['work, energy, and simple machines', 'simple machines'],
    pages: merge(on([2, 3], wheat), on([15, 16], incline)),
    whenText: [
      { any: ['5 kg', 'wheat bag', '1 m', 'work done'], tags: [wheat] },
      { any: ['inclined plane', 'pulley', 'lever', 'simple machines'], tags: [incline] },
    ],
  },
  {
    classNum: 9,
    subject: 'Science',
    match: ['journey inside the atom'],
    pages: on([4, 5, 6], foil),
    whenText: [{ any: ['gold foil', 'rutherford', 'thomson', 'nucleus'], tags: [foil] }],
  },
  {
    classNum: 9,
    subject: 'Science',
    match: ['atomic foundations of matter'],
    pages: merge(on([2, 4], saltMass), on([8, 9], h2)),
    whenText: [
      { any: ['conservation of mass', 'activity 9.1', 'baking soda'], tags: [saltMass] },
      { any: ['covalent', 'ionic', 'sharing of electrons', 'nacl'], tags: [h2] },
    ],
  },
  {
    classNum: 9,
    subject: 'Science',
    match: ['sound waves', 'characteristics and applications'],
    pages: on([2, 17, 18], echo),
    whenText: [{ any: ['echo', '0.5 s', '340', 'rubber band', 'tuning fork'], tags: [echo] }],
  },
  {
    classNum: 9,
    subject: 'Science',
    match: ['reproduction - how life continues', 'how life continues'],
    pages: on([2, 3], bryo),
    whenText: [{ any: ['bryophyllum', 'asexual', 'binary fission', 'vegetative propagation'], tags: [bryo] }],
  },
  {
    classNum: 9,
    subject: 'Science',
    match: ['patterns in life', 'diversity and classification'],
    pages: on([6, 7, 8], monera),
    whenText: [{ any: ['five kingdom', 'monera', 'protista', 'whittaker'], tags: [monera] }],
  },
  {
    classNum: 9,
    subject: 'Science',
    match: ['earth as a system', 'energy, matter, and life'],
    pages: on([2, 3], snow),
    whenText: [{ any: ['geosphere', 'cryosphere', 'hydrosphere', 'activity 13.1', 'snowfall'], tags: [snow] }],
  },
]
