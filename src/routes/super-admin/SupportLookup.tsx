import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader2, Search } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { formatLastSeen } from '../../lib/studentDirectory';

interface SchoolOption {
  id: string;
  name: string;
  code: string;
}

interface LookupRow {
  id: string;
  fullName: string;
  role: string;
  isActive: boolean;
  lastSeenAt: string | null;
  classNum: number | null;
  section: string | null;
  rollNumber: string | null;
}

interface LookupResult {
  school: { id: string; name: string; code: string };
  results: LookupRow[];
}

const ROLE_LABEL: Record<string, string> = {
  student: 'Student',
  teacher: 'Teacher',
  school_admin: 'School Admin',
};

/**
 * Ticket-solving lookup (sheet item #2).
 * School + search required; every hit is audited. No XP, no export, no bulk.
 */
export const SuperAdminSupportLookup: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolId, setSchoolId] = useState(searchParams.get('schoolId') ?? '');
  const [ticketId, setTicketId] = useState(searchParams.get('ticketId') ?? '');
  const [q, setQ] = useState('');
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void api
      .get<{ rows: SchoolOption[] }>('/super-admin/schools', { pageSize: 100 })
      .then((page) => setSchools(page.rows))
      .catch(() => setSchools([]));
  }, []);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!schoolId) {
      setError('Pick a school first — this lookup is per school on purpose.');
      return;
    }
    setBusy(true);
    try {
      const query: Record<string, string> = { schoolId, q };
      if (ticketId.trim()) query.ticketId = ticketId.trim();
      setResult(await api.get<LookupResult>('/super-admin/support/lookup', query));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Lookup failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Support lookup</h1>
        <p className="text-[13px] text-slate-400 mt-1 max-w-2xl">
          Find a student or teacher in one school while solving a ticket. Every search is written to the audit log.
          Multiple Super Admins can work different schools at the same time.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <form onSubmit={(e) => void search(e)} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            required
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            className="px-3 py-2.5 text-[13px] bg-white border border-slate-300 rounded-lg outline-none"
          >
            <option value="">Select school…</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>
          <input
            required
            minLength={2}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name (at least 2 letters)"
            className="px-3 py-2.5 text-[13px] bg-white border border-slate-300 rounded-lg outline-none"
          />
          <input
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            placeholder="Ticket id (optional)"
            className="px-3 py-2.5 text-[13px] bg-white border border-slate-300 rounded-lg outline-none font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="self-start inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-4 py-2 rounded-lg disabled:opacity-50 cursor-pointer"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Search this school
        </button>
      </form>

      {result && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-700">
              {result.school.name} · {result.results.length} match{result.results.length === 1 ? '' : 'es'}
            </span>
            <Link to={`/super-admin/tickets?schoolId=${result.school.id}`} className="text-[12px] font-semibold text-indigo-600 hover:underline">
              Open this school’s tickets
            </Link>
          </div>
          {result.results.length === 0 ? (
            <p className="text-[13px] text-slate-400 text-center py-10">No matching people in this school.</p>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Role</th>
                  <th className="px-4 py-2.5">Class</th>
                  <th className="px-4 py-2.5">Last seen</th>
                  <th className="px-4 py-2.5">Account</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {r.fullName}
                      {r.rollNumber && <span className="block text-[11px] text-slate-400">Roll {r.rollNumber}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{ROLE_LABEL[r.role] ?? r.role}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.classNum ? `${r.classNum}-${r.section ?? ''}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatLastSeen(r.lastSeenAt)}</td>
                    <td className="px-4 py-3">
                      <span className={r.isActive ? 'text-emerald-700' : 'text-slate-400'}>
                        {r.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
