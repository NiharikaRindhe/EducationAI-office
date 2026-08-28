// src/routes/shared/reader/routes/ReaderBookPage.tsx
//
// New — resolves a signed PDF URL for the requested book, then mounts
// upstream's ReaderRoute unchanged. Upstream's own App.tsx did this
// resolution (list books, pick one, hand ReaderRoute a pdfSource); that
// file wasn't ported (book ownership/library is a portal concern — see
// ReaderLibrary.tsx), so this is its replacement, scoped to one book.

import React, { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useApp } from '../../../../context/AppContext.js'
import { simApiClient } from '../api.js'
import { ReaderRoute } from './ReaderRoute.js'

export const ReaderBookPage: React.FC = () => {
  const { batchId } = useApp()
  const { bookId } = useParams<{ bookId: string }>()
  const location = useLocation()
  const stateTitle = (location.state as { title?: string } | null)?.title
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [title, setTitle] = useState<string | undefined>(stateTitle)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!bookId) return
    let cancelled = false
    setPdfUrl(null)
    setError(null)

    simApiClient
      .getBookPdfUrl(bookId)
      .then((url) => {
        if (!cancelled) setPdfUrl(url)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to open this book')
      })

    // A hard refresh / direct link has no router state to read the title
    // from — fall back to the list, which is cheap (JSON only, no PDF bytes).
    if (!stateTitle) {
      simApiClient
        .listBooks()
        .then((books) => {
          if (cancelled) return
          const match = books.find((b) => b.id === bookId)
          if (match) setTitle(match.bookTitle)
        })
        .catch(() => {
          // Non-fatal — the reader still opens, just without a title in its chrome.
        })
    }

    return () => {
      cancelled = true
    }
  }, [bookId, stateTitle])

  if (!bookId) return null

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="max-w-sm rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-center text-sm text-rose-700">{error}</div>
      </div>
    )
  }

  if (!pdfUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className={`w-7 h-7 rounded-full border-2 animate-spin ${batchId === 3 ? 'border-sky-500/40 border-t-sky-500' : 'border-indigo-500/40 border-t-indigo-500'}`} />
          <p className="text-xs font-semibold text-slate-400">Opening book…</p>
        </div>
      </div>
    )
  }

  return <ReaderRoute bookId={bookId} pdfSource={pdfUrl} bookTitle={title} />
}
