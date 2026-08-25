import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Clock, Loader2 } from 'lucide-react';
import { TodayPanel } from '../../components/shared/TodayPanel';
import { api } from '../../lib/api';

interface ExamListItem {
  id: string;
  title: string;
  subject: string;
  duration: number;
  state: 'upcoming' | 'open' | 'submitted' | 'closed';
}

export const Batch3Home: React.FC = () => {
  const { studentName, currentClass } = useApp();
  const { hasFeature } = useAuth();
  const [exams, setExams] = useState<ExamListItem[] | null>(null);

  useEffect(() => {
    api.get<ExamListItem[]>('/student/exams')
      .then(setExams)
      .catch(() => setExams([]));
  }, []);

  const nextExam = (exams ?? []).find((e) => e.state === 'open');

  return (
    <div className="flex flex-col gap-6 select-none anim-fade-up">
      <TodayPanel accent="sky" examsHref="/batch3/exams" hideTasks />

      <div className="rounded-3xl border border-sky-100 bg-white p-6 md:p-8">
        <h2 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight text-slate-800">
          {studentName}, Class {currentClass}
        </h2>
        <p className="font-sans text-xs text-slate-500 font-medium mt-1">
          Board year: start with exams your teacher assigned, then the science labs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bento-card border border-sky-200 bg-sky-50/40 p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="font-display font-bold text-sm text-slate-800">Exams</span>
            <Link to="/batch3/exams" className="text-xs font-bold text-sky-600 hover:underline">Open all</Link>
          </div>
          {exams === null ? (
            <Loader2 size={14} className="animate-spin text-sky-500" />
          ) : nextExam ? (
            <div className="flex items-center justify-between gap-4 bg-white border border-sky-100 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-sky-600" />
                <div>
                  <h4 className="font-sans font-bold text-sm text-slate-800">{nextExam.title}</h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{nextExam.subject} · {nextExam.duration} mins</p>
                </div>
              </div>
              <Link to="/batch3/exams" className="py-2 px-4 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl">
                Attempt
              </Link>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No open exam right now. Check with your teacher.</p>
          )}
        </div>

        {hasFeature('virtual_labs') && (
          <Link to="/batch3/labs" className="bento-card border border-sky-200 bg-white p-5 hover:border-sky-400">
            <h3 className="font-display font-bold text-sm text-slate-800">Science Labs</h3>
            <p className="text-[11px] text-slate-400 mt-1">Physics, Chemistry and Biology — full screen, no sidebar.</p>
          </Link>
        )}
      </div>
    </div>
  );
};
