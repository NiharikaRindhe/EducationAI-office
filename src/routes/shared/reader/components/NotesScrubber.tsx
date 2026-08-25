// web/src/features/pdf-simulator/components/NotesScrubber.tsx

import React, { useState } from 'react'
import type { NoteRecord } from '../api.js'

export interface NotesScrubberProps {
  notes: NoteRecord[]
  activeId: string | null
  onSelect: (noteId: string) => void
}

const MIN_NOTES = 3

function previewText(note: NoteRecord): string {
  const raw = (note.note.trim() || note.highlight.trim() || 'Empty note').replace(/\s+/g, ' ')
  return raw.length > 88 ? `${raw.slice(0, 85)}…` : raw
}

export const NotesScrubber: React.FC<NotesScrubberProps> = ({ notes, activeId, onSelect }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (notes.length < MIN_NOTES) return null

  const hoveredIndex = hoveredId ? notes.findIndex((n) => n.id === hoveredId) : -1
  const hoveredNote = hoveredIndex >= 0 ? notes[hoveredIndex] : null
  const flyoutTop =
    hoveredIndex >= 0
      ? `calc(0.4rem + ${(hoveredIndex + 0.5) / notes.length} * (100% - 0.8rem))`
      : '50%'

  return (
    <div className="notebook-rail" onMouseLeave={() => setHoveredId(null)}>
      {hoveredNote && (
        <button
          type="button"
          className={`notebook-rail__flyout notebook-rail__flyout--${hoveredNote.color}`}
          style={{ top: flyoutTop }}
          onClick={() => onSelect(hoveredNote.id)}
        >
          <span className="notebook-rail__item-meta">
            Page {hoveredNote.page_number}
            {hoveredNote.starred ? ' · Starred' : ''}
          </span>
          <span className="notebook-rail__item-text">{previewText(hoveredNote)}</span>
        </button>
      )}

      <div className="notebook-rail__track" aria-label="Note timeline">
        {notes.map((note) => (
          <button
            key={note.id}
            type="button"
            className={`notebook-rail__tick notebook-rail__tick--${note.color}${
              note.id === activeId ? ' is-active' : ''
            }${note.id === hoveredId ? ' is-hot' : ''}${note.starred ? ' is-starred' : ''}`}
            aria-label={`Page ${note.page_number}: ${previewText(note)}`}
            aria-current={note.id === activeId ? 'true' : undefined}
            onMouseEnter={() => setHoveredId(note.id)}
            onFocus={() => setHoveredId(note.id)}
            onClick={() => onSelect(note.id)}
          />
        ))}
      </div>
    </div>
  )
}
