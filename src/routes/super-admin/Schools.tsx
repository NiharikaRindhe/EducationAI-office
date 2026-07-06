import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Plus, AlertCircle, Power } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

interface School {
  id: string;
  name: string;
  code: string;
  plan: string;
  city: string | null;
  state: string | null;
  board: string;
  is_active: boolean;
  created_at: string;
}

export const SuperAdminSchools: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [board, setBoard] = useState<'CBSE' | 'ICSE' | 'State' | 'IB'>('CBSE');
  const [plan, setPlan] = useState<'starter' | 'school' | 'enterprise'>('starter');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSchools = useCallback(async () => {
    setIsLoading(true);
    try {
      setSchools(await api.get<School[]>('/super-admin/schools'));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load schools');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadSchools(); }, [loadSchools]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await api.post('/super-admin/schools', { name, code: code.toUpperCase(), city: city || undefined, state: state || undefined, board, plan });
      setName(''); setCode(''); setCity(''); setState('');
      setShowForm(false);
      await loadSchools();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to create school');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (school: School) => {
    try {
      await api.patch(`/super-admin/schools/${school.id}/active`, { isActive: !school.is_active });
      await loadSchools();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to update school');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <span className="font-display font-black text-2xl text-slate-800 block">{schools.length}</span>
          <span className="text-[10px] font-label-caps text-slate-400">Schools on the platform</span>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
        >
          <Plus size={14} /> New School
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm grid grid-cols-3 gap-3">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="School name"
            className="col-span-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-500" />
          <input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code, e.g. SPS-DELHI-01"
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-500 font-mono" />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City"
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-500" />
          <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State"
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-500" />
          <select value={board} onChange={(e) => setBoard(e.target.value as typeof board)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none">
            {['CBSE', 'ICSE', 'State', 'IB'].map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={plan} onChange={(e) => setPlan(e.target.value as typeof plan)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none">
            {['starter', 'school', 'enterprise'].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button type="submit" disabled={isSubmitting} className="col-span-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl py-2.5 transition-all cursor-pointer disabled:opacity-50">
            {isSubmitting ? 'Creating…' : 'Create School'}
          </button>
        </form>
      )}

      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : schools.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No schools yet — create one to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 font-label-caps text-[9px] border-b border-slate-100">
                  <th className="pb-2">Name</th><th className="pb-2">Code</th><th className="pb-2">Location</th><th className="pb-2">Board</th><th className="pb-2">Plan</th><th className="pb-2">Status</th><th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {schools.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50">
                    <td className="py-2.5 font-semibold text-slate-700">{s.name}</td>
                    <td className="py-2.5 font-mono">{s.code}</td>
                    <td className="py-2.5">{[s.city, s.state].filter(Boolean).join(', ') || '—'}</td>
                    <td className="py-2.5">{s.board}</td>
                    <td className="py-2.5 capitalize">{s.plan}</td>
                    <td className="py-2.5">
                      {s.is_active ? <span className="text-emerald-600 font-bold">Active</span> : <span className="text-slate-400 font-bold">Inactive</span>}
                    </td>
                    <td className="py-2.5">
                      <button onClick={() => toggleActive(s)} className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer">
                        <Power size={12} /> {s.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
