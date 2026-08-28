// src/routes/shared/reader/routes/ReaderSubjectChapters.tsx
//
// Middle screen of the 3-step flow: ReaderLibrary (pick subject) -> here
// (pick chapter) -> ReaderBookPage (unchanged simulation + notes reader).
// A direct link/refresh lands here with no router state, so — same pattern
// as ReaderBookPage's title fallback — this re-fetches the book list itself
// rather than relying on navigation state.

import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { useApp } from '../../../../context/AppContext.js'
import { simApiClient, type ReadableBook } from '../api.js'

// Most uploaded titles follow "Chapter 10 - Symmetrical Designs"; pull the
// number out for a badge and for sorting. Falls back gracefully otherwise.
function parseChapter(bookTitle: string): { num: number | null; label: string } {
  const match = bookTitle.match(/^chapter\s+(\d+)\s*[-:]\s*(.+)$/i)
  if (!match) return { num: null, label: bookTitle }
  return { num: Number(match[1]), label: match[2].trim() }
}

export const ReaderSubjectChapters: React.FC = () => {
  const { batchId } = useApp()
  const navigate = useNavigate()
  const { subject: subjectParam } = useParams<{ subject: string }>()
  const subject = subjectParam ? decodeURIComponent(subjectParam) : ''
  const [books, setBooks] = useState<ReadableBook[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    simApiClient
      .listBooks()
      .then((rows) => {
        if (!cancelled) setBooks(rows)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load chapters')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const chapters = useMemo(() => {
    return (books ?? [])
      .filter((b) => b.subject === subject)
      .map((b) => ({ book: b, ...parseChapter(b.bookTitle) }))
      .sort((a, b) => (a.num ?? Infinity) - (b.num ?? Infinity))
  }, [books, subject])

  const openBook = (book: ReadableBook) => {
    navigate(`/batch${batchId}/reader/${book.id}`, { state: { title: book.bookTitle } })
  }

  const isSky = batchId === 3
  const eyebrowClass = isSky ? 'text-sky-600' : 'text-indigo-600'
  const badgeClass = isSky ? 'bg-sky-50 text-sky-600' : 'bg-indigo-50 text-indigo-600'

  return (
    <div className="mx-auto h-full max-w-5xl overflow-y-auto px-4 py-8">
      <button
        type="button"
        onClick={() => navigate(`/batch${batchId}/reader`)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600"
      >
        <ArrowLeft size={14} /> All subjects
      </button>

      <p className={`mt-3 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] ${eyebrowClass}`}>PDF Simulator</p>
      <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-slate-800">{subject || 'Chapters'}</h1>
      <p className="mt-1 text-sm text-slate-500">Pick a chapter to open its interactive simulation and notes.</p>

      {error && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {!books && !error && (
        <div className="mt-10 flex items-center justify-center text-sm text-slate-400">Loading chapters…</div>
      )}

      {books && chapters.length === 0 && !error && (
        <div className="mt-10 rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
          No chapters ready in {subject || 'this subject'} yet.
        </div>
      )}

      {chapters.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {chapters.map(({ book, num, label }) => (
            <button
              key={book.id}
              type="button"
              onClick={() => openBook(book)}
              className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${badgeClass}`}>
                {num ?? '•'}
              </span>
              <span className="min-w-0 flex-1 truncate font-display font-bold text-slate-800">{label}</span>
              <ChevronRight size={18} className="shrink-0 text-slate-300" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
