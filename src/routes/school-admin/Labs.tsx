import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Plus, AlertCircle, FlaskConical, X, Users, MapPin } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

interface Lab {
  id: string;
  name: string;
  seat_capacity: number;
  location: string | null;
  is_active: boolean;
}

const inputCls =
  'w-full px-3 py-2 text-[13px] text-slate-800 bg-white border border-slate-300 rounded-lg outline-none transition-colors focus:border-slate-500 focus:ring-2 focus:ring-slate-100 placeholder:text-slate-400';
const labelCls = 'block text-[12px] font-medium text-slate-600 mb-1';

const EMPTY_FORM = { name: '', seatCapacity: '30', location: '' };

export const SchoolAdminLabs: React.FC = () => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Lab | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setLabs(await api.get<Lab[]>('/school-admin/labs'));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load labs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (lab: Lab) => {
    setEditing(lab);
    setForm({ name: lab.name, seatCapacity: String(lab.seat_capacity), location: lab.location ?? '' });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      const payload = { name: form.name, seatCapacity: Number(form.seatCapacity), location: form.location || undefined };
      if (editing) {
        await api.patch(`/school-admin/labs/${editing.id}`, payload);
      } else {
        await api.post('/school-admin/labs', payload);
      }
      setShowModal(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'Failed to save lab');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (lab: Lab) => {
    setTogglingId(lab.id);
    try {
      await api.patch(`/school-admin/labs/${lab.id}`, { isActive: !lab.is_active });
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to update lab');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-800">Computer Labs</h2>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Register every computer lab your school has — the timetable builder schedules sections into these.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <Plus size={15} /> Add Lab
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : labs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
            <FlaskConical size={28} strokeWidth={1.5} />
            <p className="text-[13px]">No labs registered yet — add your first one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  {['Lab', 'Seats', 'Location', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {labs.map((lab) => (
                  <tr key={lab.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(lab)} className="text-[13px] font-semibold text-slate-800 hover:text-indigo-600 hover:underline cursor-pointer">
                        {lab.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-700 tabular-nums">
                      <span className="inline-flex items-center gap-1.5"><Users size={13} className="text-slate-400" /> {lab.seat_capacity}</span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-600">
                      {lab.location ? <span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-slate-400" /> {lab.location}</span> : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${lab.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${lab.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {lab.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => void toggleActive(lab)}
                        disabled={togglingId === lab.id}
                        className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-50 ${
                          lab.is_active
                            ? 'text-slate-600 border-slate-200 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                        }`}
                      >
                        {togglingId === lab.id ? <Loader2 size={12} className="animate-spin" /> : lab.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 backdrop-blur-[2px] overflow-y-auto py-10 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-[15px] font-semibold text-slate-800">{editing ? 'Edit lab' : 'Add a lab'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 cursor-pointer"><X size={17} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
                  <AlertCircle size={15} /> {formError}
                </div>
              )}
              <div>
                <label className={labelCls}>Lab name <span className="text-rose-500">*</span></label>
                <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Lab 1" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Seat capacity <span className="text-rose-500">*</span></label>
                <input required type="number" min={1} max={200} value={form.seatCapacity}
                  onChange={(e) => setForm((p) => ({ ...p, seatCapacity: e.target.value }))} className={inputCls} />
                <p className="text-[11px] text-slate-400 mt-1">The timetable builder warns you if you seat a bigger section here.</p>
              </div>
              <div>
                <label className={labelCls}>Location</label>
                <input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="Ground floor, Block B" className={inputCls} />
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-1">
                <button type="button" onClick={() => setShowModal(false)} className="text-[13px] font-semibold text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />} {editing ? 'Save changes' : 'Add lab'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
