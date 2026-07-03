import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Eye, EyeOff, BookOpen, Star, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface Chapter {
  name: string;
  score: number;
}

interface SubjectProgress {
  subject: string;
  chapters: Chapter[];
}

export const Batch1Progress: React.FC = () => {
  const { studentXP, studentStreak } = useApp();

  const [isParentView, setIsParentView] = useState(false);
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({
    'English Lit': true,
    'Maths Play': false
  });

  const toggleSubject = (sub: string) => {
    setExpandedSubjects(prev => ({ ...prev, [sub]: !prev[sub] }));
  };

  const progressData: SubjectProgress[] = [
    {
      subject: 'English Lit',
      chapters: [
        { name: 'The Wise Old Owl Story', score: 100 },
        { name: 'The Lion and the Mouse', score: 85 },
        { name: 'Alphabet & Phonics rhymes', score: 90 },
        { name: 'Spellings of animals', score: 55 }
      ]
    },
    {
      subject: 'Maths Play',
      chapters: [
        { name: 'Counting Stars (1–10)', score: 100 },
        { name: 'Addition with sweet apples', score: 70 },
        { name: 'Subtraction balloon popping', score: 45 }
      ]
    },
    {
      subject: 'Science Fun',
      chapters: [
        { name: 'Living vs Non-Living things', score: 80 },
        { name: 'The Little Seed Grows Ch 1', score: 65 }
      ]
    },
    {
      subject: 'EVS Explorer',
      chapters: [
        { name: 'Our Neighborhood Helpers', score: 95 }
      ]
    }
  ];

  // AI suggestions
  const suggestions = [
    { icon: '🔢', text: 'Practice "Subtraction balloon popping" to boost score above 60%' },
    { icon: '🦉', text: 'Take the spelling quiz for animal names to earn Level 3 XP' },
    { icon: '📸', text: 'Complete a Show & Tell upload about trees for science class' }
  ];

  // Helper for score badge colors
  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return 'pill-green';
    if (score >= 60) return 'pill-amber';
    return 'pill-rose';
  };

  // Weekly study minutes
  const weeklyActivity = [
    { day: 'Mon', mins: 25 },
    { day: 'Tue', mins: 45 },
    { day: 'Wed', mins: 15 },
    { day: 'Thu', mins: 35 },
    { day: 'Fri', mins: 60 },
    { day: 'Sat', mins: 20 },
    { day: 'Sun', mins: 30 }
  ];

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      {/* Top Header toggle panel */}
      <div className="bg-white border border-slate-100 p-5 rounded-3xl flex justify-between items-center shadow-xs">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-800">Learning Progress</h3>
          <p className="font-sans text-xs text-slate-400">Detailed stats on your academic performance.</p>
        </div>

        {/* Parent View Toggle Button */}
        <button
          onClick={() => setIsParentView(!isParentView)}
          className={`flex items-center gap-1.5 py-2 px-4 rounded-xl border font-sans font-bold text-xs cursor-pointer shadow-xs transition-all ${
            isParentView 
              ? 'bg-emerald-600 border-transparent text-white' 
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {isParentView ? <EyeOff size={16} /> : <Eye size={16} />}
          {isParentView ? 'Parent View: ON' : 'Turn ON Parent View'}
        </button>
      </div>

      {isParentView ? (
        /* PARENT SIMPLIFIED VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bento-card border border-emerald-100 bg-white text-center p-6 flex flex-col gap-2">
            <span className="text-3xl select-none">📈</span>
            <span className="font-display font-extrabold text-3xl text-emerald-600">81.5%</span>
            <span className="font-sans text-xs font-bold text-slate-500 uppercase tracking-wide">Average Score</span>
            <span className="text-[10px] text-slate-400">Calculated across 10 completed chapters</span>
          </div>

          <div className="bento-card border border-emerald-100 bg-white text-center p-6 flex flex-col gap-2">
            <span className="text-3xl select-none">🔥</span>
            <span className="font-display font-extrabold text-3xl text-orange-500">{studentStreak} Days</span>
            <span className="font-sans text-xs font-bold text-slate-500 uppercase tracking-wide">Learning Streak</span>
            <span className="text-[10px] text-slate-400">Highest recorded streak this month</span>
          </div>

          <div className="bento-card border border-emerald-100 bg-white text-center p-6 flex flex-col gap-2">
            <span className="text-3xl select-none">✅</span>
            <span className="font-display font-extrabold text-3xl text-indigo-600">10 / 12</span>
            <span className="font-sans text-xs font-bold text-slate-500 uppercase tracking-wide">Chapters Done</span>
            <span className="text-[10px] text-slate-400">NCERT-aligned syllabus checklist</span>
          </div>
        </div>
      ) : (
        /* FULL STUDENT DETAILED VIEW */
        <div className="grid grid-cols-12 gap-6">
          {/* Collapsible subjects list */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
            <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
              <span className="font-display font-bold text-sm text-slate-800">Subject Chapters Check</span>
              
              <div className="flex flex-col gap-3">
                {progressData.map((sub, idx) => {
                  const isExpanded = !!expandedSubjects[sub.subject];
                  const averageScore = Math.round(
                    sub.chapters.reduce((acc, c) => acc + c.score, 0) / sub.chapters.length
                  );

                  return (
                    <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden">
                      {/* Subject Header */}
                      <button
                        onClick={() => toggleSubject(sub.subject)}
                        className="w-full py-4 px-5 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between font-display font-bold text-sm text-slate-700 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">
                            {sub.subject.includes('English') ? '📖' : sub.subject.includes('Maths') ? '🔢' : sub.subject.includes('Science') ? '🔬' : '🌱'}
                          </span>
                          <span>{sub.subject}</span>
                          <span className={`badge ${getScoreBadgeClass(averageScore)} text-[9px] font-black ml-2`}>
                            Avg: {averageScore}%
                          </span>
                        </div>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {/* Chapters list */}
                      {isExpanded && (
                        <div className="p-4 flex flex-col gap-3.5 border-t border-slate-50 font-sans text-xs">
                          {sub.chapters.map((chap, cIdx) => (
                            <div key={cIdx} className="flex flex-col gap-1.5">
                              <div className="flex justify-between items-center text-slate-600 font-semibold">
                                <span>{chap.name}</span>
                                <span className={`badge ${getScoreBadgeClass(chap.score)} text-[10px] font-black`}>
                                  {chap.score}%
                                </span>
                              </div>
                              <div className="progress-bar bg-slate-100 h-2">
                                <div 
                                  className={`progress-fill ${
                                    chap.score >= 80 ? 'bg-emerald-500' : chap.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                  }`} 
                                  style={{ width: `${chap.score}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar widgets */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            {/* Weekly activity chart */}
            <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
              <span className="font-display font-bold text-sm text-slate-800">Weekly Activity (min)</span>
              
              {/* Simple CSS heights bar chart */}
              <div className="flex justify-between items-end h-32 px-2 border-b border-slate-100 pb-2">
                {weeklyActivity.map((act, actIdx) => (
                  <div key={actIdx} className="flex flex-col items-center gap-2 group flex-1">
                    <div 
                      className={`w-4 rounded-t-md transition-all ${
                        act.day === 'Fri' 
                          ? 'bg-amber-500 hover:bg-amber-600 shadow-sm shadow-amber-500/20' 
                          : 'bg-slate-200 hover:bg-slate-300'
                      }`} 
                      style={{ height: `${(act.mins / 60) * 100}px` }}
                    ></div>
                    <span className="text-[10px] font-bold text-slate-400">{act.day}</span>
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 font-medium text-center block mt-0.5">
                Highlight: Friday had peak study of 60 mins.
              </span>
            </div>

            {/* AI Coach suggestions */}
            <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500 fill-amber-500" />
                <span className="font-display font-bold text-sm text-slate-800">AI Coach Advice</span>
              </div>
              <div className="flex flex-col gap-3 font-sans text-xs">
                {suggestions.map((sug, sIdx) => (
                  <div key={sIdx} className="p-3 bg-amber-50/50 border border-amber-100/30 rounded-xl flex items-start gap-2.5">
                    <span className="text-lg select-none">{sug.icon}</span>
                    <span className="text-amber-900 leading-normal font-medium">{sug.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
