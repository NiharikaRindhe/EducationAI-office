import React, { useEffect, useState } from 'react';
import { Loader2, Download, Printer, BarChart3, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';

interface Section {
  id: string;
  class_num: number;
  section_name: string;
}

interface HeatmapStudent {
  name: string;
  avatar: string;
  scores: Record<string, number | null>;
  avg: number;
}

interface HeatmapExam {
  id: string;
  title: string;
  subject: string;
}

interface HeatmapReport {
  students: HeatmapStudent[];
  exams: HeatmapExam[];
}

interface EnglishStudent {
  name: string;
  avatar: string;
  accuracy: number;
  fluency: number;
  wpm: number;
  needsAttention: boolean;
}

interface EnglishReport {
  students: EnglishStudent[];
  classAvg: {
    accuracy: number;
    fluency: number;
    wpm: number;
  };
}

interface TaskInfo {
  id: string;
  title: string;
}

interface TaskReport {
  students: { id: string; name: string; avatar: string }[];
  tasks: TaskInfo[];
  matrix: Record<string, Record<string, 'completed' | 'in_progress' | 'not_started'>>;
}

export const TeacherReports: React.FC = () => {
  const [sections, setSections] = useState<Section[] | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'heatmap' | 'english' | 'tasks'>('heatmap');

  const [heatmapData, setHeatmapData] = useState<HeatmapReport | null>(null);
  const [englishData, setEnglishData] = useState<EnglishReport | null>(null);
  const [taskData, setTaskData] = useState<TaskReport | null>(null);

  const [loading, setLoading] = useState(false);

  // Load sections on mount
  useEffect(() => {
    api.get<Section[]>('/teacher/my-sections')
      .then(res => {
        setSections(res);
        if (res.length > 0) {
          setSelectedSection(res[0]!.id);
        }
      })
      .catch(() => setSections([]));
  }, []);

  // Fetch report data when section or tab changes
  useEffect(() => {
    if (!selectedSection) return;

    setLoading(true);
    if (activeTab === 'heatmap') {
      api.get<HeatmapReport>('/teacher/reports/heatmap', { sectionId: selectedSection })
        .then(setHeatmapData)
        .catch(() => setHeatmapData(null))
        .finally(() => setLoading(false));
    } else if (activeTab === 'english') {
      api.get<EnglishReport>('/teacher/reports/english', { sectionId: selectedSection })
        .then(setEnglishData)
        .catch(() => setEnglishData(null))
        .finally(() => setLoading(false));
    } else if (activeTab === 'tasks') {
      api.get<TaskReport>('/teacher/reports/tasks', { sectionId: selectedSection })
        .then(setTaskData)
        .catch(() => setTaskData(null))
        .finally(() => setLoading(false));
    }
  }, [selectedSection, activeTab]);

  const handlePrint = () => {
    window.print();
  };

  const getHeatmapColorClass = (score: number | null) => {
    if (score === null || score === undefined) return 'bg-slate-100 text-slate-400';
    if (score >= 80) return 'bg-emerald-500 text-white';
    if (score >= 65) return 'bg-amber-400 text-white';
    if (score >= 50) return 'bg-orange-400 text-white';
    return 'bg-rose-500 text-white';
  };

  const getThresholdIcon = (pct: number) => {
    if (pct >= 80) return <span className="text-emerald-500">🟢</span>;
    if (pct >= 50) return <span className="text-amber-500">🟡</span>;
    return <span className="text-rose-500">🔴</span>;
  };

  const getTaskStatusLabel = (status?: string) => {
    if (status === 'completed') return <span className="text-emerald-600 font-bold">✓</span>;
    if (status === 'in_progress') return <span className="text-amber-600 font-bold">⋯</span>;
    return <span className="text-slate-300">✗</span>;
  };

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      {/* Print stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-card { border: none !important; box-shadow: none !important; padding: 0 !important; }
        }
      ` }} />

      {/* Header Banner */}
      <div className="bg-white border border-slate-100 p-5 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs no-print">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-800">Academic Analytics Reports</h3>
          <p className="font-sans text-xs text-slate-400 font-medium">Class-wise score matrices, language diagnostics, and homework trackers.</p>
        </div>

        {/* Section Picker */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500">Class Section:</span>
          {sections === null ? (
            <Loader2 size={14} className="animate-spin text-indigo-600" />
          ) : (
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-sans text-xs font-bold outline-none cursor-pointer text-slate-700"
            >
              {sections.length === 0 ? (
                <option value="">No sections mapped</option>
              ) : (
                sections.map(s => (
                  <option key={s.id} value={s.id}>Class {s.class_num}-{s.section_name}</option>
                ))
              )}
            </select>
          )}
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-100 pb-3 gap-4 no-print">
        {[
          { id: 'heatmap', label: 'Performance Heatmap' },
          { id: 'english', label: 'English Assessments' },
          { id: 'tasks', label: 'Task Matrix' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 px-5 rounded-full font-sans text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}

        <div className="ml-auto flex gap-2">
          <button
            onClick={handlePrint}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <Printer size={14} /> Print Report
          </button>
          <a
            href={`${import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'}/teacher/reports/${activeTab}?sectionId=${selectedSection}&format=csv`}
            download
            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <Download size={14} /> Export CSV
          </a>
        </div>
      </div>

      {/* Content wrapper */}
      <div className="print-card">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
        ) : !selectedSection ? (
          <div className="text-center py-16 text-slate-400 font-semibold">Select a section from the dropdown above to generate reports.</div>
        ) : (
          <>
            {/* TAB 1: HEATMAP */}
            {activeTab === 'heatmap' && heatmapData && (
              <div className="col-span-12 bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4 text-left">
                <div className="flex justify-between items-center no-print">
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
                        <th className="py-2 pb-3 text-left">Student</th>
                        {heatmapData.exams.map(ex => (
                          <th key={ex.id} className="py-2 pb-3 truncate max-w-[120px]" title={`${ex.title} (${ex.subject})`}>
                            {ex.title}
                          </th>
                        ))}
                        <th className="py-2 pb-3">Average</th>
                      </tr>
                    </thead>
                    <tbody className="font-semibold">
                      {heatmapData.students.map((stud, sIdx) => (
                        <tr key={sIdx} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="py-3 text-left font-bold text-slate-800 flex items-center gap-2">
                            <span>{stud.avatar || '🦊'}</span>
                            <span>{stud.name}</span>
                          </td>
                          {heatmapData.exams.map(ex => {
                            const score = stud.scores[ex.id];
                            return (
                              <td key={ex.id} className="py-3">
                                <span className={`p-1 px-2.5 rounded-lg font-bold ${getHeatmapColorClass(score)}`}>
                                  {score !== null ? `${Math.round(score)}%` : '—'}
                                </span>
                              </td>
                            );
                          })}
                          <td className="py-3">
                            <span className="p-1 px-2.5 rounded-lg font-black bg-slate-100 text-slate-800">
                              {Math.round(stud.avg)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: ENGLISH */}
            {activeTab === 'english' && englishData && (
              <div className="flex flex-col gap-6 text-left">
                <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
                  <span className="font-display font-bold text-sm text-slate-800">English Assessment Diagnostics</span>
                  
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold">
                          <th className="py-2 pb-3">Student</th>
                          <th className="py-2 pb-3 text-center">Accuracy</th>
                          <th className="py-2 pb-3 text-center">Fluency</th>
                          <th className="py-2 pb-3 text-center">WPM</th>
                          <th className="py-2 pb-3 text-center">Risk status</th>
                        </tr>
                      </thead>
                      <tbody className="font-semibold">
                        {englishData.students.map((stud, sIdx) => (
                          <tr key={sIdx} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="py-3 font-bold text-slate-800 flex items-center gap-2">
                              <span>{stud.avatar || '🦊'}</span>
                              <span>{stud.name}</span>
                            </td>
                            <td className="py-3 text-center">
                              <span className="flex items-center justify-center gap-1.5">
                                {getThresholdIcon(stud.accuracy)} {Math.round(stud.accuracy)}%
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <span className="flex items-center justify-center gap-1.5">
                                {getThresholdIcon(stud.fluency)} {Math.round(stud.fluency)}%
                              </span>
                            </td>
                            <td className="py-3 text-center text-slate-600">{stud.wpm} WPM</td>
                            <td className="py-3 text-center">
                              {stud.needsAttention ? (
                                <span className="badge pill-rose text-[9px] font-black uppercase">Needs Attention</span>
                              ) : (
                                <span className="badge pill-green text-[9px] font-bold">On Track</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {/* Class averages row */}
                        <tr className="bg-slate-50 font-black text-slate-800 border-t border-slate-200">
                          <td className="py-3 pl-3">Class Average</td>
                          <td className="py-3 text-center">{Math.round(englishData.classAvg.accuracy)}%</td>
                          <td className="py-3 text-center">{Math.round(englishData.classAvg.fluency)}%</td>
                          <td className="py-3 text-center">{englishData.classAvg.wpm} WPM</td>
                          <td className="py-3"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Needs Attention callout list */}
                {englishData.students.some(s => s.needsAttention) && (
                  <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 flex flex-col gap-3">
                    <h4 className="font-display font-bold text-xs text-rose-800 flex items-center gap-1.5">
                      <AlertTriangle size={15} /> Students flagged for speech/speaking revision
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {englishData.students.filter(s => s.needsAttention).map((stud, idx) => (
                        <div key={idx} className="bg-white border border-rose-100 p-3 rounded-2xl flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span className="flex items-center gap-2">
                            <span>{stud.avatar || '🦊'}</span>
                            <span>{stud.name}</span>
                          </span>
                          <span className="text-[10px] text-rose-600">Acc: {Math.round(stud.accuracy)}% · {stud.wpm} WPM</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TASKS */}
            {activeTab === 'tasks' && taskData && (
              <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4 text-left">
                <div className="flex justify-between items-center no-print">
                  <span className="font-display font-bold text-sm text-slate-800">Task Completion Matrix</span>
                  <div className="flex items-center gap-3 text-[9px] font-bold font-sans text-slate-400">
                    <span className="flex items-center gap-1">✓ Completed</span>
                    <span className="flex items-center gap-1">⋯ In Progress</span>
                    <span className="flex items-center gap-1">✗ Not Started / Overdue</span>
                  </div>
                </div>

                {taskData.tasks.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No tasks assigned to this section yet.</p>
                ) : (
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-center border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold">
                          <th className="py-2 pb-3 text-left">Student</th>
                          {taskData.tasks.map(t => (
                            <th key={t.id} className="py-2 pb-3 truncate max-w-[120px]" title={t.title}>
                              {t.title}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="font-semibold">
                        {taskData.students.map((stud) => (
                          <tr key={stud.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="py-3 text-left font-bold text-slate-800 flex items-center gap-2">
                              <span>{stud.avatar || '🦊'}</span>
                              <span>{stud.name}</span>
                            </td>
                            {taskData.tasks.map(t => (
                              <td key={t.id} className="py-3 text-base">
                                {getTaskStatusLabel(taskData.matrix[stud.id]?.[t.id])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
