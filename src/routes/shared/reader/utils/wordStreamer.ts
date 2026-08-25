// web/src/features/pdf-simulator/utils/wordStreamer.ts

export interface WordStreamerOptions {
  /** Callback fired whenever a new word/token is revealed with the accumulated text */
  onWord: (revealedText: string) => void
  /** Optional callback fired when all target text has finished streaming */
  onComplete?: () => void
  /** Base delay between words in milliseconds (default 26ms) */
  wordDelayMs?: number
}

export interface WordStreamer {
  /** Push new / updated target text as chunks arrive from the network */
  appendTarget: (fullTargetTextSoFar: string) => void
  /** Mark that the upstream network stream has completed */
  finish: (finalFullText?: string) => Promise<void>
  /** Cancel any pending animation immediately (e.g. user aborts) */
  cancel: () => void
  /** Get current revealed text */
  getRevealedText: () => string
  /** Check if streamer is active */
  isActive: () => boolean
}

/**
 * Creates a word-by-word streaming coordinator that smoothly delivers
 * incoming chunks at a fluid, natural reading pace.
 */
export function createWordStreamer(options: WordStreamerOptions): WordStreamer {
  const { onWord, onComplete, wordDelayMs = 26 } = options

  let targetText = ''
  let revealedText = ''
  let isFinished = false
  let isCancelled = false
  let timerId: ReturnType<typeof setTimeout> | null = null
  let finishResolver: (() => void) | null = null

  const getRemainingWordCount = (): number => {
    if (revealedText.length >= targetText.length) return 0
    const remaining = targetText.slice(revealedText.length)
    const matches = remaining.match(/\S+/g)
    return matches ? matches.length : 0
  }

  const getNextToken = (): string => {
    if (revealedText.length >= targetText.length) return ''
    const remaining = targetText.slice(revealedText.length)
    // Match either leading whitespace or a word followed by optional whitespace
    const match = remaining.match(/^\s+|\S+\s*/)?.[0]
    return match || remaining.slice(0, 1)
  }

  const step = () => {
    timerId = null
    if (isCancelled) return

    if (revealedText.length < targetText.length) {
      const token = getNextToken()
      if (token) {
        revealedText += token
        onWord(revealedText)
      }
    }

    if (revealedText.length >= targetText.length) {
      if (isFinished) {
        finishResolver?.()
        finishResolver = null
        onComplete?.()
        return
      }
      // Wait for more data from appendTarget
      return
    }

    // Adaptive speed: accelerate when buffer has accumulated many words
    const queueSize = getRemainingWordCount()
    let delay = wordDelayMs
    if (queueSize > 25) {
      delay = Math.max(6, Math.floor(wordDelayMs * 0.25))
    } else if (queueSize > 12) {
      delay = Math.max(10, Math.floor(wordDelayMs * 0.45))
    } else if (queueSize > 5) {
      delay = Math.max(16, Math.floor(wordDelayMs * 0.7))
    }

    timerId = setTimeout(step, delay)
  }

  const startLoopIfNeeded = () => {
    if (timerId === null && !isCancelled && revealedText.length < targetText.length) {
      timerId = setTimeout(step, 0)
    }
  }

  return {
    appendTarget(fullTargetTextSoFar: string) {
      if (isCancelled) return
      targetText = fullTargetTextSoFar
      startLoopIfNeeded()
    },

    finish(finalFullText?: string): Promise<void> {
      if (isCancelled) return Promise.resolve()
      if (typeof finalFullText === 'string') {
        targetText = finalFullText
      }
      isFinished = true

      if (revealedText.length >= targetText.length) {
        onComplete?.()
        return Promise.resolve()
      }

      return new Promise<void>((resolve) => {
        finishResolver = resolve
        startLoopIfNeeded()
      })
    },

    cancel() {
      isCancelled = true
      if (timerId !== null) {
        clearTimeout(timerId)
        timerId = null
      }
      finishResolver?.()
      finishResolver = null
    },

    getRevealedText() {
      return revealedText
    },

    isActive() {
      return !isCancelled && (timerId !== null || revealedText.length < targetText.length)
    },
  }
}
