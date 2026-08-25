import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2, AlertCircle, School, Users, GraduationCap, TicketCheck, Activity, UserCheck,
  ShieldAlert, Moon, Clock, UploadCloud, XCircle, Sparkles, CheckCircle2,
} from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { formatLastSeen } from '../../lib/studentDirectory';

interface SchoolRow {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  studentCount: number;
  teacherCount: number;
  activeNow: number;
  openTickets: number;
}

interface DormantSchool {
  id: string;
  name: string;
  code: string;
  lastActivityAt: string | null;
}

interface Overview {
  totalSchools: number;
  activeSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalUsers: number;
  totalLoggedIn: number;
  totalActiveNow: number;
  totalOpenTickets: number;
  schools: SchoolRow[];
  attention: {
    dormantSchools: DormantSchool[];
    escalatedTickets: number;
    staleTickets: number;
    newSchoolsThisWeek: number;
    ingestionQueued: number;
    ingestionErrors: number;
    sameLogins?: { userId: string; fullName: string; schoolName: string | null; role: string; count: number }[];
  };
}

export const SuperAdminOverview: React.FC = () => {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void api
      .get<Overview>('/super-admin/overview')
      .then(setOverview)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Failed to load overview'));
  }, []);

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
        <AlertCircle size={14} /> {error}
      </div>
    );
  }

  if (!overview) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-400" /></div>;
  }

  const stats = [
    { label: 'Active Schools', value: `${overview.activeSchools} / ${overview.totalSchools}`, icon: School, colorClass: 'text-slate-800' },
    { label: 'Total Users', value: overview.totalUsers, icon: Users, colorClass: 'text-indigo-500' },
    { label: 'Users logged in', value: overview.totalLoggedIn, icon: UserCheck, colorClass: 'text-sky-600' },
    { label: 'Active Now', value: overview.totalActiveNow, icon: Activity, colorClass: 'text-amber-500' },
    { label: 'Total Students', value: overview.totalStudents, icon: UserCheck, colorClass: 'text-sky-500' },
    { label: 'Total Teachers', value: overview.totalTeachers, icon: GraduationCap, colorClass: 'text-emerald-500' },
    { label: 'Open Tickets', value: overview.totalOpenTickets, icon: TicketCheck, colorClass: 'text-rose-500' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col gap-2">
            <s.icon className={s.colorClass} size={20} />
            <span className="font-display font-black text-2xl text-slate-800">{s.value}</span>
            <span className="text-[10px] font-label-caps text-slate-400">{s.label}</span>
          </div>
        ))}
      </div>

      <NeedsAttentionPanel attention={overview.attention} />

      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <h2 className="font-display font-bold text-lg text-slate-800 mb-4">Schools</h2>
        {overview.schools.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No schools yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 font-label-caps text-[9px] border-b border-slate-100">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Code</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Students</th>
                  <th className="pb-2">Teachers</th>
                  <th className="pb-2">Active Now</th>
                  <th className="pb-2">Open Tickets</th>
                </tr>
              </thead>
              <tbody>
                {overview.schools.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50">
                    <td className="py-2.5 font-semibold text-slate-700">
                      <Link to={`/super-admin/schools/${s.id}`} className="hover:text-indigo-600 hover:underline">{s.name}</Link>
                    </td>
                    <td className="py-2.5 font-mono">{s.code}</td>
                    <td className="py-2.5">
                      {s.isActive ? <span className="text-emerald-600 font-bold">Active</span> : <span className="text-slate-400 font-bold">Inactive</span>}
                    </td>
                    <td className="py-2.5">{s.studentCount}</td>
                    <td className="py-2.5">{s.teacherCount}</td>
                    <td className="py-2.5">{s.activeNow > 0 ? <span className="text-emerald-600 font-bold">{s.activeNow}</span> : '0'}</td>
                    <td className="py-2.5">
                      {s.openTickets > 0 ? (
                        // Carry the school through: the inbox defaults to
                        // "escalated + mine", so an unscoped link lands on an
                        // empty page and this count looks like a lie.
                        <Link to={`/super-admin/tickets?schoolId=${s.id}`} className="text-rose-600 font-bold hover:underline">{s.openTickets}</Link>
                      ) : '0'}
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

/**
 * Triage panel: what actually needs the Super Admin's attention today, as
 * opposed to the stat cards above which are just a health snapshot. Rows
 * hide themselves when their count is zero — with a hundred schools this is
 * meant to stay short, not become a second copy of the full schools table.
 */
const NeedsAttentionPanel: React.FC<{ attention: Overview['attention'] }> = ({ attention }) => {
  const {
    dormantSchools, escalatedTickets, staleTickets, newSchoolsThisWeek, ingestionQueued, ingestionErrors, sameLogins = [],
  } = attention;

  const rowCls = 'flex items-center gap-3 rounded-2xl border border-slate-100 px-4 py-3';

  const hasAnything =
    dormantSchools.length > 0 || escalatedTickets > 0 || staleTickets > 0 ||
    newSchoolsThisWeek > 0 || ingestionQueued > 0 || ingestionErrors > 0 ||
    (sameLogins?.length ?? 0) > 0;

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
      <h2 className="font-display font-bold text-lg text-slate-800">Needs Attention</h2>

      {!hasAnything && (
        <div className={`${rowCls} text-emerald-700 bg-emerald-50/50`}>
          <CheckCircle2 size={18} />
          <span className="text-xs font-semibold">All clear — no escalations, stale tickets, dormant schools, or ingestion problems right now.</span>
        </div>
      )}

      {escalatedTickets > 0 && (
        <Link to="/super-admin/tickets" className={`${rowCls} text-rose-700 bg-rose-50/50 hover:bg-rose-50 transition`}>
          <ShieldAlert size={18} />
          <span className="text-xs font-semibold flex-1">
            {escalatedTickets} ticket{escalatedTickets === 1 ? '' : 's'} escalated to you and still open
          </span>
        </Link>
      )}

      {staleTickets > 0 && (
        <Link to="/super-admin/tickets" className={`${rowCls} text-amber-700 bg-amber-50/50 hover:bg-amber-50 transition`}>
          <Clock size={18} />
          <span className="text-xs font-semibold flex-1">
            {staleTickets} ticket{staleTickets === 1 ? '' : 's'} open for more than 48 hours
          </span>
        </Link>
      )}

      {ingestionErrors > 0 && (
        <Link to="/super-admin/content" className={`${rowCls} text-rose-700 bg-rose-50/50 hover:bg-rose-50 transition`}>
          <XCircle size={18} />
          <span className="text-xs font-semibold flex-1">
            {ingestionErrors} book upload{ingestionErrors === 1 ? '' : 's'} failed processing
          </span>
        </Link>
      )}

      {ingestionQueued > 0 && (
        <Link to="/super-admin/content" className={`${rowCls} text-slate-600 bg-slate-50 hover:bg-slate-100 transition`}>
          <UploadCloud size={18} />
          <span className="text-xs font-semibold flex-1">
            {ingestionQueued} book{ingestionQueued === 1 ? '' : 's'} still processing in the upload queue
          </span>
        </Link>
      )}

      {dormantSchools.length > 0 && (
        <div className={`${rowCls} items-start text-slate-600 bg-slate-50 flex-col`}>
          <div className="flex items-center gap-3">
            <Moon size={18} />
            <span className="text-xs font-semibold">
              {dormantSchools.length} active school{dormantSchools.length === 1 ? '' : 's'} with nobody logged in for over a week
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pl-8">
            {dormantSchools.slice(0, 8).map((s) => (
              <Link
                key={s.id}
                to={`/super-admin/schools/${s.id}`}
                className="text-[11px] font-medium bg-white border border-slate-200 rounded-full px-2.5 py-1 hover:border-slate-400 transition"
              >
                {s.name} · {formatLastSeen(s.lastActivityAt)}
              </Link>
            ))}
            {dormantSchools.length > 8 && (
              <span className="text-[11px] text-slate-400 py-1">+{dormantSchools.length - 8} more</span>
            )}
          </div>
        </div>
      )}

      {(sameLogins?.length ?? 0) > 0 && (
        <div className={`${rowCls} items-start text-amber-800 bg-amber-50/50 flex-col`}>
          <div className="flex items-center gap-3">
            <ShieldAlert size={18} />
            <span className="text-xs font-semibold">
              {sameLogins.length} account{sameLogins.length === 1 ? '' : 's'} signed in more than once in the last 20 minutes
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pl-8">
            {sameLogins.map((u) => (
              <span key={u.userId} className="text-[11px] font-medium bg-white border border-amber-200 rounded-full px-2.5 py-1">
                {u.fullName} · {u.schoolName ?? '—'} · {u.count} logins
              </span>
            ))}
          </div>
        </div>
      )}

      {newSchoolsThisWeek > 0 && (
        <div className={`${rowCls} text-indigo-700 bg-indigo-50/50`}>
          <Sparkles size={18} />
          <span className="text-xs font-semibold">
            {newSchoolsThisWeek} new school{newSchoolsThisWeek === 1 ? '' : 's'} onboarded in the last 7 days
          </span>
        </div>
      )}
    </div>
  );
};
