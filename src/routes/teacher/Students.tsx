import React, { useState } from 'react';
import { useApp, StudentRecord } from '../../context/AppContext';
import { Search, ChevronRight, ArrowLeft, Star, Clock, Sparkles } from 'lucide-react';

export const TeacherStudents: React.FC = () => {
  const { studentsList } = useApp();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<'All' | '3-A' | '7-A' | '9-C' | '12-A'>('All');
  const [showOnlyAtRisk, setShowOnlyAtRisk] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  // Filter students
  const filteredStudents = studentsList.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter === 'All' || `${s.classNum}-${s.section}` === classFilter;
    const matchesRisk = !showOnlyAtRisk || s.isAtRisk;
    return matchesSearch && matchesClass && matchesRisk;
  });

  const handleBackToList = () => {
    setSelectedStudent(null);
  };

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      {selectedStudent ? (
        /* INDIVIDUAL DRILL-DOWN VIEW */
        <div className="flex flex-col gap-6 animate-fade-up">
          {/* Back button */}
          <div>
            <button
              onClick={handleBackToList}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
              Back to Students List
            </button>
          </div>

          {/* Profile Header Gradient card */}
          <div className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md select-none">
            <div className="flex items-center gap-5">
              <span className="text-4xl bg-white/20 backdrop-blur-md border border-white/20 w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm">
                {selectedStudent.avatar}
              </span>
              <div>
                <h3 className="font-display font-extrabold text-2xl tracking-tight">{selectedStudent.name}</h3>
                <span className="text-[10px] text-indigo-150 font-bold block mt-0.5">
                  Class {selectedStudent.classNum}-{selectedStudent.section} · Cohort Batch
                </span>
              </div>
            </div>

            {/* Avg Score circle */}
            <div className="flex flex-col items-center bg-white/10 backdrop-blur-md p-4 px-6 rounded-2xl border border-white/10 select-none">
              <span className="font-display font-black text-3xl">{selectedStudent.avgScore}%</span>
              <span className="text-[9px] text-indigo-100 font-bold uppercase tracking-wider mt-0.5">Term Average</span>
            </div>
          </div>

          {/* 3-stat summary row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bento-card border border-slate-100 bg-white text-center p-4">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Streak</span>
              <h4 className="font-display font-black text-xl text-slate-800 mt-1">🔥 {selectedStudent.streak} Days</h4>
            </div>
            <div className="bento-card border border-slate-100 bg-white text-center p-4">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Last Active</span>
              <h4 className="font-display font-bold text-sm text-slate-800 mt-1.5">{selectedStudent.lastActive}</h4>
            </div>
            <div className="bento-card border border-slate-100 bg-white text-center p-4">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total XP</span>
              <h4 className="font-display font-black text-xl text-indigo-600 mt-1">⚡ {selectedStudent.xp}</h4>
            </div>
          </div>

          {/* Subject Performance Bars */}
          <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4 text-left">
            <span className="font-display font-bold text-sm text-slate-800">Subject Breakdown</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(selectedStudent.subjectScores).map(([sub, score]) => (
                <div key={sub} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                    <span>{sub}</span>
                    <span className={`badge ${score < 60 ? 'pill-rose' : 'pill-indigo'} text-[9px] font-black`}>
                      {score}%
                    </span>
                  </div>
                  <div className="progress-bar h-1.5 bg-slate-100">
                    <div 
                      className={`progress-fill ${score < 60 ? 'bg-red-500' : 'bg-indigo-600'}`} 
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* STUDENTS DIRECTORY GALLERY LIST */
        <div className="flex flex-col gap-6">
          {/* Top filter row */}
          <div className="bg-white border border-slate-100 p-5 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs">
            {/* Class tabs */}
            <div className="flex gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0">
              {(['All', '3-A', '7-A', '9-C', '12-A'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setClassFilter(tab)}
                  className={`py-2 px-4 rounded-full font-sans text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    classFilter === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Class {tab}
                </button>
              ))}
            </div>

            {/* Right: Search & risk filters */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Risk Toggle */}
              <button
                onClick={() => setShowOnlyAtRisk(!showOnlyAtRisk)}
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  showOnlyAtRisk 
                    ? 'bg-red-600 border-transparent text-white shadow-md shadow-red-500/15 animate-pulse' 
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
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

          {/* Student Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((stud) => (
                <div 
                  key={stud.id}
                  onClick={() => setSelectedStudent(stud)}
                  className={`bento-card bg-white border flex flex-col justify-between gap-5 p-5 card-interactive cursor-pointer ${
                    stud.isAtRisk ? 'border-red-200 hover:border-red-300' : 'border-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3.5">
                      <span className="text-3xl bg-slate-50 border border-slate-100 p-2 rounded-2xl select-none">
                        {stud.avatar}
                      </span>
                      <div>
                        <h4 className="font-display font-bold text-sm text-slate-800 leading-tight">
                          {stud.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium block mt-1">
                          Class {stud.classNum}-{stud.section}
                        </span>
                      </div>
                    </div>

                    {stud.isAtRisk && (
                      <span className="badge pill-rose text-[8px] font-black uppercase flex items-center gap-1 select-none animate-pulse">
                        ⚠️ At Risk
                      </span>
                    )}
                  </div>

                  {/* 3-stat metrics grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center font-sans text-[10px] font-bold text-slate-500 select-none">
                    <div>
                      <span className="block text-[8px] text-slate-400">STREAK</span>
                      <span className="text-slate-700">{stud.streak}d</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-400">AVG %</span>
                      <span className="text-indigo-600">{stud.avgScore}%</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-400">XP</span>
                      <span className="text-slate-700">{stud.xp}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-50 mt-1 text-[10px] font-bold text-slate-400 select-none">
                    <span>Active: {stud.lastActive}</span>
                    <span className="text-indigo-600 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                      View Profile
                      <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-12 text-center py-12 bg-white border border-slate-100 rounded-3xl flex flex-col items-center gap-2">
                <span className="text-3xl select-none">👥</span>
                <span className="font-sans font-bold text-xs text-slate-500">No students matched</span>
                <span className="text-[10px] text-slate-400">Adjust your class tabs or filters.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
