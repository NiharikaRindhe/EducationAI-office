import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Plus, AlertCircle, Search, X, Building2, Copy, Check } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

interface School {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  board: string;
  plan: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  created_at: string;
}

interface OverviewSchool {
  id: string;
  studentCount: number;
  teacherCount: number;
  activeNow: number;
  openTickets: number;
}

interface AdminCredential {
  fullName: string;
  email: string;
  password: string;
}

const inputCls =
  'w-full px-3 py-2 text-[13px] text-slate-800 bg-white border border-slate-300 rounded-lg outline-none transition-colors focus:border-slate-500 focus:ring-2 focus:ring-slate-100 placeholder:text-slate-400';

export const SuperAdminSchools: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [counts, setCounts] = useState<Map<string, OverviewSchool>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Creation lives on the dedicated onboarding page (schools/new); this
  // banner only shows the credential it hands back on redirect.
  const [newCredential, setNewCredential] = useState<AdminCredential | null>(null);
  const [copied, setCopied] = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [schoolList, overview] = await Promise.all([
        api.get<School[]>('/super-admin/schools'),
        api.get<{ schools: OverviewSchool[] }>('/super-admin/overview'),
      ]);
      setSchools(schoolList);
      setCounts(new Map(overview.schools.map((s) => [s.id, s])));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load schools');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return schools.filter((s) => {
      if (statusFilter === 'active' && !s.is_active) return false;
      if (statusFilter === 'inactive' && s.is_active) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.city ?? '').toLowerCase().includes(q) ||
        (s.contact_name ?? '').toLowerCase().includes(q)
      );
    });
  }, [schools, searchQuery, statusFilter]);


  const toggleActive = async (school: School) => {
    setTogglingId(school.id);
    setError('');
    try {
      await api.patch(`/super-admin/schools/${school.id}/active`, { isActive: !school.is_active });
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to update school');
    } finally {
      setTogglingId(null);
    }
  };

  const copyCredential = () => {
    if (!newCredential) return;
    void navigator.clipboard.writeText(
      `EduAI School Admin\nName: ${newCredential.fullName}\nEmail: ${newCredential.email}\nPassword: ${newCredential.password}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* One-time admin credential banner */}
      {newCredential && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3.5 flex items-center justify-between gap-4">
          <div className="text-[13px] text-emerald-900">
            <span className="font-semibold block mb-0.5">School admin account created — share these credentials securely. They are shown only once.</span>
            <span className="font-mono text-emerald-800">{newCredential.email}</span>
            <span className="mx-2 text-emerald-400">·</span>
            <span className="font-mono font-semibold">{newCredential.password}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={copyCredential} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg cursor-pointer">
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={() => setNewCredential(null)} className="text-emerald-500 hover:text-emerald-700 p-1.5 cursor-pointer"><X size={15} /></button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative max-w-xs flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, code, city, contact…"
              className={`${inputCls} pl-9`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 text-[13px] text-slate-700 bg-white border border-slate-300 rounded-lg outline-none cursor-pointer focus:border-slate-500"
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>
        <Link
          to="/super-admin/schools/new"
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <Plus size={15} /> Onboard School
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
            <Building2 size={28} strokeWidth={1.5} />
            <p className="text-[13px]">{schools.length === 0 ? 'No schools yet — add the first one.' : 'No schools match your search.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  {['School', 'Location', 'Board / Plan', 'Students', 'Teachers', 'Contact', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const c = counts.get(s.id);
                  return (
                    <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/super-admin/schools/${s.id}`} className="block text-[13px] font-semibold text-slate-800 hover:text-indigo-600 hover:underline">
                          {s.name}
                        </Link>
                        <span className="block text-[12px] font-mono text-slate-400">{s.code}</span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-slate-600 whitespace-nowrap">
                        {[s.city, s.state].filter(Boolean).join(', ') || '—'}
                        {s.pincode && <span className="block text-[12px] text-slate-400">{s.pincode}</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[13px] text-slate-700">{s.board}</span>
                        <span className="block text-[12px] text-slate-400 capitalize">{s.plan}</span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-slate-700 tabular-nums">{c?.studentCount ?? 0}</td>
                      <td className="px-4 py-3 text-[13px] text-slate-700 tabular-nums">{c?.teacherCount ?? 0}</td>
                      <td className="px-4 py-3">
                        {s.contact_name ? (
                          <>
                            <span className="block text-[13px] text-slate-700">{s.contact_name}</span>
                            <span className="block text-[12px] text-slate-400">{s.contact_phone ?? s.contact_email ?? ''}</span>
                          </>
                        ) : (
                          <span className="text-[13px] text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${s.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => void toggleActive(s)}
                          disabled={togglingId === s.id}
                          className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-50 ${
                            s.is_active
                              ? 'text-slate-600 border-slate-200 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          {togglingId === s.id ? <Loader2 size={12} className="animate-spin" /> : s.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
