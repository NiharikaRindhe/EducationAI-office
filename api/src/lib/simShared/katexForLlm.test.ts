import { describe, expect, it } from 'vitest'
import { looksLikeMathLine, toKatexForLlm, unicodeMathToLatex } from './katexForLlm.js'

describe('toKatexForLlm', () => {
  it('wraps a flattened mirror formula as KaTeX fractions', () => {
    const out = toKatexForLlm('1/v + 1/u = 1/f')
    expect(out).toContain('$')
    expect(out).toContain('\\frac{1}{v}')
    expect(out).toContain('\\frac{1}{u}')
    expect(out).toContain('\\frac{1}{f}')
  })

  it('converts unicode superscripts and subscripts', () => {
    const out = toKatexForLlm('E = mc² and R₁ + R₂')
    expect(out).toContain('^{2}')
    expect(out).toContain('_{1}')
    expect(out).toContain('_{2}')
  })

  it('converts greek letters and operators', () => {
    const out = unicodeMathToLatex('θ ≈ π/2 × λ')
    expect(out).toContain('\\theta')
    expect(out).toContain('\\pi')
    expect(out).toContain('\\approx')
    expect(out).toContain('\\times')
    expect(out).toContain('\\lambda')
  })

  it('wraps F = ma inside a sentence', () => {
    const out = toKatexForLlm('Newton second law is F = ma and it is used here.')
    expect(out).toContain('$F = ma$')
    expect(out).toContain('Newton second law')
  })

  it('is idempotent for already-delimited KaTeX', () => {
    const once = toKatexForLlm('$F = ma$')
    const twice = toKatexForLlm(once)
    expect(twice).toBe('$F = ma$')
  })

  it('leaves ordinary prose unchanged', () => {
    const prose = 'A body at rest stays at rest unless a force acts on it.'
    expect(toKatexForLlm(prose)).toBe(prose)
  })

  it('marks equation-only lines as math', () => {
    expect(looksLikeMathLine('1/v + 1/u = 1/f')).toBe(true)
    expect(looksLikeMathLine('A body at rest stays at rest.')).toBe(false)
  })

  it('converts sin theta unicode into KaTeX functions', () => {
    const out = toKatexForLlm('sin θ = opposite/hypotenuse')
    expect(out).toContain('\\sin')
    expect(out).toContain('\\theta')
    expect(out).toContain('\\frac{opposite}{hypotenuse}')
  })

  it('does not wrap surrounding English into the math delimiters', () => {
    const out = toKatexForLlm('The mirror formula is 1/v + 1/u = 1/f.')
    expect(out).toContain('The mirror formula is')
    expect(out).toContain('$')
    expect(out).toContain('\\frac{1}{f}')
    expect(out.startsWith('$The')).toBe(false)
  })

  it('converts unicode formulas in a prompt without an equals sign', () => {
    const out = toKatexForLlm('the length of the arc is 2πr × θ/360°')
    expect(out).toContain('\\pi')
    expect(out).toContain('\\theta')
    expect(out).toContain('\\times')
    expect(out).toContain('\\frac')
    expect(out).toContain('\\circ')
    expect(out).toContain('$')
    expect(out).not.toContain('2\\pir')
  })

  it('rejoins stacked PDF-pasted formula lines', () => {
    const out = toKatexForLlm('the length of the arc is 2πr ×\nθ\n360°')
    expect(out).toContain('\\frac')
    expect(out).toContain('\\theta')
    expect(out).toMatch(/360/)
    expect(out.split('\n').filter((l) => l.trim() === '\\theta' || l.trim() === 'θ')).toHaveLength(0)
  })
})
