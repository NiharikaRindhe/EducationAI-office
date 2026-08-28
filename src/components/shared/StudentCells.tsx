import React from 'react';
import type { StudentDirectoryRow } from '../../lib/studentDirectory';

/**
 * Cell renderers shared by the School Admin, Teacher and Super Admin student
 * tables, so a student row reads identically in all three portals.
 */

export const StudentNameCell: React.FC<{ row: StudentDirectoryRow }> = ({ row }) => (
  <div className="flex items-center gap-2.5">
    <span className="text-lg leading-none">{row.avatar ?? '🙂'}</span>
    <div className="min-w-0">
      <span className="block truncate font-semibold text-slate-800">{row.full_name}</span>
      {row.roll_number && <span className="block text-[11px] text-slate-400">Roll {row.roll_number}</span>}
    </div>
  </div>
);

export const ClassCell: React.FC<{ row: StudentDirectoryRow }> = ({ row }) => (
  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[12px] font-semibold tabular-nums text-slate-700">
    {row.class_num}-{row.section}
  </span>
);

/** Login readiness — the number a School Admin chases at term start.
 *  A deactivated account outranks "never logged in": it explains the
 *  absence, so showing both would just be noise. Graduated outranks a plain
 *  deactivation in turn — a Class 10 pass-out isn't a suspended account,
 *  and the two used to be indistinguishable here (#53). */
export const LoginStatusCell: React.FC<{ row: StudentDirectoryRow }> = ({ row }) => {
  if (row.graduated) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-indigo-600">
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Graduated
      </span>
    );
  }
  if (!row.is_active) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Deactivated
      </span>
    );
  }
  return row.has_logged_in_ever ? (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-amber-600">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Never logged in
    </span>
  );
};
