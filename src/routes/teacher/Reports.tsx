import React, { useEffect, useState } from 'react';
import { Loader2, Printer, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';

/**
 * A section as `/teacher/my-sections` actually returns it.
 *
 * This page previously declared `{ id, class_num, section_name }` and typed the
 * whole response as an array. The endpoint returns an OBJECT
 * (`{ sections, legacyFallback, subjectsByClass }`) whose entries are keyed
 * `classSectionId` / `classNum` / `section` — so `res.length` was undefined, no
 * section was ever selected, and no report could load at all.
 */
interface TeachingSection {
  classSectionId: string;
  classNum: number;
  section: string;
  subjects: string[];
  isClassTeacher: boolean;
}

interface MySectionsResponse {
  sections: TeachingSection[];
}

/*
 * The interfaces below mirror what the API RETURNS.
 *
 * They previously described something else entirely — `name` where the API
 * sends `fullName`, `classAvg` where it sends `classAverages`, a keyed object
 * where it sends a flat array of cells. Combined with the wrong endpoint and
 * the wrong response shape from /my-sections, this page could never have
 * rendered a single row against this backend. Verified field-by-field against
 * live responses for Class 7-B.
 */

interface HeatmapStudent {
  id: string;
  fullName: string;
  rollNumber: string | null;
  xp: number;
  averageScorePct: number | null;
}

interface HeatmapExam {
  id: string;
  title: string;
  averageScorePct: number | null;
}

/** One student x one exam. Flat list, not a nested map. */
interface HeatmapCell {
  studentId: string;
  examId: string;
  scorePct: number | null;
  submitted: boolean;
}

interface HeatmapReport {
  students: HeatmapStudent[];
  exams: HeatmapExam[];
  matrix: HeatmapCell[];
}

interface EnglishStudent {
  studentId: string;
  fullName: string;
  rollNumber: string | null;
  avgAccuracy: number | null;
  avgFluency: number | null;
  avgWpm: number | null;
  totalAttempts: number;
  status: string;
}

interface EnglishReport {
  students: EnglishStudent[];
  classAverages: {
    avgAccuracy: number | null;
    avgFluency: number | null;
    avgWpm: number | null;
  };
  needsAttention: EnglishStudent[];
}

interface TaskInfo {
  id: string;
  title: string;
  subject: string;
}

interface TaskStudent {
  id: string;
  fullName: string;
  rollNumber: string | null;
  completedCount: number;
  totalCount: number;
  completionRatePct: number;
}

interface TaskCell {
  studentId: string;
  taskId: string;
  status: 'completed' | 'in_progress' | 'not_started' | 'in_review';
}

interface TaskReport {
  students: TaskStudent[];
  tasks: TaskInfo[];
  matrix: TaskCell[];
}

export const TeacherReports: React.FC = () => {
  const [sections, setSections] = useState<TeachingSection[] | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'heatmap' | 'english' | 'tasks'>('heatmap');

  const [heatmapData, setHeatmapData] = useState<HeatmapReport | null>(null);
  const [englishData, setEnglishData] = useState<EnglishReport | null>(null);
  const [taskData, setTaskData] = useState<TaskReport | null>(null);

  const [loading, setLoading] = useState(false);
  /**
   * Held separately from "no data" on purpose. Every fetch here used to end in
   * `.catch(() => setX(null))`, which renders identically to a section that
   * genuinely has no exams yet — so a 404 looked like an empty class and the
   * page appeared to work while being completely broken.
   */
  const [error, setError] = useState<string | null>(null);

  // Load sections on mount
  useEffect(() => {
    api.get<MySectionsResponse>('/teacher/my-sections')
      .then(res => {
        const list = res.sections ?? [];
        setSections(list);
        if (list.length > 0) setSelectedSection(list[0]!.classSectionId);
      })
      .catch(() => {
        setSections([]);
        setError('Could not load your class sections.');
      });
  }, []);

  // Fetch report data when section or tab changes
  useEffect(() => {
    if (!selectedSection || !sections) return;
    const current = sections.find(s => s.classSectionId === selectedSection);
    if (!current) return;

    // The reports API is keyed by class + section, not by class_section_id.
    const query = { classNum: current.classNum, section: current.section };

    setLoading(true);
    setError(null);

    // NOTE: the endpoint is `/reports/performance`. This page called
    // `/reports/heatmap`, which has never existed, and swallowed the 404.
    const request =
      activeTab === 'heatmap'
        ? api.get<HeatmapReport>('/teacher/reports/performance', query).then(setHeatmapData)
        : activeTab === 'english'
          ? api.get<EnglishReport>('/teacher/reports/english', query).then(setEnglishData)
          : api.get<TaskReport>('/teacher/reports/tasks', query).then(setTaskData);

    request
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not load this report.');
        if (activeTab === 'heatmap') setHeatmapData(null);
        else if (activeTab === 'english') setEnglishData(null);
        else setTaskData(null);
      })
      .finally(() => setLoading(false));
  }, [selectedSection, activeTab, sections]);

  const handlePrint = () => {
    window.print();
  };

  /* The API returns the grids as flat cell lists; index them once per render
     rather than scanning the array inside every table cell. */
  const heatmapMatrix = React.useMemo(() => {
    const m = new Map<string, HeatmapCell>();
    for (const c of heatmapData?.matrix ?? []) m.set(`${c.studentId}|${c.examId}`, c);
    return m;
  }, [heatmapData]);

  const taskMatrix = React.useMemo(() => {
    const m = new Map<string, TaskCell['status']>();
    for (const c of taskData?.matrix ?? []) m.set(`${c.studentId}|${c.taskId}`, c.status);
    return m;
  }, [taskData]);

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
                  <option key={s.classSectionId} value={s.classSectionId}>
                    Class {s.classNum}-{s.section}
                  </option>
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
            onClick={() => setActiveTab(tab.id as 'heatmap' | 'english' | 'tasks')}
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
          {/* An "Export CSV" button used to sit here pointing at
              `/teacher/reports/{tab}?format=csv`. No reports endpoint supports
              a `format` parameter, and a plain <a href> cannot carry the bearer
              token anyway, so it could only ever have 404'd or 401'd. Removed
              rather than left as a button that does nothing; Print below is
              real and works today. */}
        </div>
      </div>

      {/* Content wrapper */}
      <div className="print-card">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <AlertTriangle size={28} className="text-amber-500" strokeWidth={1.5} />
            <p className="text-[13px] font-semibold text-slate-700">This report could not be loaded.</p>
            <p className="text-[12px] text-slate-400">{error}</p>
          </div>
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
                          <th key={ex.id} className="py-2 pb-3 truncate max-w-[120px]" title={ex.title}>
                            {ex.title}
                          </th>
                        ))}
                        <th className="py-2 pb-3">Average</th>
                      </tr>
                    </thead>
                    <tbody className="font-semibold">
                      {heatmapData.students.map((stud) => (
                        <tr key={stud.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="py-3 text-left font-bold text-slate-800">
                            {stud.fullName}
                            {stud.rollNumber && (
                              <span className="ml-2 font-mono text-[10px] font-normal text-slate-400">#{stud.rollNumber}</span>
                            )}
                          </td>
                          {heatmapData.exams.map(ex => {
                            const cell = heatmapMatrix.get(`${stud.id}|${ex.id}`);
                            const score = cell?.scorePct ?? null;
                            return (
                              <td key={ex.id} className="py-3">
                                <span className={`p-1 px-2.5 rounded-lg font-bold ${getHeatmapColorClass(score)}`}>
                                  {score !== null ? `${Math.round(score)}%` : cell?.submitted ? '—' : 'Not sat'}
                                </span>
                              </td>
                            );
                          })}
                          <td className="py-3">
                            <span className="p-1 px-2.5 rounded-lg font-black bg-slate-100 text-slate-800">
                              {stud.averageScorePct !== null ? `${Math.round(stud.averageScorePct)}%` : '—'}
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
                        {englishData.students.map((stud) => (
                          <tr key={stud.studentId} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="py-3 font-bold text-slate-800">
                              {stud.fullName}
                              {stud.rollNumber && (
                                <span className="ml-2 font-mono text-[10px] font-normal text-slate-400">#{stud.rollNumber}</span>
                              )}
                            </td>
                            <td className="py-3 text-center">
                              {stud.avgAccuracy === null ? <span className="text-slate-300">—</span> : (
                                <span className="flex items-center justify-center gap-1.5">
                                  {getThresholdIcon(stud.avgAccuracy)} {Math.round(stud.avgAccuracy)}%
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-center">
                              {stud.avgFluency === null ? <span className="text-slate-300">—</span> : (
                                <span className="flex items-center justify-center gap-1.5">
                                  {getThresholdIcon(stud.avgFluency)} {Math.round(stud.avgFluency)}%
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-center text-slate-600">
                              {stud.avgWpm === null ? <span className="text-slate-300">—</span> : `${stud.avgWpm} WPM`}
                            </td>
                            <td className="py-3 text-center">
                              {stud.totalAttempts === 0 ? (
                                <span className="badge text-[9px] font-bold text-slate-400">No attempts yet</span>
                              ) : stud.status === 'needs_attention' ? (
                                <span className="badge pill-rose text-[9px] font-black uppercase">Needs Attention</span>
                              ) : (
                                <span className="badge pill-green text-[9px] font-bold">On Track</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {/* Class averages row. Every value is nullable: with no
                            attempts recorded there is no average to state, and
                            printing 0% would read as "the class scored zero". */}
                        <tr className="bg-slate-50 font-black text-slate-800 border-t border-slate-200">
                          <td className="py-3 pl-3">Class Average</td>
                          <td className="py-3 text-center">
                            {englishData.classAverages.avgAccuracy === null ? '—' : `${Math.round(englishData.classAverages.avgAccuracy)}%`}
                          </td>
                          <td className="py-3 text-center">
                            {englishData.classAverages.avgFluency === null ? '—' : `${Math.round(englishData.classAverages.avgFluency)}%`}
                          </td>
                          <td className="py-3 text-center">
                            {englishData.classAverages.avgWpm === null ? '—' : `${englishData.classAverages.avgWpm} WPM`}
                          </td>
                          <td className="py-3"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Needs Attention callout list */}
                {englishData.needsAttention.length > 0 && (
                  <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 flex flex-col gap-3">
                    <h4 className="font-display font-bold text-xs text-rose-800 flex items-center gap-1.5">
                      <AlertTriangle size={15} /> Students flagged for speech/speaking revision
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {englishData.needsAttention.map((stud) => (
                        <div key={stud.studentId} className="bg-white border border-rose-100 p-3 rounded-2xl flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span>{stud.fullName}</span>
                          <span className="text-[10px] text-rose-600">
                            Acc: {stud.avgAccuracy === null ? '—' : `${Math.round(stud.avgAccuracy)}%`}
                            {stud.avgWpm !== null && ` · ${stud.avgWpm} WPM`}
                          </span>
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
                            <th key={t.id} className="py-2 pb-3 truncate max-w-[120px]" title={`${t.title} (${t.subject})`}>
                              {t.title}
                            </th>
                          ))}
                          <th className="py-2 pb-3">Completed</th>
                        </tr>
                      </thead>
                      <tbody className="font-semibold">
                        {taskData.students.map((stud) => (
                          <tr key={stud.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="py-3 text-left font-bold text-slate-800">
                              {stud.fullName}
                              {stud.rollNumber && (
                                <span className="ml-2 font-mono text-[10px] font-normal text-slate-400">#{stud.rollNumber}</span>
                              )}
                            </td>
                            {taskData.tasks.map(t => (
                              <td key={t.id} className="py-3 text-base">
                                {getTaskStatusLabel(taskMatrix.get(`${stud.id}|${t.id}`))}
                              </td>
                            ))}
                            <td className="py-3 text-slate-600">
                              {stud.completedCount}/{stud.totalCount}
                            </td>
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
