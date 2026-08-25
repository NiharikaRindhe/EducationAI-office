import { describe, expect, it } from 'vitest'
import {
  citationValues,
  dropCitationParams,
  maskCitations,
  quantityValues,
} from '../citations.js'

describe('citationValues / maskCitations', () => {
  it('picks Fig. 8.5 as 8.5, not 8 and 5', () => {
    expect(citationValues('A ball is thrown at 20 m/s (see Fig. 8.5).')).toEqual([8.5])
    expect(maskCitations('see Fig. 8.5')).toBe('see Fig. [REF]')
  })

  it('handles Figure, Table, Activity, Example, Exercise, Q. and lists', () => {
    expect(citationValues('Figure 3.2 shows a circuit')).toEqual([3.2])
    expect(citationValues('Activity 8.4: two resistors')).toEqual([8.4])
    expect(citationValues('Example 9.1')).toEqual([9.1])
    expect(citationValues('Exercise 10.3')).toEqual([10.3])
    expect(citationValues('Q. 8 is numerical')).toEqual([8])
    expect(citationValues('Question 3')).toEqual([3])
    expect(citationValues('Table 4.1')).toEqual([4.1])
    expect(citationValues('Fig. 8.5 and 8.6')).toEqual([8.5, 8.6])
    expect(citationValues('Fig. 8.5(a)')).toEqual([8.5])
    expect(maskCitations('Fig. 8.5 and 8.6')).toBe('Fig. [REF] and [REF]')
  })
})

describe('quantityValues', () => {
  it('keeps unit-backed numbers including the same digits as a figure id', () => {
    const text = 'dropped from 8.5 m (Fig. 8.5)'
    expect(quantityValues(text)).toContain(8.5)
    expect(citationValues(text)).toContain(8.5)
  })

  it('reads 20 m/s and 4 Ω as quantities, not Fig. 3.2', () => {
    expect(quantityValues('A ball is thrown at 20 m/s (see Fig. 8.5).')).toEqual([20])
    expect(quantityValues('Fig. 3.2 shows a 4 Ω resistor.')).toEqual([4])
  })
})

describe('dropCitationParams', () => {
  it('omits a param that is only a figure id', () => {
    const text = 'A ball is thrown at 20 m/s (see Fig. 8.5).'
    const next = dropCitationParams({ v0: 8.5, angleDeg: 45 }, text)
    expect(next?.v0).toBeUndefined()
    expect(next?.angleDeg).toBe(45)
  })

  it('keeps a figure-like number when it is also a measured height', () => {
    const text = 'A stone is dropped from 8.5 m (Fig. 8.5).'
    const next = dropCitationParams({ h0: 8.5 }, text)
    expect(next?.h0).toBe(8.5)
  })

  it('does not treat 0/1 choice codes as citations', () => {
    const text = 'Example 1: two resistors in series.'
    const next = dropCitationParams({ mode: 1, R1: 2 }, text)
    expect(next?.mode).toBe(1)
  })
})
