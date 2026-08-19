import React from 'react';
import { Search, X, Download, Loader2 } from 'lucide-react';
import type { DirectoryFilters } from '../../lib/studentDirectory';

/**
 * Filter bar above the student directory table. Shared by all three portals
 * so the same filters live in the same order everywhere; the Super Admin's
 * school picker is the only role-specific control and is passed in.
 */

export interface SchoolOption { id: string; name: string }

interface Props {
  filters: DirectoryFilters;
  onChange: (update: Partial<DirectoryFilters>) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  total: number;
  isLoading?: boolean;
  /** Class numbers offered; Batch-scoped portals can narrow this. */
  classOptions?: number[];
  sectionOptions?: string[];
  /** Renders the school <select> for the Super Admin directory. */
  schoolOptions?: SchoolOption[];
  /** Enrolment filter — only the school admin can retire or reinstate a student. */
  showEnrolmentFilter?: boolean;
  onExport?: () => Promise<void> | void;
  /** Extra controls (e.g. Import / Add student) rendered at the right. */
  children?: React.ReactNode;
}

const selectCls =
  'px-3 py-2 text-[13px] text-slate-700 bg-white border border-slate-300 rounded-lg outline-none cursor-pointer focus:border-slate-500';

export const StudentDirectoryToolbar: React.FC<Props> = ({
  filters, onChange, onReset, hasActiveFilters, total, isLoading,
  classOptions = Array.from({ length: 10 }, (_, i) => i + 1),
  sectionOptions = ['A', 'B', 'C', 'D', 'E'],
  schoolOptions, onExport, children, showEnrolmentFilter = false,
}) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    if (!onExport) return;
    setIsExporting(true);
    try {
      await onExport();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="portal-toolbar">
      <div className="relative min-w-[200px] max-w-xs flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Search name or roll number…"
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-[13px] text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
        />
      </div>

      {schoolOptions && (
        <select
          value={filters.schoolId}
          onChange={(e) => onChange({ schoolId: e.target.value })}
          className={selectCls}
          aria-label="Filter by school"
        >
          <option value="">All schools</option>
          {schoolOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      )}

      <select
        value={filters.classNum}
        onChange={(e) => onChange({ classNum: e.target.value })}
        className={selectCls}
        aria-label="Filter by class"
      >
        <option value="">All classes</option>
        {classOptions.map((c) => <option key={c} value={c}>Class {c}</option>)}
      </select>

      <select
        value={filters.section}
        onChange={(e) => onChange({ section: e.target.value })}
        className={selectCls}
        aria-label="Filter by section"
      >
        <option value="">All sections</option>
        {sectionOptions.map((s) => <option key={s} value={s}>Section {s}</option>)}
      </select>

      <select
        value={filters.status}
        onChange={(e) => onChange({ status: e.target.value as DirectoryFilters['status'] })}
        className={selectCls}
        aria-label="Filter by login status"
      >
        <option value="all">All logins</option>
        <option value="active">Has logged in</option>
        <option value="never">Never logged in</option>
      </select>

      <select
        value={filters.enabled}
        onChange={(e) => onChange({ enabled: e.target.value as DirectoryFilters['enabled'] })}
        className={selectCls}
        aria-label="Filter by account state"
      >
        <option value="all">All accounts</option>
        <option value="enabled">Active only</option>
        <option value="disabled">Deactivated only</option>
      </select>

      {/* Enrolment is separate from the account toggle: a leaver is not the
          same as a suspended account, and the roster hides leavers by default
          so headcount stays honest. */}
      {showEnrolmentFilter && (
        <select
          value={filters.enrolment ?? 'current'}
          onChange={(e) => onChange({ enrolment: e.target.value as DirectoryFilters['enrolment'] })}
          className={selectCls}
          aria-label="Filter by enrolment"
        >
          <option value="current">Currently enrolled</option>
          <option value="left">Left the school</option>
          <option value="all">Enrolled + left</option>
        </select>
      )}

      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-[12px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
        >
          <X size={13} /> Clear
        </button>
      )}

      <div className="ml-auto flex items-center gap-2">
        <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500 tabular-nums">
          {isLoading ? <Loader2 size={12} className="animate-spin" /> : `${total.toLocaleString('en-IN')} student${total === 1 ? '' : 's'}`}
        </span>
        {onExport && (
          <button
            onClick={() => void handleExport()}
            disabled={isExporting || total === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            Export CSV
          </button>
        )}
        {children}
      </div>
    </div>
  );
};
