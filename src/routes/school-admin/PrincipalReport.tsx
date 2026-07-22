import React, { useEffect, useState } from 'react';
import { Loader2, Printer } from 'lucide-react';
import { api } from '../../lib/api';

interface PrincipalReportData {
  school_name: string;
  report_date: string;
  total_students: number;
  total_teachers: number;
  active_this_week: number;
  sessions_this_week: number;
  exams_conducted: number;
  enrollment_by_class: { class_num: number; count: number }[];
}

export const SchoolAdminPrincipalReport: React.FC = () => {
  const [report, setReport] = useState<PrincipalReportData | null>(null);

  useEffect(() => {
    api.get<PrincipalReportData>('/school-admin/reports/principal')
      .then(setReport)
      .catch(() => setReport(null));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (report === null) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-rose-400" size={32} /></div>;
  }

  const maxEnrollment = Math.max(1, ...report.enrollment_by_class.map(e => e.count));

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up text-left">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-card { border: none !important; box-shadow: none !important; padding: 0 !important; max-width: 100% !important; }
        }
      ` }} />

      {/* Action Header */}
      <div className="flex justify-between items-center no-print">
        <div>
          <h2 className="font-display font-extrabold text-xl text-slate-800">Principal Summary Report</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Printable platform engagement sheet designed for school leadership.</p>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-md shadow-rose-500/10"
        >
          <Printer size={14} /> Print Report
        </button>
      </div>

      {/* A4 Printable Card container */}
      <div className="print-card bento-card border border-slate-100 bg-white p-8 max-w-4xl mx-auto w-full shadow-sm flex flex-col gap-6">
        {/* Report Header */}
        <div className="border-b border-slate-200 pb-5 flex justify-between items-start">
          <div>
            <h1 className="font-display font-black text-xl text-slate-900">{report.school_name}</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Platform Activity &amp; Roster Report</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Report Date</span>
            <span className="text-xs font-black text-slate-700">{new Date(report.report_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        {/* 4 KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Roster Students', value: report.total_students },
            { label: 'Total Teachers', value: report.total_teachers },
            { label: 'Active Students (Wk)', value: report.active_this_week },
            { label: 'Exams Run', value: report.exams_conducted }
          ].map((stat, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{stat.label}</span>
              <span className="font-display font-black text-2xl text-slate-800">{stat.value}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {/* Class Enrollment list */}
          <div className="flex flex-col gap-3">
            <span className="font-display font-bold text-xs text-slate-500 uppercase tracking-wide">Class Enrollment Roster</span>
            <div className="flex flex-col gap-2 bg-slate-50 p-4 border border-slate-100 rounded-3xl">
              {report.enrollment_by_class.map(c => (
                <div key={c.class_num} className="flex items-center gap-3 text-xs">
                  <span className="text-[10px] font-bold text-slate-500 w-12 shrink-0">Class {c.class_num}</span>
                  <div className="flex-1 h-3.5 bg-slate-200/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-400 rounded-full"
                      style={{ width: `${(c.count / maxEnrollment) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 w-8 text-right shrink-0">{c.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity summary block */}
          <div className="flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <span className="font-display font-bold text-xs text-slate-500 uppercase tracking-wide">Weekly Session Summary</span>
              <div className="bg-slate-50 p-5 border border-slate-100 rounded-3xl flex flex-col gap-4 text-xs font-semibold text-slate-700">
                <div className="flex justify-between items-center">
                  <span>Live sessions held this week:</span>
                  <span className="font-black text-base text-rose-500">{report.sessions_this_week} sessions</span>
                </div>
                <div className="w-full h-[1px] bg-slate-200" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Live sessions denote active computer lab periods. Students in these periods join their teacher's active stream and log attendance automatically.
                </p>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-right border-t border-slate-100 pt-4">
              Generated by EduAI · School Server Box Admin
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
