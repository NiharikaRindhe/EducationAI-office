import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertCircle, School, Users, GraduationCap, TicketCheck } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

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

interface Overview {
  totalSchools: number;
  activeSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalOpenTickets: number;
  schools: SchoolRow[];
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
    { label: 'Total Students', value: overview.totalStudents, icon: Users, colorClass: 'text-indigo-500' },
    { label: 'Total Teachers', value: overview.totalTeachers, icon: GraduationCap, colorClass: 'text-emerald-500' },
    { label: 'Open Tickets', value: overview.totalOpenTickets, icon: TicketCheck, colorClass: 'text-rose-500' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col gap-2">
            <s.icon className={s.colorClass} size={20} />
            <span className="font-display font-black text-2xl text-slate-800">{s.value}</span>
            <span className="text-[10px] font-label-caps text-slate-400">{s.label}</span>
          </div>
        ))}
      </div>

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
                        <Link to="/super-admin/tickets" className="text-rose-600 font-bold hover:underline">{s.openTickets}</Link>
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
