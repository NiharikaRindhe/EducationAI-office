// Ported from pdf-simulation-master/web/src/features/pdf-simulator/__tests__/
// pdfPageText.test.ts — pdfPageText.ts is byte-identical to upstream, so
// this carries over unchanged.
import { describe, expect, it } from 'vitest'
import { joinPdfPageText } from '../utils/pdfPageText.js'

describe('joinPdfPageText', () => {
  it('joins PDF text items into a readable page string', () => {
    const text = joinPdfPageText([
      { str: 'Newton', hasEOL: false },
      { str: 'First Law', hasEOL: true },
      { str: 'A body at rest stays at rest.', hasEOL: true },
    ])
    expect(text).toContain('Newton')
    expect(text).toContain('First Law')
    expect(text).toContain('A body at rest stays at rest.')
  })

  it('returns empty string for empty items', () => {
    expect(joinPdfPageText([])).toBe('')
  })
})
