import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Users, GraduationCap, UserCheck, UserX } from 'lucide-react';
import { api } from '../../lib/api';

interface StudentRow {
  id: string;
  has_logged_in_ever: boolean;
  student_profiles: { class_num: number } | null;
}
interface TeacherRow {
  id: string;
  has_logged_in_ever: boolean;
}

export const SchoolAdminDashboard: React.FC = () => {
  const [students, setStudents] = useState<StudentRow[] | null>(null);
  const [teachers, setTeachers] = useState<TeacherRow[] | null>(null);

  useEffect(() => {
    void api.get<StudentRow[]>('/school-admin/students').then(setStudents);
    void api.get<TeacherRow[]>('/school-admin/teachers').then(setTeachers);
  }, []);

  if (!students || !teachers) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-rose-400" /></div>;
  }

  const neverLoggedIn = students.filter((s) => !s.has_logged_in_ever).length;
  const batchCounts = [1, 2, 3].map((batch) => {
    const range = batch === 1 ? [1, 4] : batch === 2 ? [5, 8] : [9, 10];
    return students.filter((s) => {
      const c = s.student_profiles?.class_num;
      return c !== undefined && c >= range[0] && c <= range[1];
    }).length;
  });

  // Tailwind can't see dynamically-built class names like `text-${color}-500`
  // at build time, so the icon color class has to be a literal per entry.
  const stats = [
    { label: 'Total Students', value: students.length, icon: Users, colorClass: 'text-rose-500' },
    { label: 'Total Teachers', value: teachers.length, icon: GraduationCap, colorClass: 'text-indigo-500' },
    { label: 'Active Accounts', value: students.length - neverLoggedIn, icon: UserCheck, colorClass: 'text-emerald-500' },
    { label: 'Never Logged In', value: neverLoggedIn, icon: UserX, colorClass: 'text-amber-500' },
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

      <div className="grid grid-cols-3 gap-4">
        {['Batch 1 (Class 1-4)', 'Batch 2 (Class 5-8)', 'Batch 3 (Class 9-10)'].map((label, i) => (
          <div key={label} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-label-caps text-slate-400 block mb-1">{label}</span>
            <span className="font-display font-bold text-xl text-slate-800">{batchCounts[i]} students</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link to="/school-admin/students" className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center"><Users size={18} /></div>
          <div>
            <span className="font-display font-bold text-sm text-slate-800 block">Manage Students</span>
            <span className="text-[10px] text-slate-400">Import CSV, view accounts, download credentials</span>
          </div>
        </Link>
        <Link to="/school-admin/teachers" className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center"><GraduationCap size={18} /></div>
          <div>
            <span className="font-display font-bold text-sm text-slate-800 block">Manage Teachers</span>
            <span className="text-[10px] text-slate-400">Add teachers, assign classes taught</span>
          </div>
        </Link>
      </div>
    </div>
  );
};
