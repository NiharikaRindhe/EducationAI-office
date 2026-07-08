import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, AlertCircle, Printer, KeyRound } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { printCredentialSlips } from '../../lib/printSlips';

interface TeacherRow {
  id: string;
  full_name: string;
  is_active: boolean;
  has_logged_in_ever: boolean;
  teacher_profiles: { specialization: string | null; classes_taught: number[] } | null;
}

interface Credential {
  fullName: string;
  username: string;
  password: string;
}

export const LabInchargeTeachers: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetCredential, setResetCredential] = useState<Credential | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setTeachers(await api.get<TeacherRow[]>('/lab-incharge/teachers'));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load teachers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleReset = async (t: TeacherRow) => {
    setError('');
    setResettingId(t.id);
    try {
      setResetCredential(await api.post<Credential>(`/lab-incharge/teachers/${t.id}/reset-password`));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to reset password');
    } finally {
      setResettingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {resetCredential && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="text-xs text-amber-800">
            <span className="font-bold">{resetCredential.fullName}</span> — new password:{' '}
            <span className="font-mono font-bold text-sm">{resetCredential.password}</span>
            <span className="block text-amber-600 mt-0.5">Login ID: <span className="font-mono">{resetCredential.username}</span></span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() =>
                printCredentialSlips(
                  [{ fullName: resetCredential.fullName, username: resetCredential.username, roleLine: 'Teacher', password: resetCredential.password }],
                  'Teacher Login Slip',
                )
              }
              className="flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 px-3 py-1.5 rounded-lg cursor-pointer"
            >
              <Printer size={13} /> Print Slip
            </button>
            <button onClick={() => setResetCredential(null)} className="text-xs font-bold text-amber-500 hover:bg-amber-100 px-2 py-1.5 rounded-lg cursor-pointer">✕</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <h2 className="font-display font-bold text-lg text-slate-800 mb-4">All Teachers ({teachers.length})</h2>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-teal-400" /></div>
        ) : teachers.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No teachers yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 font-label-caps text-[9px] border-b border-slate-100">
                  <th className="pb-2">Name</th><th className="pb-2">Specialization</th><th className="pb-2">Status</th><th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50">
                    <td className="py-2.5 font-semibold text-slate-700">{t.full_name}</td>
                    <td className="py-2.5">{t.teacher_profiles?.specialization ?? '—'}</td>
                    <td className="py-2.5">
                      {t.has_logged_in_ever ? (
                        <span className="text-emerald-600 font-bold">Active</span>
                      ) : (
                        <span className="text-amber-600 font-bold">Never logged in</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => void handleReset(t)}
                        disabled={resettingId === t.id}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-teal-600 hover:bg-teal-50 px-2 py-1 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                      >
                        {resettingId === t.id ? <Loader2 size={11} className="animate-spin" /> : <KeyRound size={11} />}
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
