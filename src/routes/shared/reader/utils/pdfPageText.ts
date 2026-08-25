// web/src/features/pdf-simulator/utils/pdfPageText.ts

export interface PdfTextItem {
  str?: string
  hasEOL?: boolean
}

export function joinPdfPageText(items: PdfTextItem[]): string {
  const chunks: string[] = []
  let line = ''

  for (const item of items) {
    const str = typeof item.str === 'string' ? item.str : ''
    line += str
    if (item.hasEOL) {
      chunks.push(line.trim())
      line = ''
    } else if (str && !str.endsWith(' ') && line.length > 0) {
      line += ' '
    }
  }

  if (line.trim()) chunks.push(line.trim())
  return chunks.join('\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n').trim()
}
