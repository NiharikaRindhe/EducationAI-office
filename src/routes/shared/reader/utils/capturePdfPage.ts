import { DEFAULT_FIGURE_PROMPT } from '@sim/shared'

export const VLM_MAX_PAGE_EDGE = 1280
export const VLM_JPEG_QUALITY = 0.72
export const MIN_SNIP_PX = 8
export { DEFAULT_FIGURE_PROMPT } from '@sim/shared'

export interface PixelRect {
  x: number
  y: number
  w: number
  h: number
}

const pageImageCache = new Map<string, string>()
const MAX_CACHE = 8

export function zoomBucket(zoom: number): number {
  return Math.round(zoom * 10) / 10
}

export function pageImageCacheKey(bookId: string | undefined, page: number, zoom: number): string {
  return `${bookId || 'book'}:${page}:${zoomBucket(zoom)}`
}

export function rememberPageImage(key: string, dataUrl: string): void {
  if (pageImageCache.has(key)) pageImageCache.delete(key)
  pageImageCache.set(key, dataUrl)
  while (pageImageCache.size > MAX_CACHE) {
    const oldest = pageImageCache.keys().next().value
    if (oldest === undefined) break
    pageImageCache.delete(oldest)
  }
}

export function cachedPageImage(key: string): string | undefined {
  return pageImageCache.get(key)
}

export function clearPageImageCache(): void {
  pageImageCache.clear()
}

export function pickTurnImage(explicit?: string | null, fullPage?: string | null): string | undefined {
  if (explicit && explicit.startsWith('data:image/')) return explicit
  if (fullPage && fullPage.startsWith('data:image/')) return fullPage
  return undefined
}

export function composeOutgoingText(text: string, hasImage: boolean): string {
  const trimmed = (text || '').trim()
  if (trimmed) return trimmed
  return hasImage ? DEFAULT_FIGURE_PROMPT : ''
}

export function findPageCanvas(root: ParentNode | null): HTMLCanvasElement | null {
  if (!root) return null
  const el = root.querySelector('.react-pdf__Page__canvas') || root.querySelector('canvas')
  return el instanceof HTMLCanvasElement ? el : null
}

export function parseImageDataUrl(dataUrl: string): { mime: string; base64: string } | null {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec((dataUrl || '').trim())
  if (!match) return null
  const mime = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase()
  return { mime, base64: match[2].replace(/\s/g, '') }
}

export function estimateDataUrlBytes(dataUrl: string): number {
  const parsed = parseImageDataUrl(dataUrl)
  if (!parsed) return 0
  const padding = parsed.base64.endsWith('==') ? 2 : parsed.base64.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((parsed.base64.length * 3) / 4) - padding)
}

export function normalizeDragRect(x0: number, y0: number, x1: number, y1: number): PixelRect {
  return {
    x: Math.min(x0, x1),
    y: Math.min(y0, y1),
    w: Math.abs(x1 - x0),
    h: Math.abs(y1 - y0),
  }
}

export function overlayRectToCanvasPixels(
  overlayRect: PixelRect,
  overlaySize: { w: number; h: number },
  canvasSize: { w: number; h: number }
): PixelRect {
  if (overlaySize.w < 1 || overlaySize.h < 1) {
    return { x: 0, y: 0, w: 0, h: 0 }
  }
  const x = Math.round((overlayRect.x / overlaySize.w) * canvasSize.w)
  const y = Math.round((overlayRect.y / overlaySize.h) * canvasSize.h)
  const w = Math.round((overlayRect.w / overlaySize.w) * canvasSize.w)
  const h = Math.round((overlayRect.h / overlaySize.h) * canvasSize.h)
  return {
    x: Math.max(0, Math.min(canvasSize.w, x)),
    y: Math.max(0, Math.min(canvasSize.h, y)),
    w: Math.max(0, Math.min(canvasSize.w - Math.max(0, x), w)),
    h: Math.max(0, Math.min(canvasSize.h - Math.max(0, y), h)),
  }
}

function drawScaled(source: CanvasImageSource, srcW: number, srcH: number): HTMLCanvasElement | null {
  if (srcW < 1 || srcH < 1) return null
  const longSide = Math.max(srcW, srcH)
  const scale = longSide > VLM_MAX_PAGE_EDGE ? VLM_MAX_PAGE_EDGE / longSide : 1
  const w = Math.max(1, Math.round(srcW * scale))
  const h = Math.max(1, Math.round(srcH * scale))
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(source, 0, 0, srcW, srcH, 0, 0, w, h)
  return out
}

export function canvasToJpegDataUrl(
  canvas: HTMLCanvasElement,
  quality = VLM_JPEG_QUALITY
): string | null {
  const scaled = drawScaled(canvas, canvas.width, canvas.height)
  if (!scaled) return null
  try {
    return scaled.toDataURL('image/jpeg', quality)
  } catch {
    return null
  }
}

export function capturePageCanvas(
  canvas: HTMLCanvasElement,
  cacheKey: string
): string | null {
  const hit = cachedPageImage(cacheKey)
  if (hit) return hit
  const dataUrl = canvasToJpegDataUrl(canvas)
  if (dataUrl) rememberPageImage(cacheKey, dataUrl)
  return dataUrl
}

export function cropCanvasToJpeg(
  canvas: HTMLCanvasElement,
  rect: PixelRect,
  quality = VLM_JPEG_QUALITY
): string | null {
  if (rect.w < MIN_SNIP_PX || rect.h < MIN_SNIP_PX) return null
  const w = Math.min(rect.w, canvas.width - rect.x)
  const h = Math.min(rect.h, canvas.height - rect.y)
  if (w < MIN_SNIP_PX || h < MIN_SNIP_PX) return null
  const slice = document.createElement('canvas')
  slice.width = w
  slice.height = h
  const ctx = slice.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(canvas, rect.x, rect.y, w, h, 0, 0, w, h)
  return canvasToJpegDataUrl(slice, quality)
}

export async function blobToJpegDataUrl(blob: Blob, quality = VLM_JPEG_QUALITY): Promise<string | null> {
  if (!blob || !blob.type.startsWith('image/')) return null
  try {
    const bitmap = await createImageBitmap(blob)
    const scaled = drawScaled(bitmap, bitmap.width, bitmap.height)
    bitmap.close()
    if (!scaled) return null
    return scaled.toDataURL('image/jpeg', quality)
  } catch {
    return null
  }
}

export function firstClipboardImage(data: DataTransfer | null): File | null {
  if (!data) return null
  const fromItems = Array.from(data.items || [])
    .find((item) => item.kind === 'file' && item.type.startsWith('image/'))
    ?.getAsFile()
  if (fromItems) return fromItems
  return Array.from(data.files || []).find((file) => file.type.startsWith('image/')) || null
}
