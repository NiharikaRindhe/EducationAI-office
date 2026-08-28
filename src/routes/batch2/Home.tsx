import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { TodayPanel } from '../../components/shared/TodayPanel';
import { activitiesForClass } from '../../data/activities';

export const Batch2Home: React.FC = () => {
  const { studentName, currentClass } = useApp();
  const { hasFeature } = useAuth();
  const classActivities = activitiesForClass(currentClass);

  return (
    <div className="flex flex-col gap-6 select-none anim-fade-up">
      <TodayPanel accent="indigo" examsHref="/batch2/exams" hideTasks />

      <div className="rounded-3xl border border-indigo-100 bg-white p-6 md:p-8">
        <h2 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight text-slate-800">
          {studentName}, Class {currentClass}
        </h2>
        <p className="font-sans text-xs text-slate-500 font-medium mt-1">
          Today: activities, tutor help, and exams your teacher assigned.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/batch2/activities" className="bento-card border border-indigo-100 bg-white p-5 hover:border-indigo-300">
          <h3 className="font-display font-bold text-sm text-slate-800">Activities</h3>
          <p className="text-[11px] text-slate-400 mt-1">{classActivities.length} chapter practices ready</p>
        </Link>
        {hasFeature('ai_tutor') && (
          <Link to="/batch2/chat" className="bento-card border border-indigo-100 bg-white p-5 hover:border-indigo-300">
            <h3 className="font-display font-bold text-sm text-slate-800">Tutor</h3>
            <p className="text-[11px] text-slate-400 mt-1">Ask a doubt from your class books</p>
          </Link>
        )}
        <Link to="/batch2/exams" className="bento-card border border-indigo-100 bg-white p-5 hover:border-indigo-300">
          <h3 className="font-display font-bold text-sm text-slate-800">Exams</h3>
          <p className="text-[11px] text-slate-400 mt-1">Papers assigned by your teacher</p>
        </Link>
      </div>
    </div>
  );
};
