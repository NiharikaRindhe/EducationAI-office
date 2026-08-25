import { describe, it, expect } from 'vitest'
import {
  DEFAULT_FIGURE_PROMPT,
  resolveChatPageImage,
  shouldAttachPageImage,
  wantsPageImage,
} from './imageIntent.js'

const SNIP = 'data:image/jpeg;base64,snip'
const PAGE = 'data:image/jpeg;base64,page'

describe('wantsPageImage', () => {
  it('returns false for plain concept questions', () => {
    expect(wantsPageImage({ question: "Explain Newton's second law" })).toBe(false)
    expect(wantsPageImage({ question: 'What is the main idea on this page?' })).toBe(false)
  })

  it('returns true when a snip or paste is attached', () => {
    expect(wantsPageImage({ question: 'help', explicitImage: SNIP })).toBe(true)
    expect(wantsPageImage({ question: 'help', userAttachedImage: true })).toBe(true)
  })

  it('returns true for visual questions', () => {
    expect(wantsPageImage({ question: 'Explain the diagram on this page' })).toBe(true)
    expect(wantsPageImage({ question: 'What does this graph show?' })).toBe(true)
    expect(wantsPageImage({ question: DEFAULT_FIGURE_PROMPT })).toBe(true)
  })

  it('returns true for short follow-ups after an image turn', () => {
    expect(wantsPageImage({ question: 'Why?', recentHadImage: true })).toBe(true)
    expect(wantsPageImage({ question: 'What about the y-axis?', recentHadImage: true })).toBe(true)
    expect(wantsPageImage({ question: 'Why?', recentHadImage: false })).toBe(false)
  })
})

describe('resolveChatPageImage', () => {
  it('prefers snip over full page', () => {
    expect(resolveChatPageImage({ question: 'text', explicitImage: SNIP, fullPageImage: PAGE })).toBe(SNIP)
  })

  it('uses full page only when intent matches', () => {
    expect(resolveChatPageImage({ question: 'Explain inertia', fullPageImage: PAGE })).toBeUndefined()
    expect(resolveChatPageImage({ question: 'Explain the diagram', fullPageImage: PAGE })).toBe(PAGE)
  })
})

describe('shouldAttachPageImage', () => {
  it('always keeps user-attached images', () => {
    expect(
      shouldAttachPageImage({
        question: 'Explain inertia',
        pageImage: SNIP,
        imageSource: 'user',
      })
    ).toBe(true)
  })

  it('drops auto full-page images for text-only questions', () => {
    expect(
      shouldAttachPageImage({
        question: 'Explain inertia',
        pageImage: PAGE,
        imageSource: 'auto',
      })
    ).toBe(false)
    expect(
      shouldAttachPageImage({
        question: 'What does this figure show?',
        pageImage: PAGE,
        imageSource: 'auto',
      })
    ).toBe(true)
  })
})
