import { CLASS5_PAGE_TAGS } from './ncertPageTags.class5.js'
import { CLASS6_PAGE_TAGS } from './ncertPageTags.class6.js'
import { CLASS7_PAGE_TAGS } from './ncertPageTags.class7.js'
import { CLASS8_PAGE_TAGS } from './ncertPageTags.class8.js'
import { CLASS9_PAGE_TAGS } from './ncertPageTags.class9.js'
import { CLASS10_PAGE_TAGS } from './ncertPageTags.class10.js'
import {
  invertFirstPlacements,
  tagsForPage,
  type ChapterSimTags,
  type PageSimTag,
  type TemplatePlacement,
} from './ncertPageTags.js'

/** All hardcoded NCERT sim placements. Untagged pages get no simulation and no LLM. */
export const NCERT_PAGE_TAGS: ChapterSimTags[] = [
  ...CLASS5_PAGE_TAGS,
  ...CLASS6_PAGE_TAGS,
  ...CLASS7_PAGE_TAGS,
  ...CLASS8_PAGE_TAGS,
  ...CLASS9_PAGE_TAGS,
  ...CLASS10_PAGE_TAGS,
]

export function lookupNcertPageTags(input: {
  classNum: number
  subject: string
  bookTitle: string
  pageNumber: number
  pageText: string
}): PageSimTag[] {
  return tagsForPage(NCERT_PAGE_TAGS, input)
}

export function firstPlacementByTemplateId(): Map<string, TemplatePlacement> {
  return invertFirstPlacements(NCERT_PAGE_TAGS)
}
