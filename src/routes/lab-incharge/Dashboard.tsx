import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, AlertCircle, Radio } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

interface ActiveSession {
  id: string;
  class_num: number;
  section: string;
  subject: string | null;
  started_at: string;
  teacher_profiles: { user_profiles: { full_name: string } | { full_name: string }[] } | null;
}

interface SectionRow {
  class_num: number;
  section_label: string;
  studentCount: number;
}

const teacherName = (s: ActiveSession): string => {
  const up = s.teacher_profiles?.user_profiles;
  if (!up) return 'Unknown';
  return Array.isArray(up) ? (up[0]?.full_name ?? 'Unknown') : up.full_name;
};

export const LabInchargeDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<ActiveSession[] | null>(null);
  const [sections, setSections] = useState<SectionRow[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [sessionList, sectionList] = await Promise.all([
        api.get<ActiveSession[]>('/lab-incharge/sessions/active'),
        api.get<SectionRow[]>('/lab-incharge/class-sections'),
      ]);
      setSessions(sessionList);
      setSections(sectionList);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load dashboard');
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 20_000);
    return () => window.clearInterval(interval);
  }, [load]);

  const totalStudents = (sections ?? []).reduce((sum, s) => sum + s.studentCount, 0);

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-3xl p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Live Right Now</span>
            <h4 className="font-display font-black text-2xl text-slate-800 mt-1">{sessions?.length ?? '—'}</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center"><Radio size={18} /></div>
        </div>
        <div className="bg-white border border-slate-100 rounded-3xl p-5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sections</span>
          <h4 className="font-display font-black text-2xl text-slate-800 mt-1">{sections?.length ?? '—'}</h4>
        </div>
        <div className="bg-white border border-slate-100 rounded-3xl p-5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Students</span>
          <h4 className="font-display font-black text-2xl text-slate-800 mt-1">{totalStudents}</h4>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <h2 className="font-display font-bold text-lg text-slate-800 mb-4">Live Sessions</h2>
        {sessions === null ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-teal-400" /></div>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            No class is live right now — Batch 1 (Class 1–4) students can only log in with their PIN while a session is active for their section.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {sessions.map((s) => (
              <div key={s.id} className="border border-teal-100 bg-teal-50/40 rounded-2xl p-4 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="font-display font-bold text-slate-800">Class {s.class_num}-{s.section}</span>
                </div>
                <span className="text-[11px] text-slate-500">{s.subject ?? 'No subject set'} · {teacherName(s)}</span>
                <span className="text-[10px] text-slate-400">
                  Since {new Date(s.started_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
