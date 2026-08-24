import React from 'react';
import {
  Loader2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Inbox, X,
} from 'lucide-react';

/**
 * Shared roster/data table for the admin-side portals.
 *
 * Built for server-side paging: it renders exactly the `rows` it is given and
 * reports sort/page changes upward, rather than holding the full dataset and
 * slicing it. That's what lets the same component back a 60-student section
 * and a multi-school directory without changing behaviour.
 *
 * Selection deliberately distinguishes "the rows on this page" from "every row
 * matching the current filter" — with paging, a header checkbox that silently
 * means only the visible 50 of 1,800 is a foot-gun for bulk actions, so
 * selecting a full page offers an explicit opt-in to widen it.
 */

export interface DataTableColumn<T> {
  /** Stable identity for the column. */
  key: string;
  header: React.ReactNode;
  /** Set to make the column sortable; this value is what gets reported up. */
  sortKey?: string;
  align?: 'left' | 'right' | 'center';
  /** Applied to the <th>, e.g. 'w-32'. */
  className?: string;
  /** Hide below the md breakpoint to keep narrow screens readable. */
  hideOnMobile?: boolean;
  render: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;

  /** Server-reported total for the current filter (not just this page). */
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;

  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSortChange?: (sortKey: string, sortDir: 'asc' | 'desc') => void;

  isLoading?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
  onRowClick?: (row: T) => void;

  /** Selection is opt-in; omit for a read-only table. */
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  /** Resolves every id matching the current filter, for "select all N". */
  onSelectAllMatching?: () => Promise<string[]>;
  /** Buttons for the bulk bar; only rendered while something is selected. */
  bulkActions?: (selectedIds: string[]) => React.ReactNode;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

export function DataTable<T>({
  rows, columns, getRowId,
  total, page, pageSize, onPageChange, onPageSizeChange,
  sortKey, sortDir = 'asc', onSortChange,
  isLoading, emptyTitle = 'Nothing to show', emptyHint, onRowClick,
  selectedIds, onSelectionChange, onSelectAllMatching, bulkActions,
}: DataTableProps<T>) {
  const selectable = Boolean(selectedIds && onSelectionChange);
  const selected = selectedIds ?? new Set<string>();
  const [isSelectingAll, setIsSelectingAll] = React.useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const firstRow = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastRow = Math.min(safePage * pageSize, total);

  const pageIds = rows.map(getRowId);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPageSelected = pageIds.some((id) => selected.has(id));

  const headerCheckboxRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someOnPageSelected && !allOnPageSelected;
    }
  }, [someOnPageSelected, allOnPageSelected]);

  const setSelection = (next: Set<string>) => onSelectionChange?.(next);

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelection(next);
  };

  const togglePage = () => {
    const next = new Set(selected);
    if (allOnPageSelected) pageIds.forEach((id) => next.delete(id));
    else pageIds.forEach((id) => next.add(id));
    setSelection(next);
  };

  const handleSelectAllMatching = async () => {
    if (!onSelectAllMatching) return;
    setIsSelectingAll(true);
    try {
      setSelection(new Set(await onSelectAllMatching()));
    } finally {
      setIsSelectingAll(false);
    }
  };

  const handleSort = (key: string) => {
    if (!onSortChange) return;
    onSortChange(key, sortKey === key && sortDir === 'asc' ? 'desc' : 'asc');
  };

  const alignClass = (align?: string) =>
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  const selectedCount = selected.size;
  // Only offer "select all N" when the filter genuinely reaches past this page.
  const canWidenSelection = Boolean(onSelectAllMatching) && allOnPageSelected && total > pageIds.length && selectedCount < total;

  return (
    <div className="flex flex-col gap-3">
      {/* Bulk action bar — replaces the toolbar's attention while a selection is active */}
      {selectable && selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white shadow-sm">
          <span className="text-[13px] font-semibold">
            {selectedCount.toLocaleString('en-IN')} selected
          </span>
          {canWidenSelection && (
            <button
              onClick={() => void handleSelectAllMatching()}
              disabled={isSelectingAll}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-white/20 disabled:opacity-50 cursor-pointer"
            >
              {isSelectingAll && <Loader2 size={12} className="animate-spin" />}
              Select all {total.toLocaleString('en-IN')} matching
            </button>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {bulkActions?.([...selected])}
            <button
              onClick={() => setSelection(new Set())}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <X size={13} /> Clear
            </button>
          </div>
        </div>
      )}

      <div className="portal-panel">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
            <Inbox size={28} strokeWidth={1.5} />
            <p className="text-[13px] font-medium text-slate-500">{emptyTitle}</p>
            {emptyHint && <p className="text-[12px]">{emptyHint}</p>}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="portal-table w-full">
                <thead>
                  {/* Row/text sizing here is intentionally a step up from the
                      12px-13px density used elsewhere in the portal shell —
                      this is the primary record a School Admin scans and acts
                      on all day (item #82, UI testing pass Aug 24 2026), not a
                      supporting stat card, so it earns the extra breathing
                      room. */}
                  <tr className="bg-slate-50 text-left text-[11.5px] text-slate-500">
                    {selectable && (
                      <th className="w-10 px-4 py-3.5">
                        <input
                          ref={headerCheckboxRef}
                          type="checkbox"
                          checked={allOnPageSelected}
                          onChange={togglePage}
                          aria-label="Select all rows on this page"
                          className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 accent-slate-900"
                        />
                      </th>
                    )}
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className={`px-4 py-3.5 whitespace-nowrap ${alignClass(col.align)} ${col.className ?? ''} ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                      >
                        {col.sortKey && onSortChange ? (
                          <button
                            onClick={() => handleSort(col.sortKey!)}
                            className="inline-flex items-center gap-1 font-semibold uppercase tracking-wider transition-colors hover:text-slate-700 cursor-pointer"
                          >
                            {col.header}
                            {sortKey === col.sortKey && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                          </button>
                        ) : (
                          <span className="font-semibold uppercase tracking-wider">{col.header}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const id = getRowId(row);
                    const isSelected = selected.has(id);
                    return (
                      <tr
                        key={id}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        className={`border-t border-slate-100 transition-colors ${
                          isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/60'
                        } ${onRowClick ? 'cursor-pointer' : ''}`}
                      >
                        {selectable && (
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRow(id)}
                              aria-label="Select row"
                              className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 accent-slate-900"
                            />
                          </td>
                        )}
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className={`px-4 py-3 text-[13.5px] text-slate-700 ${alignClass(col.align)} ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                          >
                            {col.render(row)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-slate-500">
                  Showing <span className="font-semibold text-slate-700 tabular-nums">{firstRow.toLocaleString('en-IN')}–{lastRow.toLocaleString('en-IN')}</span> of{' '}
                  <span className="font-semibold text-slate-700 tabular-nums">{total.toLocaleString('en-IN')}</span>
                </span>
                {onPageSizeChange && (
                  <select
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    aria-label="Rows per page"
                    className="cursor-pointer rounded-lg border border-slate-300 bg-white px-2 py-1 text-[12px] text-slate-600 outline-none focus:border-slate-500"
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n} / page</option>)}
                  </select>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPageChange(safePage - 1)}
                  disabled={safePage <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft size={13} /> Prev
                </button>
                <span className="text-[12px] tabular-nums text-slate-500">Page {safePage} / {totalPages}</span>
                <button
                  onClick={() => onPageChange(safePage + 1)}
                  disabled={safePage >= totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
