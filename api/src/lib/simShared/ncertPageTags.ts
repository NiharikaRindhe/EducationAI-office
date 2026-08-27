// Hardcoded NCERT page → simulation tags.
// Ingest reads this instead of calling the curator LLM.

export interface PageSimTag {
  templateId: string
  params?: Record<string, number>
}

export interface TextRule {
  any: string[]
  tags: PageSimTag[]
}

export interface ChapterSimTags {
  classNum: number
  subject: 'Mathematics' | 'Science' | 'EVS'
  /** Match book_title or page text (case-insensitive). Longer hits win. */
  match: string[]
  /** 1-based PDF page numbers for a chapter-wise file. */
  pages: Record<number, PageSimTag[]>
  /** Used when the upload is a whole book (PDF page numbers do not match). */
  whenText?: TextRule[]
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[–—−]/g, '-').replace(/\s+/g, ' ').trim()
}

function subjectGroup(subject: string): 'Mathematics' | 'Science' | 'EVS' | null {
  const s = norm(subject)
  if (/math|ganita|joyful/.test(s)) return 'Mathematics'
  if (/\bevs\b|environmental|wondrous|world around us/.test(s)) return 'EVS'
  if (/science|curiosity|exploration/.test(s)) return 'Science'
  return null
}

function hitScore(hay: string, needles: string[]): number {
  let best = 0
  for (const n of needles) {
    const needle = norm(n)
    if (needle.length >= 6 && hay.includes(needle) && needle.length > best) best = needle.length
  }
  return best
}

function uniqueTags(tags: PageSimTag[]): PageSimTag[] {
  const seen = new Set<string>()
  const out: PageSimTag[] = []
  for (const tag of tags) {
    if (seen.has(tag.templateId)) continue
    seen.add(tag.templateId)
    out.push(tag)
    if (out.length >= 3) break
  }
  return out
}

export interface TemplatePlacement {
  templateId: string
  classNum: number
  subject: ChapterSimTags['subject']
  match: string[]
  page: number
  params?: Record<string, number>
  extraPages: number[]
}

/** First tagged page per templateId (stable chapter order). Extra pages in
 *  that same chapter are listed on extraPages — later chapters are ignored
 *  so page numbers stay meaningful for a chapter-wise PDF. */
export function invertFirstPlacements(chapters: ChapterSimTags[]): Map<string, TemplatePlacement> {
  const map = new Map<string, TemplatePlacement>()
  for (const ch of chapters) {
    const nums = Object.keys(ch.pages)
      .map(Number)
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b)
    for (const page of nums) {
      const tags = ch.pages[page]
      if (!tags) continue
      for (const tag of tags) {
        const existing = map.get(tag.templateId)
        if (!existing) {
          map.set(tag.templateId, {
            templateId: tag.templateId,
            classNum: ch.classNum,
            subject: ch.subject,
            match: ch.match,
            page,
            params: tag.params,
            extraPages: [],
          })
          continue
        }
        const sameChapter =
          existing.classNum === ch.classNum &&
          existing.subject === ch.subject &&
          existing.match === ch.match
        if (sameChapter && page !== existing.page && !existing.extraPages.includes(page)) {
          existing.extraPages.push(page)
        }
      }
    }
  }
  return map
}

export function findChapterTags(
  chapters: ChapterSimTags[],
  classNum: number,
  subject: string,
  bookTitle: string,
  pageText: string,
): { chapter: ChapterSimTags; fromTitle: boolean } | null {
  const group = subjectGroup(subject)
  const titleHay = norm(bookTitle)
  const pageHay = norm(pageText)
  let best: ChapterSimTags | null = null
  let bestScore = 0
  let fromTitle = false
  for (const ch of chapters) {
    if (ch.classNum !== classNum) continue
    if (group && ch.subject !== group) continue
    const titleScore = hitScore(titleHay, ch.match)
    const pageScore = hitScore(pageHay, ch.match)
    const score = Math.max(titleScore, pageScore)
    if (score > bestScore) {
      bestScore = score
      best = ch
      fromTitle = titleScore > 0 && titleScore >= pageScore
    }
  }
  return best ? { chapter: best, fromTitle } : null
}

export function tagsForPage(
  chapters: ChapterSimTags[],
  input: { classNum: number; subject: string; bookTitle: string; pageNumber: number; pageText: string },
): PageSimTag[] {
  const pageHay = norm(input.pageText)
  const found = findChapterTags(chapters, input.classNum, input.subject, input.bookTitle, input.pageText)
  const collected: PageSimTag[] = []

  const applyTextRules = (ch: ChapterSimTags) => {
    for (const rule of ch.whenText ?? []) {
      if (rule.any.some((n) => pageHay.includes(norm(n)))) collected.push(...rule.tags)
    }
  }

  if (found) {
    if (found.fromTitle) collected.push(...(found.chapter.pages[input.pageNumber] ?? []))
    applyTextRules(found.chapter)
  } else {
    const group = subjectGroup(input.subject)
    for (const ch of chapters) {
      if (ch.classNum !== input.classNum) continue
      if (group && ch.subject !== group) continue
      applyTextRules(ch)
    }
  }

  return uniqueTags(collected)
}
