import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  UploadCloud, Loader2, Download, Plus, AlertCircle, Printer, KeyRound,
  X, Users, UserCheck, UserRoundX, Sparkles, ArrowRightLeft, Ban, CheckCircle2,
} from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { printCredentialSlips } from '../../lib/printSlips';
import { MetricCard, PortalPageHeader } from '../../components/shared/PortalPageHeader';
import { DataTable, type DataTableColumn } from '../../components/shared/DataTable';
import { StudentDirectoryToolbar } from '../../components/shared/StudentDirectoryToolbar';
import {
  useStudentDirectory, downloadDirectoryCsv, formatLastSeen,
  type StudentDirectoryRow,
} from '../../lib/studentDirectory';
import { StudentNameCell, ClassCell, LoginStatusCell } from '../../components/shared/StudentCells';

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

interface SchoolSummary {
  total: number;
  loggedIn: number;
  neverLoggedIn: number;
  totalXp: number;
}

const BASE = '/school-admin/students/directory';

const inputCls =
  'w-full px-3 py-2 text-[13px] text-slate-800 bg-white border border-slate-300 rounded-lg outline-none transition-colors focus:border-slate-500 focus:ring-2 focus:ring-slate-100 placeholder:text-slate-400';
const labelCls = 'block text-[12px] font-medium text-slate-600 mb-1';
const selectCls =
  'px-3 py-2 text-[13px] text-slate-700 bg-white border border-slate-300 rounded-lg outline-none cursor-pointer focus:border-slate-500';
const bulkBtnCls =
  'inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-white/20 disabled:opacity-50 cursor-pointer';

export const SchoolAdminStudents: React.FC = () => {
  const dir = useStudentDirectory({ basePath: BASE });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Header metrics describe the whole school, so they're independent of the
  // table's current filter — fetched once from an unfiltered page-1 request.
  const [summary, setSummary] = useState<SchoolSummary | null>(null);

  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [scopeClass, setScopeClass] = useState<number | ''>('');
  const [scopeSection, setScopeSection] = useState('');
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState(1);
  const [newSection, setNewSection] = useState('A');
  const [newRoll, setNewRoll] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [selected, setSelected] = useState<StudentDirectoryRow | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ tone: 'ok' | 'warn'; text: string } | null>(null);

  const [moveClass, setMoveClass] = useState(1);
  const [moveSection, setMoveSection] = useState('A');

  const loadSummary = useCallback(async () => {
    try {
      const [all, everLoggedIn] = await Promise.all([
        api.get<{ rows: StudentDirectoryRow[]; total: number }>(BASE, { pageSize: 200 }),
        api.get<{ total: number }>(BASE, { pageSize: 1, status: 'active' }),
      ]);
      setSummary({
        total: all.total,
        loggedIn: everLoggedIn.total,
        neverLoggedIn: all.total - everLoggedIn.total,
        // XP across the first page only — a true school-wide sum needs its own
        // aggregate endpoint; this stays honest by labelling it as a sample.
        totalXp: all.rows.reduce((sum, r) => sum + r.xp, 0),
      });
    } catch {
      /* metrics are decorative — a failure here must not blank the table */
    }
  }, []);

  useEffect(() => { void loadSummary(); }, [loadSummary]);

  const refreshAll = useCallback(() => {
    dir.reload();
    void loadSummary();
  }, [dir, loadSummary]);

  const clearSelection = () => setSelectedIds(new Set());

  // ── Bulk actions ────────────────────────────────────────────────────────
  const runBulk = async (key: string, fn: () => Promise<void>) => {
    setBulkBusy(key);
    setBanner(null);
    try {
      await fn();
    } catch (err) {
      dir.setError(err instanceof ApiClientError ? err.message : 'Bulk action failed');
    } finally {
      setBulkBusy(null);
    }
  };

  const bulkResetCredentials = (ids: string[]) =>
    runBulk('reset', async () => {
      const res = await api.post<{ succeeded: number; failed: { reason: string }[]; credentials: StudentCredential[] }>(
        '/school-admin/students/bulk/reset-credentials',
        { studentIds: ids },
      );
      setImportResult({ created: res.succeeded, errors: res.failed.map((f) => ({ reason: f.reason })), credentials: res.credentials });
      clearSelection();
      refreshAll();
    });

  const bulkSetActive = (ids: string[], isActive: boolean) =>
    runBulk(isActive ? 'enable' : 'disable', async () => {
      const res = await api.post<{ succeeded: number }>('/school-admin/students/bulk/active', { studentIds: ids, isActive });
      setBanner({ tone: 'ok', text: `${res.succeeded} account${res.succeeded === 1 ? '' : 's'} ${isActive ? 'activated' : 'deactivated'}.` });
      clearSelection();
      refreshAll();
    });

  const bulkMove = (ids: string[]) =>
    runBulk('move', async () => {
      const res = await api.post<{ succeeded: number; crossBatch: number }>('/school-admin/students/bulk/move', {
        studentIds: ids, classNum: moveClass, section: moveSection,
      });
      setShowMove(false);
      setBanner({
        tone: res.crossBatch > 0 ? 'warn' : 'ok',
        text: res.crossBatch > 0
          ? `${res.succeeded} student${res.succeeded === 1 ? '' : 's'} moved to Class ${moveClass}-${moveSection}. ${res.crossBatch} crossed the Class 4/5 boundary — their login type changed, so reset their credentials and print new slips.`
          : `${res.succeeded} student${res.succeeded === 1 ? '' : 's'} moved to Class ${moveClass}-${moveSection}.`,
      });
      clearSelection();
      refreshAll();
    });

  // ── Single-row actions ──────────────────────────────────────────────────
  const setError = dir.setError;
  const handleResetOne = useCallback(async (row: StudentDirectoryRow) => {
    setResettingId(row.id);
    try {
      const credential = await api.post<StudentCredential>(`/school-admin/students/${row.id}/reset-credentials`);
      setImportResult({ created: 1, errors: [], credentials: [credential] });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to reset credential');
    } finally {
      setResettingId(null);
    }
  }, [setError]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if ((scopeClass === '') !== (scopeSection.trim() === '')) {
      dir.setError('To import into one section, pick both the class and the section (or leave both empty).');
      e.target.value = '';
      return;
    }
    dir.setError('');
    setIsImporting(true);
    try {
      const fields = scopeClass !== '' && scopeSection.trim() !== ''
        ? { classNum: String(scopeClass), section: scopeSection.trim().toUpperCase() }
        : undefined;
      setImportResult(await api.upload<ImportResult>('/school-admin/students/import', file, fields));
      setShowImport(false);
      refreshAll();
    } catch (err) {
      dir.setError(err instanceof ApiClientError ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    dir.setError('');
    setIsAdding(true);
    try {
      const credential = await api.post<StudentCredential>('/school-admin/students', {
        fullName: newName, classNum: newClass, section: newSection, rollNumber: newRoll || undefined,
      });
      setImportResult({ created: 1, errors: [], credentials: [credential] });
      setNewName(''); setNewRoll(''); setShowAdd(false);
      refreshAll();
    } catch (err) {
      dir.setError(err instanceof ApiClientError ? err.message : 'Failed to add student');
    } finally {
      setIsAdding(false);
    }
  };

  const printSlips = (credentials: StudentCredential[]) =>
    printCredentialSlips(
      credentials.map((c) => ({
        fullName: c.fullName, username: c.username,
        roleLine: `Class ${c.classNum}-${c.section}`, password: c.password, pin: c.pin,
      })),
      'Student Login Slips',
    );

  const downloadCredentialsCsv = () => {
    if (!importResult) return;
    const header = 'Full Name,Class,Section,Username,Password,PIN\n';
    const rows = importResult.credentials
      .map((c) => `"${c.fullName}",${c.classNum},${c.section},${c.username},${c.password ?? ''},${c.pin ?? ''}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'student-credentials.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo<DataTableColumn<StudentDirectoryRow>[]>(() => [
    { key: 'name', header: 'Student', sortKey: 'name', render: (r) => <StudentNameCell row={r} /> },
    { key: 'class', header: 'Class', sortKey: 'class', render: (r) => <ClassCell row={r} /> },
    { key: 'xp', header: 'XP', sortKey: 'xp', align: 'right', hideOnMobile: true, render: (r) => <span className="tabular-nums">{r.xp.toLocaleString('en-IN')}</span> },
    { key: 'streak', header: 'Streak', sortKey: 'streak', align: 'right', hideOnMobile: true, render: (r) => <span className="tabular-nums">{r.streak}</span> },
    { key: 'lastSeen', header: 'Last seen', sortKey: 'lastSeen', hideOnMobile: true, render: (r) => <span className="text-slate-500">{formatLastSeen(r.last_seen_at)}</span> },
    { key: 'status', header: 'Status', render: (r) => <LoginStatusCell row={r} /> },
    {
      key: 'actions', header: '', align: 'right',
      render: (r) => (
        <button
          onClick={(e) => { e.stopPropagation(); void handleResetOne(r); }}
          disabled={resettingId === r.id}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 cursor-pointer"
        >
          {resettingId === r.id ? <Loader2 size={12} className="animate-spin" /> : <KeyRound size={12} />}
          Reset {r.class_num <= 4 ? 'PIN' : 'password'}
        </button>
      ),
    },
  ], [resettingId, handleResetOne]);

  return (
    <div className="flex flex-col gap-5">
      <PortalPageHeader
        eyebrow="People management"
        title="Student directory"
        description="Filter any class or section, then act on many students at once."
        actions={(
          <>
            <button onClick={() => setShowImport(true)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer">
              <UploadCloud size={15} /> Import roster
            </button>
            <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-slate-800 cursor-pointer">
              <Plus size={15} /> Add student
            </button>
          </>
        )}
      >
        <div className="portal-metrics-grid">
          <MetricCard label="Total students" value={summary?.total ?? '—'} hint="enrolled" icon={<Users size={18} />} />
          <MetricCard label="Login ready" value={summary?.loggedIn ?? '—'} hint={summary && summary.total > 0 ? `${Math.round((summary.loggedIn / summary.total) * 100)}% activated` : ''} icon={<UserCheck size={18} />} tone="emerald" />
          <MetricCard label="Needs activation" value={summary?.neverLoggedIn ?? '—'} hint="never signed in" icon={<UserRoundX size={18} />} tone="amber" />
          <MetricCard label="Learning activity" value={(summary?.totalXp ?? 0).toLocaleString('en-IN')} hint="XP, first 200 students" icon={<Sparkles size={18} />} tone="indigo" />
        </div>
      </PortalPageHeader>

      {dir.error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
          <AlertCircle size={15} /> {dir.error}
          <button onClick={() => dir.setError('')} className="ml-auto cursor-pointer"><X size={14} /></button>
        </div>
      )}

      {banner && (
        <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-[13px] ${banner.tone === 'warn' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          <CheckCircle2 size={15} /> {banner.text}
          <button onClick={() => setBanner(null)} className="ml-auto cursor-pointer"><X size={14} /></button>
        </div>
      )}

      {importResult && (
        <div className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-semibold text-emerald-800">
              {importResult.credentials.length} credential{importResult.credentials.length === 1 ? '' : 's'} issued — print or download now, they are shown only once.
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={() => printSlips(importResult.credentials)} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100 cursor-pointer">
                <Printer size={13} /> Print slips
              </button>
              <button onClick={downloadCredentialsCsv} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100 cursor-pointer">
                <Download size={13} /> CSV
              </button>
              <button onClick={() => setImportResult(null)} className="p-1 text-emerald-500 hover:text-emerald-700 cursor-pointer"><X size={15} /></button>
            </div>
          </div>
          {importResult.errors.length > 0 && (
            <span className="text-[12px] text-rose-600">{importResult.errors.length} failed: {importResult.errors.map((e) => e.reason).join('; ')}</span>
          )}
        </div>
      )}

      <StudentDirectoryToolbar
        filters={dir.filters}
        onChange={dir.setFilters}
        onReset={dir.resetFilters}
        hasActiveFilters={dir.hasActiveFilters}
        total={dir.data.total}
        isLoading={dir.isLoading}
        onExport={() => downloadDirectoryCsv(`${BASE}/export`, dir.effectiveFilters, 'students.csv')}
      />

      <DataTable
        rows={dir.data.rows}
        columns={columns}
        getRowId={(r) => r.id}
        total={dir.data.total}
        page={dir.page}
        pageSize={dir.pageSize}
        onPageChange={dir.setPage}
        onPageSizeChange={(n) => { dir.setPageSize(n); dir.setPage(1); }}
        sortKey={dir.sortKey}
        sortDir={dir.sortDir}
        onSortChange={dir.changeSort}
        isLoading={dir.isLoading}
        emptyTitle={dir.hasActiveFilters ? 'No students match these filters' : 'No students yet'}
        emptyHint={dir.hasActiveFilters ? 'Try clearing a filter.' : 'Import a CSV to get started.'}
        onRowClick={setSelected}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onSelectAllMatching={dir.fetchAllMatchingIds}
        bulkActions={(ids) => (
          <>
            <button onClick={() => void bulkResetCredentials(ids)} disabled={bulkBusy !== null} className={bulkBtnCls}>
              {bulkBusy === 'reset' ? <Loader2 size={12} className="animate-spin" /> : <KeyRound size={12} />} Reset credentials
            </button>
            <button onClick={() => setShowMove(true)} disabled={bulkBusy !== null} className={bulkBtnCls}>
              <ArrowRightLeft size={12} /> Move section
            </button>
            <button onClick={() => void bulkSetActive(ids, false)} disabled={bulkBusy !== null} className={bulkBtnCls}>
              {bulkBusy === 'disable' ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />} Deactivate
            </button>
            <button onClick={() => void bulkSetActive(ids, true)} disabled={bulkBusy !== null} className={bulkBtnCls}>
              {bulkBusy === 'enable' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Activate
            </button>
          </>
        )}
      />

      {/* Move-section modal */}
      {showMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-[15px] font-semibold text-slate-800">Move {selectedIds.size} student{selectedIds.size === 1 ? '' : 's'}</h2>
              <button onClick={() => setShowMove(false)} className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"><X size={17} /></button>
            </div>
            <div className="flex flex-col gap-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Target class</label>
                  <select value={moveClass} onChange={(e) => setMoveClass(Number(e.target.value))} className={inputCls}>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Target section</label>
                  <select value={moveSection} onChange={(e) => setMoveSection(e.target.value)} className={inputCls}>
                    {['A', 'B', 'C', 'D', 'E'].map((s) => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                </div>
              </div>
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-[12px] text-slate-500">
                Moving across the Class 4 / 5 line changes how a student logs in (PIN vs password). You'll be prompted to reissue credentials if that happens.
              </p>
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button onClick={() => setShowMove(false)} className="rounded-lg px-4 py-2 text-[13px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">Cancel</button>
                <button
                  onClick={() => void bulkMove([...selectedIds])}
                  disabled={bulkBusy !== null}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {bulkBusy === 'move' && <Loader2 size={14} className="animate-spin" />} Move students
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30" onClick={() => setSelected(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
              <h2 className="text-[15px] font-semibold text-slate-800">Student details</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"><X size={17} /></button>
            </div>
            <div className="flex flex-col gap-6 p-6">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{selected.avatar}</span>
                <div>
                  <span className="block text-[16px] font-semibold text-slate-900">{selected.full_name}</span>
                  <span className="block text-[13px] text-slate-500">
                    Class {selected.class_num}-{selected.section}{selected.roll_number ? ` · Roll ${selected.roll_number}` : ''}
                  </span>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                {([
                  ['XP earned', selected.xp.toLocaleString('en-IN')],
                  ['Level', String(selected.level)],
                  ['Current streak', `${selected.streak} days`],
                  ['Longest streak', `${selected.longest_streak} days`],
                  ['Login type', selected.class_num <= 4 ? 'Name + PIN (Class 1–4)' : 'Email + password'],
                  ['Account status', selected.is_active ? 'Active' : 'Deactivated'],
                  ['Ever logged in', selected.has_logged_in_ever ? 'Yes' : 'No'],
                  ['Last seen', formatLastSeen(selected.last_seen_at)],
                ] as const).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
                    <dd className="mt-1 text-[13px] text-slate-800">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-col gap-2 border-t border-slate-100 pt-5">
                <button
                  onClick={() => void handleResetOne(selected)}
                  disabled={resettingId === selected.id}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {resettingId === selected.id ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                  Reset {selected.class_num <= 4 ? 'PIN' : 'password'} &amp; print a new slip
                </button>
                <p className="text-center text-[12px] text-slate-400">The new credential appears at the top of the page.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-[15px] font-semibold text-slate-800">Bulk import students</h2>
                <p className="mt-0.5 text-[12px] text-slate-400">.csv or .xlsx with columns: full_name, class_num, section, roll_number</p>
              </div>
              <button onClick={() => setShowImport(false)} className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"><X size={17} /></button>
            </div>
            <div className="flex flex-col gap-4 p-6">
              <div>
                <label className={labelCls}>Import into one section (optional)</label>
                <div className="flex items-center gap-3">
                  <select value={scopeClass} onChange={(e) => setScopeClass(e.target.value === '' ? '' : Number(e.target.value))} className={selectCls}>
                    <option value="">Class from file</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                  <input value={scopeSection} onChange={(e) => setScopeSection(e.target.value)} placeholder="Section (e.g. B)" maxLength={4} className={`${inputCls} w-36 uppercase`} />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">When set, the file only needs full_name and roll_number.</p>
              </div>
              <label className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-10 transition-colors ${isImporting ? 'border-slate-200 bg-slate-50' : 'border-slate-300 hover:border-slate-500 hover:bg-slate-50'}`}>
                {isImporting ? <Loader2 size={24} className="animate-spin text-slate-400" /> : <UploadCloud size={24} className="text-slate-400" />}
                <span className="text-[13px] font-medium text-slate-600">
                  {isImporting ? 'Importing…' : `Click to choose the file${scopeClass !== '' && scopeSection ? ` — into Class ${scopeClass}-${scopeSection.toUpperCase()}` : ''}`}
                </span>
                <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Add single modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-[15px] font-semibold text-slate-800">Add one student</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"><X size={17} /></button>
            </div>
            <form onSubmit={handleAddSingle} className="flex flex-col gap-4 p-6">
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
                <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg px-4 py-2 text-[13px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">Cancel</button>
                <button type="submit" disabled={isAdding} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50 cursor-pointer">
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
