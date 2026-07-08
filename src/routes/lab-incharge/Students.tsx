import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, AlertCircle, Printer, KeyRound, Search } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { printCredentialSlips } from '../../lib/printSlips';

interface StudentRow {
  id: string;
  full_name: string;
  is_active: boolean;
  has_logged_in_ever: boolean;
  student_profiles: { class_num: number; section: string; roll_number: string | null; avatar: string } | null;
}

interface StudentCredential {
  fullName: string;
  classNum: number;
  section: string;
  username: string;
  password?: string;
  pin?: string;
}

export const LabInchargeStudents: React.FC = () => {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetCredential, setResetCredential] = useState<StudentCredential | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setStudents(await api.get<StudentRow[]>('/lab-incharge/students'));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load students');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleReset = async (s: StudentRow) => {
    setError('');
    setResettingId(s.id);
    try {
      setResetCredential(await api.post<StudentCredential>(`/lab-incharge/students/${s.id}/reset-credentials`));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to reset credential');
    } finally {
      setResettingId(null);
    }
  };

  const filtered = students.filter((s) => s.full_name.toLowerCase().includes(search.toLowerCase()));

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
            <span className="font-bold">{resetCredential.fullName}</span> (Class {resetCredential.classNum}-{resetCredential.section}) —{' '}
            new {resetCredential.pin ? 'PIN' : 'password'}:{' '}
            <span className="font-mono font-bold text-sm">{resetCredential.pin ?? resetCredential.password}</span>
            <span className="block text-amber-600 mt-0.5">Login ID: <span className="font-mono">{resetCredential.username}</span></span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() =>
                printCredentialSlips(
                  [{ fullName: resetCredential.fullName, username: resetCredential.username, roleLine: `Class ${resetCredential.classNum}-${resetCredential.section}`, password: resetCredential.password, pin: resetCredential.pin }],
                  'Student Login Slip',
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg text-slate-800">All Students ({filtered.length})</h2>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name…"
              className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-400 w-56" />
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-teal-400" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No students found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 font-label-caps text-[9px] border-b border-slate-100">
                  <th className="pb-2">Name</th><th className="pb-2">Class</th><th className="pb-2">Status</th><th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50">
                    <td className="py-2.5 flex items-center gap-2 font-semibold text-slate-700">
                      <span className="text-lg">{s.student_profiles?.avatar}</span> {s.full_name}
                    </td>
                    <td className="py-2.5">{s.student_profiles?.class_num}-{s.student_profiles?.section}</td>
                    <td className="py-2.5">
                      {s.has_logged_in_ever ? (
                        <span className="text-emerald-600 font-bold">Active</span>
                      ) : (
                        <span className="text-amber-600 font-bold">Never logged in</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => void handleReset(s)}
                        disabled={resettingId === s.id}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-teal-600 hover:bg-teal-50 px-2 py-1 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                      >
                        {resettingId === s.id ? <Loader2 size={11} className="animate-spin" /> : <KeyRound size={11} />}
                        Reset {(s.student_profiles?.class_num ?? 5) <= 4 ? 'PIN' : 'Password'}
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
