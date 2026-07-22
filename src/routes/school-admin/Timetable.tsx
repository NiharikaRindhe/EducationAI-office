import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Loader2, AlertCircle, X, Trash2, Plus, FlaskConical, AlertTriangle } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

interface SectionRow {
  id: string;
  class_num: number;
  section_label: string;
}
interface TeacherRow {
  id: string;
  full_name: string;
}
interface SubjectRow {
  class_num: number;
  subject: string;
}
interface Lab {
  id: string;
  name: string;
  seat_capacity: number;
  is_active: boolean;
}
interface Slot {
  id: string;
  classSectionId: string;
  dayOfWeek: number;
  periodNo: number;
  startsAt: string;
  endsAt: string;
  subject: string;
  teacherId: string | null;
  teacherName: string | null;
  labId: string | null;
  labName: string | null;
}

const DAYS = [
  { num: 1, label: 'Mon' },
  { num: 2, label: 'Tue' },
  { num: 3, label: 'Wed' },
  { num: 4, label: 'Thu' },
  { num: 5, label: 'Fri' },
  { num: 6, label: 'Sat' },
];
const PERIODS = Array.from({ length: 10 }, (_, i) => i + 1);

const inputCls =
  'w-full px-3 py-2 text-[13px] text-slate-800 bg-white border border-slate-300 rounded-lg outline-none transition-colors focus:border-slate-500 focus:ring-2 focus:ring-slate-100';
const labelCls = 'block text-[12px] font-medium text-slate-600 mb-1';

const EMPTY_FORM = { startsAt: '09:00', endsAt: '09:40', subject: '', teacherId: '', labId: '' };

export const SchoolAdminTimetable: React.FC = () => {
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalCell, setModalCell] = useState<{ dayOfWeek: number; periodNo: number; slot: Slot | null } | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formWarning, setFormWarning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadStatic = useCallback(async () => {
    try {
      const [sectionData, teacherData, subjectData, labData] = await Promise.all([
        api.get<SectionRow[]>('/school-admin/class-sections'),
        api.get<TeacherRow[]>('/school-admin/teachers'),
        api.get<SubjectRow[]>('/school-admin/subjects'),
        api.get<Lab[]>('/school-admin/labs'),
      ]);
      setSections(sectionData);
      setTeachers(teacherData);
      setSubjects(subjectData);
      setLabs(labData.filter((l) => l.is_active));
      setSelectedSectionId((prev) => prev || sectionData[0]?.id || '');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load timetable setup');
    }
  }, []);

  const loadSlots = useCallback(async (sectionId: string) => {
    if (!sectionId) { setSlots([]); return; }
    setIsLoading(true);
    try {
      setSlots(await api.get<Slot[]>('/school-admin/timetable', { classSectionId: sectionId }));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load timetable');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadStatic(); }, [loadStatic]);
  useEffect(() => { if (selectedSectionId) void loadSlots(selectedSectionId); }, [selectedSectionId, loadSlots]);

  const slotByCell = useMemo(() => {
    const map = new Map<string, Slot>();
    for (const s of slots) map.set(`${s.dayOfWeek}|${s.periodNo}`, s);
    return map;
  }, [slots]);

  const selectedSection = sections.find((s) => s.id === selectedSectionId) ?? null;
  const availableSubjects = selectedSection ? subjects.filter((s) => s.class_num === selectedSection.class_num) : [];

  const openCell = (dayOfWeek: number, periodNo: number) => {
    const existing = slotByCell.get(`${dayOfWeek}|${periodNo}`) ?? null;
    setModalCell({ dayOfWeek, periodNo, slot: existing });
    setForm(
      existing
        ? {
            startsAt: existing.startsAt.slice(0, 5),
            endsAt: existing.endsAt.slice(0, 5),
            subject: existing.subject,
            teacherId: existing.teacherId ?? '',
            labId: existing.labId ?? '',
          }
        : EMPTY_FORM,
    );
    setFormError('');
    setFormWarning('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalCell || !selectedSectionId) return;
    setFormError('');
    setFormWarning('');
    setIsSubmitting(true);
    try {
      const payload = {
        classSectionId: selectedSectionId,
        dayOfWeek: modalCell.dayOfWeek,
        periodNo: modalCell.periodNo,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
        subject: form.subject,
        teacherId: form.teacherId || null,
        labId: form.labId || null,
      };
      const result = modalCell.slot
        ? await api.patch<Slot & { capacityWarning: string | null }>(`/school-admin/timetable/${modalCell.slot.id}`, payload)
        : await api.post<Slot & { capacityWarning: string | null }>('/school-admin/timetable', payload);

      if (result.capacityWarning) {
        setFormWarning(result.capacityWarning);
      }
      setModalCell(null);
      await loadSlots(selectedSectionId);
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'Failed to save period');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!modalCell?.slot) return;
    setIsDeleting(true);
    try {
      await api.delete(`/school-admin/timetable/${modalCell.slot.id}`);
      setModalCell(null);
      await loadSlots(selectedSectionId);
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'Failed to remove period');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-800">Lab Timetable Builder</h2>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Build the weekly period grid per section — assign subject, teacher and lab per period. Conflicts are checked automatically.
          </p>
        </div>
        <select
          value={selectedSectionId}
          onChange={(e) => setSelectedSectionId(e.target.value)}
          className="px-3 py-2 text-[13px] text-slate-700 bg-white border border-slate-300 rounded-lg outline-none cursor-pointer focus:border-slate-500 min-w-48"
        >
          {sections.length === 0 && <option value="">No sections yet</option>}
          {sections.map((s) => (
            <option key={s.id} value={s.id}>Class {s.class_num} · {s.section_label}</option>
          ))}
        </select>
      </div>

      {labs.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
          <FlaskConical size={15} /> No labs registered yet — add one under Labs before scheduling lab periods.
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : !selectedSectionId ? (
          <p className="text-[13px] text-slate-400 text-center py-16">Set up a section first under Classes &amp; Sections.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-3 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-16">Period</th>
                  {DAYS.map((d) => (
                    <th key={d.num} className="px-3 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider min-w-40">{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((periodNo) => (
                  <tr key={periodNo} className="border-t border-slate-100">
                    <td className="px-3 py-2.5 text-[13px] font-semibold text-slate-500 tabular-nums align-top">{periodNo}</td>
                    {DAYS.map((d) => {
                      const slot = slotByCell.get(`${d.num}|${periodNo}`);
                      return (
                        <td key={d.num} className="px-2 py-2 align-top border-l border-slate-50">
                          {slot ? (
                            <button
                              onClick={() => openCell(d.num, periodNo)}
                              className="w-full text-left bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg px-2.5 py-2 transition-colors cursor-pointer"
                            >
                              <span className="block text-[12px] font-semibold text-indigo-900 truncate">{slot.subject}</span>
                              <span className="block text-[10px] text-indigo-500 truncate">{slot.teacherName ?? 'No teacher'}</span>
                              <span className="block text-[10px] text-indigo-500 truncate">{slot.labName ?? 'No lab'}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => openCell(d.num, periodNo)}
                              className="w-full flex items-center justify-center py-2.5 rounded-lg border border-dashed border-slate-200 text-slate-300 hover:border-slate-300 hover:text-slate-400 transition-colors cursor-pointer"
                            >
                              <Plus size={13} />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalCell && selectedSection && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 backdrop-blur-[2px] overflow-y-auto py-10 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-[15px] font-semibold text-slate-800">
                  Class {selectedSection.class_num}-{selectedSection.section_label} · {DAYS.find((d) => d.num === modalCell.dayOfWeek)?.label} · Period {modalCell.periodNo}
                </h2>
                <p className="text-[12px] text-slate-400 mt-0.5">{modalCell.slot ? 'Edit this period' : 'Assign this period'}</p>
              </div>
              <button onClick={() => setModalCell(null)} className="text-slate-400 hover:text-slate-600 p-1.5 cursor-pointer"><X size={17} /></button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 flex flex-col gap-4">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
                  <AlertCircle size={15} /> {formError}
                </div>
              )}
              {formWarning && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
                  <AlertTriangle size={15} /> {formWarning}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Starts</label>
                  <input required type="time" value={form.startsAt} onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Ends</label>
                  <input required type="time" value={form.endsAt} onChange={(e) => setForm((p) => ({ ...p, endsAt: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Subject <span className="text-rose-500">*</span></label>
                {availableSubjects.length > 0 ? (
                  <select required value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} className={inputCls}>
                    <option value="">Select subject</option>
                    {availableSubjects.map((s) => <option key={s.subject} value={s.subject}>{s.subject}</option>)}
                  </select>
                ) : (
                  <input required value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} placeholder="Subject" className={inputCls} />
                )}
              </div>
              <div>
                <label className={labelCls}>Teacher</label>
                <select value={form.teacherId} onChange={(e) => setForm((p) => ({ ...p, teacherId: e.target.value }))} className={inputCls}>
                  <option value="">— No teacher —</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Lab</label>
                <select value={form.labId} onChange={(e) => setForm((p) => ({ ...p, labId: e.target.value }))} className={inputCls}>
                  <option value="">— No lab —</option>
                  {labs.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.seat_capacity} seats)</option>)}
                </select>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 mt-1">
                {modalCell.slot ? (
                  <button type="button" onClick={() => void handleDelete()} disabled={isDeleting}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50">
                    {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Remove
                  </button>
                ) : <span />}
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setModalCell(null)} className="text-[13px] font-semibold text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting}
                    className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
                    {isSubmitting && <Loader2 size={14} className="animate-spin" />} Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
