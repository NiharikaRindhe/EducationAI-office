import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Download, BarChart3, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const TeacherReports: React.FC = () => {
  const { studentsList } = useApp();
  const [period, setPeriod] = useState<'Week' | 'Month' | 'Term'>('Term');

  // Heatmap helper color classes
  const getHeatmapColorClass = (score: number) => {
    if (score >= 80) return 'bg-emerald-500 text-white';
    if (score >= 65) return 'bg-amber-400 text-white';
    if (score >= 50) return 'bg-orange-400 text-white';
    return 'bg-rose-500 text-white';
  };

  const subjectTrends = [
    { name: 'English Lit', val: 78, color: 'bg-emerald-500' },
    { name: 'Mathematics', val: 71, color: 'bg-emerald-500' },
    { name: 'Science', val: 74, color: 'bg-emerald-500' },
    { name: 'Social Science', val: 76, color: 'bg-emerald-500' }
  ];

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      
      {/* Period selector header banner */}
      <div className="bg-white border border-slate-100 p-5 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-800">Academic Analytics Reports</h3>
          <p className="font-sans text-xs text-slate-400 font-medium">Export class-wise score heatmaps and evaluation trackers.</p>
        </div>

        {/* Period toggler */}
        <div className="flex bg-slate-100 p-1 rounded-full select-none text-[10px] font-bold">
          {(['Week', 'Month', 'Term'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`py-1.5 px-4 rounded-full transition-all cursor-pointer ${
                period === p ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              This {p}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Class Average', val: '68%', icon: <BarChart3 size={18} />, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
          { label: 'Top Score', val: '92%', icon: <TrendingUp size={18} />, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Tasks Completed', val: '142', icon: <CheckCircle2 size={18} />, color: 'text-sky-600 bg-sky-50 border-sky-100' },
          { label: 'At Risk Students', val: '3', icon: <AlertTriangle size={18} />, color: 'text-rose-600 bg-rose-50 border-rose-100' }
        ].map((card, idx) => (
          <div key={idx} className={`bento-card border p-4 flex items-center justify-between bg-white ${card.color}`}>
            <div>
              <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wide">{card.label}</span>
              <h4 className="font-display font-black text-xl text-slate-800 mt-1">{card.val}</h4>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Heatmap & Sidebars */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Performance Heatmap Table */}
        <div className="col-span-12 lg:col-span-8 bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4 text-left">
          <div className="flex justify-between items-center">
            <span className="font-display font-bold text-sm text-slate-800">Class Performance Heatmap</span>
            
            {/* Heatmap Legend */}
            <div className="flex items-center gap-3 text-[9px] font-bold font-sans text-slate-400">
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-xs"></div> &ge;80%</span>
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-amber-400 rounded-xs"></div> 65-79%</span>
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-orange-400 rounded-xs"></div> 50-64%</span>
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-rose-500 rounded-xs"></div> &lt;50%</span>
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold">
                  <th className="py-2 pb-3 text-left">Pupil</th>
                  <th className="py-2 pb-3">English</th>
                  <th className="py-2 pb-3">Maths</th>
                  <th className="py-2 pb-3">Science</th>
                  <th className="py-2 pb-3">Social Sci</th>
                  <th className="py-2 pb-3">Average</th>
                </tr>
              </thead>
              <tbody className="font-semibold">
                {studentsList.map((stud) => (
                  <tr key={stud.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 text-left font-bold text-slate-800 flex items-center gap-2">
                      <span>{stud.avatar}</span>
                      <span>{stud.name}</span>
                    </td>
                    <td className="py-3"><span className={`p-1 px-2.5 rounded-lg font-bold ${getHeatmapColorClass(stud.subjectScores.English)}`}>{stud.subjectScores.English}%</span></td>
                    <td className="py-3"><span className={`p-1 px-2.5 rounded-lg font-bold ${getHeatmapColorClass(stud.subjectScores.Maths)}`}>{stud.subjectScores.Maths}%</span></td>
                    <td className="py-3"><span className={`p-1 px-2.5 rounded-lg font-bold ${getHeatmapColorClass(stud.subjectScores.Science)}`}>{stud.subjectScores.Science}%</span></td>
                    <td className="py-3"><span className={`p-1 px-2.5 rounded-lg font-bold ${getHeatmapColorClass(stud.subjectScores.SocialSci)}`}>{stud.subjectScores.SocialSci}%</span></td>
                    <td className="py-3"><span className={`p-1 px-2.5 rounded-lg font-black bg-slate-100 text-slate-800`}>{stud.avgScore}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: Trends & Exports */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          
          {/* Subject Trends */}
          <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4 text-left">
            <span className="font-display font-bold text-xs text-slate-700">Subject Trends</span>
            <div className="flex flex-col gap-3">
              {subjectTrends.map((sub, idx) => (
                <div key={idx} className="flex flex-col gap-1.5">
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

          {/* Export Panel */}
          <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4 text-left">
            <span className="font-display font-bold text-xs text-slate-700">Export Class Reports</span>
            <div className="flex flex-col gap-2.5 font-sans text-xs">
              {[
                { name: 'Full Class Report (PDF)' },
                { name: 'At-Risk Students (CSV)' },
                { name: 'Subject Analysis (PDF)' },
                { name: 'Parent Report Cards (PDF)' }
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => alert(`Exporting ${item.name} file...`)}
                  className="w-full p-3 bg-slate-50 border border-slate-100 hover:border-indigo-400 rounded-xl flex justify-between items-center font-bold text-slate-600 hover:text-indigo-600 transition-all cursor-pointer group"
                >
                  <span>{item.name}</span>
                  <Download size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
