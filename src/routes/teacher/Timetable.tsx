import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Loader2, AlertCircle, X, CalendarClock, Ban, RefreshCcw, ChevronLeft, ChevronRight, FlaskConical } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

interface Occurrence {
  date: string;
  dayOfWeek: number;
  slotId: string;
  classSectionId: string;
  classNum: number | null;
  sectionLabel: string | null;
  periodNo: number;
  startsAt: string;
  endsAt: string;
  subject: string;
  labId: string | null;
  labName: string | null;
  status: 'scheduled' | 'cancelled' | 'rescheduled_out' | 'rescheduled_in';
  reason?: string | null;
  movedTo?: { date: string; periodNo: number } | null;
  movedFrom?: string | null;
}

interface Lab {
  id: string;
  name: string;
  is_active: boolean;
}

const DAY_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const inputCls =
  'w-full px-3 py-2 text-[13px] text-slate-800 bg-white border border-slate-300 rounded-lg outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50';
const labelCls = 'block text-[12px] font-medium text-slate-600 mb-1';

const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const shortTime = (t: string) => t.slice(0, 5);

function mondayOf(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

export const TeacherTimetable: React.FC = () => {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [occurrences, setOccurrences] = useState<Occurrence[] | null>(null);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [error, setError] = useState('');

  const [modalOcc, setModalOcc] = useState<Occurrence | null>(null);
  const [action, setAction] = useState<'cancelled' | 'rescheduled'>('cancelled');
  const [reason, setReason] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newPeriodNo, setNewPeriodNo] = useState('1');
  const [newLabId, setNewLabId] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const weekDates = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  }), [weekStart]);

  const load = useCallback(async () => {
    setOccurrences(null);
    try {
      const from = fmtDate(weekStart);
      const to = fmtDate(weekDates[5]!);
      const [occ, labData] = await Promise.all([
        api.get<Occurrence[]>('/teacher/timetable/occurrences', { from, to }),
        labs.length ? Promise.resolve(labs) : api.get<Lab[]>('/teacher/labs').catch(() => [] as Lab[]),
      ]);
      setOccurrences(occ);
      if (!labs.length) setLabs(labData.filter((l) => l.is_active));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load timetable');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  useEffect(() => { void load(); }, [load]);

  const byDate = useMemo(() => {
    const map = new Map<string, Occurrence[]>();
    for (const o of occurrences ?? []) {
      if (o.status === 'rescheduled_out') continue;
      const list = map.get(o.date) ?? [];
      list.push(o);
      map.set(o.date, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.periodNo - b.periodNo);
    return map;
  }, [occurrences]);

  const openModal = (occ: Occurrence) => {
    setModalOcc(occ);
    setAction('cancelled');
    setReason('');
    setNewDate(occ.date);
    setNewPeriodNo(String(occ.periodNo));
    setNewLabId(occ.labId ?? '');
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalOcc) return;
    setFormError('');
    setIsSubmitting(true);
    try {
      const payload =
        action === 'cancelled'
          ? { status: 'cancelled' as const, exceptionDate: modalOcc.date, reason }
          : {
              status: 'rescheduled' as const,
              exceptionDate: modalOcc.date,
              reason,
              newDate,
              newPeriodNo: Number(newPeriodNo),
              newLabId: newLabId || null,
            };
      await api.post(`/teacher/timetable/${modalOcc.slotId}/exceptions`, payload);
      setModalOcc(null);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'Failed to save the change');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
          <CalendarClock size={16} className="text-indigo-500" /> My Weekly Schedule
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer"><ChevronLeft size={15} /></button>
          <span className="text-xs font-semibold text-slate-600 min-w-36 text-center">
            {weekDates[0]!.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {weekDates[5]!.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
          <button onClick={() => setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer"><ChevronRight size={15} /></button>
          <button onClick={() => setWeekStart(mondayOf(new Date()))}
            className="text-[12px] font-semibold text-indigo-600 hover:underline px-2 cursor-pointer">This week</button>
        </div>
      </div>

      {occurrences === null ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-400" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {weekDates.map((d) => {
            const dateStr = fmtDate(d);
            const dayOccs = byDate.get(dateStr) ?? [];
            const isToday = dateStr === fmtDate(new Date());
            return (
              <div key={dateStr} className={`bento-card border p-4 flex flex-col gap-2.5 ${isToday ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100 bg-white'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-xs text-slate-700">{DAY_LABEL[d.getDay()]} · {d.getDate()}</span>
                  {isToday && <span className="text-[9px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">Today</span>}
                </div>
                {dayOccs.length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-2">No periods.</p>
                ) : (
                  dayOccs.map((o, i) => (
                    <div key={i} className={`rounded-lg px-3 py-2.5 border ${o.status === 'cancelled' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className={`block text-[12px] font-bold truncate ${o.status === 'cancelled' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                            P{o.periodNo} · {o.subject}
                          </span>
                          <span className="block text-[10px] text-slate-400 truncate">
                            Class {o.classNum}-{o.sectionLabel} · {shortTime(o.startsAt)}–{shortTime(o.endsAt)}
                          </span>
                          {o.labName && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-400 truncate mt-0.5">
                              <FlaskConical size={10} /> {o.labName}
                            </span>
                          )}
                          {o.status === 'rescheduled_in' && (
                            <span className="block text-[10px] text-amber-600 font-semibold mt-0.5">Moved here from {o.movedFrom}</span>
                          )}
                          {o.status === 'cancelled' && o.reason && (
                            <span className="block text-[10px] text-rose-500 mt-0.5">{o.reason}</span>
                          )}
                        </div>
                        {(o.status === 'scheduled' || o.status === 'rescheduled_in') && (
                          <button onClick={() => openModal(o)} title="Reschedule or cancel"
                            className="shrink-0 p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer">
                            <RefreshCcw size={13} />
                          </button>
                        )}
                        {o.status === 'cancelled' && <Ban size={13} className="text-rose-400 shrink-0" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalOcc && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 backdrop-blur-[2px] overflow-y-auto py-10 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-[15px] font-semibold text-slate-800">
                  Class {modalOcc.classNum}-{modalOcc.sectionLabel} · {modalOcc.subject}
                </h2>
                <p className="text-[12px] text-slate-400 mt-0.5">{modalOcc.date}, Period {modalOcc.periodNo}</p>
              </div>
              <button onClick={() => setModalOcc(null)} className="text-slate-400 hover:text-slate-600 p-1.5 cursor-pointer"><X size={17} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
                  <AlertCircle size={15} /> {formError}
                </div>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => setAction('cancelled')}
                  className={`flex-1 text-[13px] font-semibold py-2 rounded-lg border cursor-pointer transition-colors ${action === 'cancelled' ? 'bg-rose-600 text-white border-rose-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  Cancel period
                </button>
                <button type="button" onClick={() => setAction('rescheduled')}
                  className={`flex-1 text-[13px] font-semibold py-2 rounded-lg border cursor-pointer transition-colors ${action === 'rescheduled' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  Reschedule
                </button>
              </div>

              <div>
                <label className={labelCls}>Reason <span className="text-rose-500">*</span></label>
                <input required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Lab PCs down" className={inputCls} />
              </div>

              {action === 'rescheduled' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>New date</label>
                      <input required type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>New period</label>
                      <input required type="number" min={1} max={12} value={newPeriodNo} onChange={(e) => setNewPeriodNo(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Lab</label>
                    <select value={newLabId} onChange={(e) => setNewLabId(e.target.value)} className={inputCls}>
                      <option value="">— Same as before —</option>
                      {labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-1">
                <button type="button" onClick={() => setModalOcc(null)} className="text-[13px] font-semibold text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold px-5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
