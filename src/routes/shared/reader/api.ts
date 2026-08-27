// src/routes/shared/reader/api.ts
//
// Rewrite of pdf-simulation-master's web/src/features/pdf-simulator/api.ts
// against our backend (api/src/routes/student.routes.ts's /sim/* routes)
// instead of the standalone /api/sim/* server. Every exported type keeps
// upstream's exact (snake_case) shape and every method keeps upstream's
// exact call signature, so every component under components/ and sim/
// that imports from here — SimDrawer, ChatPane, NotebookPanel,
// TextSelectionExplainer, ReaderRoute itself — stays byte-identical to
// upstream. This file is the whole integration boundary; see
// vite.config.ts's @sim/shared alias comment for the sibling boundary on
// the simulation-catalog side.
//
// What actually changed, and why:
//  - Auth: every request carries the bearer token, following the pattern
//    in src/routes/batch3/labs/Chemistry/Lab/Lab.jsx.
//  - No book upload/library/delete here — that's the Super Admin's
//    Content Portal. bookId (kept as the param name upstream used) is
//    really our ncert_ingestion_jobs id ("jobId" server-side).
//  - Chat is no longer SSE. sendChatMessageStream() keeps its exact
//    (params, { onDelta, signal }) contract, but makes one plain POST and
//    calls onDelta ONCE with the full reply — the caller
//    (ReaderRoute.handleSendChatMessage) already wraps every onDelta call
//    through createWordStreamer, so the typing effect is unchanged.
//  - Grounding text is never sent by the client. bookContext.pageText is
//    accepted on the type (ReaderRoute still tracks it for other reasons)
//    but is NOT put on the wire — the server derives it itself from
//    (jobId, page) via sim_pages. See simAccess.service.ts.
//  - llmPrompt is never populated (our backend doesn't send one — see
//    simExplain.service.ts's header comment on why it was dropped). Kept
//    as an always-undefined optional field so this file's types don't
//    force a change in ReaderRoute.tsx, which reads `result.llmPrompt`.
//  - Notes are NOT anonymous/local-storage-backed. bookId/userId are
//    accepted on every notes method (matching upstream's signatures
//    exactly) but userId is never sent — the server derives the student
//    from the bearer token. There is no localStorage fallback: a note
//    write failure is a real error now, not a silent local-only save.

import { getAccessToken } from '../../../lib/api.js'
import { resolveSimBrief, type SimBrief, type SimSpec } from '@sim/shared'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

export interface VariableExplanation {
  symbol: string
  meaning: string
  unit?: string
}

export interface EquationBreakdown {
  formula: string
  description: string
  variables: VariableExplanation[]
}

export interface AnimationElementGuide {
  element: string
  meaning: string
}

export interface ThoughtExperiment {
  question: string
  hint?: string
  answer: string
}

export interface StudentExplanation {
  summary: string
  intuition: string[]
  animationGuide: AnimationElementGuide[]
  equationBreakdown: EquationBreakdown[]
  realWorldApplications: string[]
  thoughtExperiment: ThoughtExperiment
  keyTakeaways: string[]
  tutorAnswer?: string
}

export interface SelectionExplanation {
  selectedText: string
  conceptTitle: string
  domain: string
  summary: string
  detailedExplanation: string[]
  keyTakeaways: string[]
  realWorldExample?: string
  relatedFormulas?: string[]
  llmPrompt?: string
}

export interface ChatApiTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatBookContext {
  title?: string
  currentPage?: number
  parentTopic?: string
  domain?: string
  /** Tracked client-side for other reasons (image-intent heuristics); never sent — see header comment. */
  pageText?: string
  pageImage?: string
  imageSource?: 'user' | 'auto'
  recentHadImage?: boolean
  syllabusTopics?: string[]
  bookId?: string
}

export interface ChatReply {
  reply: string
  relatedFormulas?: string[]
  keyTakeaways?: string[]
  llmPrompt?: string
}

export type { SimBrief }

export interface SimAnnotation {
  id: string
  book_id: string
  page_number: number
  quote: string
  spec: SimSpec
  spec_version: string
  content_hash?: string
  created_at: string
}

/** GET /student/sim/books row shape — used by the new ReaderLibrary
 *  picker, not part of upstream's API surface. */
export interface ReadableBook {
  id: string
  classNum: number
  subject: string
  bookTitle: string
  pagesSimulated: number
}

export interface BookRecord {
  id: string
  slug: string
  title: string
  storage_path: string
  page_count?: number
  status: 'pending' | 'extracting' | 'classifying' | 'ready' | 'failed'
  error?: string | null
  created_at: string
}

export interface NoteRecord {
  id: string
  book_id: string
  user_id: string
  page_number: number
  highlight: string
  note: string
  color: string
  starred: boolean
  created_at: string
  updated_at: string
}

export type NotePatch = {
  note?: string
  color?: string
  starred?: boolean
}

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getAccessToken()
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(`${API_URL}${path}`, { ...init, headers })
}

async function readJson<T>(res: Response, fallbackMessage: string): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || err?.error || fallbackMessage)
  }
  return res.json() as Promise<T>
}

// ─── Server annotation shape -> upstream's SimAnnotation shape ───────────
// Our /sim/books/:jobId/annotations returns camelCase rows
// ({id, pageNumber, quote, spec, specVersion}); every component below this
// file expects upstream's snake_case SimAnnotation. Translated here, once,
// so nothing downstream needs to know our backend's field naming.
interface ServerAnnotation {
  id: string
  pageNumber: number
  quote: string
  spec: SimSpec
  specVersion: string
}

function toSimAnnotation(bookId: string, row: ServerAnnotation): SimAnnotation {
  return {
    id: row.id,
    book_id: bookId,
    page_number: row.pageNumber,
    quote: row.quote,
    spec: row.spec,
    spec_version: row.specVersion,
    created_at: '',
  }
}

class SimulationApiClient {
  private bookAnnotationsCache: Map<string, SimAnnotation[]> = new Map()
  // Only fetchBookAnnotations uses this today, hence the concrete type
  // rather than Promise<unknown> — that would fail the `!`-asserted return
  // below against this method's Promise<SimAnnotation[]> signature.
  private pendingRequests: Map<string, Promise<SimAnnotation[]>> = new Map()

  /** Every sim-ready book the student's class can read, for the library
   *  picker (ReaderLibrary.tsx — new, not part of upstream's API shape,
   *  so this returns our backend's own fields rather than being squeezed
   *  into upstream's sparse BookRecord). */
  async listBooks(): Promise<ReadableBook[]> {
    const res = await authedFetch('/student/sim/books')
    const data = await readJson<{ books: ReadableBook[] }>(res, 'Failed to list books')
    return data.books
  }

  /** A short-lived signed URL for react-pdf to load the PDF from directly. */
  async getBookPdfUrl(bookId: string): Promise<string> {
    const res = await authedFetch(`/student/sim/books/${encodeURIComponent(bookId)}/pdf-url`)
    const data = await readJson<{ url: string }>(res, 'Failed to get a download link for this book')
    return data.url
  }

  async fetchBookAnnotations(bookId: string): Promise<SimAnnotation[]> {
    if (this.bookAnnotationsCache.has(bookId)) return this.bookAnnotationsCache.get(bookId)!

    const key = `annotations:${bookId}`
    if (this.pendingRequests.has(key)) return this.pendingRequests.get(key)!

    const request = (async () => {
      try {
        const res = await authedFetch(`/student/sim/books/${encodeURIComponent(bookId)}/annotations`)
        const data = await readJson<{ annotations: ServerAnnotation[] }>(res, 'Failed to fetch book annotations')
        const annotations = data.annotations.map((row) => toSimAnnotation(bookId, row))
        this.bookAnnotationsCache.set(bookId, annotations)
        return annotations
      } finally {
        this.pendingRequests.delete(key)
      }
    })()

    this.pendingRequests.set(key, request)
    return request
  }

  seedAnnotations(bookId: string, annotations: SimAnnotation[]): void {
    this.bookAnnotationsCache.set(bookId, annotations)
  }

  clearCache(): void {
    this.bookAnnotationsCache.clear()
    this.pendingRequests.clear()
  }

  async generateAiSimulation(params: {
    prompt?: string
    pageText?: string
    bookId?: string
    pageNumber?: number
    annotationId?: string
    existingSpec?: SimSpec
  }): Promise<{ spec: SimSpec; annotation?: SimAnnotation | null }> {
    if (!params.bookId || !params.pageNumber) throw new Error('generateAiSimulation requires bookId and pageNumber')
    const res = await authedFetch('/student/sim/generate', {
      method: 'POST',
      body: JSON.stringify({
        jobId: params.bookId,
        page: params.pageNumber,
        prompt: params.prompt || params.existingSpec?.title || '',
        annotationId: params.annotationId,
      }),
    })
    const data = await readJson<{ spec: SimSpec; annotation: ServerAnnotation | null }>(res, 'Generation failed')
    const annotation = data.annotation ? toSimAnnotation(params.bookId, data.annotation) : null

    if (annotation && params.annotationId) {
      const cached = this.bookAnnotationsCache.get(params.bookId) || []
      const updated = cached.map((item) => (item.id === params.annotationId ? annotation : item))
      this.bookAnnotationsCache.set(params.bookId, updated)
    }

    return { spec: data.spec, annotation }
  }

  async fetchStudentExplanation(_params: {
    spec: SimSpec
    quote?: string
    pageText?: string
    mode?: 'beginner' | 'standard' | 'advanced'
    customQuestion?: string
    skipCache?: boolean
  }): Promise<StudentExplanation> {
    // Unused by the ported reader (ExplainPanel reads resolveSimBrief
    // client-side, never this endpoint) — kept for API-surface parity, not
    // wired to a real call site. Throwing rather than guessing a shape
    // keeps that honest if something new ever calls it.
    throw new Error('fetchStudentExplanation is not wired in this port — see api.ts header comment')
  }

  /** bookId is required here (not part of upstream's param shape — see the
   *  one-line addition at this method's ReaderRoute.tsx call site). */
  async explainSelectionText(params: {
    bookId: string
    selectedText: string
    surroundingContext?: string
    pageText?: string
    currentPage?: number
    parentTopic?: string
    domain?: string
    mode?: 'beginner' | 'standard' | 'advanced'
    pageImage?: string
  }): Promise<SelectionExplanation> {
    if (!params.currentPage) throw new Error('explainSelectionText requires currentPage')
    const res = await authedFetch('/student/sim/explain-selection', {
      method: 'POST',
      body: JSON.stringify({
        jobId: params.bookId,
        page: params.currentPage,
        selectedText: params.selectedText,
        parentTopic: params.parentTopic,
        domain: params.domain,
        mode: params.mode,
        image: params.pageImage,
      }),
    })
    const data = await readJson<{ explanation: SelectionExplanation }>(res, 'Failed to explain selected text')
    return data.explanation
  }

  /** Streaming contract preserved (see header comment) — one plain POST,
   *  one onDelta call with the full reply. */
  async sendChatMessageStream(
    params: { messages: ChatApiTurn[]; bookContext?: ChatBookContext; bookId?: string },
    options: { onDelta: (text: string) => void; signal?: AbortSignal },
  ): Promise<ChatReply> {
    const bookId = params.bookId || params.bookContext?.bookId
    const page = params.bookContext?.currentPage
    if (!bookId || !page) throw new Error('Chat requires an open book and a current page')

    const res = await authedFetch('/student/sim/chat', {
      method: 'POST',
      body: JSON.stringify({
        jobId: bookId,
        page,
        messages: params.messages,
        parentTopic: params.bookContext?.parentTopic,
        domain: params.bookContext?.domain,
        image: params.bookContext?.pageImage,
      }),
      signal: options.signal,
    })
    const data = await readJson<ChatReply>(res, 'Failed to send chat message')
    if (data.reply) options.onDelta(data.reply)
    return data
  }

  /** Never calls an LLM — reads the brief stored on the spec, or derives
   *  one procedurally. Pure, so this runs client-side with zero request. */
  fetchSimBrief(params: { spec: SimSpec; quote?: string }): SimBrief {
    return resolveSimBrief(params.spec, params.quote)
  }

  async fetchNotes(bookId: string, _userId: string): Promise<NoteRecord[]> {
    const res = await authedFetch(`/student/sim/notes/${encodeURIComponent(bookId)}`)
    const data = await readJson<{ notes: ServerNote[] }>(res, 'Failed to fetch notes')
    return data.notes.map((n) => toNoteRecord(bookId, n))
  }

  async createNote(payload: { bookId: string; userId: string; pageNumber: number; highlight: string; note?: string; color?: string }): Promise<NoteRecord> {
    const res = await authedFetch('/student/sim/notes', {
      method: 'POST',
      body: JSON.stringify({
        jobId: payload.bookId,
        pageNumber: payload.pageNumber,
        highlight: payload.highlight,
        note: payload.note,
        color: payload.color,
      }),
    })
    const data = await readJson<{ note: ServerNote }>(res, 'Failed to create note')
    return toNoteRecord(payload.bookId, data.note)
  }

  async updateNote(noteId: string, patch: NotePatch): Promise<NoteRecord> {
    const res = await authedFetch(`/student/sim/notes/${encodeURIComponent(noteId)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    const data = await readJson<{ note: ServerNote }>(res, 'Failed to update note')
    return toNoteRecord(data.note.jobId, data.note)
  }

  async deleteNote(noteId: string): Promise<void> {
    const res = await authedFetch(`/student/sim/notes/${encodeURIComponent(noteId)}`, { method: 'DELETE' })
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message || 'Failed to delete note')
    }
  }
}

interface ServerNote {
  id: string
  jobId: string
  pageNumber: number
  highlight: string
  note: string
  color: string
  starred: boolean
  createdAt: string
  updatedAt: string
}

function toNoteRecord(bookId: string, row: ServerNote): NoteRecord {
  return {
    id: row.id,
    book_id: bookId,
    user_id: '',
    page_number: row.pageNumber,
    highlight: row.highlight,
    note: row.note,
    color: row.color,
    starred: row.starred,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  }
}

export const simApiClient = new SimulationApiClient()

/** Vestigial: upstream keyed anonymous local notes off a browser-generated
 *  id. Our notes are scoped to the authenticated student server-side, so
 *  this exists only so ReaderRoute.tsx's `useMemo(() => getNotesUserId(), [])`
 *  keeps compiling unchanged — the value is never sent anywhere. */
export function getNotesUserId(): string {
  return 'authenticated-student'
}
