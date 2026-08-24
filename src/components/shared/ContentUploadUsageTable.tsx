import React from 'react';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface UploadUsageRow {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  classNum: number;
  subject: string;
  used: number;
  limit: number;
}

interface Props {
  rows: UploadUsageRow[] | null;
  /** Show the School column and link each row to its School Detail page —
   *  on for the cross-school Content Portal view, off when this table is
   *  already embedded inside one school's own detail page. */
  showSchool?: boolean;
  emptyHint?: string;
}

/**
 * Per-(class, subject) upload quota usage — a real table, not a progress
 * bar, per the explicit ask in UI feedback Aug 24 2026 (item #5): the quota
 * is 3 uploads per class+subject *per school*, not some platform-wide pool,
 * so a single bar can't represent it honestly. This is the shared shell for
 * both the cross-school view (Content Portal) and the single-school view
 * (School Detail's Content Uploads tab).
 */
export const ContentUploadUsageTable: React.FC<Props> = ({ rows, showSchool = false, emptyHint }) => {
  if (rows === null) {
    return <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin text-slate-300" /></div>;
  }

  if (rows.length === 0) {
    return (
      <p className="text-[13px] text-slate-400 text-center py-10">
        {emptyHint ?? 'No school has uploaded any books or PYQs yet.'}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 text-left">
            {[...(showSchool ? ['School'] : []), 'Class', 'Subject', 'Used', ''].map((h) => (
              <th key={h} className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const atLimit = r.used >= r.limit;
            return (
              <tr key={`${r.schoolId}-${r.classNum}-${r.subject}`} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                {showSchool && (
                  <td className="px-4 py-3">
                    <Link to={`/super-admin/schools/${r.schoolId}`} className="text-[13px] font-semibold text-slate-800 hover:text-indigo-600 hover:underline">
                      {r.schoolName}
                    </Link>
                    <span className="block text-[11px] font-mono text-slate-400">{r.schoolCode}</span>
                  </td>
                )}
                <td className="px-4 py-3 text-[13px] text-slate-700 whitespace-nowrap">Class {r.classNum}</td>
                <td className="px-4 py-3 text-[13px] text-slate-700 whitespace-nowrap">{r.subject}</td>
                <td className="px-4 py-3 text-[13px] font-semibold tabular-nums whitespace-nowrap">
                  <span className={atLimit ? 'text-rose-600' : 'text-slate-700'}>{r.used} / {r.limit}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {atLimit ? (
                    <span className="inline-flex text-[11px] font-semibold px-2 py-1 rounded-md bg-rose-50 text-rose-700">At limit</span>
                  ) : (
                    <span className="text-[11px] text-slate-400">{r.limit - r.used} left</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
