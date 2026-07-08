import React, { useEffect, useState, useCallback } from 'react';
import { UploadCloud, Loader2, Download, Plus, AlertCircle, Printer, KeyRound } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { printCredentialSlips } from '../../lib/printSlips';

interface TeacherRow {
  id: string;
  full_name: string;
  is_active: boolean;
  has_logged_in_ever: boolean;
  teacher_profiles: { employee_id: string | null; specialization: string | null; classes_taught: number[] } | null;
}

interface TeacherCredential {
  fullName: string;
  username: string;
  password: string;
}

interface ImportResult {
  created: number;
  errors: { row?: number; fullName?: string; reason: string }[];
  credentials: TeacherCredential[];
}

export const SchoolAdminTeachers: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newSpecialization, setNewSpecialization] = useState('');
  const [newClasses, setNewClasses] = useState('');

  const [resetCredential, setResetCredential] = useState<TeacherCredential | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const loadTeachers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<TeacherRow[]>('/school-admin/teachers');
      setTeachers(data);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load teachers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadTeachers(); }, [loadTeachers]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setIsImporting(true);
    try {
      const result = await api.upload<ImportResult>('/school-admin/teachers/import', file);
      setImportResult(result);
      await loadTeachers();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const classesTaught = newClasses
        .split(/[,|]/)
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= 10);

      const credential = await api.post<TeacherCredential>('/school-admin/teachers', {
        fullName: newName,
        employeeId: newEmployeeId || undefined,
        specialization: newSpecialization || undefined,
        classesTaught,
      });
      setImportResult({ created: 1, errors: [], credentials: [credential] });
      setNewName('');
      setNewEmployeeId('');
      setNewSpecialization('');
      setNewClasses('');
      setShowAddForm(false);
      await loadTeachers();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to add teacher');
    }
  };

  const handleResetPassword = async (teacher: TeacherRow) => {
    setError('');
    setResettingId(teacher.id);
    try {
      const credential = await api.post<TeacherCredential>(`/school-admin/teachers/${teacher.id}/reset-password`);
      setResetCredential(credential);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to reset password');
    } finally {
      setResettingId(null);
    }
  };

  const printSlips = (credentials: TeacherCredential[]) => {
    printCredentialSlips(
      credentials.map((c) => ({ fullName: c.fullName, username: c.username, roleLine: 'Teacher', password: c.password })),
      'Teacher Login Slips',
    );
  };

  const downloadCredentialsCsv = () => {
    if (!importResult) return;
    const header = 'Full Name,Username,Password\n';
    const rows = importResult.credentials.map((c) => `"${c.fullName}",${c.username},${c.password}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teacher-credentials.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

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
            <h2 className="font-display font-bold text-lg text-slate-800">Bulk Import Teachers</h2>
            <p className="text-xs text-slate-400 mt-0.5">.csv or .xlsx — columns: full_name, employee_id, specialization, classes_taught (e.g. "6|7|8"). Assign sections &amp; subjects on the Classes page after import.</p>
          </div>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <Plus size={14} /> Add One Teacher
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddSingle} className="grid grid-cols-4 gap-3 bg-slate-50 rounded-2xl p-4">
            <input required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name"
              className="col-span-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-400" />
            <input value={newEmployeeId} onChange={(e) => setNewEmployeeId(e.target.value)} placeholder="Employee ID"
              className="col-span-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-400" />
            <input value={newSpecialization} onChange={(e) => setNewSpecialization(e.target.value)} placeholder="Specialization (e.g. Mathematics)"
              className="col-span-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-400" />
            <input value={newClasses} onChange={(e) => setNewClasses(e.target.value)} placeholder="Classes taught (e.g. 6,7,8)"
              className="col-span-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-400" />
            <button type="submit" className="col-span-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl py-2.5 transition-all cursor-pointer">
              Create Account
            </button>
          </form>
        )}

        <label className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-2 cursor-pointer transition-all ${isImporting ? 'border-slate-200 bg-slate-50' : 'border-rose-200 hover:bg-rose-50/50'}`}>
          {isImporting ? <Loader2 size={28} className="animate-spin text-rose-400" /> : <UploadCloud size={28} className="text-rose-400" />}
          <span className="font-sans text-xs font-bold text-slate-600">{isImporting ? 'Importing…' : 'Click to upload .csv / .xlsx'}</span>
          <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
        </label>

        {importResult && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-sm text-emerald-700">
                {importResult.created} account{importResult.created === 1 ? '' : 's'} created
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => printSlips(importResult.credentials)} className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg cursor-pointer">
                  <Printer size={13} /> Print Login Slips
                </button>
                <button onClick={downloadCredentialsCsv} className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg cursor-pointer">
                  <Download size={13} /> Download CSV
                </button>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="text-xs text-rose-600">
                {importResult.errors.length} row(s) failed: {importResult.errors.map((e) => e.reason).join('; ')}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-400 font-label-caps text-[9px]">
                    <th className="pb-2">Name</th><th className="pb-2">Username</th><th className="pb-2">Password</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.credentials.map((c, i) => (
                    <tr key={i} className="border-t border-emerald-100">
                      <td className="py-1.5 font-semibold">{c.fullName}</td>
                      <td className="py-1.5 font-mono">{c.username}</td>
                      <td className="py-1.5 font-mono font-bold">{c.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {resetCredential && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="text-xs text-amber-800">
            <span className="font-bold">{resetCredential.fullName}</span> — new password:{' '}
            <span className="font-mono font-bold text-sm">{resetCredential.password}</span>
            <span className="block text-amber-600 mt-0.5">Login ID: <span className="font-mono">{resetCredential.username}</span></span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => printSlips([resetCredential])} className="flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 px-3 py-1.5 rounded-lg cursor-pointer">
              <Printer size={13} /> Print Slip
            </button>
            <button onClick={() => setResetCredential(null)} className="text-xs font-bold text-amber-500 hover:bg-amber-100 px-2 py-1.5 rounded-lg cursor-pointer">✕</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <h2 className="font-display font-bold text-lg text-slate-800 mb-4">All Teachers ({teachers.length})</h2>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-rose-400" /></div>
        ) : teachers.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No teachers yet — add one to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 font-label-caps text-[9px] border-b border-slate-100">
                  <th className="pb-2">Name</th><th className="pb-2">Specialization</th><th className="pb-2">Classes Taught</th><th className="pb-2">Status</th><th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50">
                    <td className="py-2.5 font-semibold text-slate-700">{t.full_name}</td>
                    <td className="py-2.5">{t.teacher_profiles?.specialization ?? '—'}</td>
                    <td className="py-2.5">{t.teacher_profiles?.classes_taught?.join(', ') || '—'}</td>
                    <td className="py-2.5">
                      {t.has_logged_in_ever ? (
                        <span className="text-emerald-600 font-bold">Active</span>
                      ) : (
                        <span className="text-amber-600 font-bold">Never logged in</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => void handleResetPassword(t)}
                        disabled={resettingId === t.id}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-all cursor-pointer disabled:opacity-40"
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
