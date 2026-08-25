// web/src/features/pdf-simulator/components/SimDrawer.tsx

import React, { useState } from 'react'
import { simApiClient, type SimAnnotation } from '../api.js'

export interface SimDrawerProps {
  isOpen: boolean
  embedded?: boolean
  onClose?: () => void
  annotations: SimAnnotation[]
  pageNumber: number
  /** Total simulations mapped across the whole PDF. */
  totalCount?: number
  bookId?: string
  selectedAnnotationId: string | null
  onSelectSimulation: (annotation: SimAnnotation) => void
  onAnnotationAdded?: (newAnnotation: SimAnnotation) => void
}

export const SimDrawer: React.FC<SimDrawerProps> = ({
  isOpen,
  embedded = false,
  onClose,
  annotations,
  pageNumber,
  totalCount,
  bookId,
  selectedAnnotationId,
  onSelectSimulation,
  onAnnotationAdded,
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  if (!isOpen && !embedded) return null

  const handleReanimateCard = async (item: SimAnnotation) => {
    if (item.spec.templateId) {
      onSelectSimulation(item)
      onClose?.()
      return
    }
    setIsGenerating(true)
    setGenerateError(null)

    try {
      const result = await simApiClient.generateAiSimulation({
        prompt: item.spec.title,
        bookId,
        pageNumber,
        annotationId: item.id,
        existingSpec: item.spec,
      })

      const updatedAnnotation: SimAnnotation = result.annotation || {
        ...item,
        spec: result.spec,
      }

      onAnnotationAdded?.(updatedAnnotation)
      onSelectSimulation(updatedAnnotation)
      onClose?.()
    } catch (err: unknown) {
      console.error('[SimDrawer] Error re-animating simulation:', err)
      const message = err instanceof Error ? err.message : 'Failed to re-animate simulation. Please try again.'
      setGenerateError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const launch = (item: SimAnnotation) => {
    onSelectSimulation(item)
    onClose?.()
  }

  const bookTotal = totalCount ?? annotations.length
  const pageCount = annotations.length
  const bookLabel = `${bookTotal} simulation${bookTotal === 1 ? '' : 's'} in this book`

  const hub = (
    <div className={`sim-hub${embedded ? ' sim-picker' : ' sim-drawer'}`}>
      <header className="sim-hub__header">
        <div>
          <div className="sim-hub__title-row">
            <h3>Simulations</h3>
            <span className="sim-hub__count" title={bookLabel}>
              {bookTotal}
            </span>
          </div>
          <p>
            {bookLabel}
            {' · '}
            Page {pageNumber}
            {pageCount > 0 ? ` · ${pageCount} on this page` : ''}
          </p>
        </div>
        {!embedded && (
          <button type="button" className="sim-hub__close" onClick={onClose} title="Close">
            Close
          </button>
        )}
      </header>

      {generateError && <p className="sim-hub__error">{generateError}</p>}

      <div className="sim-hub__list">
        {annotations.length === 0 ? (
          <div className="sim-hub__empty">No simulations on this page yet.</div>
        ) : (
          annotations.map((item) => {
            const spec = item.spec
            const isSelected = selectedAnnotationId === item.id

            return (
              <article
                key={item.id}
                className={`sim-card sim-hub__card${isSelected ? ' is-active' : ''}`}
              >
                <div className="sim-hub__card-top">
                  <span className={`badge badge-${spec.domain || 'general'}`}>{spec.domain}</span>
                  <h4 className="sim-hub__card-title" title={spec.title}>
                    {spec.title}
                  </h4>
                  {isSelected && <span className="sim-hub__active">Active</span>}
                </div>
                {spec.subtitle && <p className="sim-hub__card-sub">{spec.subtitle}</p>}
                <div className="sim-hub__card-actions">
                  {!item.spec.templateId && (
                    <button
                      type="button"
                      className="sim-hub__text-btn"
                      onClick={() => handleReanimateCard(item)}
                      disabled={isGenerating}
                    >
                      Re-animate
                    </button>
                  )}
                  <button
                    type="button"
                    className="action-btn sim-hub__launch"
                    onClick={() => launch(item)}
                  >
                    {isSelected ? 'View' : 'Launch'}
                  </button>
                </div>
              </article>
            )
          })
        )}
      </div>
    </div>
  )

  if (embedded) return hub

  return (
    <div className="sim-drawer-overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>{hub}</div>
    </div>
  )
}
