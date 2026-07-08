import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Plus, AlertCircle, Printer, KeyRound } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { printCredentialSlips } from '../../lib/printSlips';

interface LabInchargeRow {
  id: string;
  full_name: string;
  is_active: boolean;
  has_logged_in_ever: boolean;
}

interface Credential {
  fullName: string;
  username: string;
  password: string;
}

export const SchoolAdminLabIncharges: React.FC = () => {
  const [rows, setRows] = useState<LabInchargeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [freshCredential, setFreshCredential] = useState<Credential | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setRows(await api.get<LabInchargeRow[]>('/school-admin/lab-incharges'));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load lab in-charges');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAdding(true);
    try {
      const credential = await api.post<Credential>('/school-admin/lab-incharges', { fullName: newName });
      setFreshCredential(credential);
      setNewName('');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to add lab in-charge');
    } finally {
      setIsAdding(false);
    }
  };

  const handleReset = async (row: LabInchargeRow) => {
    setError('');
    setResettingId(row.id);
    try {
      const credential = await api.post<Credential>(`/school-admin/lab-incharges/${row.id}/reset-password`);
      setFreshCredential(credential);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to reset password');
    } finally {
      setResettingId(null);
    }
  };

  const printSlip = (credential: Credential) => {
    printCredentialSlips(
      [{ fullName: credential.fullName, username: credential.username, roleLine: 'Lab In-charge', password: credential.password }],
      'Lab In-charge Login Slip',
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-800">Lab In-charges</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Can reset student PINs and teacher passwords, and see today's roster and live sessions — no access to grades, exams, or tasks. Most schools need just one or two.
          </p>
        </div>

        <form onSubmit={handleAdd} className="flex items-center gap-3">
          <input required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name"
            className="flex-1 max-w-xs px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-400" />
          <button type="submit" disabled={isAdding}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl px-4 py-2.5 transition-all cursor-pointer">
            {isAdding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add Lab In-charge
          </button>
        </form>
      </div>

      {freshCredential && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="text-xs text-amber-800">
            <span className="font-bold">{freshCredential.fullName}</span> — password:{' '}
            <span className="font-mono font-bold text-sm">{freshCredential.password}</span>
            <span className="block text-amber-600 mt-0.5">Login ID: <span className="font-mono">{freshCredential.username}</span></span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => printSlip(freshCredential)} className="flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 px-3 py-1.5 rounded-lg cursor-pointer">
              <Printer size={13} /> Print Slip
            </button>
            <button onClick={() => setFreshCredential(null)} className="text-xs font-bold text-amber-500 hover:bg-amber-100 px-2 py-1.5 rounded-lg cursor-pointer">✕</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <h2 className="font-display font-bold text-lg text-slate-800 mb-4">All Lab In-charges ({rows.length})</h2>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-rose-400" /></div>
        ) : rows.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No lab in-charges yet — add one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 font-label-caps text-[9px] border-b border-slate-100">
                  <th className="pb-2">Name</th><th className="pb-2">Status</th><th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50">
                    <td className="py-2.5 font-semibold text-slate-700">{r.full_name}</td>
                    <td className="py-2.5">
                      {r.has_logged_in_ever ? (
                        <span className="text-emerald-600 font-bold">Active</span>
                      ) : (
                        <span className="text-amber-600 font-bold">Never logged in</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => void handleReset(r)}
                        disabled={resettingId === r.id}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                      >
                        {resettingId === r.id ? <Loader2 size={11} className="animate-spin" /> : <KeyRound size={11} />}
                        Reset Password
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
