import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Loader2, CheckCircle, Clock, Check, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Batch4SchedulePlanner: React.FC = () => {
  const { studyPlan, toggleStudyTask, generateStudyPlan } = useApp();

  const [goal, setGoal] = useState('JEE Advanced');
  const [hours, setHours] = useState(8);
  const [weakSubjects, setWeakSubjects] = useState<string[]>(['Physics']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeDay, setActiveDay] = useState<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri'>('Mon');

  const handleSubjectToggle = (sub: string) => {
    setWeakSubjects(prev => 
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      generateStudyPlan(goal, hours, weakSubjects);
      confetti({
        particleCount: 50,
        spread: 30
      });
    }, 1800);
  };

  const getTaskTypeBadge = (type: string) => {
    switch (type) {
      case 'Study': return 'bg-indigo-600 text-white';
      case 'Practice': return 'bg-sky-500 text-white';
      case 'Mock': return 'bg-rose-500 text-white';
      default: return 'bg-amber-500 text-white'; // Revision
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 font-sans select-none anim-fade-up">
      {/* Left Col: Setup configurations */}
      <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
        <div className="bento-card border border-purple-100 bg-white p-6 flex flex-col gap-5 text-left">
          <h3 className="font-display font-bold text-sm text-slate-800">Generate Study Plan</h3>
          
          {/* Goal Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-caps text-[9px] font-bold text-slate-400">TARGET GOAL</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl text-xs font-semibold outline-none"
            >
              <option value="JEE Advanced">JEE Advanced</option>
              <option value="JEE Mains">JEE Mains</option>
              <option value="NEET Medical">NEET Medical</option>
              <option value="Class 12 Boards">Class 12 Boards</option>
            </select>
          </div>

          {/* Hours per day range slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline font-label-caps text-[9px] font-bold text-slate-400">
              <span>DAILY STUDY HOURS</span>
              <span className="text-purple-600 text-xs font-display font-black">{hours} hours</span>
            </div>
            <input
              type="range"
              min="2"
              max="12"
              step="1"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Weak subjects toggles */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-caps text-[9px] font-bold text-slate-400">MARK WEAK SUBJECTS (AI PRIORITY)</label>
            <div className="grid grid-cols-2 gap-2 text-center select-none font-sans text-xs">
              {['Physics', 'Chemistry', 'Maths', 'Biology'].map((sub) => {
                const isSelected = weakSubjects.includes(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => handleSubjectToggle(sub)}
                    className={`py-3.5 border rounded-xl font-bold cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-purple-600 bg-purple-50/20 text-purple-700' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3.5 mt-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/10 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating AI Study Plan...
              </>
            ) : (
              <>
                <Sparkles size={16} className="animate-pulse" />
                Generate AI Plan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Col: Generated 5-day plan display */}
      <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
        <div className="bento-card border border-purple-100 bg-white p-5 flex flex-col gap-4 text-left">
          
          {/* Day tabs */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="font-display font-bold text-xs text-slate-700">Weekly Schedule Planner</span>
            
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg select-none text-[10px] font-bold">
              {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const).map((day) => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`py-1 px-3 rounded-md transition-all cursor-pointer ${
                    activeDay === day ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Tasks List */}
          <div className="flex flex-col gap-3">
            {studyPlan.map((task) => (
              <div 
                key={task.id}
                onClick={() => toggleStudyTask(task.id)}
                className={`p-3.5 px-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center justify-between gap-4 card-interactive cursor-pointer ${
                  task.completed ? 'opacity-60 line-through' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      task.completed ? 'bg-emerald-500 border-transparent text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {task.completed && <Check size={12} className="stroke-[3px]" />}
                  </button>
                  <div>
                    <span className="font-sans font-bold text-xs text-slate-700 block">{task.topic}</span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{task.subject}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 select-none font-sans text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {task.duration} min
                  </span>
                  <span className={`badge ${getTaskTypeBadge(task.type)} text-[8px] font-black uppercase`}>
                    {task.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
