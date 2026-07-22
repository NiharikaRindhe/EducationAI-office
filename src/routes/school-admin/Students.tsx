import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  UploadCloud, Loader2, Download, Plus, AlertCircle, Printer, KeyRound,
  Search, X, Users, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
} from 'lucide-react';
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

type SortKey = 'name' | 'class' | 'roll' | 'xp' | 'streak';

const PAGE_SIZE = 50;

const inputCls =
  'w-full px-3 py-2 text-[13px] text-slate-800 bg-white border border-slate-300 rounded-lg outline-none transition-colors focus:border-slate-500 focus:ring-2 focus:ring-slate-100 placeholder:text-slate-400';
const labelCls = 'block text-[12px] font-medium text-slate-600 mb-1';
const selectCls =
  'px-3 py-2 text-[13px] text-slate-700 bg-white border border-slate-300 rounded-lg outline-none cursor-pointer focus:border-slate-500';

function sp(s: StudentRow) {
  return Array.isArray(s.student_profiles) ? (s.student_profiles as unknown as StudentRow['student_profiles'][])[0] : s.student_profiles;
}

export const SchoolAdminStudents: React.FC = () => {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'never'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('class');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);

  // Import / add modals
  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [scopeClass, setScopeClass] = useState<number | ''>('');
  const [scopeSection, setScopeSection] = useState('');
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState(1);
  const [newSection, setNewSection] = useState('A');
  const [newRoll, setNewRoll] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Detail drawer
  const [selected, setSelected] = useState<StudentRow | null>(null);
  const [resetCredential, setResetCredential] = useState<StudentCredential | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      setStudents(await api.get<StudentRow[]>('/school-admin/students'));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load students');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadStudents(); }, [loadStudents]);

  // Sections available for the selected class filter (or all)
  const sectionOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of students) {
      const p = sp(s);
      if (!p) continue;
      if (classFilter && String(p.class_num) !== classFilter) continue;
      set.add(p.section);
    }
    return [...set].sort();
  }, [students, classFilter]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const rows = students.filter((s) => {
      const p = sp(s);
      if (classFilter && String(p?.class_num ?? '') !== classFilter) return false;
      if (sectionFilter && (p?.section ?? '') !== sectionFilter) return false;
      if (statusFilter === 'active' && !s.has_logged_in_ever) return false;
      if (statusFilter === 'never' && s.has_logged_in_ever) return false;
      if (!q) return true;
      return s.full_name.toLowerCase().includes(q) || (p?.roll_number ?? '').toLowerCase().includes(q);
    });

    const dir = sortAsc ? 1 : -1;
    rows.sort((a, b) => {
      const pa = sp(a);
      const pb = sp(b);
      switch (sortKey) {
        case 'name':
          return dir * a.full_name.localeCompare(b.full_name);
        case 'class': {
          const ca = (pa?.class_num ?? 0) * 100 + (pa?.section?.charCodeAt(0) ?? 0);
          const cb = (pb?.class_num ?? 0) * 100 + (pb?.section?.charCodeAt(0) ?? 0);
          return dir * (ca - cb) || a.full_name.localeCompare(b.full_name);
        }
        case 'roll':
          return dir * (pa?.roll_number ?? '').localeCompare(pb?.roll_number ?? '', undefined, { numeric: true });
        case 'xp':
          return dir * ((pa?.xp ?? 0) - (pb?.xp ?? 0));
        case 'streak':
          return dir * ((pa?.streak ?? 0) - (pb?.streak ?? 0));
      }
    });
    return rows;
  }, [students, searchQuery, classFilter, sectionFilter, statusFilter, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [searchQuery, classFilter, sectionFilter, statusFilter]);
  useEffect(() => { setSectionFilter(''); }, [classFilter]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  };

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
      setShowImport(false);
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
    setIsAdding(true);
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
      setShowAdd(false);
      await loadStudents();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to add student');
    } finally {
      setIsAdding(false);
    }
  };

  const handleResetCredential = async (student: StudentRow) => {
    setError('');
    setResettingId(student.id);
    try {
      setResetCredential(await api.post<StudentCredential>(`/school-admin/students/${student.id}/reset-credentials`));
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

      {/* Post-import credential result */}
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

      {/* Post-reset credential */}
      {resetCredential && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3.5 flex items-center justify-between gap-4">
          <div className="text-[13px] text-amber-900">
            <span className="font-semibold">{resetCredential.fullName}</span> (Class {resetCredential.classNum}-{resetCredential.section}) — new {resetCredential.pin ? 'PIN' : 'password'}:{' '}
            <span className="font-mono font-semibold">{resetCredential.pin ?? resetCredential.password}</span>
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
            placeholder="Search by name or roll number…"
            className={`${inputCls} pl-9`}
          />
        </div>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className={selectCls}>
          <option value="">All classes</option>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className={selectCls}>
          <option value="">All sections</option>
          {sectionOptions.map((s) => <option key={s} value={s}>Section {s}</option>)}
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
            <Plus size={15} /> Add student
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : pageRows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
            <Users size={28} strokeWidth={1.5} />
            <p className="text-[13px]">{students.length === 0 ? 'No students yet — import a CSV to get started.' : 'No students match these filters.'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-left text-[11px] text-slate-500">
                    <th className="px-4 py-3 whitespace-nowrap"><SortHeader label="Student" k="name" /></th>
                    <th className="px-4 py-3 whitespace-nowrap"><SortHeader label="Class" k="class" /></th>
                    <th className="px-4 py-3 whitespace-nowrap"><SortHeader label="Roll No." k="roll" /></th>
                    <th className="px-4 py-3 whitespace-nowrap"><SortHeader label="XP" k="xp" /></th>
                    <th className="px-4 py-3 whitespace-nowrap"><SortHeader label="Streak" k="streak" /></th>
                    <th className="px-4 py-3 uppercase tracking-wider font-semibold whitespace-nowrap">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((s) => {
                    const p = sp(s);
                    return (
                      <tr
                        key={s.id}
                        onClick={() => setSelected(s)}
                        className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg leading-none">{p?.avatar ?? '🙂'}</span>
                            <span className="text-[13px] font-semibold text-slate-800">{s.full_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-[13px] text-slate-700 whitespace-nowrap">{p ? `${p.class_num}-${p.section}` : '—'}</td>
                        <td className="px-4 py-2.5 text-[13px] text-slate-600 tabular-nums">{p?.roll_number ?? '—'}</td>
                        <td className="px-4 py-2.5 text-[13px] text-slate-600 tabular-nums">{p?.xp ?? 0}</td>
                        <td className="px-4 py-2.5 text-[13px] text-slate-600 tabular-nums">{p?.streak ?? 0}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${s.has_logged_in_ever ? 'text-emerald-700' : 'text-amber-600'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.has_logged_in_ever ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                            {s.has_logged_in_ever ? 'Active' : 'Never logged in'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => void handleResetCredential(s)}
                            disabled={resettingId === s.id}
                            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 hover:text-slate-700 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {resettingId === s.id ? <Loader2 size={12} className="animate-spin" /> : <KeyRound size={12} />}
                            Reset {(p?.class_num ?? 5) <= 4 ? 'PIN' : 'password'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <span className="text-[12px] text-slate-500">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                {filtered.length !== students.length && ` (filtered from ${students.length})`}
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

      {/* Detail drawer */}
      {selected && (() => {
        const p = sp(selected);
        return (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30" onClick={() => setSelected(null)}>
            <div className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
                <h2 className="text-[15px] font-semibold text-slate-800">Student details</h2>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 p-1.5 cursor-pointer"><X size={17} /></button>
              </div>

              <div className="p-6 flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{p?.avatar ?? '🙂'}</span>
                  <div>
                    <span className="block text-[16px] font-semibold text-slate-900">{selected.full_name}</span>
                    <span className="block text-[13px] text-slate-500">Class {p?.class_num}-{p?.section}{p?.roll_number ? ` · Roll ${p.roll_number}` : ''}</span>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {[
                    ['XP earned', String(p?.xp ?? 0)],
                    ['Current streak', `${p?.streak ?? 0} days`],
                    ['Login type', (p?.class_num ?? 5) <= 4 ? 'Name + PIN (Class 1–4)' : 'Email + password'],
                    ['Account status', selected.is_active ? 'Active' : 'Deactivated'],
                    ['Ever logged in', selected.has_logged_in_ever ? 'Yes' : 'No'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</dt>
                      <dd className="text-[13px] text-slate-800 mt-1">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="border-t border-slate-100 pt-5 flex flex-col gap-2">
                  <button
                    onClick={() => void handleResetCredential(selected)}
                    disabled={resettingId === selected.id}
                    className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {resettingId === selected.id ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                    Reset {(p?.class_num ?? 5) <= 4 ? 'PIN' : 'password'} &amp; print a new slip
                  </button>
                  <p className="text-[12px] text-slate-400 text-center">The new credential appears at the top of the page after the reset.</p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-[15px] font-semibold text-slate-800">Bulk import students</h2>
                <p className="text-[12px] text-slate-400 mt-0.5">.csv or .xlsx with columns: full_name, class_num, section, roll_number</p>
              </div>
              <button onClick={() => setShowImport(false)} className="text-slate-400 hover:text-slate-600 p-1.5 cursor-pointer"><X size={17} /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className={labelCls}>Import into one section (optional)</label>
                <div className="flex items-center gap-3">
                  <select value={scopeClass} onChange={(e) => setScopeClass(e.target.value === '' ? '' : Number(e.target.value))} className={selectCls}>
                    <option value="">Class from file</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                  <input
                    value={scopeSection}
                    onChange={(e) => setScopeSection(e.target.value)}
                    placeholder="Section (e.g. B)"
                    maxLength={4}
                    className={`${inputCls} w-36 uppercase`}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">When set, the file only needs full_name and roll_number — every row goes into this section.</p>
              </div>

              <label className={`border-2 border-dashed rounded-lg px-4 py-10 flex flex-col items-center gap-2 cursor-pointer transition-colors ${isImporting ? 'border-slate-200 bg-slate-50' : 'border-slate-300 hover:border-slate-500 hover:bg-slate-50'}`}>
                {isImporting ? <Loader2 size={24} className="animate-spin text-slate-400" /> : <UploadCloud size={24} className="text-slate-400" />}
                <span className="text-[13px] font-medium text-slate-600">
                  {isImporting ? 'Importing…' : `Click to choose the file${scopeClass !== '' && scopeSection ? ` — importing into Class ${scopeClass}-${scopeSection.toUpperCase()}` : ''}`}
                </span>
                <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Add single modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-[15px] font-semibold text-slate-800">Add one student</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 p-1.5 cursor-pointer"><X size={17} /></button>
            </div>
            <form onSubmit={handleAddSingle} className="p-6 flex flex-col gap-4">
              <div>
                <label className={labelCls}>Full name <span className="text-rose-500">*</span></label>
                <input required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Aarav Sharma" className={inputCls} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Class</label>
                  <select value={newClass} onChange={(e) => setNewClass(Number(e.target.value))} className={inputCls}>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Section</label>
                  <select value={newSection} onChange={(e) => setNewSection(e.target.value)} className={inputCls}>
                    {['A', 'B', 'C', 'D'].map((s) => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Roll no. (optional)</label>
                  <input value={newRoll} onChange={(e) => setNewRoll(e.target.value)} placeholder="23" className={inputCls} />
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
