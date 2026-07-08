import React, { useEffect, useState, useCallback } from 'react';
import { UploadCloud, Loader2, Download, Plus, AlertCircle, Printer, KeyRound } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { printCredentialSlips } from '../../lib/printSlips';

interface StudentRow {
  id: string;
  full_name: string;
  is_active: boolean;
  has_logged_in_ever: boolean;
  student_profiles: { class_num: number; section: string; roll_number: string | null; avatar: string; xp: number; streak: number } | null;
}

interface StudentCredential {
  fullName: string;
  classNum: number;
  section: string;
  username: string;
  password?: string;
  pin?: string;
}

interface ImportResult {
  created: number;
  errors: { row?: number; fullName?: string; reason: string }[];
  credentials: StudentCredential[];
}

export const SchoolAdminStudents: React.FC = () => {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  // Single-add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState(1);
  const [newSection, setNewSection] = useState('A');
  const [newRoll, setNewRoll] = useState('');

  // Scoped import: pin the whole file to one class+section (file then only
  // needs full_name + roll_number). Empty = file provides class_num/section.
  const [scopeClass, setScopeClass] = useState<number | ''>('');
  const [scopeSection, setScopeSection] = useState('');

  // Credential reset result for one student
  const [resetCredential, setResetCredential] = useState<StudentCredential | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<StudentRow[]>('/school-admin/students');
      setStudents(data);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load students');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadStudents(); }, [loadStudents]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if ((scopeClass === '') !== (scopeSection.trim() === '')) {
      setError('To import into one section, pick both the class and the section (or leave both empty).');
      e.target.value = '';
      return;
    }
    setError('');
    setIsImporting(true);
    try {
      const fields =
        scopeClass !== '' && scopeSection.trim() !== ''
          ? { classNum: String(scopeClass), section: scopeSection.trim().toUpperCase() }
          : undefined;
      const result = await api.upload<ImportResult>('/school-admin/students/import', file, fields);
      setImportResult(result);
      await loadStudents();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleResetCredential = async (student: StudentRow) => {
    setError('');
    setResettingId(student.id);
    try {
      const credential = await api.post<StudentCredential>(`/school-admin/students/${student.id}/reset-credentials`);
      setResetCredential(credential);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to reset credential');
    } finally {
      setResettingId(null);
    }
  };

  const printSlips = (credentials: StudentCredential[]) => {
    printCredentialSlips(
      credentials.map((c) => ({
        fullName: c.fullName,
        username: c.username,
        roleLine: `Class ${c.classNum}-${c.section}`,
        password: c.password,
        pin: c.pin,
      })),
      'Student Login Slips',
    );
  };

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const credential = await api.post<StudentCredential>('/school-admin/students', {
        fullName: newName,
        classNum: newClass,
        section: newSection,
        rollNumber: newRoll || undefined,
      });
      setImportResult({ created: 1, errors: [], credentials: [credential] });
      setNewName('');
      setNewRoll('');
      setShowAddForm(false);
      await loadStudents();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to add student');
    }
  };

  const downloadCredentialsCsv = () => {
    if (!importResult) return;
    const header = 'Full Name,Class,Section,Username,Password,PIN\n';
    const rows = importResult.credentials
      .map((c) => `"${c.fullName}",${c.classNum},${c.section},${c.username},${c.password ?? ''},${c.pin ?? ''}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-credentials.csv';
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

      {/* Import card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-slate-800">Bulk Import Students</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              .csv or .xlsx — columns: full_name, class_num, section, roll_number. Pick a class below to import into one section (then only full_name + roll_number are needed).
            </p>
          </div>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <Plus size={14} /> Add One Student
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddSingle} className="grid grid-cols-4 gap-3 bg-slate-50 rounded-2xl p-4">
            <input required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name"
              className="col-span-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-400" />
            <select value={newClass} onChange={(e) => setNewClass(Number(e.target.value))}
              className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => <option key={c} value={c}>Class {c}</option>)}
            </select>
            <select value={newSection} onChange={(e) => setNewSection(e.target.value)}
              className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none">
              {['A', 'B', 'C', 'D'].map((s) => <option key={s} value={s}>Section {s}</option>)}
            </select>
            <input value={newRoll} onChange={(e) => setNewRoll(e.target.value)} placeholder="Roll no. (optional)"
              className="col-span-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-400" />
            <button type="submit" className="col-span-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl py-2.5 transition-all cursor-pointer">
              Create Account
            </button>
          </form>
        )}

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-label-caps text-slate-400 tracking-wider">IMPORT INTO</span>
          <select value={scopeClass} onChange={(e) => setScopeClass(e.target.value === '' ? '' : Number(e.target.value))}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none">
            <option value="">Class from file</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <input value={scopeSection} onChange={(e) => setScopeSection(e.target.value)} placeholder="Section (e.g. B)" maxLength={4}
            className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-400 uppercase" />
        </div>

        <label className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-2 cursor-pointer transition-all ${isImporting ? 'border-slate-200 bg-slate-50' : 'border-rose-200 hover:bg-rose-50/50'}`}>
          {isImporting ? <Loader2 size={28} className="animate-spin text-rose-400" /> : <UploadCloud size={28} className="text-rose-400" />}
          <span className="font-sans text-xs font-bold text-slate-600">
            {isImporting ? 'Importing…' : `Click to upload .csv / .xlsx${scopeClass !== '' && scopeSection ? ` into Class ${scopeClass}-${scopeSection.toUpperCase()}` : ''}`}
          </span>
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
                    <th className="pb-2">Name</th><th className="pb-2">Class</th><th className="pb-2">Username</th><th className="pb-2">Password / PIN</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.credentials.map((c, i) => (
                    <tr key={i} className="border-t border-emerald-100">
                      <td className="py-1.5 font-semibold">{c.fullName}</td>
                      <td className="py-1.5">{c.classNum}-{c.section}</td>
                      <td className="py-1.5 font-mono">{c.username}</td>
                      <td className="py-1.5 font-mono font-bold">{c.pin ? `PIN: ${c.pin}` : c.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Fresh credential after a reset */}
      {resetCredential && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="text-xs text-amber-800">
            <span className="font-bold">{resetCredential.fullName}</span> (Class {resetCredential.classNum}-{resetCredential.section}) —{' '}
            new {resetCredential.pin ? 'PIN' : 'password'}:{' '}
            <span className="font-mono font-bold text-sm">{resetCredential.pin ?? resetCredential.password}</span>
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

      {/* Student list */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <h2 className="font-display font-bold text-lg text-slate-800 mb-4">All Students ({students.length})</h2>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-rose-400" /></div>
        ) : students.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No students yet — import a CSV to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 font-label-caps text-[9px] border-b border-slate-100">
                  <th className="pb-2">Name</th><th className="pb-2">Class</th><th className="pb-2">XP</th><th className="pb-2">Streak</th><th className="pb-2">Status</th><th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50">
                    <td className="py-2.5 flex items-center gap-2 font-semibold text-slate-700">
                      <span className="text-lg">{s.student_profiles?.avatar}</span> {s.full_name}
                    </td>
                    <td className="py-2.5">{s.student_profiles?.class_num}-{s.student_profiles?.section}</td>
                    <td className="py-2.5">{s.student_profiles?.xp ?? 0}</td>
                    <td className="py-2.5">{s.student_profiles?.streak ?? 0}</td>
                    <td className="py-2.5">
                      {s.has_logged_in_ever ? (
                        <span className="text-emerald-600 font-bold">Active</span>
                      ) : (
                        <span className="text-amber-600 font-bold">Never logged in</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => void handleResetCredential(s)}
                        disabled={resettingId === s.id}
                        title={`Reset ${(s.student_profiles?.class_num ?? 5) <= 4 ? 'PIN' : 'password'}`}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-all cursor-pointer disabled:opacity-40"
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
