// web/src/features/pdf-simulator/components/NotebookPanel.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { NotePatch, NoteRecord } from '../api.js'
import { parseHighlightBlocks } from '../utils/formatPdfSelection.js'
import { CollapseRuleButton, CollapsibleBlock } from './CollapsibleBlock.js'
import { NotesScrubber } from './NotesScrubber.js'

export interface NotebookPanelProps {
  notes: NoteRecord[]
  currentPage: number
  canAdd: boolean
  onAddBlank: () => void
  onUpdate: (noteId: string, patch: NotePatch) => void
  onDelete: (noteId: string) => void
  onGoToPage: (page: number) => void
}

const COLORS = ['yellow', 'blue', 'green', 'rose', 'violet'] as const

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.4l2.47 5.01 5.53.8-4 3.9.94 5.5L12 16.02 7.06 18.61l.94-5.5-4-3.9 5.53-.8L12 3.4z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FormattedHighlight({ text }: { text: string }) {
  const blocks = parseHighlightBlocks(text)
  if (blocks.length === 0) return null

  return (
    <div className="notebook-card__quote-text">
      {blocks.map((block, i) => {
        if (block.type === 'ul') {
          return (
            <ul key={i} className="notebook-card__quote-list">
              {block.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          )
        }
        if (block.type === 'ol') {
          return (
            <ol key={i} className="notebook-card__quote-list" start={block.start}>
              {block.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ol>
          )
        }
        return (
          <p key={i} className="notebook-card__quote-p">
            {block.text}
          </p>
        )
      })}
    </div>
  )
}

function formatNoteDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function autoGrow(el: HTMLTextAreaElement, expanded: boolean, collapsedMax = 120) {
  el.style.height = 'auto'
  const full = Math.max(el.scrollHeight, 72)
  if (!expanded && full > collapsedMax) {
    el.style.height = `${collapsedMax}px`
    el.style.overflowY = 'hidden'
    return true
  }
  el.style.height = `${full}px`
  el.style.overflowY = 'hidden'
  return full > collapsedMax
}

function NoteCard({
  note,
  onUpdate,
  onDelete,
  onGoToPage,
}: {
  note: NoteRecord
  onUpdate: NotebookPanelProps['onUpdate']
  onDelete: NotebookPanelProps['onDelete']
  onGoToPage: NotebookPanelProps['onGoToPage']
}) {
  const [draft, setDraft] = useState(note.note)
  const [bodyOpen, setBodyOpen] = useState(false)
  const [bodyCanCollapse, setBodyCanCollapse] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setDraft(note.note)
  }, [note.note])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    setBodyCanCollapse(autoGrow(el, bodyOpen))
  }, [draft, bodyOpen])

  const savedAt = formatNoteDate(note.updated_at || note.created_at)

  return (
    <article
      className={`notebook-card notebook-card--${note.color}${note.starred ? ' is-starred' : ''}`}
    >
      <header className="notebook-card__header">
        <div className="notebook-card__lead">
          <button
            type="button"
            className="notebook-card__page"
            onClick={() => onGoToPage(note.page_number)}
            title={`Go to page ${note.page_number}`}
          >
            Page {note.page_number}
          </button>
          <button
            type="button"
            className={`notebook-card__star${note.starred ? ' is-on' : ''}`}
            onClick={() => onUpdate(note.id, { starred: !note.starred })}
            title={note.starred ? 'Remove from important' : 'Mark as important'}
            aria-label={note.starred ? 'Unstar note' : 'Star note'}
            aria-pressed={note.starred}
          >
            <StarIcon filled={note.starred} />
          </button>
        </div>
        <div className="notebook-card__tools">
          <div className="notebook-card__palette" role="group" aria-label="Note color">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`notebook-card__swatch notebook-card__swatch--${color}${
                  note.color === color ? ' is-on' : ''
                }`}
                onClick={() => {
                  if (note.color !== color) onUpdate(note.id, { color })
                }}
                title={color}
                aria-label={`${color} marker`}
                aria-pressed={note.color === color}
              />
            ))}
          </div>
          <button
            type="button"
            className="notebook-card__delete"
            onClick={() => onDelete(note.id)}
            title="Delete note"
          >
            Delete
          </button>
        </div>
      </header>

      {note.highlight.trim() && (
        <blockquote className="notebook-card__quote">
          <span className="notebook-card__quote-label">From the textbook</span>
          <CollapsibleBlock maxHeight={88}>
            <FormattedHighlight text={note.highlight} />
          </CollapsibleBlock>
        </blockquote>
      )}

      <div className="notebook-card__compose">
        <div
          className={`notebook-card__compose-body${
            bodyCanCollapse && !bodyOpen ? ' is-clipped' : ''
          }`}
        >
          <textarea
            ref={textareaRef}
            className="notebook-card__body"
            value={draft}
            placeholder="Write this in your own words…"
            rows={3}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => setBodyOpen(true)}
            onBlur={() => {
              if (draft !== note.note) onUpdate(note.id, { note: draft })
            }}
          />
        </div>
        {bodyCanCollapse && (
          <CollapseRuleButton
            open={bodyOpen}
            onToggle={() => setBodyOpen((v) => !v)}
          />
        )}
      </div>

      {savedAt && <p className="notebook-card__meta">{savedAt}</p>}
    </article>
  )
}

export const NotebookPanel: React.FC<NotebookPanelProps> = ({
  notes,
  currentPage,
  canAdd,
  onAddBlank,
  onUpdate,
  onDelete,
  onGoToPage,
}) => {
  const [thisPageOnly, setThisPageOnly] = useState(false)
  const [starredOnly, setStarredOnly] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef(new Map<string, HTMLElement>())
  const focusTimerRef = useRef<number>(0)

  const visible = useMemo(() => {
    let list = notes
    if (thisPageOnly) list = list.filter((n) => n.page_number === currentPage)
    if (starredOnly) list = list.filter((n) => n.starred)
    return [...list].sort((a, b) => {
      if (a.page_number !== b.page_number) return a.page_number - b.page_number
      if (a.starred !== b.starred) return a.starred ? -1 : 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [notes, thisPageOnly, starredOnly, currentPage])

  const groups = useMemo(() => {
    const map = new Map<number, NoteRecord[]>()
    for (const note of visible) {
      const bucket = map.get(note.page_number)
      if (bucket) bucket.push(note)
      else map.set(note.page_number, [note])
    }
    return [...map.entries()]
  }, [visible])

  useEffect(() => {
    const root = listRef.current
    if (!root || visible.length === 0) return

    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        const id = hit?.target.getAttribute('data-note-id')
        if (id) setActiveId(id)
      },
      { root, threshold: [0.15, 0.4, 0.7] }
    )

    for (const el of cardRefs.current.values()) io.observe(el)
    return () => io.disconnect()
  }, [visible])

  useEffect(() => {
    return () => window.clearTimeout(focusTimerRef.current)
  }, [])

  const focusNote = (noteId: string) => {
    const el = cardRefs.current.get(noteId)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveId(noteId)
    setFocusedId(noteId)
    window.clearTimeout(focusTimerRef.current)
    focusTimerRef.current = window.setTimeout(() => {
      setFocusedId((cur) => (cur === noteId ? null : cur))
    }, 1600)
  }

  const countLabel =
    notes.length === 0
      ? 'No notes yet'
      : `${notes.length} note${notes.length === 1 ? '' : 's'} in this book`

  return (
    <div className="notebook">
      <header className="notebook__header">
        <div>
          <h2 className="notebook__title">Study notes</h2>
          <p className="notebook__subtitle">{countLabel}</p>
        </div>
        <div className="notebook__actions">
          <button
            type="button"
            className={`notebook__filter${thisPageOnly ? ' is-on' : ''}`}
            onClick={() => setThisPageOnly((v) => !v)}
            aria-pressed={thisPageOnly}
          >
            This page
          </button>
          <button
            type="button"
            className={`notebook__filter${starredOnly ? ' is-on' : ''}`}
            onClick={() => setStarredOnly((v) => !v)}
            aria-pressed={starredOnly}
          >
            Starred
          </button>
          {canAdd && (
            <button type="button" className="notebook__add" onClick={onAddBlank}>
              New note
            </button>
          )}
        </div>
      </header>

      <div className="notebook__body">
      <div ref={listRef} className={`notebook__list${visible.length === 0 ? ' is-empty' : ''}`}>
        {visible.length === 0 ? (
          <div className="notebook__empty">
            <h3 className="notebook__empty-title">
              {starredOnly && thisPageOnly
                ? `No starred notes on page ${currentPage}`
                : starredOnly
                  ? 'No starred notes yet'
                  : thisPageOnly
                    ? `Nothing on page ${currentPage}`
                    : 'Capture what matters'}
            </h3>
            <p className="notebook__empty-desc">
              {starredOnly
                ? 'Star a note to mark it as important, then filter here to review them.'
                : thisPageOnly
                  ? 'Highlight a sentence on this page, or start a blank note.'
                  : 'Select a passage in the textbook and choose Add note, or start a blank note for this page.'}
            </p>
            {canAdd && !starredOnly && (
              <button type="button" className="notebook__empty-btn" onClick={onAddBlank}>
                Start a note on page {currentPage}
              </button>
            )}
            {(thisPageOnly || starredOnly) && notes.length > 0 && (
              <button
                type="button"
                className="notebook__empty-link"
                onClick={() => {
                  setThisPageOnly(false)
                  setStarredOnly(false)
                }}
              >
                Show all notes
              </button>
            )}
          </div>
        ) : (
          groups.map(([page, pageNotes]) => (
            <section key={page} className="notebook__group">
              <div className="notebook__group-head">
                <h3 className="notebook__group-title">Page {page}</h3>
                {page === currentPage && <span className="notebook__group-tag">Current</span>}
                <button
                  type="button"
                  className="notebook__group-jump"
                  onClick={() => onGoToPage(page)}
                >
                  Open
                </button>
              </div>
              {pageNotes.map((note) => (
                <div
                  key={note.id}
                  data-note-id={note.id}
                  className={`notebook__card-anchor${focusedId === note.id ? ' is-focused' : ''}`}
                  ref={(el) => {
                    if (el) cardRefs.current.set(note.id, el)
                    else cardRefs.current.delete(note.id)
                  }}
                >
                  <NoteCard
                    note={note}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onGoToPage={onGoToPage}
                  />
                </div>
              ))}
            </section>
          ))
        )}
      </div>
      <NotesScrubber notes={visible} activeId={activeId} onSelect={focusNote} />
      </div>
    </div>
  )
}
