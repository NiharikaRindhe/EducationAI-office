import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Users, GraduationCap, LayoutGrid, Radio, AlertCircle, ArrowRight, Cast } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

interface StudentRow {
  id: string;
  has_logged_in_ever: boolean;
  student_profiles: { class_num: number; section: string } | { class_num: number; section: string }[] | null;
}

interface TeacherRow {
  id: string;
  full_name: string;
  is_active: boolean;
}

interface SectionRow {
  id: string;
  class_num: number;
  section_label: string;
  classTeacherName: string | null;
  studentCount: number;
  is_active: boolean;
}

interface AssignmentRow {
  id: string;
  teacher_id: string;
  class_section_id: string;
  subject: string;
}

interface Activity {
  activeNow: { userId: string; fullName: string; role: string; lastSeenAt: string }[];
  todayLoginCount: number;
  liveSessions: { id: string; classNum: number; section: string; subject: string | null; startedAt: string; teacherName: string | null }[];
}

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs} h ago`;
}

export const SchoolAdminDashboard: React.FC = () => {
  const [students, setStudents] = useState<StudentRow[] | null>(null);
  const [teachers, setTeachers] = useState<TeacherRow[] | null>(null);
  const [sections, setSections] = useState<SectionRow[] | null>(null);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<StudentRow[]>('/school-admin/students'),
      api.get<TeacherRow[]>('/school-admin/teachers'),
      api.get<SectionRow[]>('/school-admin/class-sections'),
      api.get<AssignmentRow[]>('/school-admin/teaching-assignments'),
      api.get<Activity>('/school-admin/activity'),
    ])
      .then(([st, te, se, asgn, act]) => {
        setStudents(st);
        setTeachers(te);
        setSections(se);
        setAssignments(asgn);
        setActivity(act);
      })
      .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Failed to load dashboard'));
  }, []);

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
        <AlertCircle size={15} /> {error}
      </div>
    );
  }

  if (!students || !teachers || !sections || !activity) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400" /></div>;
  }

  const teacherNameById = new Map(teachers.map((t) => [t.id, t.full_name]));
  const subjectTeachersBySection = new Map<string, { subject: string; teacher: string }[]>();
  for (const a of assignments) {
    const list = subjectTeachersBySection.get(a.class_section_id) ?? [];
    list.push({ subject: a.subject, teacher: teacherNameById.get(a.teacher_id) ?? '—' });
    subjectTeachersBySection.set(a.class_section_id, list);
  }

  const activeSections = sections.filter((s) => s.is_active);
  const neverLoggedIn = students.filter((s) => !s.has_logged_in_ever).length;

  const stats = [
    { label: 'Total Students', value: students.length, sub: `${neverLoggedIn} never logged in`, icon: Users },
    { label: 'Total Teachers', value: teachers.length, sub: `${teachers.filter((t) => t.is_active).length} active`, icon: GraduationCap },
    { label: 'Sections', value: activeSections.length, sub: `across ${new Set(activeSections.map((s) => s.class_num)).size} classes`, icon: LayoutGrid },
    { label: 'Active Right Now', value: activity.activeNow.length, sub: `${activity.todayLoginCount} logins today`, icon: Radio },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl shadow-sm px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-slate-500">{s.label}</span>
              <s.icon size={16} className="text-slate-400" />
            </div>
            <span className="block text-2xl font-semibold text-slate-900 mt-1.5 tabular-nums">{s.value}</span>
            <span className="block text-[12px] text-slate-400 mt-0.5">{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5 items-start">
        {/* Sections table */}
        <div className="col-span-12 xl:col-span-8">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-[14px] font-semibold text-slate-800">Sections &amp; staffing</h2>
                <p className="text-[12px] text-slate-400 mt-0.5">Students and assigned teachers per section</p>
              </div>
              <Link to="/school-admin/classes" className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                Manage <ArrowRight size={13} />
              </Link>
            </div>

            {activeSections.length === 0 ? (
              <p className="text-[13px] text-slate-400 text-center py-12">No sections yet — set them up under Classes &amp; Sections.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      {['Section', 'Students', 'Class Teacher', 'Subject Teachers'].map((h) => (
                        <th key={h} className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeSections.map((s) => {
                      const staff = subjectTeachersBySection.get(s.id) ?? [];
                      return (
                        <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 text-[13px] font-semibold text-slate-800 whitespace-nowrap">Class {s.class_num} · {s.section_label}</td>
                          <td className="px-4 py-3 text-[13px] text-slate-700 tabular-nums">{s.studentCount}</td>
                          <td className="px-4 py-3 text-[13px] whitespace-nowrap">
                            {s.classTeacherName ?? <span className="text-amber-600 text-[12px] font-medium">Not assigned</span>}
                          </td>
                          <td className="px-4 py-3">
                            {staff.length === 0 ? (
                              <span className="text-[12px] text-slate-400">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {staff.map((st, i) => (
                                  <span key={i} className="inline-flex text-[11px] text-slate-600 bg-slate-100 rounded-md px-2 py-0.5" title={st.teacher}>
                                    {st.subject}: <span className="font-medium ml-1">{st.teacher}</span>
                                  </span>
                                ))}
                              </div>
                            )}
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

        {/* Activity panel */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-5">
          {/* Live sessions */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Cast size={15} className="text-slate-400" />
              <h2 className="text-[14px] font-semibold text-slate-800">Live class sessions</h2>
              {activity.liveSessions.length > 0 && (
                <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {activity.liveSessions.length} running
                </span>
              )}
            </div>
            <div className="p-4">
              {activity.liveSessions.length === 0 ? (
                <p className="text-[13px] text-slate-400 text-center py-4">No sessions running right now.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {activity.liveSessions.map((ls) => (
                    <div key={ls.id} className="flex items-center justify-between gap-3 border border-slate-100 rounded-lg px-3.5 py-2.5">
                      <div>
                        <span className="block text-[13px] font-semibold text-slate-800">
                          Class {ls.classNum}-{ls.section}{ls.subject ? ` · ${ls.subject}` : ''}
                        </span>
                        <span className="block text-[12px] text-slate-400">{ls.teacherName ?? 'Unknown teacher'} · started {timeAgo(ls.startedAt)}</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active users */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-[14px] font-semibold text-slate-800">Active in the last 15 minutes</h2>
            </div>
            <div className="p-4">
              {activity.activeNow.length === 0 ? (
                <p className="text-[13px] text-slate-400 text-center py-4">Nobody online right now.</p>
              ) : (
                <div className="flex flex-col">
                  {activity.activeNow.slice(0, 8).map((u) => (
                    <div key={u.userId} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div className="min-w-0">
                        <span className="block text-[13px] text-slate-700 truncate">{u.fullName}</span>
                        <span className="block text-[11px] text-slate-400 capitalize">{u.role.replace('_', ' ')}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">{timeAgo(u.lastSeenAt)}</span>
                    </div>
                  ))}
                  {activity.activeNow.length > 8 && (
                    <span className="text-[12px] text-slate-400 pt-2">+ {activity.activeNow.length - 8} more</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-2">
            {[
              { to: '/school-admin/students', label: 'Manage students', desc: 'Import, credentials, resets' },
              { to: '/school-admin/teachers', label: 'Manage teachers', desc: 'Accounts and passwords' },
              { to: '/school-admin/classes', label: 'Classes & sections', desc: 'Sections, class teachers, subjects' },
              { to: '/school-admin/tickets', label: 'Support tickets', desc: 'Reported issues' },
            ].map((l) => (
              <Link key={l.to} to={l.to} className="flex items-center justify-between px-3.5 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group">
                <div>
                  <span className="block text-[13px] font-medium text-slate-700">{l.label}</span>
                  <span className="block text-[12px] text-slate-400">{l.desc}</span>
                </div>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
