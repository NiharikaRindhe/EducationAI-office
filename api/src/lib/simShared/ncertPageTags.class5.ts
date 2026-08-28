import type { ChapterSimTags, PageSimTag } from './ncertPageTags.js'

const place13520: PageSimTag = {
  templateId: 'place_value_chart',
  params: { tenThousands: 1, thousands: 3, hundreds: 5, tens: 2, ones: 0 },
}
const fractionHalf: PageSimTag = { templateId: 'fraction_kit', params: { numerator: 1, denominator: 2, k: 2 } }
const quarterTurn: PageSimTag = { templateId: 'turns_angle', params: { eighths: 2 } }
const fuelAdd: PageSimTag = { templateId: 'add_place', params: { a: 28, b: 75, mode: 0 } }
const race3km: PageSimTag = { templateId: 'length_units', params: { metres: 3000, extraCm: 0 } }
const dairy8x5: PageSimTag = { templateId: 'array_multiply', params: { rows: 8, cols: 5 } }
const pentagon: PageSimTag = { templateId: 'tessellate_fit', params: { sides: 5 } }
const weave11: PageSimTag = { templateId: 'weave_pattern', params: { over: 1, under: 1 } }
const flour: PageSimTag = { templateId: 'weight_scale', params: { kg: 3, grams: 500 } }
const litre: PageSimTag = { templateId: 'capacity_jugs', params: { litres: 1, ml: 250 } }
const coconuts: PageSimTag = { templateId: 'divide_share', params: { dividend: 35, divisor: 7 } }
const letterH: PageSimTag = { templateId: 'symmetry_spin', params: { letter: 0, eighths: 4 } }
const quilt: PageSimTag = { templateId: 'area_grid', params: { length: 6, breadth: 4 } }
const clock155: PageSimTag = { templateId: 'race_clock', params: { hours: 1, minutes: 55, seconds: 0, format: 0 } }
const jumps: PageSimTag = { templateId: 'animal_jumps', params: { jumpA: 4, jumpB: 3 } }
const east: PageSimTag = { templateId: 'map_compass', params: { facing: 1 } }
const pictograph: PageSimTag = { templateId: 'picture_data', params: { v1: 20, v2: 15, v3: 25, scale: 5 } }
const cycle: PageSimTag = { templateId: 'water_cycle', params: { heat: 6 } }
const teaspoon: PageSimTag = { templateId: 'freshwater_share', params: { glassMl: 200, freshMl: 5 } }
const godavari: PageSimTag = { templateId: 'river_dam', params: { lengthKm: 1465, dam: 0 } }
const mould: PageSimTag = { templateId: 'food_microbes', params: { temperature: 30, moisture: 1, air: 1 } }
const balloon: PageSimTag = { templateId: 'kitchen_energy', params: { mode: 0, amount: 6 } }
const dayNight: PageSimTag = { templateId: 'earth_day_night', params: { spin: 40 } }
const vasanta: PageSimTag = { templateId: 'india_seasons', params: { look: 0, season: 0 } }
const sisira: PageSimTag = { templateId: 'india_seasons', params: { look: 0, season: 5 } }
const moonShape: PageSimTag = { templateId: 'india_seasons', params: { look: 1, season: 0 } }

function spread(pages: number[], tag: PageSimTag): Record<number, PageSimTag[]> {
  return Object.fromEntries(pages.map((p) => [p, [tag]]))
}

/** 2026–27 Class 5 Joyful Maths + Our Wondrous World (chapter-wise PDFs). */
export const CLASS5_PAGE_TAGS: ChapterSimTags[] = [
  {
    classNum: 5,
    subject: 'Mathematics',
    match: ['we the travellers - i', 'we the travellers i', 'large numbers around us'],
    pages: spread([2, 3, 4, 13, 14, 15], place13520),
    whenText: [{ any: ['ten thousand', 'tth', '13,520', '13520', 'place value chart'], tags: [place13520] }],
  },
  {
    classNum: 5,
    subject: 'Mathematics',
    match: ['we the travellers - ii', 'we the travellers ii'],
    pages: spread([1, 2, 3, 4], fuelAdd),
    whenText: [{ any: ['we the travellers - ii', 'fuel arithmetic'], tags: [fuelAdd] }],
  },
  {
    classNum: 5,
    subject: 'Mathematics',
    match: ['fractions'],
    pages: spread([1, 2, 3, 4], fractionHalf),
    whenText: [{ any: ['equivalent fractions', 'fraction kit', 'same whole'], tags: [fractionHalf] }],
  },
  {
    classNum: 5,
    subject: 'Mathematics',
    match: ['angles as turns'],
    pages: spread([1, 2, 3, 4, 9, 10], quarterTurn),
    whenText: [{ any: ['quarter turn', 'half turn', 'acute angle', 'right angle'], tags: [quarterTurn] }],
  },
  {
    classNum: 5,
    subject: 'Mathematics',
    match: ['far and near'],
    pages: spread([1, 2, 3, 4], race3km),
    whenText: [{ any: ['far and near', '3 km', 'kilometre', 'millimetre'], tags: [race3km] }],
  },
  {
    classNum: 5,
    subject: 'Mathematics',
    match: ['the dairy farm', 'dairy farm'],
    pages: spread([1, 2, 3, 4], dairy8x5),
    whenText: [{ any: ['dairy farm', 'butter packets'], tags: [dairy8x5] }],
  },
  {
    classNum: 5,
    subject: 'Mathematics',
    match: ['shapes and patterns'],
    pages: {
      1: [weave11],
      2: [weave11],
      3: [pentagon],
      4: [pentagon],
    },
    whenText: [
      { any: ['tessellat', 'regular pentagon', 'fit around a point'], tags: [pentagon] },
      { any: ['weaving mats', 'over, under', '1 over'], tags: [weave11] },
    ],
  },
  {
    classNum: 5,
    subject: 'Mathematics',
    match: ['weight and capacity'],
    pages: {
      1: [flour],
      2: [flour],
      3: [flour],
      13: [litre],
      14: [litre],
      15: [litre],
    },
    whenText: [
      { any: ['kilogram', '3 kg 500', 'weighing'], tags: [flour] },
      { any: ['litre', 'millilitre', 'capacity'], tags: [litre] },
    ],
  },
  {
    classNum: 5,
    subject: 'Mathematics',
    match: ['coconut farm'],
    pages: spread([1, 2, 3, 4], coconuts),
    whenText: [{ any: ['coconut farm', 'sharing equally'], tags: [coconuts] }],
  },
  {
    classNum: 5,
    subject: 'Mathematics',
    match: ['symmetrical designs'],
    pages: spread([1, 2, 3], letterH),
    whenText: [{ any: ['rotational symmetry', 'firki', 'line of symmetry'], tags: [letterH] }],
  },
  {
    classNum: 5,
    subject: 'Mathematics',
    match: ["grandmother's quilt", 'grandmother quilt'],
    pages: spread([1, 6, 10], quilt),
    whenText: [{ any: ['quilt', 'perimeter', 'unit square'], tags: [quilt] }],
  },
  {
    classNum: 5,
    subject: 'Mathematics',
    match: ['racing seconds'],
    pages: spread([1, 2, 3, 6], clock155),
    whenText: [{ any: ['racing seconds', '24-hour', '01:55', 'seconds hand'], tags: [clock155] }],
  },
  {
    classNum: 5,
    subject: 'Mathematics',
    match: ['animal jumps'],
    pages: spread([1, 2, 3], jumps),
    whenText: [{ any: ['common multiples', 'rabbit', 'frog', 'animal jumps'], tags: [jumps] }],
  },
  {
    classNum: 5,
    subject: 'Mathematics',
    match: ['maps and locations'],
    pages: spread([1, 2, 3], east),
    whenText: [{ any: ['maps and locations', 'rising sun'], tags: [east] }],
  },
  {
    classNum: 5,
    subject: 'Mathematics',
    match: ['data through pictures'],
    pages: spread([1, 2, 3], pictograph),
    whenText: [{ any: ['pictograph', 'data through pictures', 'one picture'], tags: [pictograph] }],
  },
  {
    classNum: 5,
    subject: 'EVS',
    match: ['water - the essence of life', 'essence of life'],
    pages: {
      5: [cycle],
      6: [cycle],
      7: [cycle],
      8: [cycle],
    },
    whenText: [
      { any: ['water cycle', 'evaporation', 'condensation'], tags: [cycle] },
      { any: ['teaspoon', 'freshwater', '200 ml'], tags: [teaspoon] },
    ],
  },
  {
    classNum: 5,
    subject: 'EVS',
    match: ['journey of a river'],
    pages: spread([1, 2, 6], godavari),
    whenText: [{ any: ['godavari', 'tributar', '1,465', 'reservoir'], tags: [godavari] }],
  },
  {
    classNum: 5,
    subject: 'EVS',
    match: ['the mystery of food', 'mystery of food'],
    pages: spread([3, 4, 5, 8], mould),
    whenText: [{ any: ['microbe', 'mould', 'uttapam', 'pickle'], tags: [mould] }],
  },
  {
    classNum: 5,
    subject: 'EVS',
    match: ['energy - how things work', 'how things work'],
    pages: spread([1, 2, 3], balloon),
    whenText: [{ any: ['balloon rocket', 'what is energy', 'rubber'], tags: [balloon] }],
  },
  {
    classNum: 5,
    subject: 'EVS',
    match: ['clothes - how things are made', 'how things are made'],
    pages: spread([1, 2, 3], weave11),
    whenText: [{ any: ['weaving', 'over, under', 'handloom'], tags: [weave11] }],
  },
  {
    classNum: 5,
    subject: 'EVS',
    match: ['rhythms of nature'],
    pages: {
      5: [dayNight],
      6: [dayNight],
      7: [vasanta],
      11: [vasanta],
      12: [sisira],
    },
    whenText: [
      { any: ['day and night', 'globe', 'torch', 'earth rotation'], tags: [dayNight] },
      { any: ['vasanta', 'six seasons', 'seasons journal', 'saba', 'aparna'], tags: [vasanta] },
      { any: ['pongal', 'makar sankranti', 'śiśira', 'shishira', 'winter'], tags: [sisira] },
      { any: ['moon’s shape', 'moon shape', 'bright part of the moon'], tags: [moonShape] },
    ],
  },
]
