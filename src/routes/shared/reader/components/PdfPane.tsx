// web/src/features/pdf-simulator/components/PdfPane.tsx

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { PdfMinimap, type PdfMinimapViewport } from './PdfMinimap.js'
import { joinPdfPageText } from '../utils/pdfPageText.js'
import {
  capturePageCanvas,
  cropCanvasToJpeg,
  findPageCanvas,
  MIN_SNIP_PX,
  normalizeDragRect,
  overlayRectToCanvasPixels,
  pageImageCacheKey,
} from '../utils/capturePdfPage.js'
// Bundled by Vite rather than pinned to a CDN (unpkg) — school labs are
// frequently offline, and a CDN pin is a version-coupling hazard against
// whatever version react-pdf actually resolves.
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc

const MIN_ZOOM = 0.5
const MAX_ZOOM = 2.5
const ZOOM_STEP = 0.15

export interface PdfPaneProps {
  pdfSource: string | File | ArrayBuffer | null
  currentPage: number
  onPageChange: (newPage: number) => void
  onDocumentLoaded?: (totalNumPages: number) => void
  onPageTextExtracted?: (pageNumber: number, text: string) => void
  onPageImageCaptured?: (pageNumber: number, dataUrl: string) => void
  onSnipCaptured?: (dataUrl: string) => void
  bookId?: string
  bookTitle?: string
  children?: React.ReactNode
}

function ChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M8.75 3.5 5.25 7l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M5.25 3.5 8.75 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MinusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 6h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 6h7M6 2.5v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function CropIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3.5 1.5V10.5H12.5M10.5 12.5V3.5H1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function readViewport(el: HTMLDivElement): PdfMinimapViewport {
  const { scrollTop, scrollLeft, clientWidth, clientHeight, scrollWidth, scrollHeight } = el
  return {
    top: scrollHeight > 0 ? scrollTop / scrollHeight : 0,
    left: scrollWidth > 0 ? scrollLeft / scrollWidth : 0,
    width: scrollWidth > 0 ? clientWidth / scrollWidth : 1,
    height: scrollHeight > 0 ? clientHeight / scrollHeight : 1,
  }
}

export const PdfPane: React.FC<PdfPaneProps> = ({
  pdfSource,
  currentPage,
  onPageChange,
  onDocumentLoaded,
  onPageTextExtracted,
  onPageImageCaptured,
  onSnipCaptured,
  bookId,
  bookTitle,
  children,
}) => {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [zoom, setZoom] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [pageDraft, setPageDraft] = useState(String(currentPage))
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const [pageNatural, setPageNatural] = useState({ w: 0, h: 0 })
  const [viewport, setViewport] = useState<PdfMinimapViewport | null>(null)
  const [snipMode, setSnipMode] = useState(false)
  const [snipDrag, setSnipDrag] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)
  const snipDragRef = useRef<{ x0: number; y0: number; x1: number; y1: number } | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pageFrameRef = useRef<HTMLDivElement>(null)

  const clearSnipDrag = () => {
    snipDragRef.current = null
    setSnipDrag(null)
  }

  useEffect(() => {
    setPageDraft(String(currentPage))
  }, [currentPage])

  useEffect(() => {
    setNumPages(null)
    setError(null)
    setZoom(1)
    setPageNatural({ w: 0, h: 0 })
    setViewport(null)
    setSnipMode(false)
    clearSnipDrag()
  }, [pdfSource])

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const update = () => {
      setContainerSize({ w: stage.clientWidth, h: stage.clientHeight })
      if (containerRef.current) setViewport(readViewport(containerRef.current))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(stage)
    return () => ro.disconnect()
  }, [pdfSource, numPages, error])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.scrollTo({ top: 0, left: 0 })
    setViewport(readViewport(el))
  }, [currentPage])

  const handleScroll = () => {
    const el = containerRef.current
    if (el) setViewport(readViewport(el))
  }

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setError(null)
    onDocumentLoaded?.(numPages)
  }

  const handleDocumentLoadError = (err: Error) => {
    console.error('[PdfPane] Error loading PDF:', err)
    setError(err.message || 'Failed to render PDF document')
  }

  const handlePageLoadSuccess = useCallback(
    (page: {
      originalWidth: number
      originalHeight: number
      width: number
      height: number
      getTextContent: () => Promise<{ items: unknown[] }>
    }) => {
      setPageNatural({
        w: page.originalWidth || page.width,
        h: page.originalHeight || page.height,
      })
      const pageNum = currentPage
      void page
        .getTextContent()
        .then((content) => {
          onPageTextExtracted?.(pageNum, joinPdfPageText((content.items || []) as Array<{ str?: string; hasEOL?: boolean }>))
        })
        .catch((err) => {
          console.warn('[PdfPane] Could not extract page text:', err)
          onPageTextExtracted?.(pageNum, '')
        })
    },
    [currentPage, onPageTextExtracted]
  )

  const captureFullPage = useCallback(() => {
    const canvas = findPageCanvas(pageFrameRef.current)
    if (!canvas || canvas.width < 8) return
    const dataUrl = capturePageCanvas(canvas, pageImageCacheKey(bookId, currentPage, zoom))
    if (dataUrl) onPageImageCaptured?.(currentPage, dataUrl)
  }, [bookId, currentPage, zoom, onPageImageCaptured])

  useEffect(() => {
    if (!snipMode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSnipMode(false)
        clearSnipDrag()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [snipMode])

  const overlayPoint = (el: HTMLDivElement, clientX: number, clientY: number) => {
    const bounds = el.getBoundingClientRect()
    return { x: clientX - bounds.left, y: clientY - bounds.top }
  }

  const finishSnip = (el: HTMLDivElement, drag: { x0: number; y0: number; x1: number; y1: number }) => {
    const canvas = findPageCanvas(pageFrameRef.current)
    if (!canvas) return
    const rect = normalizeDragRect(drag.x0, drag.y0, drag.x1, drag.y1)
    if (rect.w < MIN_SNIP_PX || rect.h < MIN_SNIP_PX) return
    const mapped = overlayRectToCanvasPixels(rect, { w: el.clientWidth, h: el.clientHeight }, {
      w: canvas.width,
      h: canvas.height,
    })
    const dataUrl = cropCanvasToJpeg(canvas, mapped)
    if (dataUrl) onSnipCaptured?.(dataUrl)
  }

  const goToPrevPage = () => {
    if (currentPage > 1) onPageChange(currentPage - 1)
  }

  const goToNextPage = () => {
    if (numPages && currentPage < numPages) onPageChange(currentPage + 1)
  }

  const commitPageDraft = () => {
    const next = Number.parseInt(pageDraft, 10)
    if (!Number.isFinite(next) || next < 1) {
      setPageDraft(String(currentPage))
      return
    }
    const clamped = Math.min(numPages ?? next, Math.max(1, next))
    if (clamped !== currentPage) onPageChange(clamped)
    else setPageDraft(String(currentPage))
  }

  const zoomIn = () => setZoom((prev) => Math.min(Number((prev + ZOOM_STEP).toFixed(2)), MAX_ZOOM))
  const zoomOut = () => setZoom((prev) => Math.max(Number((prev - ZOOM_STEP).toFixed(2)), MIN_ZOOM))
  const resetZoom = () => setZoom(1)

  const fitHeight = useMemo(() => {
    const { w: cw, h: ch } = containerSize
    const { w: pw, h: ph } = pageNatural
    if (ch < 1) return 0
    if (pw < 1 || ph < 1) return ch
    const widthAtHeightFit = (pw / ph) * ch
    if (widthAtHeightFit <= cw) return ch
    return (ph / pw) * cw
  }, [containerSize, pageNatural])

  const renderHeight = Math.max(1, Math.round(fitHeight * zoom))
  const isFit = zoom <= 1.001
  const title = bookTitle?.trim() || 'Textbook'

  useEffect(() => {
    if (pageNatural.w < 1) return
    const id = window.setTimeout(captureFullPage, 60)
    return () => window.clearTimeout(id)
  }, [captureFullPage, pageNatural, renderHeight])

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const extraX = el.scrollWidth - el.clientWidth
    el.scrollLeft = extraX > 0 ? extraX / 2 : 0
    setViewport(readViewport(el))
  }, [zoom, renderHeight])

  const pageZoomToolbar = (
    <div className="pdf-toolbar pdf-toolbar--bottom">
      <div className="pdf-seg" role="group" aria-label="Page">
        <button
          type="button"
          className="pdf-seg__btn"
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          title="Previous page"
          aria-label="Previous page"
        >
          <ChevronLeft />
        </button>
        <label className="pdf-seg__page">
          <span className="pdf-seg__sr">Page</span>
          <input
            className="pdf-seg__input"
            type="text"
            inputMode="numeric"
            value={pageDraft}
            onChange={(e) => setPageDraft(e.target.value.replace(/[^\d]/g, ''))}
            onBlur={commitPageDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'ArrowLeft') goToPrevPage()
              if (e.key === 'ArrowRight') goToNextPage()
            }}
            aria-label={`Page ${currentPage} of ${numPages ?? 'unknown'}`}
          />
          <span className="pdf-seg__total">/ {numPages ?? '…'}</span>
        </label>
        <button
          type="button"
          className="pdf-seg__btn"
          onClick={goToNextPage}
          disabled={!numPages || currentPage >= numPages}
          title="Next page"
          aria-label="Next page"
        >
          <ChevronRight />
        </button>
      </div>

      <div className="pdf-seg" role="group" aria-label="Zoom">
        <button
          type="button"
          className="pdf-seg__btn"
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <MinusIcon />
        </button>
        <button
          type="button"
          className="pdf-seg__value"
          onClick={resetZoom}
          title="Fit page to view"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          className="pdf-seg__btn"
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <PlusIcon />
        </button>
      </div>

      <div className="pdf-seg" role="group" aria-label="Snip">
        <button
          type="button"
          className={`pdf-seg__btn${snipMode ? ' is-active' : ''}`}
          onClick={() => {
            clearSnipDrag()
            setSnipMode((on) => !on)
          }}
          title={snipMode ? 'Cancel snip' : 'Snip a figure from this page'}
          aria-label={snipMode ? 'Cancel snip' : 'Snip a figure from this page'}
          aria-pressed={snipMode}
        >
          <CropIcon />
        </button>
      </div>
    </div>
  )

  const renderShell = (content: React.ReactNode, showMinimap: boolean) => (
    <div className="pdf-pane-body">
      <div className="pdf-pane-main">
        <div ref={stageRef} className="pdf-pane-stage">
          <div
            ref={containerRef}
            className={`pdf-pane-scroll${isFit ? ' is-fit' : ' is-zoomed'}`}
            onScroll={handleScroll}
          >
            <div className="pdf-pane-scroll-inner">{content}</div>
          </div>
          {children}
        </div>
        {pageZoomToolbar}
      </div>
      {showMinimap ? (
        <div className="pdf-minimap-rail">
          {numPages ? (
            <PdfMinimap
              numPages={numPages}
              currentPage={currentPage}
              onPageChange={onPageChange}
              viewport={isFit ? null : viewport}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )

  return (
    <div className="pdf-pane-wrapper">
      <div className="pdf-toolbar pdf-toolbar--top">
        <h2 className="pdf-toolbar__title" title={title}>
          {title}
        </h2>
      </div>

      {!pdfSource ? (
        renderShell(
          <div className="pdf-pane-message">
            <p>No PDF loaded.</p>
          </div>,
          false
        )
      ) : error ? (
        renderShell(
          <div className="pdf-pane-message pdf-pane-message--error">
            <p>Failed to load PDF</p>
            <p>{error}</p>
          </div>,
          false
        )
      ) : (
        <Document
          className="pdf-pane-document"
          file={pdfSource}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
          loading={renderShell(
            <div className="pdf-pane-message">Loading document…</div>,
            false
          )}
        >
          {renderShell(
            fitHeight > 0 ? (
              <div
                ref={pageFrameRef}
                className={`pdf-page-frame${snipMode ? ' is-snipping' : ''}`}
              >
                <Page
                  pageNumber={currentPage}
                  height={renderHeight}
                  renderTextLayer={true}
                  renderAnnotationLayer={false}
                  onLoadSuccess={handlePageLoadSuccess}
                />
                {snipMode ? (
                  <div
                    className="pdf-snip-overlay"
                    onPointerDown={(e) => {
                      e.preventDefault()
                      e.currentTarget.setPointerCapture(e.pointerId)
                      const pt = overlayPoint(e.currentTarget, e.clientX, e.clientY)
                      const drag = { x0: pt.x, y0: pt.y, x1: pt.x, y1: pt.y }
                      snipDragRef.current = drag
                      setSnipDrag(drag)
                    }}
                    onPointerMove={(e) => {
                      if (!snipDragRef.current) return
                      const pt = overlayPoint(e.currentTarget, e.clientX, e.clientY)
                      const next = { ...snipDragRef.current, x1: pt.x, y1: pt.y }
                      snipDragRef.current = next
                      setSnipDrag(next)
                    }}
                    onPointerUp={(e) => {
                      const start = snipDragRef.current
                      if (!start) return
                      const pt = overlayPoint(e.currentTarget, e.clientX, e.clientY)
                      const drag = { ...start, x1: pt.x, y1: pt.y }
                      finishSnip(e.currentTarget, drag)
                      clearSnipDrag()
                      setSnipMode(false)
                    }}
                  >
                    {snipDrag ? (
                      <div
                        className="pdf-snip-rect"
                        style={{
                          left: Math.min(snipDrag.x0, snipDrag.x1),
                          top: Math.min(snipDrag.y0, snipDrag.y1),
                          width: Math.abs(snipDrag.x1 - snipDrag.x0),
                          height: Math.abs(snipDrag.y1 - snipDrag.y0),
                        }}
                      />
                    ) : (
                      <span className="pdf-snip-hint">Drag to snip a figure</span>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null,
            true
          )}
        </Document>
      )}
    </div>
  )
}
