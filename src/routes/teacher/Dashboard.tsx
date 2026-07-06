import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, BarChart3, ClipboardList, Activity, Plus, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

interface DashboardStats {
  classesTaught: number[];
  totalStudents: number;
  tasksAssigned: number;
  examsCreated: number;
}

interface AtRiskStudent {
  id: string;
  fullName: string;
  classInfo: { class_num: number; section: string; streak: number; xp: number };
  risks: { type: string; label: string }[];
}

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [atRisk, setAtRisk] = useState<AtRiskStudent[] | null>(null);

  useEffect(() => {
    void api.get<DashboardStats>('/teacher/dashboard').then(setStats);
    void api.get<AtRiskStudent[]>('/teacher/at-risk').then(setAtRisk);
  }, []);

  const isLoading = !stats || !atRisk;

  return (
    <div className="grid grid-cols-12 gap-6 select-none anim-fade-up">
      {/* 4 Stat Cards */}
      <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'My Students', val: stats?.totalStudents.toString() ?? '—', icon: <Users size={20} />, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
          { label: 'Classes Taught', val: stats?.classesTaught.join(', ') || '—', icon: <Activity size={20} />, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Exams Created', val: stats?.examsCreated.toString() ?? '—', icon: <BarChart3 size={20} />, color: 'text-sky-600 bg-sky-50 border-sky-100' },
          { label: 'Tasks Assigned', val: stats?.tasksAssigned.toString() ?? '—', icon: <ClipboardList size={20} />, color: 'text-amber-600 bg-amber-50 border-amber-100' }
        ].map((card, idx) => (
          <div key={idx} className={`bento-card border p-5 flex items-center justify-between bg-white ${card.color}`}>
            <div>
              <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wide">{card.label}</span>
              <h4 className="font-display font-black text-2xl text-slate-800 mt-1">{isLoading ? '…' : card.val}</h4>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Left Column: at risk panel */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
        <div className="bento-card border border-red-100 bg-white p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center select-none">
            <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center font-display font-bold text-[10px]">
                {atRisk?.length ?? 0}
              </span>
              Students Falling Behind
            </h3>
            <Link to="/teacher/students" className="text-xs font-bold text-indigo-600 hover:underline">
              See All Students
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300" /></div>
          ) : atRisk.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No students flagged right now — nice work.</p>
          ) : (
            <div className="flex flex-col gap-3 font-sans text-xs">
              {atRisk.map((stud) => (
                <div key={stud.id} className="p-3.5 bg-red-50/30 border border-red-100/50 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl bg-white w-10 h-10 rounded-xl flex items-center justify-center border border-slate-100 select-none">
                      ⚠️
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 block">{stud.fullName}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Class {stud.classInfo.class_num}-{stud.classInfo.section} · Streak: {stud.classInfo.streak}d
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 select-none">
                    <span className="badge pill-rose font-bold">{stud.risks.map((r) => r.label).join(' · ')}</span>
                    <button
                      onClick={() => navigate('/teacher/assign-tasks')}
                      className="py-1 px-3 bg-red-600 hover:bg-red-700 text-white font-sans font-bold text-[10px] rounded-lg shadow-xs cursor-pointer transition-all"
                    >
                      Assign Task
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Quick Actions */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4 text-left">
          <span className="font-display font-bold text-xs text-slate-700">Quick Actions</span>

          <div className="flex flex-col gap-3 select-none">
            <Link
              to="/teacher/assign-tasks"
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs text-center shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus size={14} />
              Assign New Task
            </Link>
            <Link
              to="/teacher/create-exam"
              className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-sans font-bold text-xs text-center transition-all"
            >
              Create Mock Exam
            </Link>
            <Link
              to="/teacher/reports"
              className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-sans font-bold text-xs text-center transition-all"
            >
              View Class Reports
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
