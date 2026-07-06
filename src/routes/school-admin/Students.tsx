import React, { useEffect, useState, useCallback } from 'react';
import { UploadCloud, Loader2, Download, Plus, AlertCircle } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

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
    setError('');
    setIsImporting(true);
    try {
      const result = await api.upload<ImportResult>('/school-admin/students/import', file);
      setImportResult(result);
      await loadStudents();
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
            <p className="text-xs text-slate-400 mt-0.5">CSV columns: full_name, class_num, section, roll_number</p>
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

        <label className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-2 cursor-pointer transition-all ${isImporting ? 'border-slate-200 bg-slate-50' : 'border-rose-200 hover:bg-rose-50/50'}`}>
          {isImporting ? <Loader2 size={28} className="animate-spin text-rose-400" /> : <UploadCloud size={28} className="text-rose-400" />}
          <span className="font-sans text-xs font-bold text-slate-600">{isImporting ? 'Importing…' : 'Click to upload CSV'}</span>
          <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
        </label>

        {importResult && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-sm text-emerald-700">
                {importResult.created} account{importResult.created === 1 ? '' : 's'} created
              </span>
              <button onClick={downloadCredentialsCsv} className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg cursor-pointer">
                <Download size={13} /> Download Credentials CSV
              </button>
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
                  <th className="pb-2">Name</th><th className="pb-2">Class</th><th className="pb-2">XP</th><th className="pb-2">Streak</th><th className="pb-2">Status</th>
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
