import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ArrowLeft, Loader2, AlertCircle, X, Users, TriangleAlert, Flame } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { MetricCard, PortalPageHeader } from '../../components/shared/PortalPageHeader';
import { DataTable, type DataTableColumn } from '../../components/shared/DataTable';
import { StudentDirectoryToolbar } from '../../components/shared/StudentDirectoryToolbar';
import {
  useStudentDirectory, downloadDirectoryCsv, formatLastSeen,
  type StudentDirectoryRow,
} from '../../lib/studentDirectory';
import { StudentNameCell, ClassCell, LoginStatusCell } from '../../components/shared/StudentCells';

/**
 * Teacher roster. Read-only by design: a teacher can see and analyse every
 * student in the sections they teach, but credential resets, transfers and
 * deactivations stay with the School Admin so there is a single accountable
 * owner of the roster.
 */

interface AtRiskStudent {
  id: string;
  risks: { type: string; label: string }[];
}

interface StudentDetail {
  id: string;
  full_name: string;
  student_profiles: { class_num: number; section: string; avatar: string; xp: number; level: number; streak: number; longest_streak: number } | null;
  subject_progress: { subject: string; chapters_done: number; total_chapters: number }[];
  student_badges: { badge_id: string; earned_at: string; badges: { name: string; icon: string | null } | null }[];
}

const BASE = '/teacher/students/directory';

export const TeacherStudents: React.FC = () => {
  const dir = useStudentDirectory({ basePath: BASE });

  const [atRisk, setAtRisk] = useState<Record<string, string[]>>({});
  const [showOnlyAtRisk, setShowOnlyAtRisk] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    void api
      .get<AtRiskStudent[]>('/teacher/at-risk')
      .then((rows) => {
        const map: Record<string, string[]> = {};
        rows.forEach((r) => { map[r.id] = r.risks.map((risk) => risk.label); });
        setAtRisk(map);
      })
      .catch(() => { /* at-risk is an overlay — the roster still works without it */ });
  }, []);

  const setError = dir.setError;
  const openDetail = useCallback(async (row: StudentDirectoryRow) => {
    setSelectedId(row.id);
    setIsDetailLoading(true);
    try {
      setDetail(await api.get<StudentDetail>(`/teacher/students/${row.id}`));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load student');
      setSelectedId(null);
    } finally {
      setIsDetailLoading(false);
    }
  }, [setError]);

  // At-risk is computed per teacher, not per page, so it filters the page in
  // the browser — the server-side filters above have already narrowed the set.
  const visibleRows = useMemo(
    () => (showOnlyAtRisk ? dir.data.rows.filter((r) => atRisk[r.id]) : dir.data.rows),
    [dir.data.rows, showOnlyAtRisk, atRisk],
  );

  const atRiskOnPage = dir.data.rows.filter((r) => atRisk[r.id]).length;

  const columns = useMemo<DataTableColumn<StudentDirectoryRow>[]>(() => [
    {
      key: 'name', header: 'Student', sortKey: 'name',
      render: (r) => (
        <div className="flex items-center gap-2">
          <StudentNameCell row={r} />
          {atRisk[r.id] && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-rose-600">
              <TriangleAlert size={10} /> At risk
            </span>
          )}
        </div>
      ),
    },
    { key: 'class', header: 'Class', sortKey: 'class', render: (r) => <ClassCell row={r} /> },
    { key: 'xp', header: 'XP', sortKey: 'xp', align: 'right', hideOnMobile: true, render: (r) => <span className="tabular-nums">{r.xp.toLocaleString('en-IN')}</span> },
    {
      key: 'streak', header: 'Streak', sortKey: 'streak', align: 'right', hideOnMobile: true,
      render: (r) => (
        <span className="inline-flex items-center gap-1 tabular-nums">
          {r.streak > 0 && <Flame size={12} className="text-amber-500" />}{r.streak}
        </span>
      ),
    },
    { key: 'lastSeen', header: 'Last seen', sortKey: 'lastSeen', hideOnMobile: true, render: (r) => <span className="text-slate-500">{formatLastSeen(r.last_seen_at)}</span> },
    { key: 'status', header: 'Status', render: (r) => <LoginStatusCell row={r} /> },
    {
      key: 'concern', header: 'Concern', hideOnMobile: true,
      render: (r) => <span className="text-[12px] text-slate-500">{atRisk[r.id]?.join(', ') ?? 'On track'}</span>,
    },
  ], [atRisk]);

  // ── Detail view ─────────────────────────────────────────────────────────
  if (selectedId) {
    return (
      <div className="flex flex-col gap-6">
        <button
          onClick={() => { setSelectedId(null); setDetail(null); }}
          className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft size={16} /> Back to roster
        </button>

        {isDetailLoading || !detail ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-400" /></div>
        ) : (
          <>
            <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 p-6 text-white shadow-md select-none md:flex-row md:p-8">
              <div className="flex items-center gap-5">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/20 text-4xl shadow-sm backdrop-blur-md">
                  {detail.student_profiles?.avatar}
                </span>
                <div>
                  <h3 className="font-display text-2xl font-extrabold tracking-tight">{detail.full_name}</h3>
                  <span className="mt-0.5 block text-[10px] font-bold text-indigo-100">
                    Class {detail.student_profiles?.class_num}-{detail.student_profiles?.section}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/10 p-4 px-6 backdrop-blur-md select-none">
                <span className="font-display text-3xl font-black">Lvl {detail.student_profiles?.level ?? 0}</span>
                <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-100">{detail.student_profiles?.xp} XP</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bento-card border border-slate-100 bg-white p-4 text-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Streak</span>
                <h4 className="mt-1 font-display text-xl font-black text-slate-800">🔥 {detail.student_profiles?.streak} Days</h4>
              </div>
              <div className="bento-card border border-slate-100 bg-white p-4 text-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Longest Streak</span>
                <h4 className="mt-1.5 font-display text-sm font-bold text-slate-800">{detail.student_profiles?.longest_streak} Days</h4>
              </div>
              <div className="bento-card border border-slate-100 bg-white p-4 text-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Badges Earned</span>
                <h4 className="mt-1 font-display text-xl font-black text-indigo-600">🏅 {detail.student_badges.length}</h4>
              </div>
            </div>

            <div className="bento-card flex flex-col gap-4 border border-slate-100 bg-white p-5 text-left">
              <span className="font-display text-sm font-bold text-slate-800">Subject Progress</span>
              {detail.subject_progress.length === 0 ? (
                <p className="text-xs text-slate-400">No subject progress recorded yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {detail.subject_progress.map((sp) => {
                    const pct = sp.total_chapters > 0 ? Math.round((sp.chapters_done / sp.total_chapters) * 100) : 0;
                    return (
                      <div key={sp.subject} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                          <span>{sp.subject}</span>
                          <span className={`badge ${pct < 60 ? 'pill-rose' : 'pill-indigo'} text-[9px] font-black`}>{pct}%</span>
                        </div>
                        <div className="progress-bar h-1.5 bg-slate-100">
                          <div className={`progress-fill ${pct < 60 ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Roster ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">
      <PortalPageHeader
        eyebrow="My classes"
        title="Student roster"
        description="Every student in the sections you teach. Filter by class or section, then open anyone for their full progress."
      >
        <div className="portal-metrics-grid">
          <MetricCard label="Students you teach" value={dir.data.total} hint="across your sections" icon={<Users size={18} />} />
          <MetricCard label="Flagged at risk" value={Object.keys(atRisk).length} hint="low activity or scores" icon={<TriangleAlert size={18} />} tone="amber" />
          <MetricCard label="On this page" value={dir.data.rows.length} hint={`${atRiskOnPage} at risk`} icon={<Flame size={18} />} tone="indigo" />
        </div>
      </PortalPageHeader>

      {dir.error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
          <AlertCircle size={15} /> {dir.error}
          <button onClick={() => dir.setError('')} className="ml-auto cursor-pointer"><X size={14} /></button>
        </div>
      )}

      <StudentDirectoryToolbar
        filters={dir.filters}
        onChange={dir.setFilters}
        onReset={() => { dir.resetFilters(); setShowOnlyAtRisk(false); }}
        hasActiveFilters={dir.hasActiveFilters || showOnlyAtRisk}
        total={dir.data.total}
        isLoading={dir.isLoading}
        onExport={() => downloadDirectoryCsv(`${BASE}/export`, dir.effectiveFilters, 'my-students.csv')}
      >
        <button
          onClick={() => setShowOnlyAtRisk((v) => !v)}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition ${
            showOnlyAtRisk
              ? 'border-transparent bg-rose-600 text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <TriangleAlert size={13} /> At risk only
        </button>
      </StudentDirectoryToolbar>

      <DataTable
        rows={visibleRows}
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
          showOnlyAtRisk ? 'No at-risk students on this page'
            : dir.hasActiveFilters ? 'No students match these filters'
            : 'No students assigned to you yet'
        }
        emptyHint={
          showOnlyAtRisk ? 'Turn off the at-risk filter to see everyone.'
            : dir.hasActiveFilters ? 'Try clearing a filter.'
            : 'Ask your School Admin to map you to a section.'
        }
        onRowClick={(row) => void openDetail(row)}
      />
    </div>
  );
};
