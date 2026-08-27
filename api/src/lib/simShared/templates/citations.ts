// shared/templates/citations.ts
// Strip NCERT figure/table/example numbers so they cannot become sim params.

const LABEL = String.raw`(?:fig(?:ure)?s?|tables?|tbls?|activit(?:y|ies)|examples?|exercises?|questions?)`
const NUM = String.raw`\d+(?:\.\d+)?`
const NUM_PART = String.raw`${NUM}(?:\s*\([a-zA-Z]\))?`
const NUM_LIST = String.raw`${NUM_PART}(?:\s*(?:,|&|and|to|[–-])\s*${NUM_PART})*`

/** Fig. 8.5, Table 3.2, Activity 8.4, Example 9.1, Q. 8, Question 3, Fig. 8.5 and 8.6 */
export const CITATION_RE = new RegExp(String.raw`\b(?:${LABEL}\.?|Q\.)\s+${NUM_LIST}`, 'gi')

const NUM_IN_SPAN = new RegExp(NUM, 'g')

const UNIT_AFTER = String.raw`(?:m\/s(?:\^?2|²)?|km\/h|kg|kN|N|Ω|ohm|volts?|V|amps?|A|Hz|°C|°|deg(?:rees)?|sec(?:onds)?|s|cm|mm|km|m(?:²|\^2)?|pH)`
const QUANTITY_RE = new RegExp(String.raw`(-?${NUM})\s*${UNIT_AFTER}(?![a-zA-Z])`, 'gi')
const EQUALS_RE = /(?:=\s*(-?\d+(?:\.\d+)?)|(-?\d+(?:\.\d+)?)\s*=)/g

const PLACEHOLDER = '[REF]'

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6
}

function numbersIn(span: string): number[] {
  const out: number[] = []
  for (const m of span.matchAll(NUM_IN_SPAN)) {
    const n = Number(m[0])
    if (Number.isFinite(n)) out.push(round6(n))
  }
  return out
}

/** Exact citation numbers (8.5, not split 8 and 5). */
export function citationValues(text: string): number[] {
  const out: number[] = []
  const seen = new Set<number>()
  for (const m of text.matchAll(CITATION_RE)) {
    for (const n of numbersIn(m[0])) {
      if (!seen.has(n)) {
        seen.add(n)
        out.push(n)
      }
    }
  }
  return out
}

/** Replace citation digits with [REF]; leave the label (Fig./Table/…) in place. */
export function maskCitations(text: string): string {
  return text.replace(CITATION_RE, (span) => span.replace(NUM_IN_SPAN, PLACEHOLDER))
}

/**
 * Numbers that appear as measured quantities: `20 m/s`, `4 Ω`, `u = 0`.
 * Same digit as a figure id is kept when it also has a unit (`8.5 m` + `Fig. 8.5`).
 */
export function quantityValues(text: string): number[] {
  const out: number[] = []
  const seen = new Set<number>()
  const add = (raw: string | undefined) => {
    if (!raw) return
    const n = round6(Number(raw))
    if (!Number.isFinite(n) || seen.has(n)) return
    seen.add(n)
    out.push(n)
  }
  for (const m of text.matchAll(QUANTITY_RE)) add(m[1])
  for (const m of text.matchAll(EQUALS_RE)) add(m[1] ?? m[2])
  return out
}

/**
 * Drop raw param keys whose value is a citation number and not also a unit-backed quantity.
 * Omitted keys become catalog defaults in parseTemplateParams.
 * Integer 0/1 are kept so circuit mode / kind flags are not wiped by "Example 1".
 */
export function dropCitationParams<T extends Record<string, number | string | undefined>>(
  raw: T | undefined,
  sourceText: string
): T | undefined {
  if (!raw) return raw
  const citations = new Set(citationValues(sourceText))
  if (citations.size === 0) return raw
  const quantities = new Set(quantityValues(sourceText))
  const next = { ...raw }
  for (const [key, val] of Object.entries(next)) {
    const n = typeof val === 'number' ? val : Number(val)
    if (!Number.isFinite(n)) continue
    const v = round6(n)
    if (v === 0 || v === 1) continue
    if (citations.has(v) && !quantities.has(v)) {
      delete next[key]
    }
  }
  return next
}
