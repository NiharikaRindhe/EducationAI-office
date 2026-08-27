// src/routes/shared/reader/routes/ReaderLibrary.tsx
//
// New — replaces upstream's BookManager.tsx (upload/library/delete UI,
// not ported: uploading a book is a Super Admin/School Admin concern that
// already exists in the Content Portal). This is read-only: every book
// listed is one this student's class can already open.
//
// Entry screen of a 3-step flow: pick a subject here, pick a chapter on
// ReaderSubjectChapters, then the chapter opens the unchanged simulation +
// notes reader (ReaderBookPage/ReaderRoute) — see App.tsx's /reader routes.

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, ChevronRight } from 'lucide-react'
import { useApp } from '../../../../context/AppContext.js'
import { simApiClient, type ReadableBook } from '../api.js'

export const ReaderLibrary: React.FC = () => {
  // batchId is app state (which student dashboard this is), not a URL
  // param — routes are mounted at literal /batch2, /batch3, not /batch:id.
  const { batchId } = useApp()
  const navigate = useNavigate()
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
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load books')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const bySubject = new Map<string, ReadableBook[]>()
  for (const book of books ?? []) {
    const list = bySubject.get(book.subject) ?? []
    list.push(book)
    bySubject.set(book.subject, list)
  }
  const subjects = [...bySubject.entries()]

  const openSubject = (subject: string) => {
    navigate(`/batch${batchId}/reader/subject/${encodeURIComponent(subject)}`)
  }

  const isSky = batchId === 3
  const eyebrowClass = isSky ? 'text-sky-600' : 'text-indigo-600'
  const iconClass = isSky ? 'bg-sky-50 text-sky-600' : 'bg-indigo-50 text-indigo-600'

  return (
    <div className="mx-auto h-full max-w-5xl overflow-y-auto px-4 py-8">
      <p className={`text-[0.65rem] font-extrabold uppercase tracking-[0.14em] ${eyebrowClass}`}>PDF Simulator</p>
      <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-slate-800">Choose a subject</h1>
      <p className="mt-1 text-sm text-slate-500">Pick a subject to see its chapters with interactive simulations.</p>

      {error && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {!books && !error && (
        <div className="mt-10 flex items-center justify-center text-sm text-slate-400">Loading books…</div>
      )}

      {books && subjects.length === 0 && !error && (
        <div className="mt-10 rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
          No books have simulations ready for your class yet. Check back once your school's books finish processing.
        </div>
      )}

      {subjects.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map(([subject, subjectBooks]) => (
            <button
              key={subject}
              type="button"
              onClick={() => openSubject(subject)}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
                <BookOpen size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display font-bold text-slate-800">{subject}</div>
                <div className="mt-0.5 text-xs text-slate-400">
                  {subjectBooks.length} chapter{subjectBooks.length === 1 ? '' : 's'} ready
                </div>
              </div>
              <ChevronRight size={18} className="shrink-0 text-slate-300" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
