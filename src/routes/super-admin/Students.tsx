import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, X, Users, UserRoundX, Building2, Loader2, Ban, CheckCircle2, School as SchoolIcon,
} from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { MetricCard, PortalPageHeader } from '../../components/shared/PortalPageHeader';
import { DataTable, type DataTableColumn } from '../../components/shared/DataTable';
import { StudentDirectoryToolbar, type SchoolOption } from '../../components/shared/StudentDirectoryToolbar';
import {
  useStudentDirectory, downloadDirectoryCsv, formatLastSeen,
  type StudentDirectoryRow,
} from '../../lib/studentDirectory';
import { StudentNameCell, ClassCell, LoginStatusCell } from '../../components/shared/StudentCells';

/**
 * Platform-wide student directory.
 *
 * Reads across every school so support can find any student by name or roll
 * number without first knowing which school they belong to. Bulk writes stay
 * school-scoped on purpose — a cross-school mutation is never a legitimate
 * roster operation, so the action bar only unlocks once a single school is
 * selected in the filter.
 */

const BASE = '/super-admin/students';

const bulkBtnCls =
  'inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-white/20 disabled:opacity-50 cursor-pointer';

export const SuperAdminStudents: React.FC = () => {
  const dir = useStudentDirectory({ basePath: BASE, initialSortKey: 'school' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [bulkBusy, setBulkBusy] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [selected, setSelected] = useState<StudentDirectoryRow | null>(null);

  useEffect(() => {
    void api
      .get<{ id: string; name: string }[]>('/super-admin/schools')
      .then((rows) => setSchools(rows.map((s) => ({ id: s.id, name: s.name }))))
      .catch(() => { /* the picker degrades to "All schools" */ });
  }, []);

  const scopedSchoolId = dir.filters.schoolId;

  const bulkSetActive = async (ids: string[], isActive: boolean) => {
    if (!scopedSchoolId) return;
    setBulkBusy(isActive ? 'enable' : 'disable');
    setBanner(null);
    try {
      const res = await api.post<{ succeeded: number }>(
        `${BASE}/bulk/active?schoolId=${encodeURIComponent(scopedSchoolId)}`,
        { studentIds: ids, isActive },
      );
      setBanner(`${res.succeeded} account${res.succeeded === 1 ? '' : 's'} ${isActive ? 'activated' : 'deactivated'}.`);
      setSelectedIds(new Set());
      dir.reload();
    } catch (err) {
      dir.setError(err instanceof ApiClientError ? err.message : 'Bulk action failed');
    } finally {
      setBulkBusy(null);
    }
  };

  const columns = useMemo<DataTableColumn<StudentDirectoryRow>[]>(() => [
    {
      key: 'school', header: 'School', sortKey: 'school',
      render: (r) => (
        <div className="min-w-0">
          <span className="block truncate font-medium text-slate-700">{r.school_name}</span>
          <span className="block text-[11px] text-slate-400">{r.school_code}</span>
        </div>
      ),
    },
    { key: 'name', header: 'Student', sortKey: 'name', render: (r) => <StudentNameCell row={r} /> },
    { key: 'class', header: 'Class', sortKey: 'class', render: (r) => <ClassCell row={r} /> },
    { key: 'xp', header: 'XP', sortKey: 'xp', align: 'right', hideOnMobile: true, render: (r) => <span className="tabular-nums">{r.xp.toLocaleString('en-IN')}</span> },
    { key: 'lastSeen', header: 'Last seen', sortKey: 'lastSeen', hideOnMobile: true, render: (r) => <span className="text-slate-500">{formatLastSeen(r.last_seen_at)}</span> },
    { key: 'status', header: 'Status', render: (r) => <LoginStatusCell row={r} /> },
  ], []);

  const neverLoggedIn = dir.data.rows.filter((r) => !r.has_logged_in_ever).length;

  return (
    <div className="flex flex-col gap-5">
      <PortalPageHeader
        eyebrow="Platform operations"
        title="Student directory"
        description="Look up any student across every school. Search by name or roll number, or pick a school to act in bulk. Lookups are recorded in the audit log."
      >
        <div className="portal-metrics-grid">
          <MetricCard label="Students matching" value={dir.data.total} hint="current filter" icon={<Users size={18} />} />
          <MetricCard label="Schools" value={schools.length} hint="on the platform" icon={<Building2 size={18} />} tone="indigo" />
          <MetricCard label="Never logged in" value={neverLoggedIn} hint="on this page" icon={<UserRoundX size={18} />} tone="amber" />
        </div>
      </PortalPageHeader>

      {dir.error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
          <AlertCircle size={15} /> {dir.error}
          <button onClick={() => dir.setError('')} className="ml-auto cursor-pointer"><X size={14} /></button>
        </div>
      )}

      {banner && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">
          <CheckCircle2 size={15} /> {banner}
          <button onClick={() => setBanner(null)} className="ml-auto cursor-pointer"><X size={14} /></button>
        </div>
      )}

      <StudentDirectoryToolbar
        filters={dir.filters}
        onChange={(u) => { dir.setFilters(u); setSelectedIds(new Set()); }}
        onReset={() => { dir.resetFilters(); setSelectedIds(new Set()); }}
        hasActiveFilters={dir.hasActiveFilters}
        total={dir.data.total}
        isLoading={dir.isLoading}
        schoolOptions={schools}
        onExport={() => downloadDirectoryCsv(`${BASE}/export`, dir.effectiveFilters, 'students-all-schools.csv')}
      />

      {selectedIds.size > 0 && !scopedSchoolId && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          <SchoolIcon size={15} />
          Pick a single school in the filter to enable bulk actions — cross-school writes are blocked by design.
        </div>
      )}

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
        emptyTitle={
          dir.data.gated
            ? 'Search for a student to begin'
            : dir.hasActiveFilters
              ? 'No students match these filters'
              : 'No students on the platform yet'
        }
        emptyHint={
          dir.data.gated
            ? "This directory is for looking up a specific student, so it doesn't list every child by default. Enter a name or roll number, or pick a school."
            : dir.hasActiveFilters
              ? 'Try clearing a filter.'
              : undefined
        }
        onRowClick={setSelected}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={(ids) => (
          <>
            <button onClick={() => void bulkSetActive(ids, false)} disabled={!scopedSchoolId || bulkBusy !== null} className={bulkBtnCls}>
              {bulkBusy === 'disable' ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />} Deactivate
            </button>
            <button onClick={() => void bulkSetActive(ids, true)} disabled={!scopedSchoolId || bulkBusy !== null} className={bulkBtnCls}>
              {bulkBusy === 'enable' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Activate
            </button>
          </>
        )}
      />

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
                  <span className="block text-[13px] text-slate-500">Class {selected.class_num}-{selected.section}</span>
                  <span className="block text-[12px] text-slate-400">{selected.school_name} · {selected.school_code}</span>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                {([
                  ['XP earned', selected.xp.toLocaleString('en-IN')],
                  ['Level', String(selected.level)],
                  ['Current streak', `${selected.streak} days`],
                  ['Longest streak', `${selected.longest_streak} days`],
                  ['Roll number', selected.roll_number ?? '—'],
                  ['Login type', selected.class_num <= 4 ? 'Name + PIN' : 'Email + password'],
                  ['Account status', selected.is_active ? 'Active' : 'Deactivated'],
                  ['Last seen', formatLastSeen(selected.last_seen_at)],
                ] as const).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
                    <dd className="mt-1 text-[13px] text-slate-800">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-[12px] text-slate-500">
                Credential resets and section transfers are performed by the school's own admin, so the school keeps ownership of its roster.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
