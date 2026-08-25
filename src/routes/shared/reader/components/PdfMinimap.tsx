// web/src/features/pdf-simulator/components/PdfMinimap.tsx

import React, { useEffect, useRef, useState } from 'react'
import { Page } from 'react-pdf'

export interface PdfMinimapViewport {
  top: number
  left: number
  width: number
  height: number
}

export interface PdfMinimapProps {
  numPages: number
  currentPage: number
  onPageChange: (page: number) => void
  viewport: PdfMinimapViewport | null
}

const THUMB_WIDTH = 72

const MinimapThumb: React.FC<{
  pageNumber: number
  isCurrent: boolean
  onSelect: (page: number) => void
  viewport: PdfMinimapViewport | null
}> = ({ pageNumber, isCurrent, onSelect, viewport }) => {
  const ref = useRef<HTMLButtonElement>(null)
  const [shouldRender, setShouldRender] = useState(isCurrent)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShouldRender(true)
      },
      { rootMargin: '160px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (isCurrent) {
      ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
  }, [isCurrent])

  const showViewport =
    isCurrent &&
    viewport &&
    (viewport.width < 0.98 || viewport.height < 0.98)

  return (
    <button
      ref={ref}
      type="button"
      className={`pdf-minimap__thumb${isCurrent ? ' is-current' : ''}`}
      onClick={() => onSelect(pageNumber)}
      aria-current={isCurrent ? 'page' : undefined}
      aria-label={`Page ${pageNumber}`}
      title={`Page ${pageNumber}`}
    >
      {shouldRender || isCurrent ? (
        <Page
          pageNumber={pageNumber}
          width={THUMB_WIDTH}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          loading={<div className="pdf-minimap__placeholder" />}
        />
      ) : (
        <div className="pdf-minimap__placeholder" />
      )}
      {showViewport && viewport && (
        <span
          className="pdf-minimap__viewport"
          style={{
            top: `${viewport.top * 100}%`,
            left: `${viewport.left * 100}%`,
            width: `${viewport.width * 100}%`,
            height: `${viewport.height * 100}%`,
          }}
        />
      )}
      <span className="pdf-minimap__label">{pageNumber}</span>
    </button>
  )
}

export const PdfMinimap: React.FC<PdfMinimapProps> = ({
  numPages,
  currentPage,
  onPageChange,
  viewport,
}) => {
  if (numPages < 1) return null

  return (
    <nav className="pdf-minimap" aria-label="PDF page minimap">
      {Array.from({ length: numPages }, (_, i) => {
        const pageNumber = i + 1
        return (
          <MinimapThumb
            key={pageNumber}
            pageNumber={pageNumber}
            isCurrent={pageNumber === currentPage}
            onSelect={onPageChange}
            viewport={pageNumber === currentPage ? viewport : null}
          />
        )
      })}
    </nav>
  )
}
