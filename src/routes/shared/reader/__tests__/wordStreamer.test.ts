// Ported from pdf-simulation-master/web/src/features/pdf-simulator/__tests__/
// wordStreamer.test.ts — wordStreamer.ts is byte-identical to upstream, so
// this carries over unchanged. Directly relevant to the real-streaming
// restoration: this is what confirms appendTarget() expects the
// cumulative target text on every call (see api.ts's sendChatMessageStream
// and its header comment).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createWordStreamer } from '../utils/wordStreamer.js'

describe('createWordStreamer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('streams text word by word with proper intervals', async () => {
    const revealed: string[] = []
    const onComplete = vi.fn()

    const streamer = createWordStreamer({
      onWord: (text) => revealed.push(text),
      onComplete,
      wordDelayMs: 20,
    })

    streamer.appendTarget('Newton second law of motion.')

    // Initial tick (0ms)
    vi.advanceTimersByTime(0)
    expect(revealed[0]).toBe('Newton ')

    // Advance 20ms
    vi.advanceTimersByTime(20)
    expect(revealed[1]).toBe('Newton second ')

    // Advance 20ms
    vi.advanceTimersByTime(20)
    expect(revealed[2]).toBe('Newton second law ')

    // Advance remaining
    vi.advanceTimersByTime(60)
    expect(revealed[revealed.length - 1]).toBe('Newton second law of motion.')

    await streamer.finish()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('handles growing target text smoothly as chunks arrive', async () => {
    const revealed: string[] = []
    const streamer = createWordStreamer({
      onWord: (text) => revealed.push(text),
      wordDelayMs: 20,
    })

    streamer.appendTarget('Hello world')
    vi.advanceTimersByTime(25)
    expect(revealed[revealed.length - 1]).toBe('Hello world')

    // More text arrives
    streamer.appendTarget('Hello world from the simulation!')
    vi.advanceTimersByTime(100)
    expect(revealed[revealed.length - 1]).toBe('Hello world from the simulation!')
  })

  it('stops immediately when cancelled', () => {
    const revealed: string[] = []
    const onComplete = vi.fn()

    const streamer = createWordStreamer({
      onWord: (text) => revealed.push(text),
      onComplete,
      wordDelayMs: 30,
    })

    streamer.appendTarget('This is a very long sentence that will be cancelled.')
    vi.advanceTimersByTime(35)
    const countBeforeCancel = revealed.length

    streamer.cancel()
    vi.advanceTimersByTime(200)

    expect(revealed.length).toBe(countBeforeCancel)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('preserves multi-line formatting and KaTeX formulas exactly', async () => {
    const text = `# Gravity\n\nForce equation: $$F = \\frac{G m_1 m_2}{r^2}$$\n\n- Mass 1\n- Mass 2`
    let finalRevealed = ''

    const streamer = createWordStreamer({
      onWord: (t) => {
        finalRevealed = t
      },
      wordDelayMs: 5,
    })

    const finishPromise = streamer.finish(text)
    vi.runAllTimers()
    await finishPromise

    expect(finalRevealed).toBe(text)
  })
})
