import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Users, CheckSquare, BarChart3, ClipboardList, AlertCircle, ArrowRight, Activity, Plus } from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { studentsList, assignedTasks } = useApp();

  // Get at-risk students
  const atRiskStudents = studentsList.filter(s => s.isAtRisk);

  // Subjects statistics
  const subjectAverages = [
    { name: 'English Lit', val: 78, color: 'bg-indigo-600' },
    { name: 'Mathematics', val: 71, color: 'bg-indigo-600' },
    { name: 'Science', val: 74, color: 'bg-indigo-600' },
    { name: 'Social Science', val: 76, color: 'bg-indigo-600' }
  ];

  return (
    <div className="grid grid-cols-12 gap-6 select-none anim-fade-up">
      {/* 4 Stat Cards */}
      <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', val: '101', icon: <Users size={20} />, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
          { label: 'Active Today', val: '82', icon: <Activity size={20} />, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Class Average', val: '71%', icon: <BarChart3 size={20} />, color: 'text-sky-600 bg-sky-50 border-sky-100' },
          { label: 'Tasks Assigned', val: assignedTasks.length.toString(), icon: <ClipboardList size={20} />, color: 'text-amber-600 bg-amber-50 border-amber-100' }
        ].map((card, idx) => (
          <div key={idx} className={`bento-card border p-5 flex items-center justify-between bg-white ${card.color}`}>
            <div>
              <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wide">{card.label}</span>
              <h4 className="font-display font-black text-2xl text-slate-800 mt-1">{card.val}</h4>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Left Column: class overview & at risk panel */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
        
        {/* Class Overview Table */}
        <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center select-none">
            <span className="font-display font-bold text-sm text-slate-800">Class Grade Summary</span>
            <Link to="/teacher/students" className="text-xs font-bold text-indigo-600 hover:underline">
              See All Students
            </Link>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold">
                  <th className="py-2 pb-3">Class Cohort</th>
                  <th className="py-2 pb-3">Students</th>
                  <th className="py-2 pb-3">Active Today</th>
                  <th className="py-2 pb-3">Avg Score</th>
                  <th className="py-2 pb-3">Avg Streak</th>
                </tr>
              </thead>
              <tbody className="font-medium text-slate-600">
                {[
                  { name: 'Class 3-A (Batch 1)', count: 28, active: 80, score: 78, streak: 12 },
                  { name: 'Class 7-A (Batch 2)', count: 24, active: 75, score: 71, streak: 8 },
                  { name: 'Class 9-C (Batch 3)', count: 25, active: 88, score: 84, streak: 18 },
                  { name: 'Class 12-A (Batch 4)', count: 24, active: 92, score: 80, streak: 22 }
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 font-bold text-slate-800">{row.name}</td>
                    <td className="py-3">{row.count} Pupils</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="progress-bar w-16 h-1.5 bg-slate-100">
                          <div className="progress-fill bg-indigo-600" style={{ width: `${row.active}%` }}></div>
                        </div>
                        <span>{row.active}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`badge ${row.score >= 75 ? 'pill-green' : 'pill-amber'} text-[9px] font-bold`}>
                        {row.score}%
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-slate-700">{row.streak} Days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* At-Risk panel */}
        <div className="bento-card border border-red-100 bg-white p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center select-none">
            <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center font-display font-bold text-[10px]">
                {atRiskStudents.length}
              </span>
              Students Falling Behind
            </h3>
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider font-label-caps">
              ⚠️ Attention Needed
            </span>
          </div>

          <div className="flex flex-col gap-3 font-sans text-xs">
            {atRiskStudents.map((stud) => (
              <div 
                key={stud.id}
                className="p-3.5 bg-red-50/30 border border-red-100/50 rounded-2xl flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl bg-white w-10 h-10 rounded-xl flex items-center justify-center border border-slate-100 select-none">
                    {stud.avatar}
                  </span>
                  <div>
                    <span className="font-bold text-slate-800 block">{stud.name}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Class {stud.classNum}-{stud.section} · Last Active: {stud.lastActive}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 select-none">
                  <span className="badge pill-rose font-bold">
                    Reason: {stud.riskReason} (Score: {stud.avgScore}%)
                  </span>
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
        </div>
      </div>

      {/* Right Column: Quick Actions & subject averages */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        
        {/* Quick Actions Sidebar */}
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

        {/* Avg by Subject */}
        <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4 text-left">
          <span className="font-display font-bold text-xs text-slate-700">Syllabus Average by Subject</span>
          
          <div className="flex flex-col gap-3.5">
            {subjectAverages.map((sub, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                  <span>{sub.name}</span>
                  <span>{sub.val}%</span>
                </div>
                <div className="progress-bar h-1.5">
                  <div className={`progress-fill ${sub.color}`} style={{ width: `${sub.val}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
