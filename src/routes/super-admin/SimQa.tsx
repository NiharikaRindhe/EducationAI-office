import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import {
  TEMPLATE_IDS,
  TEMPLATE_CATALOG,
  createTemplateSpec,
  firstPlacementByTemplateId,
  isTemplateId,
  classBandContains,
  type SimDomain,
  type TemplateId,
} from '@sim/shared'
import { api, ApiClientError } from '../../lib/api'
import type { BookJob } from '../../lib/bookLibrary'
import { PdfPane } from '../shared/reader/components/PdfPane.js'
import { SimPanel } from '../shared/reader/components/SimPanel.js'
import '../shared/reader/reader.css'
import { indexBooksByTemplate } from './simQaMatch.js'

const CLASSES = [5, 6, 7, 8, 9, 10] as const
const DOMAINS: SimDomain[] = ['physics', 'math', 'chemistry']

const DOMAIN_CHIP: Record<SimDomain, string> = {
  physics: 'bg-slate-100 text-slate-700',
  math: 'bg-purple-50 text-purple-700',
  chemistry: 'bg-pink-50 text-pink-700',
}

const SORTED_IDS = [...TEMPLATE_IDS].sort((a, b) => {
  const da = TEMPLATE_CATALOG[a]
  const db = TEMPLATE_CATALOG[b]
  return da.ncertClass - db.ncertClass || da.label.localeCompare(db.label) || a.localeCompare(b)
})

const PLACEMENTS = firstPlacementByTemplateId()

export const SuperAdminSimQa: React.FC = () => {
  const navigate = useNavigate()
  const { templateId: rawId } = useParams<{ templateId: string }>()
  const [jobs, setJobs] = useState<BookJob[]>([])
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState<number | ''>('')
  const [domainFilter, setDomainFilter] = useState<SimDomain | ''>('')
  const [hasPdfOnly, setHasPdfOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const listRef = useRef<HTMLButtonElement | null>(null)
  const pdfCache = useRef<Map<string, { url: string; expiresAt: number }>>(new Map())

  useEffect(() => {
    let cancelled = false
    api
      .get<BookJob[]>('/super-admin/ncert/jobs')
      .then((rows) => {
        if (!cancelled) setJobs(rows)
      })
      .catch(() => {
        if (!cancelled) setJobs([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const bookByTemplate = useMemo(() => indexBooksByTemplate(jobs), [jobs])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return SORTED_IDS.filter((id) => {
      const def = TEMPLATE_CATALOG[id]
      if (classFilter !== '' && !classBandContains(def.classBand, classFilter)) return false
      if (domainFilter && def.domain !== domainFilter) return false
      if (q && !id.toLowerCase().includes(q) && !def.label.toLowerCase().includes(q)) return false
      if (hasPdfOnly && !bookByTemplate.has(id)) return false
      return true
    })
  }, [search, classFilter, domainFilter, hasPdfOnly, bookByTemplate])

  const currentId: TemplateId | undefined = useMemo(() => {
    if (rawId && isTemplateId(rawId) && filtered.includes(rawId)) return rawId
    return filtered[0]
  }, [rawId, filtered])

  useEffect(() => {
    if (!currentId) return
    if (rawId !== currentId) navigate(`/super-admin/sim-qa/${currentId}`, { replace: true })
  }, [currentId, rawId, navigate])

  const goTo = useCallback(
    (id: TemplateId) => navigate(`/super-admin/sim-qa/${id}`),
    [navigate],
  )

  const idx = currentId ? filtered.indexOf(currentId) : -1
  const goPrev = useCallback(() => {
    if (idx > 0) goTo(filtered[idx - 1]!)
  }, [filtered, goTo, idx])
  const goNext = useCallback(() => {
    if (idx >= 0 && idx < filtered.length - 1) goTo(filtered[idx + 1]!)
  }, [filtered, goTo, idx])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) {
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goPrev, goNext])

  const def = currentId ? TEMPLATE_CATALOG[currentId] : null
  const placement = currentId ? PLACEMENTS.get(currentId) : undefined
  const match = currentId ? bookByTemplate.get(currentId) ?? null : null

  useEffect(() => {
    if (match) setPage(match.page)
  }, [currentId, match?.job.id, match?.page])

  useEffect(() => {
    const jobId = match?.job.id
    if (!jobId) {
      setPdfUrl(null)
      setPdfError(null)
      setPdfLoading(false)
      return
    }
    const cached = pdfCache.current.get(jobId)
    if (cached && cached.expiresAt - Date.now() > 60_000) {
      setPdfUrl(cached.url)
      setPdfError(null)
      setPdfLoading(false)
      return
    }
    let cancelled = false
    setPdfLoading(true)
    setPdfError(null)
    api
      .get<{ url: string; expiresAt: string }>(`/super-admin/ncert/jobs/${jobId}/pdf-url`)
      .then((data) => {
        pdfCache.current.set(jobId, { url: data.url, expiresAt: new Date(data.expiresAt).getTime() })
        if (!cancelled) {
          setPdfUrl(data.url)
          setPdfLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPdfUrl(null)
          setPdfLoading(false)
          setPdfError(err instanceof ApiClientError ? err.message : 'Could not open this textbook')
        }
      })
    return () => {
      cancelled = true
    }
  }, [match?.job.id])

  useEffect(() => {
    listRef.current?.scrollIntoView({ block: 'nearest' })
  }, [currentId])

  const spec = useMemo(() => {
    if (!currentId) return null
    return createTemplateSpec(currentId, placement?.params, {
      title: def?.label,
      subtitle: def?.description,
    })
  }, [currentId, placement, def])

  const chapterHint = placement?.match[0]
  const extraHint =
    placement && placement.extraPages.length > 0
      ? `also p.${placement.extraPages.slice(0, 4).join(', p.')}`
      : null

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--color-bg,#f8fafc)] font-sans text-slate-800">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="min-w-0">
          <h1 className="font-display text-lg font-extrabold tracking-tight text-slate-800">Test simulations</h1>
          <p className="text-xs font-semibold text-slate-400">
            {filtered.length === 0 ? '0 / 0' : `${Math.max(1, idx + 1)} / ${filtered.length}`}
            {def ? ` · Class ${def.ncertClass} · ${def.domain}` : ''}
            {chapterHint ? ` · ${chapterHint}` : ''}
            {match ? ` · p.${page}` : ''}
            {extraHint ? ` · ${extraHint}` : ''}
          </p>
        </div>

        <div className="relative min-w-[12rem] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search id or label"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm text-slate-800 outline-none focus:border-slate-400"
          />
        </div>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value ? Number(e.target.value) : '')}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
        >
          <option value="">All classes</option>
          {CLASSES.map((n) => (
            <option key={n} value={n}>
              Class {n}
            </option>
          ))}
        </select>

        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter((e.target.value || '') as SimDomain | '')}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
        >
          <option value="">All domains</option>
          {DOMAINS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <input type="checkbox" checked={hasPdfOnly} onChange={(e) => setHasPdfOnly(e.target.checked)} />
          Has PDF
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={idx <= 0}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={idx < 0 || idx >= filtered.length - 1}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white">
          {filtered.map((id) => {
            const row = TEMPLATE_CATALOG[id]
            const active = id === currentId
            return (
              <button
                key={id}
                type="button"
                ref={active ? listRef : undefined}
                onClick={() => goTo(id)}
                className={`flex w-full flex-col gap-1 border-b border-slate-100 px-3 py-2.5 text-left ${
                  active ? 'bg-indigo-50' : 'hover:bg-slate-50'
                }`}
              >
                <span className="font-display text-sm font-bold text-slate-800">{row.label}</span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  <span>C{row.ncertClass}</span>
                  <span className={`rounded-md px-1.5 py-0.5 ${DOMAIN_CHIP[row.domain]}`}>{row.domain}</span>
                  {bookByTemplate.has(id) ? (
                    <span className="text-emerald-600">PDF</span>
                  ) : null}
                </span>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-slate-400">No templates match these filters.</p>
          )}
        </aside>

        <div className="reader-pdf-container min-w-0 flex-[1.1]">
          {pdfUrl ? (
            <PdfPane
              pdfSource={pdfUrl}
              currentPage={page}
              onPageChange={setPage}
              bookId={match?.job.id}
              bookTitle={match?.job.book_title}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-sm text-slate-500">
              {pdfLoading
                ? 'Opening textbook…'
                : pdfError
                  ? pdfError
                  : `No uploaded book for Class ${def?.ncertClass ?? '—'} ${placement?.subject ?? def?.domain ?? ''} — sim still runs.`}
            </div>
          )}
        </div>

        <div className="reader-sim-container min-w-0 flex-1">
          <div className="sim-tab flex h-full min-h-0 flex-col">
            {spec ? <SimPanel key={currentId} spec={spec} /> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
