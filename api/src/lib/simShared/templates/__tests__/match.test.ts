import { describe, it, expect } from 'vitest'
import { matchTemplateFromText } from '../match.js'

describe('matchTemplateFromText — NCERT-like quotes', () => {
  it('st_vt_graph from rest, a = 2, 5 s', () => {
    const m = matchTemplateFromText(
      'A body starts from rest and moves with acceleration 2 m/s². Draw the s–t and v–t graphs for 5 s.'
    )
    expect(m?.templateId).toBe('st_vt_graph')
    expect(m?.params.u).toBe(0)
    expect(m?.params.a).toBe(2)
    expect(m?.params.tMax).toBe(5)
  })

  it('vi_graph beats generic Ohm', () => {
    const m = matchTemplateFromText('The V–I graph for a resistor of 4 Ω is drawn up to 12 V.')
    expect(m?.templateId).toBe('vi_graph')
    expect(m?.params.R).toBe(4)
    expect(m?.params.Vmax).toBe(12)
  })

  it('series_parallel series 2 Ω and 3 Ω on 10 V', () => {
    const m = matchTemplateFromText(
      'Two resistors of 2 Ω and 3 Ω are connected in series across a 10 V battery.'
    )
    expect(m?.templateId).toBe('series_parallel')
    expect(m?.params.R1).toBe(2)
    expect(m?.params.R2).toBe(3)
    expect(m?.params.V).toBe(10)
    expect(m?.params.mode).toBe(0)
  })

  it('AP keywords beat motion a', () => {
    const m = matchTemplateFromText(
      'An A.P. has first term a = 2, common difference d = 3 and n = 5 terms.'
    )
    expect(m?.templateId).toBe('ap_graph')
    expect(m?.params.a).toBe(2)
    expect(m?.params.d).toBe(3)
    expect(m?.params.n).toBe(5)
  })

  it('section_formula midpoint 1:1', () => {
    const m = matchTemplateFromText(
      'Find the point that divides the join of (0, 0) and (4, 2) internally in the ratio 1:1.'
    )
    expect(m?.templateId).toBe('section_formula')
    expect(m?.params.x1).toBe(0)
    expect(m?.params.y1).toBe(0)
    expect(m?.params.x2).toBe(4)
    expect(m?.params.y2).toBe(2)
    expect(m?.params.m).toBe(1)
    expect(m?.params.n).toBe(1)
  })

  it('ph_strip from pH = 3', () => {
    const m = matchTemplateFromText('A solution has pH = 3 on the universal indicator scale.')
    expect(m?.templateId).toBe('ph_strip')
    expect(m?.params.pH).toBe(3)
  })

  it('echo from a cliff 340 m, v = 340 m/s', () => {
    const m = matchTemplateFromText(
      'An echo is heard from a cliff 340 m away. Speed of sound is 340 m/s.'
    )
    expect(m?.templateId).toBe('echo')
    expect(m?.params.distance).toBe(340)
    expect(m?.params.vSound).toBe(340)
  })

  it('equation_balance 2x + 3 = 11', () => {
    const m = matchTemplateFromText('Solve 2x + 3 = 11')
    expect(m?.templateId).toBe('equation_balance')
    expect(m?.params.coeff).toBe(2)
    expect(m?.params.addend).toBe(3)
    expect(m?.params.rhs).toBe(11)
  })

  it('probability_spinner favourable / total', () => {
    const m = matchTemplateFromText('A spinner has 2 favourable outcomes out of 6 equally likely.')
    expect(m?.templateId).toBe('probability_spinner')
    expect(m?.params.favorable).toBe(2)
    expect(m?.params.total).toBe(6)
  })

  it('pressure_area F and A', () => {
    const m = matchTemplateFromText('A force of 10 N acts on an area of 2 m². Find the pressure.')
    expect(m?.templateId).toBe('pressure_area')
    expect(m?.params.force).toBe(10)
    expect(m?.params.area).toBe(2)
  })

  it('reactivity_swap zinc vs copper', () => {
    const m = matchTemplateFromText('Zinc is added to copper sulphate solution.')
    expect(m?.templateId).toBe('reactivity_swap')
    expect(m?.params.metalA).toBe(2)
    expect(m?.params.metalB).toBe(4)
  })

  it('parallel mode is 1', () => {
    const m = matchTemplateFromText(
      'Two resistors of 2 Ω and 3 Ω are connected in parallel across a 10 V battery.'
    )
    expect(m?.templateId).toBe('series_parallel')
    expect(m?.params.mode).toBe(1)
  })

  it('does not use Fig. 8.5 as launch speed', () => {
    const m = matchTemplateFromText('A ball is thrown at 20 m/s (see Fig. 8.5).')
    expect(m?.params.v0).toBe(20)
    expect(Object.values(m?.params ?? {})).not.toContain(8.5)
  })

  it('does not use Fig. 3.2 as resistance', () => {
    const m = matchTemplateFromText(
      "Fig. 3.2: a 6 V battery is connected across a 4 Ω resistor. Find the current using Ohm's law."
    )
    expect(m?.templateId).toBe('ohm_circuit')
    expect(m?.params.R).toBe(4)
    expect(m?.params.V).toBe(6)
    expect(Object.values(m?.params ?? {})).not.toContain(3.2)
  })

  it('keeps 8.5 m as height when Fig. 8.5 is also present', () => {
    const m = matchTemplateFromText('A stone is dropped from 8.5 m (Fig. 8.5). Take g = 9.8 m/s².')
    expect(m?.params.h0).toBe(8.5)
  })

  it('does not use Activity 8.4 as a resistor value', () => {
    const m = matchTemplateFromText(
      'Activity 8.4: two resistors of 2 Ω and 3 Ω are connected in series across a 10 V battery.'
    )
    expect(m?.templateId).toBe('series_parallel')
    expect(m?.params.R1).toBe(2)
    expect(m?.params.R2).toBe(3)
    expect(Object.values(m?.params ?? {})).not.toContain(8.4)
  })

  it('Class 5 equivalent fractions use the fraction kit, not the generic bar', () => {
    const m = matchTemplateFromText(
      'These are called equivalent fractions. 1/2 is equivalent to 2/4 when the same whole is shaded.'
    )
    expect(m?.templateId).toBe('fraction_kit')
    expect(m?.params.numerator).toBe(1)
    expect(m?.params.denominator).toBe(2)
  })

  it('Class 5 rabbit and frog jumps land on common multiples', () => {
    const m = matchTemplateFromText(
      'A rabbit takes a jump of 4 each time. A frog takes a jump of 3 each time. Use the number line to find the common multiples of 3 and 4.'
    )
    expect(m?.templateId).toBe('animal_jumps')
    expect(m?.params.jumpA).toBe(4)
    expect(m?.params.jumpB).toBe(3)
  })

  it('Class 5 water cycle beats generic states of matter', () => {
    const m = matchTemplateFromText(
      'Follow the water cycle: evaporation, condensation, and rain return water to the river.'
    )
    expect(m?.templateId).toBe('water_cycle')
  })

  it('Class 5 pictograph uses one picture for every 5 items', () => {
    const m = matchTemplateFromText(
      'Dipesh used a pictograph. One picture stands for every 5 toys. Data through pictures helps record a large number of things.'
    )
    expect(m?.templateId).toBe('picture_data')
    expect(m?.params.scale).toBe(5)
  })

  it('Class 7 lakh is not the Class 5 ten-thousand chart', () => {
    const m = matchTemplateFromText('One lakh is 1,00,000. Large numbers around us use Indian place value.')
    expect(m?.templateId).toBe('lakh_crore_chart')
    expect(m?.params.lakhs).toBe(1)
  })

  it('Class 7 12 ft × 16 ft room uses square tiles, not animal jumps', () => {
    const m = matchTemplateFromText(
      'A 12 ft × 16 ft room is tiled with the largest square tile. Finding common ground: HCF.'
    )
    expect(m?.templateId).toBe('hcf_tiles')
    expect(m?.params.width).toBe(12)
    expect(m?.params.length).toBe(16)
  })

  it('Class 7 100 m sprint is not a pendulum', () => {
    const m = matchTemplateFromText(
      'A 100 m race is timed with a stopwatch. Speed = distance ÷ time. Measurement of time and motion.'
    )
    expect(m?.templateId).toBe('sprint_speed')
    expect(m?.params.distance).toBe(100)
  })

  it('Class 8 lockers are square numbers, not a square grid', () => {
    const m = matchTemplateFromText(
      '100 lockers. A locker stays open only if it has an odd number of factors. A square and a cube.'
    )
    expect(m?.templateId).toBe('locker_squares')
  })

  it('Class 8 Baudhāyana doubling is not the old 3-4-5 Pythagoras drop-in', () => {
    const m = matchTemplateFromText(
      'Baudhāyana considers doubling a square. The diagonal of a square produces a square of double the area. Sulba-Sūtra.'
    )
    expect(m?.templateId).toBe('baudhayana_square')
  })

  it('Class 8 electromagnet is not Ohm or Joule heat', () => {
    const m = matchTemplateFromText(
      'An iron nail wrapped with wire picked up iron paper clips when the circuit closed. An electromagnet.'
    )
    expect(m?.templateId).toBe('electromagnet_nail')
  })

  it('Class 6 idli-vada is not rabbit and frog jumps', () => {
    const m = matchTemplateFromText(
      'Prime Time. Players say idli instead of multiples of 3 and vada instead of multiples of 5. The first idli-vada is 15.'
    )
    expect(m?.templateId).toBe('idli_vada')
  })

  it('Class 6 roti shares are not the Class 5 fraction kit', () => {
    const m = matchTemplateFromText(
      'One roti is divided equally between two children. Each child gets one half. Four children share 1/4 roti.'
    )
    expect(m?.templateId).toBe('roti_share')
  })

  it('Class 9 gold foil is not Bohr energy levels', () => {
    const m = matchTemplateFromText(
      'Journey inside the atom. The gold foil experiment. Rutherford. Most particles go through.'
    )
    expect(m?.templateId).toBe('gold_foil')
  })

  it('Class 9 wheat bag work is not the old W=Fs lab', () => {
    const m = matchTemplateFromText(
      'A wheat bag of 5 kg is lifted 1 m. Work, energy and simple machines. W = mgh.'
    )
    expect(m?.templateId).toBe('lift_work')
  })

  it('Class 9 relay stagger is not a circle sector', () => {
    const m = matchTemplateFromText(
      'Athletes at the start of a 4 × 100 m relay. The stagger on a 400 m track. C/D ratio.'
    )
    expect(m?.templateId).toBe('track_stagger')
  })

  it('Class 10 two dice theoretical is fair_chance, not maybe_chance', () => {
    const m = matchTemplateFromText(
      'Probability — a theoretical approach. Two dice. Fig. 14.3. Outcomes (2,6) (3,5) (4,4) (5,3) (6,2).'
    )
    expect(m?.templateId).toBe('fair_chance')
  })

  it('Class 10 24 cm 7 cm right triangle is not the unit circle', () => {
    const m = matchTemplateFromText(
      'Introduction to trigonometry. In triangle ABC right-angled at B, AB = 24 cm, BC = 7 cm. Trigonometric ratios.'
    )
    expect(m?.templateId).toBe('right_trig')
  })

  it('Class 10 four 1.5 V cells is ohm_line, not ohm_circuit', () => {
    const m = matchTemplateFromText(
      'Electricity. Activity 11.1. Four cells of 1.5 V each. Nichrome wire. Plot V–I.'
    )
    expect(m?.templateId).toBe('ohm_line')
  })

  it('Class 6 two rays with a common starting point is rotate_arms', () => {
    const m = matchTemplateFromText(
      'An angle is formed by two rays having a common starting point. Making rotating arms using two paper straws.'
    )
    expect(m?.templateId).toBe('rotate_arms')
  })

  it('Class 6 flower beds 120 sq m is not perimeter tape', () => {
    const m = matchTemplateFromText(
      'Area of the whole land = 12 m × 10 m = 120 sq m. Four square flower beds of side 4 m.'
    )
    expect(m?.templateId).toBe('flower_beds')
  })

  it('Class 6 oscillatory swing is kind_of_move, not a stopwatch sprint', () => {
    const m = matchTemplateFromText(
      'Types of motion. Oscillatory motion. A swing moving to and fro. Merry-go-round is circular motion.'
    )
    expect(m?.templateId).toBe('kind_of_move')
  })

  it('Class 8 magnifying glass is two_lenses, not a spoon or the lens formula', () => {
    const m = matchTemplateFromText(
      'A convex lens is thicker at the middle. A magnifying glass. Converging lens. No 1/v − 1/u.'
    )
    expect(m?.templateId).toBe('two_lenses')
  })

  it('Class 8 sea breeze is wind_spin, not picnic straps', () => {
    const m = matchTemplateFromText(
      'How do winds form? Land gets heated faster. Sea breeze. Cyclones form over warm ocean waters.'
    )
    expect(m?.templateId).toBe('wind_spin')
  })

  it('Class 5 Vasanta six seasons is india_seasons, not day and night', () => {
    const m = matchTemplateFromText(
      'Rhythms of nature. Saba and Aparna keep a seasons journal. India hosts six seasons. Vasanta is spring.'
    )
    expect(m?.templateId).toBe('india_seasons')
  })
})
