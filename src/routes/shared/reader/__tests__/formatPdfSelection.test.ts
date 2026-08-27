// Ported from pdf-simulation-master/web/src/features/pdf-simulator/__tests__/
// formatPdfSelection.test.ts — formatPdfSelection.ts is byte-identical to
// upstream, so this carries over unchanged.
import { describe, expect, it } from 'vitest'
import {
  formatPdfSelectionText,
  joinPdfSpansAsLines,
  parseHighlightBlocks,
} from '../utils/formatPdfSelection.js'

describe('joinPdfSpansAsLines', () => {
  it('keeps spans on the same visual row on one line', () => {
    const text = joinPdfSpansAsLines([
      { text: 'Force', top: 40, left: 80, height: 12 },
      { text: 'is a push', top: 41, left: 120, height: 12 },
      { text: 'or pull.', top: 40.5, left: 190, height: 12 },
    ])
    expect(text).toBe('Force is a push or pull.')
  })

  it('starts a new line when the Y position jumps', () => {
    const text = joinPdfSpansAsLines([
      { text: '•', top: 40, left: 60, height: 12 },
      { text: 'Force', top: 40, left: 80, height: 12 },
      { text: '•', top: 58, left: 60, height: 12 },
      { text: 'Mass', top: 58, left: 80, height: 12 },
    ])
    expect(text).toBe('• Force\n• Mass')
  })

  it('does not insert a space before punctuation', () => {
    const text = joinPdfSpansAsLines([
      { text: 'rest', top: 10, left: 10, height: 12 },
      { text: '.', top: 10, left: 40, height: 12 },
    ])
    expect(text).toBe('rest.')
  })
})

describe('formatPdfSelectionText', () => {
  it('splits flattened unicode bullets onto their own lines', () => {
    expect(formatPdfSelectionText('• Force is a push or pull • Mass is the amount of matter')).toBe(
      '• Force is a push or pull\n• Mass is the amount of matter'
    )
  })

  it('splits sequential numbered items that were collapsed onto one line', () => {
    expect(formatPdfSelectionText('1. First law 2. Second law 3. Third law')).toBe(
      '1. First law\n2. Second law\n3. Third law'
    )
  })

  it('does not treat a lone mid-sentence number as a list', () => {
    expect(formatPdfSelectionText('See Fig. 12. Then compare the two cases.')).toBe(
      'See Fig. 12. Then compare the two cases.'
    )
  })

  it('keeps existing line breaks', () => {
    expect(formatPdfSelectionText('• Force\n• Mass\n• Acceleration')).toBe(
      '• Force\n• Mass\n• Acceleration'
    )
  })

  it('is idempotent', () => {
    const once = formatPdfSelectionText('• Force is a push • Mass is matter')
    expect(formatPdfSelectionText(once)).toBe(once)
  })

  it('adds a space after a glued bullet glyph', () => {
    expect(formatPdfSelectionText('•Force')).toBe('• Force')
  })

  it('merges wrapped list-item continuations', () => {
    expect(formatPdfSelectionText('• Force is a push\nor a pull\n• Mass')).toBe(
      '• Force is a push or a pull\n• Mass'
    )
  })

  it('returns empty string for empty input', () => {
    expect(formatPdfSelectionText('')).toBe('')
    expect(formatPdfSelectionText('   ')).toBe('')
  })
})

describe('parseHighlightBlocks', () => {
  it('groups bullet lines into a list', () => {
    expect(parseHighlightBlocks('• Force\n• Mass')).toEqual([
      { type: 'ul', items: ['Force', 'Mass'] },
    ])
  })

  it('groups numbered lines into an ordered list', () => {
    expect(parseHighlightBlocks('1. First law 2. Second law')).toEqual([
      { type: 'ol', items: ['First law', 'Second law'], start: 1 },
    ])
  })

  it('keeps a heading paragraph before a list', () => {
    expect(parseHighlightBlocks('Newton’s laws\n• Inertia\n• Force')).toEqual([
      { type: 'p', text: 'Newton’s laws' },
      { type: 'ul', items: ['Inertia', 'Force'] },
    ])
  })

  it('does not treat a normal sentence as a bullet', () => {
    expect(parseHighlightBlocks('The force is a push or a pull.')).toEqual([
      { type: 'p', text: 'The force is a push or a pull.' },
    ])
  })
})
