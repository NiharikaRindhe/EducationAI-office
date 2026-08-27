// Ported from pdf-simulation-master/web/src/features/pdf-simulator/__tests__/
// capturePdfPage.test.ts — capturePdfPage.ts itself is byte-identical to
// upstream (see api.ts's header comment on the integration boundary), so
// this test carries over unchanged apart from the @pdf-sim/shared ->
// @sim/shared alias.
import { beforeEach, describe, expect, it } from 'vitest'
import { resolveChatPageImage } from '@sim/shared'
import {
  cachedPageImage,
  clearPageImageCache,
  composeOutgoingText,
  cropCanvasToJpeg,
  DEFAULT_FIGURE_PROMPT,
  estimateDataUrlBytes,
  firstClipboardImage,
  MIN_SNIP_PX,
  normalizeDragRect,
  overlayRectToCanvasPixels,
  pageImageCacheKey,
  parseImageDataUrl,
  pickTurnImage,
  rememberPageImage,
  zoomBucket,
} from '../utils/capturePdfPage.js'

describe('capturePdfPage helpers', () => {
  beforeEach(() => {
    clearPageImageCache()
  })

  it('buckets zoom to one decimal', () => {
    expect(zoomBucket(1.149)).toBe(1.1)
    expect(zoomBucket(1.15)).toBe(1.2)
  })

  it('builds cache keys from book, page, and zoom bucket', () => {
    expect(pageImageCacheKey('abc', 4, 1.149)).toBe('abc:4:1.1')
    expect(pageImageCacheKey(undefined, 1, 1)).toBe('book:1:1')
  })

  it('remembers page images with a small LRU', () => {
    rememberPageImage('a', 'data:image/jpeg;base64,aaa')
    expect(cachedPageImage('a')).toBe('data:image/jpeg;base64,aaa')
    for (let i = 0; i < 10; i++) {
      rememberPageImage(`k${i}`, `data:image/jpeg;base64,${i}`)
    }
    expect(cachedPageImage('a')).toBeUndefined()
    expect(cachedPageImage('k9')).toBe('data:image/jpeg;base64,9')
  })

  it('prefers an explicit paste/snip image over the silent full page', () => {
    const snip = 'data:image/jpeg;base64,snip'
    const page = 'data:image/jpeg;base64,page'
    expect(pickTurnImage(snip, page)).toBe(snip)
    expect(pickTurnImage(null, page)).toBe(page)
    expect(pickTurnImage(undefined, null)).toBeUndefined()
    expect(pickTurnImage('not-an-image', page)).toBe(page)
  })

  it('resolveChatPageImage only attaches full page when visual intent matches', () => {
    const page = 'data:image/jpeg;base64,page'
    expect(resolveChatPageImage({ question: 'Explain inertia', fullPageImage: page })).toBeUndefined()
    expect(resolveChatPageImage({ question: 'Explain the diagram', fullPageImage: page })).toBe(page)
    expect(
      resolveChatPageImage({
        question: 'Why?',
        fullPageImage: page,
        recentHadImage: true,
      })
    ).toBe(page)
  })

  it('uses the default figure prompt when text is empty but an image is attached', () => {
    expect(composeOutgoingText('  ', true)).toBe(DEFAULT_FIGURE_PROMPT)
    expect(composeOutgoingText('What is this ray?', true)).toBe('What is this ray?')
    expect(composeOutgoingText('', false)).toBe('')
  })

  it('picks the first clipboard image file', () => {
    const image = new File(['x'], 'fig.png', { type: 'image/png' })
    const text = new File(['y'], 'note.txt', { type: 'text/plain' })
    const data = {
      items: [
        { kind: 'string', type: 'text/plain', getAsFile: () => null },
        { kind: 'file', type: 'image/png', getAsFile: () => image },
      ],
      files: [text, image],
    } as unknown as DataTransfer
    expect(firstClipboardImage(data)).toBe(image)
    expect(firstClipboardImage(null)).toBeNull()
  })

  it('rejects snips smaller than the minimum drag', () => {
    const canvas = { width: 400, height: 300 } as HTMLCanvasElement
    expect(cropCanvasToJpeg(canvas, { x: 10, y: 10, w: MIN_SNIP_PX - 1, h: 40 })).toBeNull()
    expect(cropCanvasToJpeg(canvas, { x: 10, y: 10, w: 40, h: 2 })).toBeNull()
  })

  it('parses jpeg data URLs and estimates decoded bytes', () => {
    const dataUrl = 'data:image/jpeg;base64,AAAA'
    const parsed = parseImageDataUrl(dataUrl)
    expect(parsed?.mime).toBe('image/jpeg')
    expect(parsed?.base64).toBe('AAAA')
    expect(estimateDataUrlBytes(dataUrl)).toBeGreaterThan(0)
    expect(parseImageDataUrl('https://example.com/x.png')).toBeNull()
  })

  it('maps overlay drag rects onto canvas pixels', () => {
    const drag = normalizeDragRect(80, 20, 20, 60)
    expect(drag).toEqual({ x: 20, y: 20, w: 60, h: 40 })
    const mapped = overlayRectToCanvasPixels(drag, { w: 100, h: 100 }, { w: 1000, h: 2000 })
    expect(mapped).toEqual({ x: 200, y: 400, w: 600, h: 800 })
  })

  it('exposes a default prompt for image-only sends', () => {
    expect(DEFAULT_FIGURE_PROMPT.length).toBeGreaterThan(8)
  })
})
