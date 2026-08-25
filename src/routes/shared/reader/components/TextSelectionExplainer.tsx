// web/src/features/pdf-simulator/components/TextSelectionExplainer.tsx

import React, { useCallback, useEffect, useState } from 'react'
import { readFormattedPdfSelection } from '../utils/formatPdfSelection.js'
import { CopyButton } from './CopyButton.js'

export interface TextSelectionExplainerProps {
  currentPage: number
  onExplain: (selectedText: string, page: number, context: string) => void
  onAddNote?: (selectedText: string, page: number) => void
}

interface PopoverPos {
  top: number
  left: number
}

const MIN_SELECTION_CHARS = 3
const BAR_WIDTH = 340
const BAR_HEIGHT = 44

function clampBarPos(left: number, top: number): PopoverPos {
  return {
    left: Math.max(10, Math.min(window.innerWidth - BAR_WIDTH - 10, left)),
    top: Math.max(10, Math.min(window.innerHeight - BAR_HEIGHT - 10, top)),
  }
}

function lastVisibleRect(range: Range): DOMRect | null {
  const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0)
  const onScreen = rects.filter(
    (r) => r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth
  )
  return onScreen[onScreen.length - 1] ?? rects[rects.length - 1] ?? null
}

export const TextSelectionExplainer: React.FC<TextSelectionExplainerProps> = ({
  currentPage,
  onExplain,
  onAddNote,
}) => {
  const [selectedText, setSelectedText] = useState('')
  const [surroundingContext, setSurroundingContext] = useState('')
  const [buttonPos, setButtonPos] = useState<PopoverPos | null>(null)

  const dismiss = useCallback(() => {
    setButtonPos(null)
    setSelectedText('')
    setSurroundingContext('')
  }, [])

  useEffect(() => {
    const handleSelection = (pointer?: { x: number; y: number }) => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        setButtonPos(null)
        return
      }

      const text = readFormattedPdfSelection(selection)
      if (text.length < MIN_SELECTION_CHARS) {
        setButtonPos(null)
        return
      }

      try {
        const range = selection.getRangeAt(0)
        const rect = lastVisibleRect(range)
        if (!rect && !pointer) {
          setButtonPos(null)
          return
        }

        let contextText = ''
        const startNode = range.commonAncestorContainer
        const startEl =
          startNode instanceof HTMLElement ? startNode : startNode.parentElement
        const textLayer = startEl?.closest('.react-pdf__Page__textContent, .textLayer')
        if (textLayer instanceof HTMLElement) {
          contextText = (textLayer.innerText || textLayer.textContent || '').trim()
        } else if (startEl) {
          contextText = (startEl.innerText || startEl.textContent || '').trim()
        }

        setSelectedText(text)
        setSurroundingContext(contextText)

        const anchorX = pointer?.x ?? rect!.left + rect!.width / 2
        const anchorY = pointer?.y ?? rect!.top
        const placeAbove = anchorY > BAR_HEIGHT + 12
        const top = placeAbove ? anchorY - BAR_HEIGHT - 8 : (rect ? rect.bottom + 8 : anchorY + 12)
        const left = anchorX - BAR_WIDTH / 2
        setButtonPos(clampBarPos(left, top))
      } catch {
        setButtonPos(null)
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      const point = { x: e.clientX, y: e.clientY }
      window.setTimeout(() => handleSelection(point), 50)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss()
        return
      }
      window.setTimeout(() => handleSelection(), 50)
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [dismiss])

  const handleExplain = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedText.trim()) return
    const text = selectedText
    const context = surroundingContext
    dismiss()
    window.getSelection()?.removeAllRanges()
    onExplain(text, currentPage, context)
  }

  const handleAddNote = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedText.trim()) return
    const text = selectedText
    dismiss()
    window.getSelection()?.removeAllRanges()
    onAddNote?.(text, currentPage)
  }

  if (!buttonPos) return null

  return (
    <div
      className="selection-action-bar"
      style={{
        position: 'fixed',
        top: `${buttonPos.top}px`,
        left: `${buttonPos.left}px`,
        zIndex: 9999,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button type="button" className="selection-action-btn selection-action-btn--explain" onClick={handleExplain}>
        <span>Explain</span>
      </button>
      <CopyButton text={selectedText} className="selection-action-btn selection-action-btn--copy" />
      {onAddNote && (
        <button type="button" className="selection-action-btn selection-action-btn--note" onClick={handleAddNote}>
          <span>Add note</span>
        </button>
      )}
    </div>
  )
}
