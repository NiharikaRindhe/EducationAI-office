import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileText, Share2, Mail, CheckCircle, TrendingUp, 
  Flame, CheckSquare, Sparkles, AlertTriangle, ArrowRight, Download, Award
} from 'lucide-react';

export const ParentReports: React.FC = () => {
  const { studentName, studentXP, studentStreak, studentsList } = useApp();
  const [selectedWeek, setSelectedWeek] = useState<'this' | 'last'>('this');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Find child record in studentsList to get real subject scores if available
  const childRecord = studentsList.find(s => s.name.toLowerCase() === studentName.toLowerCase()) || {
    avgScore: 84,
    subjectScores: { English: 82, Maths: 88, Science: 78, SocialSci: 80, Hindi: 85 }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Mock data for This Week
  const thisWeekData = {
    range: 'June 09 – June 15, 2026',
    xpEarned: 240,
    tasksDone: 6,
    streak: studentStreak,
    summary: `${studentName} had an exceptional week, particularly in Mathematics where they completed multiple games and quizzes with 90%+ scores. Science concepts in animal habitats are thoroughly understood, though spelling and vocabulary practice requires minor review. Direct interactive sessions have contributed to high daily streak maintenance.`,
    scores: [
      { name: 'Mathematics', val: childRecord.subjectScores.Maths, color: 'bg-emerald-500', bg: 'bg-emerald-50' },
      { name: 'English', val: childRecord.subjectScores.English, color: 'bg-indigo-500', bg: 'bg-indigo-50' },
      { name: 'Science', val: childRecord.subjectScores.Science, color: 'bg-sky-500', bg: 'bg-sky-50' },
      { name: 'Social Science', val: childRecord.subjectScores.SocialSci, color: 'bg-amber-500', bg: 'bg-amber-50' },
      { name: 'Hindi', val: childRecord.subjectScores.Hindi || 85, color: 'bg-rose-500', bg: 'bg-rose-55' }
    ],
    highlights: [
      'Scored a perfect 100% on Count & Add arithmetic game.',
      'Maintained a steady learning velocity with a 12-day streak.',
      'Completed The Wise Owl story reader task in English.'
    ],
    focusAreas: [
      'Science vocabulary and active test question spellings.',
      'Hindi reading practice chapters (Chapter 4 - 5).',
      'Class 3 Social Science geography exercises.'
    ],
    insights: [
      {
        title: 'Strength Area',
        desc: 'Spatial visualization and basic geometry are top-performing skills.',
        icon: <Award className="text-emerald-600" size={16} />,
        color: 'border-emerald-100 bg-emerald-50/50'
      },
      {
        title: 'Needs Attention',
        desc: 'Review spellings of newly introduced science vocabulary.',
        icon: <AlertTriangle className="text-rose-600" size={16} />,
        color: 'border-rose-100 bg-rose-50/50'
      },
      {
        title: 'Streak Milestone',
        desc: 'Approaching a 15-day streak milestone! Maintain momentum.',
        icon: <Flame className="text-orange-600" size={16} />,
        color: 'border-orange-100 bg-orange-50/50'
      },
      {
        title: 'Weekly Trend',
        desc: 'Performance has scaled upwards by 3.2% compared to last term.',
        icon: <TrendingUp className="text-sky-600" size={16} />,
        color: 'border-sky-100 bg-sky-50/50'
      }
    ]
  };

  // Mock data for Last Week
  const lastWeekData = {
    range: 'June 02 – June 08, 2026',
    xpEarned: 180,
    tasksDone: 4,
    streak: Math.max(0, studentStreak - 7),
    summary: `${studentName} maintained strong progress last week, focusing primarily on English vocabulary and comprehension modules. Mathematics additions were practiced. Science requires additional active reviews to bridge performance gaps.`,
    scores: [
      { name: 'Mathematics', val: Math.max(50, childRecord.subjectScores.Maths - 5), color: 'bg-emerald-500', bg: 'bg-emerald-50' },
      { name: 'English', val: Math.max(50, childRecord.subjectScores.English - 3), color: 'bg-indigo-500', bg: 'bg-indigo-50' },
      { name: 'Science', val: Math.max(50, childRecord.subjectScores.Science - 4), color: 'bg-sky-500', bg: 'bg-sky-50' },
      { name: 'Social Science', val: Math.max(50, childRecord.subjectScores.SocialSci - 2), color: 'bg-amber-500', bg: 'bg-amber-50' },
      { name: 'Hindi', val: Math.max(50, (childRecord.subjectScores.Hindi || 85) - 2), color: 'bg-rose-500', bg: 'bg-rose-50' }
    ],
    highlights: [
      'Finished Chapter 1 English Reader Assessment successfully.',
      'Logged 4 complete study sessions using game models.',
      'Completed Addition worksheets within Mathematics.'
    ],
    focusAreas: [
      'Science animal adaptation flashcards and spelling quizzes.',
      'Slightly lower speed during Class addition countdown tests.'
    ],
    insights: [
      {
        title: 'Strength Area',
        desc: 'Reading comprehension and English grammar quizzes.',
        icon: <Award className="text-emerald-600" size={16} />,
        color: 'border-emerald-100 bg-emerald-50/50'
      },
      {
        title: 'Needs Attention',
        desc: 'Active review of Animal Kingdoms worksheets in Science.',
        icon: <AlertTriangle className="text-rose-600" size={16} />,
        color: 'border-rose-100 bg-rose-50/50'
      },
      {
        title: 'Streak Milestone',
        desc: 'Maintained a active streak of 5 days last week.',
        icon: <Flame className="text-orange-600" size={16} />,
        color: 'border-orange-100 bg-orange-50/50'
      },
      {
        title: 'Weekly Trend',
        desc: 'Stabilized performance curve across all active cohorts.',
        icon: <TrendingUp className="text-sky-600" size={16} />,
        color: 'border-sky-100 bg-sky-50/50'
      }
    ]
  };

  const currentData = selectedWeek === 'this' ? thisWeekData : lastWeekData;

  const handleWhatsAppShare = () => {
    showToast('✅ Shared via WhatsApp!');
  };

  return (
    <div className="space-y-6 select-none anim-fade-up">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-800 anim-fade-up">
          <CheckCircle size={16} className="text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header with Week Selector */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
            AI Weekly Report Card
          </span>
          <h2 className="font-display font-black text-2xl text-slate-800 mt-2">
            Weekly Progress Summaries
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Date Range: <strong className="text-slate-600">{currentData.range}</strong>
          </p>
        </div>

        {/* Toggle Selector */}
        <div className="flex bg-slate-50 border border-slate-100 p-1.5 rounded-xl self-stretch md:self-auto justify-around">
          <button
            onClick={() => setSelectedWeek('this')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              selectedWeek === 'this'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/10'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setSelectedWeek('last')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              selectedWeek === 'last'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/10'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Last Week
          </button>
        </div>
      </div>

      {/* Main Split Layout Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column: Summary, Scores, Highlights vs Focus Areas */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          
          {/* Weekly Summary Card */}
          <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Sparkles size={16} className="text-emerald-500 animate-pulse" />
                Weekly AI Progress Summary
              </h3>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-50">
              {currentData.summary}
            </p>

            {/* 3 Mini Stats */}
            <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Flame size={18} fill="currentColor" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wide">Streak</span>
                  <span className="text-xs font-black text-slate-800">{currentData.streak} Days</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wide">XP Gained</span>
                  <span className="text-xs font-black text-slate-800">+{currentData.xpEarned} XP</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <CheckSquare size={18} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wide">Tasks Done</span>
                  <span className="text-xs font-black text-slate-800">{currentData.tasksDone} Tasks</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subject Accuracies */}
          <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
            <h3 className="font-display font-bold text-sm text-slate-800">Weekly Subject Accuracy</h3>
            
            <div className="space-y-3">
              {currentData.scores.map((score, idx) => (
                <div key={idx} className="flex items-center gap-4 text-xs font-bold text-slate-700">
                  <span className="w-24 shrink-0 truncate">{score.name}</span>
                  <div className="progress-bar flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`progress-fill ${score.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${score.val}%` }}
                    ></div>
                  </div>
                  <span className="w-10 text-right">{score.val}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Highlights vs Focus Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Highlights */}
            <div className="bento-card border border-emerald-100 bg-emerald-50/10 p-5 flex flex-col gap-3">
              <h4 className="font-display font-bold text-xs text-emerald-800 flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-600" /> Weekly Highlights
              </h4>
              <ul className="text-xs font-medium text-slate-600 space-y-2 list-disc list-inside">
                {currentData.highlights.map((h, idx) => (
                  <li key={idx} className="leading-relaxed pl-1">
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            {/* Focus Areas */}
            <div className="bento-card border border-amber-100 bg-amber-50/10 p-5 flex flex-col gap-3">
              <h4 className="font-display font-bold text-xs text-amber-800 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-600" /> Recommended Focus Areas
              </h4>
              <ul className="text-xs font-medium text-slate-600 space-y-2 list-disc list-inside">
                {currentData.focusAreas.map((f, idx) => (
                  <li key={idx} className="leading-relaxed pl-1">
                    {f}
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>

        {/* Right Column: AI Insights & Share Panel */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          
          {/* AI Insights */}
          <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
            <h3 className="font-display font-bold text-sm text-slate-800">Weekly AI Analytics</h3>
            
            <div className="flex flex-col gap-3">
              {currentData.insights.map((ins, idx) => (
                <div key={idx} className={`border rounded-xl p-3 flex items-start gap-3 ${ins.color}`}>
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0">
                    {ins.icon}
                  </div>
                  <div className="text-[11px] font-medium text-slate-600">
                    <h4 className="font-bold text-slate-800">{ins.title}</h4>
                    <p className="mt-0.5 leading-normal">{ins.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Share Report Panel */}
          <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
            <h3 className="font-display font-bold text-sm text-slate-800">Share Report Card</h3>
            
            <div className="flex flex-col gap-2.5">
              <button 
                onClick={() => showToast('📄 Report Card PDF downloaded!')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-900/10 transition-colors group"
              >
                <Download size={15} className="group-hover:translate-y-0.5 transition-transform" /> 
                Download PDF Report
              </button>

              <button 
                onClick={handleWhatsAppShare}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-900/10 transition-colors"
              >
                <Share2 size={15} /> 
                Share on WhatsApp
              </button>

              <button 
                onClick={() => showToast('📧 Report Card sent to registered email!')}
                className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Mail size={15} /> 
                Send via Email
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
