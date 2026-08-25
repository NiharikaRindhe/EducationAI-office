// src/routes/shared/reader/routes/ReaderLibrary.tsx
//
// New — replaces upstream's BookManager.tsx (upload/library/delete UI,
// not ported: uploading a book is a Super Admin/School Admin concern that
// already exists in the Content Portal). This is read-only: every book
// listed is one this student's class can already open.

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

  const openBook = (book: ReadableBook) => {
    navigate(`/batch${batchId}/reader/${book.id}`, { state: { title: book.bookTitle } })
  }

  const bySubject = new Map<string, ReadableBook[]>()
  for (const book of books ?? []) {
    const list = bySubject.get(book.subject) ?? []
    list.push(book)
    bySubject.set(book.subject, list)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-bold text-slate-900">PDF Simulator</h1>
      <p className="mt-1 text-sm text-slate-500">
        Open a textbook to see interactive simulations, ask questions about a page, and keep notes.
      </p>

      {error && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {!books && !error && (
        <div className="mt-10 flex items-center justify-center text-sm text-slate-400">Loading books…</div>
      )}

      {books && books.length === 0 && !error && (
        <div className="mt-10 rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
          No books have simulations ready for your class yet. Check back once your school's books finish processing.
        </div>
      )}

      {[...bySubject.entries()].map(([subject, subjectBooks]) => (
        <section key={subject} className="mt-8 first:mt-6">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">{subject}</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjectBooks.map((book) => (
              <button
                key={book.id}
                type="button"
                onClick={() => openBook(book)}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="text-[11px] font-bold uppercase tracking-wide text-indigo-600">Class {book.classNum} · {book.subject}</div>
                <div className="mt-1 font-semibold text-slate-900">{book.bookTitle}</div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
