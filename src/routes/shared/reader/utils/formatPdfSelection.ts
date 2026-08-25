// web/src/features/pdf-simulator/utils/formatPdfSelection.ts

export interface PdfSpanPiece {
  text: string
  top: number
  left: number
  height: number
}

export type HighlightBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[]; start: number }

const BULLET_CHARS = '•●○◦▪■▸►‣∙·'
const BULLET_CHAR_RE = new RegExp(`[${BULLET_CHARS}]`)
const LEADING_BULLET_RE = new RegExp(`^[${BULLET_CHARS}*\\-–—]\\s+`)
const NUMBER_ITEM_RE = /^(\d{1,2})[.)]\s+(.*)$/
const PAREN_ITEM_RE = /^\(([a-z]|[ivx]{1,6})\)\s+(.*)$/i
const TEXT_LAYER_SELECTOR = '.react-pdf__Page__textContent, .textLayer'

function needsSpace(prev: string, next: string): boolean {
  if (!prev || !next) return false
  if (/\s$/.test(prev) || /^\s/.test(next)) return false
  if (/[(\[{“"']$/.test(prev) || /^[.,;:!?%°)\]}”"']/.test(next)) return false
  if (/[-–—/]$/.test(prev) || /^[-–—/]/.test(next)) return false
  return true
}

function joinSpanTexts(texts: string[]): string {
  let out = ''
  for (const raw of texts) {
    const text = raw.replace(/\s+/g, ' ')
    if (!text) continue
    out += needsSpace(out, text) ? ` ${text}` : text
  }
  return out.replace(/[ \t]+/g, ' ').trim()
}

/** Rebuild visual lines from PDF.js absolutely positioned text spans. */
export function joinPdfSpansAsLines(spans: PdfSpanPiece[]): string {
  const usable = spans.filter((span) => span.text.trim().length > 0)
  if (usable.length === 0) return ''

  const sorted = [...usable].sort((a, b) => a.top - b.top || a.left - b.left)
  const lines: PdfSpanPiece[][] = []

  for (const span of sorted) {
    const current = lines[lines.length - 1]
    if (!current) {
      lines.push([span])
      continue
    }
    const ref = current[0]
    const threshold = Math.max(3, Math.max(ref.height, span.height) * 0.55)
    if (Math.abs(span.top - ref.top) <= threshold) current.push(span)
    else lines.push([span])
  }

  return lines
    .map((line) => joinSpanTexts([...line].sort((a, b) => a.left - b.left).map((s) => s.text)))
    .filter(Boolean)
    .join('\n')
}

function sliceByMatches(line: string, matches: RegExpMatchArray[]): string[] {
  const parts: string[] = []
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const start = match.index ?? 0
    if (i === 0 && start > 0) {
      const lead = line.slice(0, start).trim()
      if (lead) parts.push(lead)
    }
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? line.length) : line.length
    const chunk = line.slice(start, end).trim()
    if (chunk) parts.push(chunk)
  }
  return parts
}

function splitNumericItems(line: string): string[] | null {
  const re = /(?:^|\s+)(\d{1,2})[.)]\s+/g
  const matches = [...line.matchAll(re)]
  if (matches.length === 0) return null

  const atStart = (matches[0].index ?? 0) === 0
  if (matches.length === 1 && !atStart) return null

  const nums = matches.map((m) => Number(m[1]))
  const sequential = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1)
  if (!sequential && matches.length < 2) return null
  if (!atStart && matches.length < 2) return null

  return sliceByMatches(line, matches)
}

function splitParenItems(line: string): string[] | null {
  const re = /(?:^|\s+)(\(([a-z]|[ivx]{1,6})\))\s+/gi
  const matches = [...line.matchAll(re)]
  if (matches.length < 2 && !((matches[0]?.index ?? -1) === 0 && matches.length === 1)) {
    return null
  }
  return sliceByMatches(line, matches)
}

function splitBulletItems(line: string): string[] | null {
  if (!BULLET_CHAR_RE.test(line)) return null
  const re = new RegExp(`(?:^|\\s*)([${BULLET_CHARS}])\\s*`, 'g')
  const matches = [...line.matchAll(re)]
  if (matches.length === 0) return null
  return sliceByMatches(line, matches)
}

function splitLineOnListMarkers(line: string): string[] {
  const trimmed = line.trim()
  if (!trimmed) return ['']
  return splitBulletItems(trimmed) ?? splitNumericItems(trimmed) ?? splitParenItems(trimmed) ?? [trimmed]
}

function normalizeItemLine(line: string): string {
  return line
    .replace(new RegExp(`^([${BULLET_CHARS}])(?=\\S)`), '$1 ')
    .replace(/^(\d{1,2}[.)])(?=\S)/, '$1 ')
    .replace(/^(\([a-zA-Z]|[ivxIVX]{1,6}\))(?=\S)/, '$1 ')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

function isListItemLine(line: string): boolean {
  return LEADING_BULLET_RE.test(line) || NUMBER_ITEM_RE.test(line) || PAREN_ITEM_RE.test(line)
}

/** PDF list items often wrap onto the next visual line. */
function mergeWrappedListContinuations(lines: string[]): string[] {
  const out: string[] = []
  for (const line of lines) {
    const prev = out[out.length - 1]
    if (
      prev &&
      line &&
      isListItemLine(prev) &&
      !isListItemLine(line) &&
      /^[a-z(,;:]/.test(line)
    ) {
      out[out.length - 1] = `${prev} ${line}`
      continue
    }
    out.push(line)
  }
  return out
}

/**
 * Restore line breaks and list markers that PDF selection flattening drops.
 * Safe to run more than once on the same string.
 */
export function formatPdfSelectionText(raw: string): string {
  if (!raw) return ''

  const unified = raw.replace(/\r\n/g, '\n').replace(/\u00a0/g, ' ')
  const lines: string[] = []

  for (const line of unified.split('\n')) {
    const pieces = splitLineOnListMarkers(line.replace(/[ \t]+/g, ' '))
    for (const piece of pieces) lines.push(normalizeItemLine(piece))
  }

  const collapsed: string[] = []
  for (const line of lines) {
    if (line === '' && collapsed[collapsed.length - 1] === '') continue
    collapsed.push(line)
  }

  return mergeWrappedListContinuations(collapsed).join('\n').trim()
}

export function parseHighlightBlocks(text: string): HighlightBlock[] {
  const formatted = formatPdfSelectionText(text)
  if (!formatted) return []

  const blocks: HighlightBlock[] = []
  let para: string[] = []
  let bullets: string[] = []
  let numbers: { start: number; items: string[] } | null = null

  const flushPara = () => {
    if (para.length === 0) return
    blocks.push({ type: 'p', text: para.join('\n') })
    para = []
  }
  const flushBullets = () => {
    if (bullets.length === 0) return
    blocks.push({ type: 'ul', items: bullets })
    bullets = []
  }
  const flushNumbers = () => {
    if (!numbers) return
    blocks.push({ type: 'ol', items: numbers.items, start: numbers.start })
    numbers = null
  }

  for (const line of formatted.split('\n')) {
    if (!line.trim()) {
      flushPara()
      flushBullets()
      flushNumbers()
      continue
    }

    const numberMatch = line.match(NUMBER_ITEM_RE)
    if (numberMatch) {
      flushPara()
      flushBullets()
      const n = Number(numberMatch[1])
      const item = numberMatch[2]
      if (!numbers) numbers = { start: n, items: [item] }
      else numbers.items.push(item)
      continue
    }

    const bulletBody = LEADING_BULLET_RE.test(line)
      ? line.replace(LEADING_BULLET_RE, '')
      : PAREN_ITEM_RE.test(line)
        ? line.replace(PAREN_ITEM_RE, '$2')
        : null

    if (bulletBody !== null) {
      flushPara()
      flushNumbers()
      bullets.push(bulletBody)
      continue
    }

    flushBullets()
    flushNumbers()
    para.push(line)
  }

  flushPara()
  flushBullets()
  flushNumbers()
  return blocks
}

function clippedRangeText(range: Range, span: Element): string {
  try {
    const spanRange = document.createRange()
    spanRange.selectNodeContents(span)
    const clipped = spanRange.cloneRange()
    if (range.compareBoundaryPoints(Range.START_TO_START, spanRange) > 0) {
      clipped.setStart(range.startContainer, range.startOffset)
    }
    if (range.compareBoundaryPoints(Range.END_TO_END, spanRange) < 0) {
      clipped.setEnd(range.endContainer, range.endOffset)
    }
    return clipped.toString()
  } catch {
    return span.textContent || ''
  }
}

function collectSelectedPdfSpans(range: Range): PdfSpanPiece[] {
  const node = range.commonAncestorContainer
  const startEl = node instanceof Element ? node : node.parentElement
  const layer = startEl?.closest(TEXT_LAYER_SELECTOR)
  if (!(layer instanceof HTMLElement)) return []

  const pieces: PdfSpanPiece[] = []
  for (const span of layer.querySelectorAll('span')) {
    if (!range.intersectsNode(span)) continue
    const text = clippedRangeText(range, span)
    if (!text) continue
    const rect = span.getBoundingClientRect()
    pieces.push({
      text,
      top: rect.top,
      left: rect.left,
      height: rect.height || 12,
    })
  }
  return pieces
}

/** Read the current window selection as textbook-formatted note text. */
export function readFormattedPdfSelection(selection: Selection | null): string {
  if (!selection || selection.isCollapsed) return ''

  let raw = selection.toString()
  try {
    const range = selection.getRangeAt(0)
    const pieces = collectSelectedPdfSpans(range)
    if (pieces.length > 0) raw = joinPdfSpansAsLines(pieces)
  } catch {
    // Fall back to the browser's flattened selection string.
  }

  return formatPdfSelectionText(raw)
}
