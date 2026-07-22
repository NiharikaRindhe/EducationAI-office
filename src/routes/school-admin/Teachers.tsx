import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  UploadCloud, Loader2, Download, Plus, AlertCircle, Printer, KeyRound,
  Search, X, GraduationCap, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
} from 'lucide-react';
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

type SortKey = 'name' | 'specialization' | 'employee';

const PAGE_SIZE = 50;

const inputCls =
  'w-full px-3 py-2 text-[13px] text-slate-800 bg-white border border-slate-300 rounded-lg outline-none transition-colors focus:border-slate-500 focus:ring-2 focus:ring-slate-100 placeholder:text-slate-400';
const labelCls = 'block text-[12px] font-medium text-slate-600 mb-1';
const selectCls =
  'px-3 py-2 text-[13px] text-slate-700 bg-white border border-slate-300 rounded-lg outline-none cursor-pointer focus:border-slate-500';

function tp(t: TeacherRow) {
  return Array.isArray(t.teacher_profiles) ? (t.teacher_profiles as unknown as TeacherRow['teacher_profiles'][])[0] : t.teacher_profiles;
}

export const SchoolAdminTeachers: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'never'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);

  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newSpecialization, setNewSpecialization] = useState('');
  const [newClasses, setNewClasses] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [resetCredential, setResetCredential] = useState<TeacherCredential | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const loadTeachers = useCallback(async () => {
    setIsLoading(true);
    try {
      setTeachers(await api.get<TeacherRow[]>('/school-admin/teachers'));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load teachers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadTeachers(); }, [loadTeachers]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const rows = teachers.filter((t) => {
      const p = tp(t);
      if (classFilter && !(p?.classes_taught ?? []).includes(Number(classFilter))) return false;
      if (statusFilter === 'active' && !t.has_logged_in_ever) return false;
      if (statusFilter === 'never' && t.has_logged_in_ever) return false;
      if (!q) return true;
      return (
        t.full_name.toLowerCase().includes(q) ||
        (p?.employee_id ?? '').toLowerCase().includes(q) ||
        (p?.specialization ?? '').toLowerCase().includes(q)
      );
    });

    const dir = sortAsc ? 1 : -1;
    rows.sort((a, b) => {
      const pa = tp(a);
      const pb = tp(b);
      switch (sortKey) {
        case 'name':
          return dir * a.full_name.localeCompare(b.full_name);
        case 'specialization':
          return dir * (pa?.specialization ?? '').localeCompare(pb?.specialization ?? '') || a.full_name.localeCompare(b.full_name);
        case 'employee':
          return dir * (pa?.employee_id ?? '').localeCompare(pb?.employee_id ?? '', undefined, { numeric: true });
      }
    });
    return rows;
  }, [teachers, searchQuery, classFilter, statusFilter, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [searchQuery, classFilter, statusFilter]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setIsImporting(true);
    try {
      const result = await api.upload<ImportResult>('/school-admin/teachers/import', file);
      setImportResult(result);
      setShowImport(false);
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
    setIsAdding(true);
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
      setShowAdd(false);
      await loadTeachers();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to add teacher');
    } finally {
      setIsAdding(false);
    }
  };

  const handleResetPassword = async (teacher: TeacherRow) => {
    setError('');
    setResettingId(teacher.id);
    try {
      setResetCredential(await api.post<TeacherCredential>(`/school-admin/teachers/${teacher.id}/reset-password`));
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

  const SortHeader: React.FC<{ label: string; k: SortKey }> = ({ label, k }) => (
    <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 uppercase tracking-wider font-semibold cursor-pointer hover:text-slate-700">
      {label}
      {sortKey === k && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
    </button>
  );

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertCircle size={15} /> {error}
          <button onClick={() => setError('')} className="ml-auto cursor-pointer"><X size={14} /></button>
        </div>
      )}

      {importResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-semibold text-emerald-800">
              {importResult.created} account{importResult.created === 1 ? '' : 's'} created — download or print the credentials now, they are shown only once.
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => printSlips(importResult.credentials)} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg cursor-pointer">
                <Printer size={13} /> Print slips
              </button>
              <button onClick={downloadCredentialsCsv} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg cursor-pointer">
                <Download size={13} /> CSV
              </button>
              <button onClick={() => setImportResult(null)} className="text-emerald-500 hover:text-emerald-700 p-1 cursor-pointer"><X size={15} /></button>
            </div>
          </div>
          {importResult.errors.length > 0 && (
            <span className="text-[12px] text-rose-600">{importResult.errors.length} row(s) failed: {importResult.errors.map((er) => er.reason).join('; ')}</span>
          )}
        </div>
      )}

      {resetCredential && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3.5 flex items-center justify-between gap-4">
          <div className="text-[13px] text-amber-900">
            <span className="font-semibold">{resetCredential.fullName}</span> — new password:{' '}
            <span className="font-mono font-semibold">{resetCredential.password}</span>
            <span className="block text-[12px] text-amber-600 mt-0.5">Login ID: <span className="font-mono">{resetCredential.username}</span></span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => printSlips([resetCredential])} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-amber-700 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg cursor-pointer">
              <Printer size={13} /> Print slip
            </button>
            <button onClick={() => setResetCredential(null)} className="text-amber-500 hover:text-amber-700 p-1.5 cursor-pointer"><X size={15} /></button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-xs flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, employee ID, subject…"
            className={`${inputCls} pl-9`}
          />
        </div>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className={selectCls}>
          <option value="">All classes</option>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => <option key={c} value={c}>Teaches Class {c}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className={selectCls}>
          <option value="all">All statuses</option>
          <option value="active">Has logged in</option>
          <option value="never">Never logged in</option>
        </select>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-600 border border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <UploadCloud size={15} /> Import CSV/XLSX
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Plus size={15} /> Add teacher
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : pageRows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
            <GraduationCap size={28} strokeWidth={1.5} />
            <p className="text-[13px]">{teachers.length === 0 ? 'No teachers yet — add or import to get started.' : 'No teachers match these filters.'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-left text-[11px] text-slate-500">
                    <th className="px-4 py-3 whitespace-nowrap"><SortHeader label="Teacher" k="name" /></th>
                    <th className="px-4 py-3 whitespace-nowrap"><SortHeader label="Employee ID" k="employee" /></th>
                    <th className="px-4 py-3 whitespace-nowrap"><SortHeader label="Specialization" k="specialization" /></th>
                    <th className="px-4 py-3 uppercase tracking-wider font-semibold whitespace-nowrap">Classes taught</th>
                    <th className="px-4 py-3 uppercase tracking-wider font-semibold whitespace-nowrap">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((t) => {
                    const p = tp(t);
                    return (
                      <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-2.5 text-[13px] font-semibold text-slate-800">{t.full_name}</td>
                        <td className="px-4 py-2.5 text-[13px] text-slate-600 font-mono tabular-nums">{p?.employee_id ?? '—'}</td>
                        <td className="px-4 py-2.5 text-[13px] text-slate-600">{p?.specialization ?? '—'}</td>
                        <td className="px-4 py-2.5">
                          {(p?.classes_taught ?? []).length === 0 ? (
                            <span className="text-[13px] text-slate-400">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {(p?.classes_taught ?? []).map((c) => (
                                <span key={c} className="inline-flex text-[11px] font-medium text-slate-600 bg-slate-100 rounded-md px-1.5 py-0.5">
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${t.has_logged_in_ever ? 'text-emerald-700' : 'text-amber-600'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${t.has_logged_in_ever ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                            {t.has_logged_in_ever ? 'Active' : 'Never logged in'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => void handleResetPassword(t)}
                            disabled={resettingId === t.id}
                            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 hover:text-slate-700 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {resettingId === t.id ? <Loader2 size={12} className="animate-spin" /> : <KeyRound size={12} />}
                            Reset password
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <span className="text-[12px] text-slate-500">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                {filtered.length !== teachers.length && ` (filtered from ${teachers.length})`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-lg disabled:opacity-40 cursor-pointer hover:bg-slate-50"
                >
                  <ChevronLeft size={13} /> Prev
                </button>
                <span className="text-[12px] text-slate-500 tabular-nums">Page {safePage} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-lg disabled:opacity-40 cursor-pointer hover:bg-slate-50"
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-[15px] font-semibold text-slate-800">Bulk import teachers</h2>
                <p className="text-[12px] text-slate-400 mt-0.5">.csv or .xlsx with columns: full_name, employee_id, specialization, classes_taught (e.g. "6|7|8")</p>
              </div>
              <button onClick={() => setShowImport(false)} className="text-slate-400 hover:text-slate-600 p-1.5 cursor-pointer"><X size={17} /></button>
            </div>
            <div className="p-6 flex flex-col gap-3">
              <label className={`border-2 border-dashed rounded-lg px-4 py-10 flex flex-col items-center gap-2 cursor-pointer transition-colors ${isImporting ? 'border-slate-200 bg-slate-50' : 'border-slate-300 hover:border-slate-500 hover:bg-slate-50'}`}>
                {isImporting ? <Loader2 size={24} className="animate-spin text-slate-400" /> : <UploadCloud size={24} className="text-slate-400" />}
                <span className="text-[13px] font-medium text-slate-600">{isImporting ? 'Importing…' : 'Click to choose the file'}</span>
                <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
              </label>
              <p className="text-[11px] text-slate-400">After the import, map each teacher to their sections and subjects on the Classes &amp; Sections page.</p>
            </div>
          </div>
        </div>
      )}

      {/* Add single modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-[15px] font-semibold text-slate-800">Add one teacher</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 p-1.5 cursor-pointer"><X size={17} /></button>
            </div>
            <form onSubmit={handleAddSingle} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Full name <span className="text-rose-500">*</span></label>
                  <input required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Mrs. Gupta" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Employee ID</label>
                  <input value={newEmployeeId} onChange={(e) => setNewEmployeeId(e.target.value)} placeholder="EMP-104" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Specialization</label>
                  <input value={newSpecialization} onChange={(e) => setNewSpecialization(e.target.value)} placeholder="Mathematics" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Classes taught</label>
                  <input value={newClasses} onChange={(e) => setNewClasses(e.target.value)} placeholder="6, 7, 8" className={inputCls} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="text-[13px] font-semibold text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" disabled={isAdding} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
                  {isAdding && <Loader2 size={14} className="animate-spin" />} Create account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
