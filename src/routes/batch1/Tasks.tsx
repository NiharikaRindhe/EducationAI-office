import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Check, Clock, PlayCircle, AlertCircle, ArrowRight } from 'lucide-react';

export const Batch1Tasks: React.FC = () => {
  const { assignedTasks, cycleTaskStatus, studentXP } = useApp();
  const [activeTab, setActiveTab] = useState<'All' | 'Today' | 'Tomorrow' | 'This Week'>('All');

  // Filter tasks for Batch 1 only
  const b1Tasks = assignedTasks.filter(t => t.batchId === 1);

  // Filter by tab
  const filteredTasks = b1Tasks.filter((task) => {
    if (activeTab === 'All') return true;
    return task.dueDate.toLowerCase() === activeTab.toLowerCase();
  });

  // Calculate task counts
  const countCompleted = b1Tasks.filter(t => t.status === 'Completed').length;
  const countInProgress = b1Tasks.filter(t => t.status === 'In Progress').length;
  const countPending = b1Tasks.filter(t => t.status === 'Not Started' || t.status === 'In Review').length;
  const totalXPBonus = b1Tasks.filter(t => t.status === 'Completed').reduce((acc, t) => acc + t.xp, 0);

  // Status styling helpers
  const getStatusPillClass = (status: string) => {
    switch (status) {
      case 'Completed': return 'pill-green';
      case 'In Progress': return 'pill-amber';
      case 'In Review': return 'pill-purple';
      default: return 'pill-slate';
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'border-l-4 border-l-emerald-500';
      case 'In Progress': return 'border-l-4 border-l-amber-500';
      case 'In Review': return 'border-l-4 border-l-purple-500';
      default: return 'border-l-4 border-l-slate-400';
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      {/* Stats summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Completed', val: countCompleted, icon: '✅', color: 'text-emerald-500 bg-emerald-50' },
          { label: 'In Progress', val: countInProgress, icon: '⏳', color: 'text-amber-500 bg-amber-50' },
          { label: 'Pending', val: countPending, icon: '📋', color: 'text-purple-500 bg-purple-50' },
          { label: 'XP Earned', val: `+${totalXPBonus}`, icon: '⚡', color: 'text-indigo-500 bg-indigo-50' }
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

      {/* Week Progress bar */}
      <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-3">
        <div className="flex justify-between items-center text-xs font-bold text-slate-600">
          <span>Weekly Task Progress</span>
          <span>{countCompleted} / {b1Tasks.length} Completed</span>
        </div>
        <div className="progress-bar bg-slate-100 h-3">
          <div 
            className="progress-fill bg-indigo-600" 
            style={{ width: `${(countCompleted / (b1Tasks.length || 1)) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Filter and Tasks Grid */}
      <div className="flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2 select-none">
            {(['All', 'Today', 'Tomorrow', 'This Week'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-5 rounded-full font-sans text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* List of Tasks */}
        <div className="flex flex-col gap-3">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div 
                key={task.id}
                onClick={() => cycleTaskStatus(task.id)}
                className={`bento-card bg-white border border-slate-100 p-5 ${getBorderColor(task.status)} flex items-center justify-between gap-6 card-interactive cursor-pointer`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="badge pill-amber text-[9px] font-black">{task.subject}</span>
                      <span className={`badge ${getStatusPillClass(task.status)} text-[9px] font-bold`}>
                        {task.status}
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-sm text-slate-800 mt-1">
                      {task.title}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-5 select-none font-sans text-[11px] font-bold">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock size={12} />
                    Due {task.dueDate}
                  </span>
                  
                  <div className="flex items-center gap-3">
                    <span className="badge pill-indigo text-[10px] font-black">+{task.xp} XP</span>
                    
                    {/* Action prompt */}
                    <span className="text-amber-500 text-[10px] flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                      Cycle Status
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white border border-slate-100 rounded-3xl flex flex-col items-center gap-3">
              <span className="text-3xl select-none">🎉</span>
              <h4 className="font-display font-bold text-sm text-slate-500">No tasks in this category!</h4>
              <p className="font-sans text-[11px] text-slate-400">All caught up for the selected filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
