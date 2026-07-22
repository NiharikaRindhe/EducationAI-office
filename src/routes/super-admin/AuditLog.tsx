import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, ScrollText } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

interface AuditRow {
  id: string;
  school_id: string | null;
  actor_id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  schools: { name: string; code: string } | null;
  actor: { full_name: string; role: string } | null;
}

interface School {
  id: string;
  name: string;
  code: string;
}

export const SuperAdminAuditLog: React.FC = () => {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolFilter, setSchoolFilter] = useState('');
  const [days, setDays] = useState(30);
  const [error, setError] = useState('');

  useEffect(() => {
    void api.get<School[]>('/super-admin/schools').then(setSchools).catch(() => {});
  }, []);

  useEffect(() => {
    setRows(null);
    const query: Record<string, string | number> = { days };
    if (schoolFilter) query.schoolId = schoolFilter;
    api
      .get<AuditRow[]>('/super-admin/audit-log', query)
      .then(setRows)
      .catch((err) => {
        setError(err instanceof ApiClientError ? err.message : 'Failed to load audit log');
        setRows([]);
      });
  }, [schoolFilter, days]);

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <select
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
          className="px-3 py-2 text-[13px] text-slate-700 bg-white border border-slate-300 rounded-lg outline-none cursor-pointer focus:border-slate-500"
        >
          <option value="">All schools</option>
          {schools.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
        </select>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-2 text-[13px] text-slate-700 bg-white border border-slate-300 rounded-lg outline-none cursor-pointer focus:border-slate-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
        {rows && <span className="text-[12px] text-slate-400 ml-auto">{rows.length} event{rows.length === 1 ? '' : 's'}</span>}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {rows === null ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
            <ScrollText size={28} strokeWidth={1.5} />
            <p className="text-[13px]">No audit events in this period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  {['When', 'Actor', 'Action', 'Entity', 'School', 'Details'].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors align-top">
                    <td className="px-4 py-3 text-[12px] text-slate-500 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="block text-[13px] text-slate-700">{r.actor?.full_name ?? 'Unknown'}</span>
                      <span className="block text-[11px] text-slate-400 capitalize">{r.actor?.role.replace('_', ' ') ?? ''}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex text-[11px] font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-mono">{r.action}</span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-600 whitespace-nowrap">{r.entity}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-600 whitespace-nowrap">{r.schools?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-400 font-mono max-w-xs">
                      {r.metadata ? <span className="line-clamp-2 break-all">{JSON.stringify(r.metadata)}</span> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
