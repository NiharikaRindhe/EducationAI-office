import React from 'react';
import { api, ApiClientError } from './api';

/**
 * Shared client for the student directory endpoint that the School Admin,
 * Teacher and Super Admin portals all read. Keeping the query state and the
 * fetch in one place is what makes the three tables behave identically
 * instead of drifting apart. The matching cell renderers live in
 * components/shared/StudentCells.tsx.
 */

export interface StudentDirectoryRow {
  id: string;
  school_id: string;
  school_name: string;
  school_code: string;
  full_name: string;
  is_active: boolean;
  has_logged_in_ever: boolean;
  last_seen_at: string | null;
  class_num: number;
  section: string;
  batch_id: number | null;
  roll_number: string | null;
  avatar: string;
  xp: number;
  level: number;
  streak: number;
  longest_streak: number;
  graduated: boolean;
}

export interface DirectoryPage {
  rows: StudentDirectoryRow[];
  total: number;
  page: number;
  pageSize: number;
  /** Set by the cross-school (Super Admin) endpoint when the request wasn't
   *  narrowed to a school or a search term, so no rows were returned. Distinct
   *  from "no matches" and must be presented differently. */
  gated?: boolean;
}

export type DirectorySortKey = 'name' | 'class' | 'roll' | 'xp' | 'streak' | 'lastSeen' | 'school';

export interface DirectoryFilters {
  search: string;
  classNum: string;
  section: string;
  status: 'all' | 'active' | 'never';
  enabled: 'all' | 'enabled' | 'disabled';
  /** Hides students who have left unless widened. Absent = 'current'.
   *  'graduated' narrows to Class 10 pass-outs specifically (#53) — a
   *  distinct sub-case of 'left' that a plain deactivation isn't. */
  enrolment?: 'current' | 'left' | 'all' | 'graduated';
  schoolId: string;
}

export const EMPTY_FILTERS: DirectoryFilters = {
  search: '', classNum: '', section: '', status: 'all', enabled: 'all', enrolment: 'current', schoolId: '',
};

/** Only send params the server should act on — empty strings would otherwise
 *  become real filters (e.g. section='') and match nothing. */
export function toQuery(
  filters: DirectoryFilters,
  extra: Record<string, string | number | undefined> = {},
): Record<string, string | number | undefined> {
  return {
    search: filters.search.trim() || undefined,
    classNum: filters.classNum || undefined,
    section: filters.section || undefined,
    status: filters.status === 'all' ? undefined : filters.status,
    enabled: filters.enabled === 'all' ? undefined : filters.enabled,
    // Sent only when widened; the server already defaults to current-only.
    enrolment: !filters.enrolment || filters.enrolment === 'current' ? undefined : filters.enrolment,
    schoolId: filters.schoolId || undefined,
    ...extra,
  };
}

interface UseStudentDirectoryOptions {
  /** e.g. '/school-admin/students/directory' or '/super-admin/students'. */
  basePath: string;
  initialSortKey?: DirectorySortKey;
  initialPageSize?: number;
}

export function useStudentDirectory({
  basePath,
  initialSortKey = 'class',
  initialPageSize = 50,
}: UseStudentDirectoryOptions) {
  const [filters, setFiltersState] = React.useState<DirectoryFilters>(EMPTY_FILTERS);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);
  const [sortKey, setSortKey] = React.useState<DirectorySortKey>(initialSortKey);
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

  const [data, setData] = React.useState<DirectoryPage>({ rows: [], total: 0, page: 1, pageSize: initialPageSize });
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [reloadToken, setReloadToken] = React.useState(0);

  // Debounce the search box so typing doesn't fire a request per keystroke.
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  const effectiveFilters = React.useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    api
      .get<DirectoryPage>(basePath, toQuery(effectiveFilters, { page, pageSize, sortKey, sortDir }))
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setError('');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiClientError ? err.message : 'Failed to load students');
        setData({ rows: [], total: 0, page: 1, pageSize });
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [basePath, effectiveFilters, page, pageSize, sortKey, sortDir, reloadToken]);

  /** Any filter change invalidates the current page number. */
  const setFilters = React.useCallback((update: Partial<DirectoryFilters>) => {
    setFiltersState((prev) => {
      // Changing class makes the previously chosen section meaningless.
      const next = { ...prev, ...update };
      if (update.classNum !== undefined && update.classNum !== prev.classNum) next.section = '';
      return next;
    });
    setPage(1);
  }, []);

  const resetFilters = React.useCallback(() => {
    setFiltersState(EMPTY_FILTERS);
    setPage(1);
  }, []);

  const changeSort = React.useCallback((key: string, dir: 'asc' | 'desc') => {
    setSortKey(key as DirectorySortKey);
    setSortDir(dir);
    setPage(1);
  }, []);

  const reload = React.useCallback(() => setReloadToken((t) => t + 1), []);

  /** Ids of every row matching the current filter — backs "select all N". */
  const fetchAllMatchingIds = React.useCallback(
    () => api.get<string[]>(`${basePath}/ids`, toQuery(effectiveFilters)),
    [basePath, effectiveFilters],
  );

  const hasActiveFilters =
    Boolean(effectiveFilters.search) || Boolean(filters.classNum) || Boolean(filters.section) ||
    filters.status !== 'all' || filters.enabled !== 'all' ||
    (Boolean(filters.enrolment) && filters.enrolment !== 'current') || Boolean(filters.schoolId);

  return {
    filters, setFilters, resetFilters, hasActiveFilters,
    effectiveFilters,
    page, setPage, pageSize, setPageSize,
    sortKey, sortDir, changeSort,
    data, isLoading, error, setError, reload,
    fetchAllMatchingIds,
  };
}

/** Triggers a browser download of a CSV export honouring the live filters. */
export async function downloadDirectoryCsv(
  exportPath: string,
  filters: DirectoryFilters,
  filename: string,
): Promise<void> {
  const blob = await api.download(exportPath, toQuery(filters));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatLastSeen(value: string | null): string {
  if (!value) return '—';
  const then = new Date(value).getTime();
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}
