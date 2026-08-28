import type { ChapterSimTags, PageSimTag } from './ncertPageTags.js'

const hcf620: PageSimTag = { templateId: 'prime_share', params: { a: 6, b: 20 } }
const zeros14: PageSimTag = { templateId: 'poly_zeroes', params: { look: 0, a: 1, b: -3, c: -4 } }
const cubic: PageSimTag = { templateId: 'poly_zeroes', params: { look: 1, a: 1, b: -3, c: -4 } }
const pairX: PageSimTag = { templateId: 'pair_lines', params: { look: 0 } }
const pairPar: PageSimTag = { templateId: 'pair_lines', params: { look: 1 } }
const dNeg: PageSimTag = { templateId: 'root_nature', params: { a: 2, b: -4, c: 3 } }
const rungs: PageSimTag = { templateId: 'ap_rungs', params: { look: 0, a: 45, d: -2, n: 10 } }
const nth: PageSimTag = { templateId: 'ap_rungs', params: { look: 1, a: 45, d: -2, n: 10 } }
const sn: PageSimTag = { templateId: 'ap_rungs', params: { look: 2, a: 45, d: -2, n: 10 } }
const thales: PageSimTag = { templateId: 'thales_cut', params: { k: 0.5 } }
const like: PageSimTag = { templateId: 'like_triangles', params: { k: 1.5 } }
const pq: PageSimTag = { templateId: 'coord_gap', params: { x1: 4, y1: 6, x2: 6, y2: 8 } }
const mid: PageSimTag = { templateId: 'section_split', params: { x1: 1, y1: 2, x2: 7, y2: 8, m: 1, n: 1 } }
const trig247: PageSimTag = { templateId: 'right_trig', params: { adj: 24, opp: 7 } }
const elev30: PageSimTag = { templateId: 'tower_sight', params: { look: 0, angleDeg: 30, distance: 10 } }
const dep30: PageSimTag = { templateId: 'tower_sight', params: { look: 1, angleDeg: 30, distance: 10 } }
const tanPerp: PageSimTag = { templateId: 'circle_touch', params: { look: 0, r: 5, d: 13 } }
const twoTan: PageSimTag = { templateId: 'circle_touch', params: { look: 1, r: 5, d: 13 } }
const sec430: PageSimTag = { templateId: 'slice_area', params: { r: 4, thetaDeg: 30 } }
const top: PageSimTag = { templateId: 'combo_solid', params: { look: 0 } }
const rocket: PageSimTag = { templateId: 'combo_solid', params: { look: 2 } }
const meanG: PageSimTag = { templateId: 'group_avg', params: { look: 0 } }
const modeG: PageSimTag = { templateId: 'group_avg', params: { look: 1 } }
const medG: PageSimTag = { templateId: 'group_avg', params: { look: 2 } }
const coin: PageSimTag = { templateId: 'fair_chance', params: { look: 0 } }
const twoDice: PageSimTag = { templateId: 'fair_chance', params: { look: 2 } }
const combo: PageSimTag = { templateId: 'react_kind', params: { look: 0 } }
const disp: PageSimTag = { templateId: 'react_kind', params: { look: 2 } }
const phLemon: PageSimTag = { templateId: 'acid_strip', params: { look: 0, pH: 2 } }
const znAcid: PageSimTag = { templateId: 'acid_strip', params: { look: 1, pH: 2 } }
const znCu: PageSimTag = { templateId: 'metal_swap', params: { metalA: 5, metalB: 9 } }
const ch4: PageSimTag = { templateId: 'carbon_share', params: { look: 3 } }
const chain: PageSimTag = { templateId: 'carbon_share', params: { look: 4 } }
const soap: PageSimTag = { templateId: 'carbon_share', params: { look: 5 } }
const leaf: PageSimTag = { templateId: 'plant_food', params: { light: 1, look: 0 } }
const gut: PageSimTag = { templateId: 'gut_tube', params: { stop: 2 } }
const aero: PageSimTag = { templateId: 'breath_kind', params: { look: 0 } }
const heart: PageSimTag = { templateId: 'blood_loop', params: { look: 0 } }
const reflex: PageSimTag = { templateId: 'nerve_path', params: { look: 1 } }
const trop: PageSimTag = { templateId: 'plant_bend', params: { look: 0 } }
const fission: PageSimTag = { templateId: 'split_grow', params: { look: 0 } }
const flower: PageSimTag = { templateId: 'flower_parts', params: { look: 0 } }
const mendel: PageSimTag = { templateId: 'pea_cross', params: { look: 0 } }
const sex: PageSimTag = { templateId: 'pea_cross', params: { look: 1 } }
const conc: PageSimTag = { templateId: 'curve_mirror', params: { look: 0, u: 30, f: 15 } }
const slab: PageSimTag = { templateId: 'glass_slab', params: { theta1: 35, n2: 1.5 } }
const conv: PageSimTag = { templateId: 'bend_lens', params: { look: 0, u: 30, f: 15 } }
const myopia: PageSimTag = { templateId: 'eye_see', params: { look: 1 } }
const prism60: PageSimTag = { templateId: 'prism_split', params: { A: 60, mu: 1.5 } }
const ohm4: PageSimTag = { templateId: 'ohm_line', params: { cells: 4, R: 6 } }
const series: PageSimTag = { templateId: 'two_resist', params: { look: 0, R1: 4, R2: 6, V: 6 } }
const parallel: PageSimTag = { templateId: 'two_resist', params: { look: 1, R1: 4, R2: 6, V: 6 } }
const bulb: PageSimTag = { templateId: 'heat_wire', params: { V: 220, R: 1200, t: 10 } }
const wire: PageSimTag = { templateId: 'field_wire', params: { look: 0, I: 5 } }
const solo: PageSimTag = { templateId: 'field_wire', params: { look: 2, I: 5 } }
const chain10: PageSimTag = { templateId: 'food_rung', params: { look: 0, energy: 1000 } }

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

/** Classic / rationalised NCERT Class 10 Maths + Science. One dedicated template per lesson. Not stamped on every page. */
export const CLASS10_PAGE_TAGS: ChapterSimTags[] = [
  {
    classNum: 10,
    subject: 'Mathematics',
    match: ['real numbers'],
    pages: on([2, 4, 5], hcf620),
    whenText: [{ any: ['fundamental theorem of arithmetic', 'hcf and lcm', '6 and 20'], tags: [hcf620] }],
  },
  {
    classNum: 10,
    subject: 'Mathematics',
    match: ['polynomials'],
    pages: merge(on([2, 3, 4, 5], zeros14), on([6, 7], cubic)),
    whenText: [
      { any: ['x³ − 4x', 'x^3 - 4x', 'geometrical meaning of the zeroes'], tags: [zeros14] },
      { any: ['x² − 3x − 4', 'x^2 - 3x - 4', '−1 and 4'], tags: [zeros14] },
    ],
  },
  {
    classNum: 10,
    subject: 'Mathematics',
    match: ['pair of linear equations'],
    pages: merge(on([2, 3, 5, 6], pairX), on([4], pairPar)),
    whenText: [
      { any: ['graphical method', 'x − y + 1', '3x + 2y − 12'], tags: [pairX] },
      { any: ['no solution', 'parallel lines'], tags: [pairPar] },
    ],
  },
  {
    classNum: 10,
    subject: 'Mathematics',
    match: ['quadratic equations'],
    pages: on([7, 8, 9], dNeg),
    whenText: [{ any: ['nature of roots', 'discriminant', '2x² − 4x + 3', '2x^2 - 4x + 3'], tags: [dNeg] }],
  },
  {
    classNum: 10,
    subject: 'Mathematics',
    match: ['arithmetic progressions'],
    pages: merge(on([1, 2, 3], rungs), on([8, 9], nth), on([15, 16], sn)),
    whenText: [
      { any: ['45 cm', 'rungs', 'ladder'], tags: [rungs] },
      { any: ['nth term of an ap', 'a_n'], tags: [nth] },
      { any: ['sum of first n terms', 'gauss'], tags: [sn] },
    ],
  },
  {
    classNum: 10,
    subject: 'Mathematics',
    match: ['triangles'],
    pages: merge(on([7, 8, 10], thales), on([2, 13, 14], like)),
    whenText: [
      { any: ['basic proportionality', 'thales', 'parallel to one side', 'de ∥ bc'], tags: [thales] },
      { any: ['aa criterion', 'similar triangles', 'sas similarity', 'sss similarity'], tags: [like] },
    ],
  },
  {
    classNum: 10,
    subject: 'Mathematics',
    match: ['coordinate geometry'],
    pages: merge(on([2, 3, 4], pq), on([8, 9, 13], mid)),
    whenText: [
      { any: ['distance formula', 'p(4, 6)', 'q(6, 8)'], tags: [pq] },
      { any: ['section formula', 'niharika runs', 'divides internally'], tags: [mid] },
    ],
  },
  {
    classNum: 10,
    subject: 'Mathematics',
    match: ['introduction to trigonometry'],
    pages: on([2, 3, 8, 9], trig247),
    whenText: [{ any: ['trigonometric ratios', '24 cm', '7 cm', 'right-angled at b'], tags: [trig247] }],
  },
  {
    classNum: 10,
    subject: 'Mathematics',
    match: ['some applications of trigonometry', 'heights and distances'],
    pages: merge(on([1, 2, 3, 4], elev30), on([6, 7], dep30)),
    whenText: [
      { any: ['angle of depression'], tags: [dep30] },
      { any: ['angle of elevation', 'line of sight', 'electrician'], tags: [elev30] },
    ],
  },
  {
    classNum: 10,
    subject: 'Mathematics',
    match: ['circles'],
    pages: merge(on([2, 3], tanPerp), on([4, 5, 6], twoTan)),
    whenText: [
      { any: ['two tangents', 'from a point on a circle', 'external point'], tags: [twoTan] },
      { any: ['tangent to a circle', 'perpendicular to the tangent', 'point of contact'], tags: [tanPerp] },
    ],
  },
  {
    classNum: 10,
    subject: 'Mathematics',
    match: ['areas related to circles'],
    pages: on([1, 2, 3], sec430),
    whenText: [{ any: ['sector', 'segment', 'radius 4 cm', 'angle 30'], tags: [sec430] }],
  },
  {
    classNum: 10,
    subject: 'Mathematics',
    match: ['surface areas and volumes'],
    pages: merge(on([2, 3, 4], top), on([5], rocket)),
    whenText: [
      { any: ['rocket', 'conical portion'], tags: [rocket] },
      { any: ['combination of solids', 'spinning top', '3.5 cm', 'hemisphere'], tags: [top] },
    ],
  },
  {
    classNum: 10,
    subject: 'Mathematics',
    match: ['statistics'],
    pages: merge(on([1, 2, 3], meanG), on([13, 14], modeG), on([18, 24], medG)),
    whenText: [
      { any: ['median of grouped', '51 girls', '149'], tags: [medG] },
      { any: ['mode of grouped'], tags: [modeG] },
      { any: ['mean of grouped', 'class mark'], tags: [meanG] },
    ],
  },
  {
    classNum: 10,
    subject: 'Mathematics',
    match: ['probability'],
    pages: merge(on([1, 2], coin), on([12], twoDice)),
    whenText: [
      { any: ['two dice', 'fig. 14.3', 'sum = 8'], tags: [twoDice] },
      { any: ['theoretical approach', 'equally likely', 'fair coin'], tags: [coin] },
    ],
  },
  {
    classNum: 10,
    subject: 'Science',
    match: ['chemical reactions and equations'],
    pages: merge(on([6, 7], combo), on([10, 11], disp)),
    whenText: [
      { any: ['displacement reaction', 'zinc', 'copper sulphate'], tags: [disp] },
      { any: ['combination reaction', 'magnesium ribbon', 'decomposition'], tags: [combo] },
    ],
  },
  {
    classNum: 10,
    subject: 'Science',
    match: ['acids, bases and salts', 'acids bases and salts'],
    pages: merge(on([2, 7, 13], phLemon), on([3], znAcid)),
    whenText: [
      { any: ['zinc granules', 'dilute sulphuric', 'hydrogen gas'], tags: [znAcid] },
      { any: ['universal indicator', 'ph scale', 'ph of salts', 'lemon'], tags: [phLemon] },
    ],
  },
  {
    classNum: 10,
    subject: 'Science',
    match: ['metals and non-metals'],
    pages: on([8, 9], znCu),
    whenText: [{ any: ['reactivity series', 'zinc', 'copper sulphate', 'displacement'], tags: [znCu] }],
  },
  {
    classNum: 10,
    subject: 'Science',
    match: ['carbon and its compounds'],
    pages: merge(on([1, 2, 3], ch4), on([9], chain), on([17], soap)),
    whenText: [
      { any: ['soap', 'micelle', 'detergents'], tags: [soap] },
      { any: ['homologous series', '+ch2', 'ch2'], tags: [chain] },
      { any: ['covalent bond', 'electron dot', 'ch4', 'methane'], tags: [ch4] },
    ],
  },
  {
    classNum: 10,
    subject: 'Science',
    match: ['life processes'],
    pages: merge(on([3, 4, 5], leaf), on([6, 7, 8], gut), on([9, 10], aero), on([13, 14], heart)),
    whenText: [
      { any: ['double circulation', 'pulmonary', 'heart'], tags: [heart] },
      { any: ['aerobic', 'anaerobic', 'atp', 'glucose'], tags: [aero] },
      { any: ['alimentary', 'stomach', 'fig. 5.6', 'nutrition in human'], tags: [gut] },
      { any: ['photosynthesis', 'stomata', 'chlorophyll'], tags: [leaf] },
    ],
  },
  {
    classNum: 10,
    subject: 'Science',
    match: ['control and coordination'],
    pages: merge(on([2, 3], reflex), on([7], trop)),
    whenText: [
      { any: ['phototropism', 'tropism', 'growth movement'], tags: [trop] },
      { any: ['reflex arc', 'neuron', 'dendrite', 'spinal cord'], tags: [reflex] },
    ],
  },
  {
    classNum: 10,
    subject: 'Science',
    match: ['how do organisms reproduce'],
    pages: merge(on([3, 4, 5], fission), on([8], flower)),
    whenText: [
      { any: ['stamen', 'pistil', 'fig. 7.9', 'flowering plants'], tags: [flower] },
      { any: ['fission', 'budding', 'spore formation', 'vegetative propagation'], tags: [fission] },
    ],
  },
  {
    classNum: 10,
    subject: 'Science',
    match: ['heredity'],
    pages: merge(on([2, 3, 4], mendel), on([5], sex)),
    whenText: [
      { any: ['sex determination', 'xx', 'xy', 'fig. 8.6'], tags: [sex] },
      { any: ['mendel', 'dominant', 'f1', 'f2', 'pea'], tags: [mendel] },
    ],
  },
  {
    classNum: 10,
    subject: 'Science',
    match: ['light - reflection and refraction', 'reflection and refraction'],
    pages: merge(on([2, 4, 10], conc), on([13, 14], slab), on([19, 20, 22], conv)),
    whenText: [
      { any: ['lens formula', 'convex lens', 'power of a lens'], tags: [conv] },
      { any: ['glass slab', 'lateral shift', 'rectangular'], tags: [slab] },
      { any: ['spherical mirror', 'concave mirror', 'mirror formula'], tags: [conc] },
    ],
  },
  {
    classNum: 10,
    subject: 'Science',
    match: ['the human eye', 'colourful world'],
    pages: merge(on([1, 2, 3], myopia), on([5, 6], prism60)),
    whenText: [
      { any: ['prism', 'dispersion', 'spectrum', 'vibgyor'], tags: [prism60] },
      { any: ['myopia', 'hypermetropia', 'near point', '25 cm', 'human eye'], tags: [myopia] },
    ],
  },
  {
    classNum: 10,
    subject: 'Science',
    match: ['electricity'],
    pages: merge(on([5, 6], ohm4), on([12], series), on([15], parallel), on([20, 21], bulb)),
    whenText: [
      { any: ['heating effect', 'electric power', '220 v', '1200'], tags: [bulb] },
      { any: ['resistors in parallel', 'parallel combination'], tags: [parallel] },
      { any: ['resistors in series', 'series combination'], tags: [series] },
      { any: ['ohm’s law', "ohm's law", 'four cells', '1.5 v', 'v–i graph', 'v-i graph'], tags: [ohm4] },
    ],
  },
  {
    classNum: 10,
    subject: 'Science',
    match: ['magnetic effects of electric current'],
    pages: merge(on([4, 5], wire), on([7], solo)),
    whenText: [
      { any: ['solenoid'], tags: [solo] },
      { any: ['magnetic field', 'straight conductor', 'right-hand thumb', 'circular loop'], tags: [wire] },
    ],
  },
  {
    classNum: 10,
    subject: 'Science',
    match: ['our environment'],
    pages: on([3, 4], chain10),
    whenText: [{ any: ['food chain', 'trophic', '10%', 'energy flow'], tags: [chain10] }],
  },
]
