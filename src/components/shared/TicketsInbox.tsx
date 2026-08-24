import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle, Plus, ArrowLeft, ArrowUpCircle, Send, X, CheckSquare, Square } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

type Category = 'account' | 'content' | 'technical' | 'ai' | 'other';
type Status = 'open' | 'in_progress' | 'resolved' | 'closed';
type Priority = 'low' | 'normal' | 'high' | 'urgent';
type RaisedRole = 'student' | 'teacher' | 'school_admin' | 'lab_incharge' | 'super_admin';

interface Ticket {
  id: string;
  school_id: string | null;
  raised_by: string;
  raised_role: RaisedRole;
  category: Category;
  subject: string;
  body: string;
  status: Status;
  priority: Priority;
  escalated_to_super: boolean;
  created_at: string;
  resolved_at: string | null;
  schools: { name: string; code: string } | null;
  raiser: { full_name: string } | null;
}

interface TicketMessage {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender: { full_name: string; role: string } | null;
}

interface TicketDetail extends Ticket {
  messages: TicketMessage[];
}

interface School {
  id: string;
  name: string;
  code: string;
}

const STATUS_STYLES: Record<Status, string> = {
  open: 'bg-rose-50 text-rose-600 border-rose-100',
  in_progress: 'bg-amber-50 text-amber-600 border-amber-100',
  resolved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  closed: 'bg-slate-100 text-slate-500 border-slate-200',
};

const STATUS_LABELS: Record<Status, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const CATEGORY_LABELS: Record<Category, string> = {
  account: 'Account',
  content: 'Content',
  technical: 'Technical',
  ai: 'AI',
  other: 'Other',
};

const ROLE_LABELS: Record<RaisedRole, string> = {
  student: 'Student',
  teacher: 'Teacher',
  school_admin: 'School Admin',
  lab_incharge: 'Lab In-charge',
  super_admin: 'Super Admin',
};

/** Only roles that actually raise support tickets in practice — a viewer
 *  filtering "who raised this" doesn't need super_admin as an option. */
const RAISED_ROLE_FILTER_OPTIONS: RaisedRole[] = ['school_admin', 'teacher', 'student', 'lab_incharge'];

/** How often the list (and an open ticket) re-fetch on their own, so a
 *  status change made by someone else in another session — a School Admin
 *  and the Super Admin both looking at the same escalated ticket, say —
 *  shows up without a manual reload (item #28, "sync...properly"). */
const TICKET_POLL_MS = 15000;

interface TicketsInboxProps {
  accentColor: 'rose' | 'slate' | 'indigo' | 'sky' | 'amber';
  /** Show status-change controls (school admin and super admin manage; a teacher/student only reads + replies). */
  canTriage: boolean;
  /** Show the "Escalate to Super Admin" action (school admin only). */
  canEscalate: boolean;
  /** Show a per-school filter dropdown and school column (super admin only). */
  showSchoolFilter: boolean;
  /** Restrict "raise a ticket" to a specific school (school admin/teacher/student) vs. optional (super admin). */
  fixedSchool: boolean;
  /** Pre-fills and opens the "raise a ticket" form on mount — e.g. arriving
   *  from the Content Library after hitting the per-subject upload limit. */
  initialDraft?: { category: Category; subject: string; body: string };
}

export const TicketsInbox: React.FC<TicketsInboxProps> = ({ accentColor, canTriage, canEscalate, showSchoolFilter, fixedSchool, initialDraft }) => {
  const ACCENTS = {
    rose: { btn: 'bg-rose-600 hover:bg-rose-700', text: 'text-rose-600', ring: 'focus:border-rose-400', chip: 'bg-rose-50 text-rose-600' },
    slate: { btn: 'bg-slate-800 hover:bg-slate-900', text: 'text-slate-800', ring: 'focus:border-slate-400', chip: 'bg-slate-100 text-slate-700' },
    indigo: { btn: 'bg-indigo-600 hover:bg-indigo-700', text: 'text-indigo-600', ring: 'focus:border-indigo-400', chip: 'bg-indigo-50 text-indigo-600' },
    sky: { btn: 'bg-sky-500 hover:bg-sky-600', text: 'text-sky-600', ring: 'focus:border-sky-400', chip: 'bg-sky-50 text-sky-600' },
    amber: { btn: 'bg-amber-500 hover:bg-amber-600', text: 'text-amber-600', ring: 'focus:border-amber-400', chip: 'bg-amber-50 text-amber-700' },
  } as const;
  const accent = ACCENTS[accentColor];

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [statusFilter, setStatusFilter] = useState<Status | ''>('');
  const [roleFilter, setRoleFilter] = useState<RaisedRole | ''>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState<Status | null>(null);
  // ?schoolId= lets a caller land straight on one school's queue — the Super
  // Admin overview links its per-school open-ticket count here, and the default
  // inbox ("escalated + mine") would otherwise hide exactly those tickets.
  const [searchParams] = useSearchParams();
  const [schoolFilter, setSchoolFilter] = useState(
    showSchoolFilter ? (searchParams.get('schoolId') ?? '') : '',
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState<TicketDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [showRaiseForm, setShowRaiseForm] = useState(Boolean(initialDraft));
  const [newCategory, setNewCategory] = useState<Category>(initialDraft?.category ?? 'other');
  const [newSubject, setNewSubject] = useState(initialDraft?.subject ?? '');
  const [newBody, setNewBody] = useState(initialDraft?.body ?? '');
  const [newPriority, setNewPriority] = useState<Priority>('normal');
  const [newSchoolId, setNewSchoolId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [replyBody, setReplyBody] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError('');
    try {
      const query: Record<string, string> = {};
      if (statusFilter) query.status = statusFilter;
      if (schoolFilter) query.schoolId = schoolFilter;
      if (roleFilter) query.raisedRole = roleFilter;
      setTickets(await api.get<Ticket[]>('/tickets', query));
    } catch (err) {
      // A background poll failing silently is fine — the last good list
      // stays on screen rather than flashing an error every 15s.
      if (!silent) setError(err instanceof ApiClientError ? err.message : 'Failed to load tickets');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [statusFilter, schoolFilter, roleFilter]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => void load(true), TICKET_POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (showSchoolFilter) {
      // This endpoint is paginated — it answers { rows, total }, not an array.
      // Reading it as an array left `schools` an object and crashed the whole
      // inbox on schools.map().
      void api
        .get<{ rows: School[] }>('/super-admin/schools', { pageSize: 200 })
        .then((page) => setSchools(page.rows ?? []))
        .catch(() => {});
    }
  }, [showSchoolFilter]);

  // Follow ?schoolId= when it changes on an already-mounted inbox — arriving
  // from a second scoped link, or via back/forward, is a hash-only navigation
  // that never remounts this component, so the initial state alone is not
  // enough to keep the view and the URL agreeing.
  useEffect(() => {
    if (!showSchoolFilter) return;
    const fromUrl = searchParams.get('schoolId') ?? '';
    if (fromUrl) setSchoolFilter(fromUrl);
  }, [searchParams, showSchoolFilter]);

  const openTicket = async (id: string, silent = false) => {
    if (!silent) setIsDetailLoading(true);
    if (!silent) setError('');
    try {
      setSelected(await api.get<TicketDetail>(`/tickets/${id}`));
    } catch (err) {
      if (!silent) setError(err instanceof ApiClientError ? err.message : 'Failed to load ticket');
    } finally {
      if (!silent) setIsDetailLoading(false);
    }
  };

  // Keep an open ticket's status/messages in sync while someone else (a
  // School Admin and the Super Admin can both be looking at the same
  // escalated ticket) is triaging it in another session — item #28.
  useEffect(() => {
    if (!selected) return;
    const id = window.setInterval(() => void openTicket(selected.id, true), TICKET_POLL_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const handleRaise = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await api.post('/tickets', {
        category: newCategory,
        subject: newSubject,
        body: newBody,
        priority: newPriority,
        ...(showSchoolFilter && newSchoolId ? { schoolId: newSchoolId } : {}),
      });
      setNewSubject('');
      setNewBody('');
      setNewPriority('normal');
      setShowRaiseForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to raise ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !replyBody.trim()) return;
    setIsReplying(true);
    try {
      const message = await api.post<TicketMessage>(`/tickets/${selected.id}/messages`, { body: replyBody });
      setSelected({ ...selected, messages: [...selected.messages, message] });
      setReplyBody('');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to send reply');
    } finally {
      setIsReplying(false);
    }
  };

  const handleStatusChange = async (status: Status) => {
    if (!selected) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await api.patch<Ticket>(`/tickets/${selected.id}/status`, { status });
      setSelected({ ...selected, ...updated });
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkStatus = async (status: Status) => {
    if (selectedIds.size === 0) return;
    setBulkBusy(status);
    setError('');
    try {
      const result = await api.patch<{ succeeded: string[]; failed: { ticketId: string; reason: string }[] }>(
        '/tickets/bulk/status',
        { ticketIds: [...selectedIds], status },
      );
      if (result.failed.length > 0) {
        setError(`${result.succeeded.length} updated, ${result.failed.length} failed: ${result.failed[0]?.reason ?? ''}`);
      }
      setSelectedIds(new Set());
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Bulk update failed');
    } finally {
      setBulkBusy(null);
    }
  };

  const handleEscalate = async () => {
    if (!selected) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await api.patch<Ticket>(`/tickets/${selected.id}/escalate`, {});
      setSelected({ ...selected, ...updated });
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to escalate ticket');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (selected) {
    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 w-fit cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to all tickets
        </button>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`badge px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLES[selected.status]}`}>
                  {STATUS_LABELS[selected.status]}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${accent.chip}`}>{CATEGORY_LABELS[selected.category]}</span>
                {selected.escalated_to_super && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">Escalated</span>
                )}
              </div>
              <h2 className="font-display font-bold text-lg text-slate-800">{selected.subject}</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Raised by {selected.raiser?.full_name ?? 'Unknown'} ({selected.raised_role.replace('_', ' ')})
                {selected.schools ? ` · ${selected.schools.name}` : ''} · {new Date(selected.created_at).toLocaleString()}
              </p>
            </div>

            {canTriage && (
              <div className="flex items-center gap-2 shrink-0">
                {canEscalate && !selected.escalated_to_super && (
                  <button
                    onClick={() => void handleEscalate()}
                    disabled={isUpdatingStatus}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-600 hover:bg-purple-50 border border-purple-100 px-3 py-2 rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    <ArrowUpCircle size={13} /> Escalate
                  </button>
                )}
                <select
                  value={selected.status}
                  onChange={(e) => void handleStatusChange(e.target.value as Status)}
                  disabled={isUpdatingStatus}
                  className="text-[11px] font-bold border border-slate-200 rounded-xl px-3 py-2 outline-none disabled:opacity-50 cursor-pointer"
                >
                  {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-2xl p-4">{selected.body}</p>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
            {selected.messages.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No replies yet.</p>}
            {selected.messages.map((m) => (
              <div key={m.id} className="flex flex-col gap-1 bg-slate-50 rounded-2xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">{m.sender?.full_name ?? 'Unknown'}</span>
                  <span className="text-[10px] text-slate-400">{new Date(m.created_at).toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{m.body}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleReply} className="flex items-center gap-2 border-t border-slate-100 pt-4">
            <input
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Write a reply…"
              className={`flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none transition-all ${accent.ring}`}
            />
            <button
              type="submit"
              disabled={isReplying || !replyBody.trim()}
              className={`flex items-center gap-1.5 text-white font-bold text-xs rounded-xl px-4 py-2.5 transition-all cursor-pointer disabled:opacity-50 ${accent.btn}`}
            >
              {isReplying ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Send
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-slate-800">Support Tickets</h2>
            <p className="text-xs text-slate-400 mt-0.5">Report and track issues.</p>
          </div>
          <button
            onClick={() => setShowRaiseForm((v) => !v)}
            className={`inline-flex items-center gap-1.5 text-white font-bold text-xs rounded-xl px-4 py-2.5 transition-all cursor-pointer ${accent.btn}`}
          >
            {showRaiseForm ? <X size={13} /> : <Plus size={13} />} {showRaiseForm ? 'Cancel' : 'Report an Issue'}
          </button>
        </div>

        {showRaiseForm && (
          <form onSubmit={handleRaise} className="flex flex-col gap-3 bg-slate-50 rounded-2xl p-4">
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as Category)}
                className={`px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none ${accent.ring}`}
              >
                {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Priority)}
                className={`px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none ${accent.ring}`}
              >
                <option value="low">Low priority</option>
                <option value="normal">Normal priority</option>
                <option value="high">High priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            {showSchoolFilter && !fixedSchool && (
              <select
                value={newSchoolId}
                onChange={(e) => setNewSchoolId(e.target.value)}
                className={`px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none ${accent.ring}`}
              >
                <option value="">No specific school</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            )}
            <input
              required
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Subject"
              className={`px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none ${accent.ring}`}
            />
            <textarea
              required
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Describe the issue…"
              rows={3}
              className={`px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none resize-none ${accent.ring}`}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className={`self-end flex items-center gap-1.5 text-white font-bold text-xs rounded-xl px-4 py-2.5 transition-all cursor-pointer disabled:opacity-50 ${accent.btn}`}
            >
              {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : 'Submit Ticket'}
            </button>
          </form>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Status | '')}
            className="text-[11px] font-bold border border-slate-200 rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="">All statuses</option>
            {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          {/* Who raised it — School Admin vs Teacher vs Student (item #25).
              Only useful to the roles that triage across other people's
              tickets in the first place. */}
          {canTriage && (
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value as RaisedRole | ''); setSelectedIds(new Set()); }}
              className="text-[11px] font-bold border border-slate-200 rounded-xl px-3 py-2 outline-none cursor-pointer"
            >
              <option value="">All roles</option>
              {RAISED_ROLE_FILTER_OPTIONS.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          )}
          {showSchoolFilter && (
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="text-[11px] font-bold border border-slate-200 rounded-xl px-3 py-2 outline-none cursor-pointer"
            >
              <option value="">Escalated + mine (default)</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          )}
        </div>

        {/* Same issue, several tickets — set them all at once (item #29). */}
        {canTriage && selectedIds.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
            <span className="text-[11px] font-bold text-slate-500">{selectedIds.size} selected</span>
            {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
              <button
                key={s}
                onClick={() => void handleBulkStatus(s)}
                disabled={bulkBusy !== null}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-400 transition-colors cursor-pointer disabled:opacity-50"
              >
                {bulkBusy === s ? <Loader2 size={11} className="animate-spin" /> : null} Mark {STATUS_LABELS[s]}
              </button>
            ))}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto text-[11px] font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        {isLoading || isDetailLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : tickets.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No tickets here.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all"
              >
                {canTriage && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleSelected(t.id); }}
                    aria-label={selectedIds.has(t.id) ? 'Deselect ticket' : 'Select ticket'}
                    className="shrink-0 cursor-pointer text-slate-300 hover:text-slate-500"
                  >
                    {selectedIds.has(t.id) ? <CheckSquare size={16} className={accent.text} /> : <Square size={16} />}
                  </button>
                )}
                <button
                  onClick={() => void openTicket(t.id)}
                  className="flex-1 min-w-0 flex items-center justify-between gap-4 text-left cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[t.status]}`}>{STATUS_LABELS[t.status]}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${accent.chip}`}>{CATEGORY_LABELS[t.category]}</span>
                      {canTriage && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{ROLE_LABELS[t.raised_role]}</span>
                      )}
                      {t.escalated_to_super && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">Escalated</span>}
                    </div>
                    <span className="font-semibold text-sm text-slate-800 block truncate">{t.subject}</span>
                    <span className="text-[11px] text-slate-400">
                      {t.raiser?.full_name ?? 'Unknown'} {showSchoolFilter && t.schools ? `· ${t.schools.name}` : ''} · {new Date(t.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
