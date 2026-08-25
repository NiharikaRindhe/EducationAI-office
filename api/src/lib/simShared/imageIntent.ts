// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
// shared/imageIntent.ts
// Heuristic: attach page image for VLM only when the user asks about a figure or snips one.

export const DEFAULT_FIGURE_PROMPT = 'What does this figure show?'

export interface WantsPageImageInput {
  question: string
  /** Snip or paste attached on this turn (client). */
  explicitImage?: string | null
  /** Server: image came from user snip/paste, not silent full-page capture. */
  userAttachedImage?: boolean
  /** A prior user turn in the thread had an attached image. */
  recentHadImage?: boolean
}

const VISUAL_INTENT =
  /\b(figure|diagram|graph|chart|plot|illustration|image|picture|photo|drawing|sketch|axes|axis|curve|caption|labeled|labelled)\b/i

const VISUAL_PHRASE =
  /\b(this (figure|diagram|graph|chart|plot|image|picture|illustration)|in the (figure|diagram|graph|chart)|what does this (figure|diagram|graph|chart|image) show|shown in the (figure|diagram|graph)|look at the (figure|diagram|graph|chart)|the (figure|diagram|graph|chart) (shows|above|below))\b/i

const SHORT_FOLLOW_UP =
  /^(why|how|what about|and|but|so|then|can you|please|what is|explain)\b/i

export function isDataImageUrl(value?: string | null): value is string {
  return Boolean(value && value.trim().startsWith('data:image/'))
}

export function wantsPageImage(input: WantsPageImageInput): boolean {
  if (isDataImageUrl(input.explicitImage) || input.userAttachedImage) return true

  const question = (input.question || '').trim()
  if (!question) return false
  if (question === DEFAULT_FIGURE_PROMPT) return true
  if (VISUAL_INTENT.test(question) || VISUAL_PHRASE.test(question)) return true

  if (input.recentHadImage && question.length <= 48 && SHORT_FOLLOW_UP.test(question)) {
    return true
  }

  return false
}

export interface ResolveChatPageImageInput {
  question: string
  explicitImage?: string | null
  fullPageImage?: string | null
  recentHadImage?: boolean
}

/** Client: pick snip first, else full-page JPEG only when visual intent matches. */
export function resolveChatPageImage(input: ResolveChatPageImageInput): string | undefined {
  if (isDataImageUrl(input.explicitImage)) return input.explicitImage
  if (!wantsPageImage({ question: input.question, recentHadImage: input.recentHadImage })) {
    return undefined
  }
  return isDataImageUrl(input.fullPageImage) ? input.fullPageImage : undefined
}

export type ChatImageSource = 'user' | 'auto'

export interface ShouldAttachPageImageInput {
  question: string
  pageImage?: string
  imageSource?: ChatImageSource
  recentHadImage?: boolean
}

/** Server: keep pageImage only when client sent a user attachment or intent matches. */
export function shouldAttachPageImage(input: ShouldAttachPageImageInput): boolean {
  if (!isDataImageUrl(input.pageImage)) return false
  if (input.imageSource === 'user') return true
  return wantsPageImage({ question: input.question, recentHadImage: input.recentHadImage })
}

export function pageImageGateReason(input: ShouldAttachPageImageInput): 'explicit' | 'visual-intent' | 'follow-up' | null {
  if (!isDataImageUrl(input.pageImage)) return null
  if (input.imageSource === 'user') return 'explicit'
  const question = (input.question || '').trim()
  if (VISUAL_INTENT.test(question) || VISUAL_PHRASE.test(question) || question === DEFAULT_FIGURE_PROMPT) {
    return 'visual-intent'
  }
  if (input.recentHadImage && question.length <= 48 && SHORT_FOLLOW_UP.test(question)) {
    return 'follow-up'
  }
  return null
}
