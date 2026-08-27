import {
  findChapterTags,
  NCERT_PAGE_TAGS,
} from '@sim/shared'
import type { BookJob } from '../../lib/bookLibrary'

export interface BookMatch {
  job: BookJob
  page: number
}

/** First matching uploaded textbook per template. Platform jobs win over school uploads. */
export function indexBooksByTemplate(jobs: BookJob[]): Map<string, BookMatch> {
  const out = new Map<string, BookMatch>()
  const eligible = jobs
    .filter((j) => j.status === 'done' && !j.is_pyq)
    .sort((a, b) => Number(Boolean(a.school_id)) - Number(Boolean(b.school_id)))

  for (const job of eligible) {
    const found = findChapterTags(NCERT_PAGE_TAGS, job.class_num, job.subject, job.book_title, '')
    if (!found?.fromTitle) continue
    const nums = Object.keys(found.chapter.pages)
      .map(Number)
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b)
    for (const page of nums) {
      for (const tag of found.chapter.pages[page] ?? []) {
        if (!out.has(tag.templateId)) out.set(tag.templateId, { job, page })
      }
    }
  }

  return out
}
