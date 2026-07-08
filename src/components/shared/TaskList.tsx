import React, { useEffect, useState, useCallback } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

type Accent = 'amber' | 'indigo' | 'sky';

const ACCENT = {
  amber: { spinner: 'text-amber-400', fill: 'bg-amber-500', subjectPill: 'pill-amber' },
  indigo: { spinner: 'text-indigo-400', fill: 'bg-indigo-600', subjectPill: 'pill-indigo' },
  sky: { spinner: 'text-sky-400', fill: 'bg-sky-500', subjectPill: 'pill-sky' },
} as const;

type Status = 'not_started' | 'in_progress' | 'in_review' | 'completed';

interface TaskAssignment {
  id: string;
  status: Status;
  xp_awarded: number;
  completed_at: string | null;
  tasks: { id: string; title: string; subject: string; task_type: string; instructions: string | null; xp_reward: number; due_date: string | null };
}

const STATUS_LABEL: Record<Status, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  in_review: 'In Review',
  completed: 'Completed',
};

const STATUS_PILL: Record<Status, string> = {
  not_started: 'pill-slate',
  in_progress: 'pill-amber',
  in_review: 'pill-purple',
  completed: 'pill-green',
};

const STATUS_BORDER: Record<Status, string> = {
  not_started: 'border-l-4 border-l-slate-400',
  in_progress: 'border-l-4 border-l-amber-500',
  in_review: 'border-l-4 border-l-purple-500',
  completed: 'border-l-4 border-l-emerald-500',
};

export const TaskList: React.FC<{ accent: Accent }> = ({ accent }) => {
  const a = ACCENT[accent];
  const [assignments, setAssignments] = useState<TaskAssignment[] | null>(null);

  const loadTasks = useCallback(async () => {
    setAssignments(await api.get<TaskAssignment[]>('/student/tasks'));
  }, []);

  useEffect(() => { void loadTasks(); }, [loadTasks]);

  const handleCycle = async (id: string) => {
    await api.patch(`/student/tasks/${id}/status`, {});
    await loadTasks();
  };

  if (!assignments) {
    return <div className="flex justify-center py-16"><Loader2 className={`animate-spin ${a.spinner}`} /></div>;
  }

  const countCompleted = assignments.filter((a) => a.status === 'completed').length;
  const countInProgress = assignments.filter((a) => a.status === 'in_progress').length;
  const countPending = assignments.filter((a) => a.status === 'not_started' || a.status === 'in_review').length;
  const totalXPBonus = assignments.filter((a) => a.status === 'completed').reduce((acc, a) => acc + a.xp_awarded, 0);

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Completed', val: countCompleted, icon: '✅', color: 'text-emerald-500 bg-emerald-50' },
          { label: 'In Progress', val: countInProgress, icon: '⏳', color: 'text-amber-500 bg-amber-50' },
          { label: 'Pending', val: countPending, icon: '📋', color: 'text-purple-500 bg-purple-50' },
          { label: 'XP Earned', val: `+${totalXPBonus}`, icon: '⚡', color: 'text-indigo-500 bg-indigo-50' },
        ].map((stat, idx) => (
          <div key={idx} className="bento-card border border-slate-100 bg-white p-4 flex items-center justify-between">
            <div>
              <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wide">{stat.label}</span>
              <h4 className="font-display font-black text-2xl text-slate-800 mt-1">{stat.val}</h4>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${stat.color}`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-3">
        <div className="flex justify-between items-center text-xs font-bold text-slate-600">
          <span>Task Progress</span>
          <span>{countCompleted} / {assignments.length} Completed</span>
        </div>
        <div className="progress-bar bg-slate-100 h-3">
          <div className={`progress-fill ${a.fill}`} style={{ width: `${(countCompleted / (assignments.length || 1)) * 100}%` }}></div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {assignments.length > 0 ? (
          assignments.map((assignment) => (
            <div
              key={assignment.id}
              onClick={() => void handleCycle(assignment.id)}
              className={`bento-card bg-white border border-slate-100 p-5 ${STATUS_BORDER[assignment.status]} flex items-center justify-between gap-6 card-interactive cursor-pointer`}
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${a.subjectPill} text-[9px] font-black`}>{assignment.tasks.subject}</span>
                    <span className={`badge ${STATUS_PILL[assignment.status]} text-[9px] font-bold`}>{STATUS_LABEL[assignment.status]}</span>
                  </div>
                  <h4 className="font-display font-bold text-sm text-slate-800 mt-1">{assignment.tasks.title}</h4>
                </div>
              </div>

              <div className="flex items-center gap-5 select-none font-sans text-[11px] font-bold">
                {assignment.tasks.due_date && (
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock size={12} /> Due {assignment.tasks.due_date}
                  </span>
                )}
                <span className="badge pill-indigo text-[10px] font-black">+{assignment.tasks.xp_reward} XP</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white border border-slate-100 rounded-3xl flex flex-col items-center gap-3">
            <span className="text-3xl select-none">🎉</span>
            <h4 className="font-display font-bold text-sm text-slate-500">No tasks assigned yet!</h4>
            <p className="font-sans text-[11px] text-slate-400">Your teacher hasn't assigned anything yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
