import { describe, it, expect } from 'vitest'
import { CLASS5_PAGE_TAGS } from '../ncertPageTags.class5.js'
import { tagsForPage } from '../ncertPageTags.js'
import { firstPlacementByTemplateId, lookupNcertPageTags } from '../ncertPageTags.catalog.js'

describe('NCERT page tags — Class 5 chapter PDFs', () => {
  it('puts place_value_chart on Travellers I page 2 with 13,520', () => {
    const tags = lookupNcertPageTags({
      classNum: 5,
      subject: 'Mathematics',
      bookTitle: 'Chapter 1 - We the Travellers - I',
      pageNumber: 2,
      pageText: 'TTh stands for ten thousand.',
    })
    expect(tags[0]?.templateId).toBe('place_value_chart')
    expect(tags[0]?.params?.tenThousands).toBe(1)
    expect(tags[0]?.params?.ones).toBe(0)
  })

  it('does not use Travellers I page map on Travellers II', () => {
    const tags = lookupNcertPageTags({
      classNum: 5,
      subject: 'Mathematics',
      bookTitle: 'Chapter 4 - We the Travellers - II',
      pageNumber: 2,
      pageText: 'Add the fuel amounts.',
    })
    expect(tags[0]?.templateId).toBe('add_place')
    expect(tags[0]?.params?.a).toBe(28)
  })

  it('tags fraction kit on equivalent-fractions wording in a whole book', () => {
    const tags = lookupNcertPageTags({
      classNum: 5,
      subject: 'Mathematics',
      bookTitle: 'Joyful Mathematics Class 5',
      pageNumber: 88,
      pageText: 'These are called equivalent fractions. 1/2 is equivalent to 2/4 when the same whole is shaded.',
    })
    expect(tags[0]?.templateId).toBe('fraction_kit')
  })

  it('tags pentagons vs weaving on Shapes and Patterns by page', () => {
    const weave = lookupNcertPageTags({
      classNum: 5,
      subject: 'Mathematics',
      bookTitle: 'Chapter 7 - Shapes and Patterns',
      pageNumber: 1,
      pageText: 'Let us make paper mats.',
    })
    const tess = lookupNcertPageTags({
      classNum: 5,
      subject: 'Mathematics',
      bookTitle: 'Chapter 7 - Shapes and Patterns',
      pageNumber: 3,
      pageText: 'Regular pentagons do not tessellate.',
    })
    expect(weave[0]?.templateId).toBe('weave_pattern')
    expect(tess[0]?.templateId).toBe('tessellate_fit')
  })

  it('tags EVS water cycle on essence-of-life pages', () => {
    const tags = lookupNcertPageTags({
      classNum: 5,
      subject: 'World Around Us',
      bookTitle: 'Chapter 1 - Water - The Essence of Life',
      pageNumber: 8,
      pageText: 'This constant circular movement of water in nature is called the water cycle.',
    })
    expect(tags[0]?.templateId).toBe('water_cycle')
  })

  it('leaves old Class 8 Rational Numbers untagged (2026–27 book is different)', () => {
    const tags = lookupNcertPageTags({
      classNum: 8,
      subject: 'Mathematics',
      bookTitle: 'Chapter 1 - Rational Numbers',
      pageNumber: 2,
      pageText: 'A rational number can be written as p/q.',
    })
    expect(tags).toEqual([])
  })

  it('puts locker_squares on A Square and A Cube with 100 lockers', () => {
    const tags = lookupNcertPageTags({
      classNum: 8,
      subject: 'Mathematics',
      bookTitle: 'Chapter 1 - A Square and A Cube',
      pageNumber: 2,
      pageText: 'The 100 lockers. Odd number of factors.',
    })
    expect(tags[0]?.templateId).toBe('locker_squares')
    expect(tags[0]?.params?.lockers).toBe(100)
  })

  it('does not stamp a sim on Class 8 Health', () => {
    const tags = lookupNcertPageTags({
      classNum: 8,
      subject: 'Science',
      bookTitle: 'Chapter 3 - Health - The Ultimate Treasure',
      pageNumber: 2,
      pageText: 'Is being healthy just about not having diseases?',
    })
    expect(tags).toEqual([])
  })

  it('Class 8 electromagnet is not Ohm’s law', () => {
    const tags = lookupNcertPageTags({
      classNum: 8,
      subject: 'Science',
      bookTitle: 'Chapter 4 - Electricity - Magnetic and Heating Effects',
      pageNumber: 2,
      pageText: 'An iron nail wrapped with a wire picked up iron paper clips.',
    })
    expect(tags[0]?.templateId).toBe('electromagnet_nail')
    expect(tags[0]?.params?.switch).toBe(1)
  })

  it('puts seq_pictures squares on Class 6 Patterns in Mathematics', () => {
    const tags = lookupNcertPageTags({
      classNum: 6,
      subject: 'Mathematics',
      bookTitle: 'Chapter 1 - Patterns in Mathematics',
      pageNumber: 4,
      pageText: 'Pictorial representation of some number sequences. Squares 1, 4, 9, 16, 25.',
    })
    expect(tags[0]?.templateId).toBe('seq_pictures')
    expect(tags[0]?.params?.kind).toBe(0)
  })

  it('Class 6 Prime Time is idli-vada, not rabbit jumps', () => {
    const tags = lookupNcertPageTags({
      classNum: 6,
      subject: 'Mathematics',
      bookTitle: 'Chapter 5 - Prime Time',
      pageNumber: 2,
      pageText: 'Idli-vada game. Multiples of 3 and multiples of 5. First both is 15.',
    })
    expect(tags[0]?.templateId).toBe('idli_vada')
    expect(tags[0]?.params?.a).toBe(3)
    expect(tags[0]?.params?.b).toBe(5)
  })

  it('does not stamp a sim on Class 6 Mindful Eating', () => {
    const tags = lookupNcertPageTags({
      classNum: 6,
      subject: 'Science',
      bookTitle: 'Chapter 3 - Mindful Eating - A Path to a Healthy Body',
      pageNumber: 2,
      pageText: 'A balanced diet keeps us healthy.',
    })
    expect(tags).toEqual([])
  })

  it('Class 6 magnets are stick/don’t-stick, not an electromagnet', () => {
    const tags = lookupNcertPageTags({
      classNum: 6,
      subject: 'Science',
      bookTitle: 'Chapter 4 - Exploring Magnets',
      pageNumber: 2,
      pageText: 'Materials attracted by the magnet. Iron is a magnetic material.',
    })
    expect(tags[0]?.templateId).toBe('stick_magnet')
    expect(tags[0]?.params?.object).toBe(0)
  })

  it('puts lakh_crore_chart on Class 7 Large Numbers with 1,00,000', () => {
    const tags = lookupNcertPageTags({
      classNum: 7,
      subject: 'Mathematics',
      bookTitle: 'Chapter 1 - Large Numbers Around Us',
      pageNumber: 2,
      pageText: 'One lakh is 1,00,000.',
    })
    expect(tags[0]?.templateId).toBe('lakh_crore_chart')
    expect(tags[0]?.params?.lakhs).toBe(1)
  })

  it('does not stamp the same sim on every page of Parallel and Intersecting Lines', () => {
    const crossing = lookupNcertPageTags({
      classNum: 7,
      subject: 'Mathematics',
      bookTitle: 'Chapter 5 - Parallel and Intersecting Lines',
      pageNumber: 2,
      pageText: 'Two lines intersect. Vertically opposite corners match.',
    })
    const parallel = lookupNcertPageTags({
      classNum: 7,
      subject: 'Mathematics',
      bookTitle: 'Chapter 5 - Parallel and Intersecting Lines',
      pageNumber: 5,
      pageText: 'A transversal cuts two parallel lines. Corresponding corners are equal.',
    })
    const skip = lookupNcertPageTags({
      classNum: 7,
      subject: 'Mathematics',
      bookTitle: 'Chapter 5 - Parallel and Intersecting Lines',
      pageNumber: 8,
      pageText: 'Try these questions in your notebook.',
    })
    expect(crossing[0]?.templateId).toBe('intersecting_angles')
    expect(parallel[0]?.templateId).toBe('parallel_transversal')
    expect(skip).toEqual([])
  })

  it('reuses fraction_multiply for tortoise and Aaron with different book numbers', () => {
    const tortoise = lookupNcertPageTags({
      classNum: 7,
      subject: 'Mathematics',
      bookTitle: 'Chapter 8 - Working with Fractions',
      pageNumber: 2,
      pageText: 'The tortoise walks 3 × 1/4 of the way.',
    })
    const aaron = lookupNcertPageTags({
      classNum: 7,
      subject: 'Mathematics',
      bookTitle: 'Chapter 8 - Working with Fractions',
      pageNumber: 5,
      pageText: 'Aaron takes 1/5 × 3 of the bar of chocolate.',
    })
    expect(tortoise[0]?.templateId).toBe('fraction_multiply')
    expect(tortoise[0]?.params?.den).toBe(4)
    expect(aaron[0]?.templateId).toBe('fraction_multiply')
    expect(aaron[0]?.params?.den).toBe(5)
  })

  it('tags Curiosity litmus on lemon, not a pH strip', () => {
    const tags = lookupNcertPageTags({
      classNum: 7,
      subject: 'Science',
      bookTitle: 'Chapter 2 - Exploring Substances - Acidic, Basic, and Neutral',
      pageNumber: 2,
      pageText: 'Dip blue litmus in lemon juice.',
    })
    expect(tags[0]?.templateId).toBe('litmus_lab')
    expect(tags[0]?.params?.sample).toBe(0)
  })

  it('does not tag Adolescence or Number Play', () => {
    expect(lookupNcertPageTags({
      classNum: 7,
      subject: 'Science',
      bookTitle: 'Chapter 6 - Adolescence - A Stage of Growth and Change',
      pageNumber: 2,
      pageText: 'Adolescence is a stage of growth.',
    })).toEqual([])
    expect(lookupNcertPageTags({
      classNum: 7,
      subject: 'Mathematics',
      bookTitle: 'Chapter 6 - Number Play',
      pageNumber: 2,
      pageText: 'Virahanka numbers and parity puzzles.',
    })).toEqual([])
  })

  it('Class 5 chapter list covers every tagged Maths and EVS sim chapter', () => {
    expect(CLASS5_PAGE_TAGS.length).toBeGreaterThanOrEqual(20)
    expect(tagsForPage(CLASS5_PAGE_TAGS, {
      classNum: 5,
      subject: 'Mathematics',
      bookTitle: 'Chapter 13 - Animal Jumps',
      pageNumber: 2,
      pageText: 'A rabbit takes a jump of 4. Common multiples of 3 and 4.',
    })[0]?.templateId).toBe('animal_jumps')
  })

  it('puts four_quadrant on Class 9 coordinates with (3, 4)', () => {
    const tags = lookupNcertPageTags({
      classNum: 9,
      subject: 'Mathematics',
      bookTitle: 'Chapter 1 - Orienting Yourself - The Use of Coordinates',
      pageNumber: 3,
      pageText: 'The 2-d Cartesian coordinate system. Origin O.',
    })
    expect(tags[0]?.templateId).toBe('four_quadrant')
    expect(tags[0]?.params?.x).toBe(3)
  })

  it('Class 9 motion is distance/displacement, not a sprint', () => {
    const tags = lookupNcertPageTags({
      classNum: 9,
      subject: 'Science',
      bookTitle: 'Chapter 4 - Describing Motion Around Us',
      pageNumber: 2,
      pageText: 'Distance travelled and displacement from a reference point.',
    })
    expect(tags[0]?.templateId).toBe('dist_displace')
  })

  it('Class 9 gold foil is not Ohm or Bohr shells', () => {
    const tags = lookupNcertPageTags({
      classNum: 9,
      subject: 'Science',
      bookTitle: 'Chapter 8 - Journey Inside the Atom',
      pageNumber: 4,
      pageText: 'The gold foil experiment. Rutherford. Thomson’s model.',
    })
    expect(tags[0]?.templateId).toBe('gold_foil')
  })

  it('does not stamp a sim on Class 9 human reproduction pages', () => {
    expect(lookupNcertPageTags({
      classNum: 9,
      subject: 'Science',
      bookTitle: 'Chapter 11 - Reproduction - How Life Continues',
      pageNumber: 12,
      pageText: 'Reproduction in human beings. Pregnancy and childbirth.',
    })).toEqual([])
  })

  it('puts prime_share on Class 10 Real Numbers with 6 and 20', () => {
    const tags = lookupNcertPageTags({
      classNum: 10,
      subject: 'Mathematics',
      bookTitle: 'Chapter 1 - Real Numbers',
      pageNumber: 4,
      pageText: 'Example 2 : Find the LCM and HCF of 6 and 20 by the prime factorisation method.',
    })
    expect(tags[0]?.templateId).toBe('prime_share')
    expect(tags[0]?.params?.a).toBe(6)
    expect(tags[0]?.params?.b).toBe(20)
  })

  it('Class 10 polynomials use poly_zeroes, not the empty parabola', () => {
    const tags = lookupNcertPageTags({
      classNum: 10,
      subject: 'Mathematics',
      bookTitle: 'Chapter 2 - Polynomials',
      pageNumber: 4,
      pageText: 'Geometrical meaning of the zeroes. y = x² − 3x − 4 meets at −1 and 4.',
    })
    expect(tags[0]?.templateId).toBe('poly_zeroes')
  })

  it('Class 10 Zn in CuSO4 is metal_swap, not the old rank tool', () => {
    const tags = lookupNcertPageTags({
      classNum: 10,
      subject: 'Science',
      bookTitle: 'Chapter 3 - Metals and Non-metals',
      pageNumber: 8,
      pageText: 'How do metals react with solutions of other metal salts. Zinc in copper sulphate. Reactivity series.',
    })
    expect(tags[0]?.templateId).toBe('metal_swap')
  })

  it('Class 10 myopia is eye_see; four 1.5 V cells are ohm_line', () => {
    expect(lookupNcertPageTags({
      classNum: 10,
      subject: 'Science',
      bookTitle: 'Chapter 10 - The Human Eye and the Colourful World',
      pageNumber: 3,
      pageText: 'A myopic eye. Near point 25 cm. Concave lens of suitable power.',
    })[0]?.templateId).toBe('eye_see')
    expect(lookupNcertPageTags({
      classNum: 10,
      subject: 'Science',
      bookTitle: 'Chapter 11 - Electricity',
      pageNumber: 5,
      pageText: 'Activity 11.1. Four cells of 1.5 V each. Nichrome wire. Ohm’s law.',
    })[0]?.templateId).toBe('ohm_line')
  })

  it('does not stamp a sim on Class 10 human reproduction pages', () => {
    expect(lookupNcertPageTags({
      classNum: 10,
      subject: 'Science',
      bookTitle: 'Chapter 7 - How do Organisms Reproduce',
      pageNumber: 11,
      pageText: 'Male reproductive system. Female reproductive system. Pregnancy.',
    })).toEqual([])
  })

  it('Class 6 rotating arms is rotate_arms, not a line segment', () => {
    const tags = lookupNcertPageTags({
      classNum: 6,
      subject: 'Mathematics',
      bookTitle: 'Chapter 2 - Lines and Angles',
      pageNumber: 13,
      pageText: 'Making rotating arms using two paper straws and a paper clip. An angle is formed by two rays having a common starting point.',
    })
    expect(tags[0]?.templateId).toBe('rotate_arms')
    expect(tags[0]?.params?.angleDeg).toBe(90)
  })

  it('Class 6 12 m × 10 m land is flower_beds, not walking the boundary', () => {
    const tags = lookupNcertPageTags({
      classNum: 6,
      subject: 'Mathematics',
      bookTitle: 'Chapter 6 - Perimeter and Area',
      pageNumber: 10,
      pageText: 'Area of the whole land = 12 m × 10 m = 120 sq m. Four square flower beds of side 4 m.',
    })
    expect(tags[0]?.templateId).toBe('flower_beds')
    expect(tags[0]?.params?.length).toBe(12)
    expect(tags[0]?.params?.width).toBe(10)
  })

  it('Class 6 types of motion is kind_of_move, not a handspan', () => {
    const tags = lookupNcertPageTags({
      classNum: 6,
      subject: 'Science',
      bookTitle: 'Chapter 5 - Measurement of Length and Motion',
      pageNumber: 15,
      pageText: 'Oscillatory motion. A swing moving to and fro. Types of motion in a children’s park.',
    })
    expect(tags[0]?.templateId).toBe('kind_of_move')
    expect(tags[0]?.params?.look).toBe(3)
  })

  it('Class 8 convex lens is two_lenses, not the spoon', () => {
    const tags = lookupNcertPageTags({
      classNum: 8,
      subject: 'Science',
      bookTitle: 'Chapter 10 - Light - Mirrors and Lenses',
      pageNumber: 11,
      pageText: 'A lens which is thicker at the middle is called a convex lens. A magnifying glass.',
    })
    expect(tags[0]?.templateId).toBe('two_lenses')
    expect(tags[0]?.params?.kind).toBe(0)
  })

  it('Class 8 sea breeze is wind_spin, not bag straps', () => {
    const tags = lookupNcertPageTags({
      classNum: 8,
      subject: 'Science',
      bookTitle: 'Chapter 6 - Pressure, Winds, Storms, and Cyclones',
      pageNumber: 10,
      pageText: 'How do winds form? As land gets heated faster during the day, a sea breeze starts.',
    })
    expect(tags[0]?.templateId).toBe('wind_spin')
    expect(tags[0]?.params?.look).toBe(0)
  })

  it('Class 5 six seasons is india_seasons, not globe-and-torch', () => {
    const tags = lookupNcertPageTags({
      classNum: 5,
      subject: 'World Around Us',
      bookTitle: 'Chapter 9 - Rhythms of Nature',
      pageNumber: 11,
      pageText: 'Saba and Aparna keep a seasons journal. India hosts six seasons. Vasanta is spring.',
    })
    expect(tags[0]?.templateId).toBe('india_seasons')
    expect(tags[0]?.params?.season).toBe(0)
  })
})

describe('invertFirstPlacements', () => {
  it('maps a tagged template to its first chapter page', () => {
    const map = firstPlacementByTemplateId()
    const seasons = map.get('india_seasons')
    expect(seasons?.classNum).toBe(5)
    expect(seasons?.subject).toBe('EVS')
    expect(seasons?.page).toBe(7)
    expect(seasons?.params?.season).toBe(0)
    expect(seasons?.extraPages).toContain(11)
  })
})
