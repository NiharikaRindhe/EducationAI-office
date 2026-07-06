import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

interface StudentListItem {
  id: string;
  full_name: string;
  is_active: boolean;
  student_profiles: { class_num: number; section: string; roll_number: string | null; avatar: string; xp: number; streak: number; batch_id: number } | null;
}

interface AtRiskStudent {
  id: string;
  risks: { type: string; label: string }[];
}

interface StudentDetail {
  id: string;
  full_name: string;
  student_profiles: { class_num: number; section: string; avatar: string; xp: number; level: number; streak: number; longest_streak: number } | null;
  subject_progress: { subject: string; chapters_done: number; total_chapters: number }[];
  student_badges: { badge_id: string; earned_at: string; badges: { name: string; icon: string | null } | null }[];
}

export const TeacherStudents: React.FC = () => {
  const [students, setStudents] = useState<StudentListItem[] | null>(null);
  const [atRiskIds, setAtRiskIds] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('All');
  const [showOnlyAtRisk, setShowOnlyAtRisk] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    void api.get<StudentListItem[]>('/teacher/students').then(setStudents);
    void api.get<AtRiskStudent[]>('/teacher/at-risk').then((rows) => {
      const map: Record<string, string[]> = {};
      rows.forEach((r) => { map[r.id] = r.risks.map((risk) => risk.label); });
      setAtRiskIds(map);
    });
  }, []);

  const classOptions = useMemo(() => {
    if (!students) return ['All'];
    const set = new Set(students.map((s) => `${s.student_profiles?.class_num}-${s.student_profiles?.section}`));
    return ['All', ...Array.from(set).sort()];
  }, [students]);

  const filteredStudents = (students ?? []).filter((s) => {
    const label = `${s.student_profiles?.class_num}-${s.student_profiles?.section}`;
    const matchesSearch = s.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter === 'All' || label === classFilter;
    const matchesRisk = !showOnlyAtRisk || Boolean(atRiskIds[s.id]);
    return matchesSearch && matchesClass && matchesRisk;
  });

  const openDetail = useCallback(async (id: string) => {
    setSelectedId(id);
    setIsDetailLoading(true);
    try {
      setDetail(await api.get<StudentDetail>(`/teacher/students/${id}`));
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const handleBackToList = () => {
    setSelectedId(null);
    setDetail(null);
  };

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      {selectedId ? (
        <div className="flex flex-col gap-6">
          <button onClick={handleBackToList} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer">
            <ArrowLeft size={16} /> Back to Students List
          </button>

          {isDetailLoading || !detail ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-400" /></div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md select-none">
                <div className="flex items-center gap-5">
                  <span className="text-4xl bg-white/20 backdrop-blur-md border border-white/20 w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm">
                    {detail.student_profiles?.avatar}
                  </span>
                  <div>
                    <h3 className="font-display font-extrabold text-2xl tracking-tight">{detail.full_name}</h3>
                    <span className="text-[10px] text-indigo-150 font-bold block mt-0.5">
                      Class {detail.student_profiles?.class_num}-{detail.student_profiles?.section}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center bg-white/10 backdrop-blur-md p-4 px-6 rounded-2xl border border-white/10 select-none">
                  <span className="font-display font-black text-3xl">Lvl {detail.student_profiles?.level ?? 0}</span>
                  <span className="text-[9px] text-indigo-100 font-bold uppercase tracking-wider mt-0.5">{detail.student_profiles?.xp} XP</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bento-card border border-slate-100 bg-white text-center p-4">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Streak</span>
                  <h4 className="font-display font-black text-xl text-slate-800 mt-1">🔥 {detail.student_profiles?.streak} Days</h4>
                </div>
                <div className="bento-card border border-slate-100 bg-white text-center p-4">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Longest Streak</span>
                  <h4 className="font-display font-bold text-sm text-slate-800 mt-1.5">{detail.student_profiles?.longest_streak} Days</h4>
                </div>
                <div className="bento-card border border-slate-100 bg-white text-center p-4">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Badges Earned</span>
                  <h4 className="font-display font-black text-xl text-indigo-600 mt-1">🏅 {detail.student_badges.length}</h4>
                </div>
              </div>

              <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4 text-left">
                <span className="font-display font-bold text-sm text-slate-800">Subject Progress</span>
                {detail.subject_progress.length === 0 ? (
                  <p className="text-xs text-slate-400">No subject progress recorded yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {detail.subject_progress.map((sp) => {
                      const pct = sp.total_chapters > 0 ? Math.round((sp.chapters_done / sp.total_chapters) * 100) : 0;
                      return (
                        <div key={sp.subject} className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                            <span>{sp.subject}</span>
                            <span className={`badge ${pct < 60 ? 'pill-rose' : 'pill-indigo'} text-[9px] font-black`}>{pct}%</span>
                          </div>
                          <div className="progress-bar h-1.5 bg-slate-100">
                            <div className={`progress-fill ${pct < 60 ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-slate-100 p-5 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs">
            <div className="flex gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0">
              {classOptions.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setClassFilter(tab)}
                  className={`py-2 px-4 rounded-full font-sans text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    classFilter === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {tab === 'All' ? 'All' : `Class ${tab}`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setShowOnlyAtRisk(!showOnlyAtRisk)}
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  showOnlyAtRisk ? 'bg-red-600 border-transparent text-white shadow-md shadow-red-500/15' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                ⚠️ At Risk Only
              </button>
              <div className="relative flex-1 md:w-56">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-sans text-xs outline-none"
                  placeholder="Search student..."
                />
              </div>
            </div>
          </div>

          {!students ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-400" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((stud) => {
                  const risks = atRiskIds[stud.id];
                  return (
                    <div
                      key={stud.id}
                      onClick={() => void openDetail(stud.id)}
                      className={`bento-card bg-white border flex flex-col justify-between gap-5 p-5 card-interactive cursor-pointer ${risks ? 'border-red-200 hover:border-red-300' : 'border-slate-100'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3.5">
                          <span className="text-3xl bg-slate-50 border border-slate-100 p-2 rounded-2xl select-none">{stud.student_profiles?.avatar}</span>
                          <div>
                            <h4 className="font-display font-bold text-sm text-slate-800 leading-tight">{stud.full_name}</h4>
                            <span className="text-[10px] text-slate-400 font-medium block mt-1">
                              Class {stud.student_profiles?.class_num}-{stud.student_profiles?.section}
                            </span>
                          </div>
                        </div>
                        {risks && (
                          <span className="badge pill-rose text-[8px] font-black uppercase flex items-center gap-1 select-none">⚠️ At Risk</span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center font-sans text-[10px] font-bold text-slate-500 select-none">
                        <div>
                          <span className="block text-[8px] text-slate-400">STREAK</span>
                          <span className="text-slate-700">{stud.student_profiles?.streak}d</span>
                        </div>
                        <div>
                          <span className="block text-[8px] text-slate-400">XP</span>
                          <span className="text-slate-700">{stud.student_profiles?.xp}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2.5 border-t border-slate-50 mt-1 text-[10px] font-bold text-slate-400 select-none">
                        <span>{risks ? risks.join(', ') : 'On track'}</span>
                        <span className="text-indigo-600 flex items-center gap-0.5">
                          View Profile <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-3 text-center py-12 bg-white border border-slate-100 rounded-3xl flex flex-col items-center gap-2">
                  <span className="text-3xl select-none">👥</span>
                  <span className="font-sans font-bold text-xs text-slate-500">No students matched</span>
                  <span className="text-[10px] text-slate-400">Adjust your class tabs or filters.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
