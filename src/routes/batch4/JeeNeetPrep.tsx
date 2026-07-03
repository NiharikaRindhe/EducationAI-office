import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Check, X, ShieldAlert, Sparkles, ChevronRight, Calculator, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Batch4JeeNeetPrep: React.FC = () => {
  const { currentStream } = useApp();
  const [stream, setStream] = useState<'JEE' | 'NEET'>(currentStream);
  const [activeTab, setActiveTab] = useState<'overview' | 'weightage' | 'pattern' | 'predictor'>('overview');

  // Percentile slider state
  const [scoreInput, setScoreInput] = useState(180);
  const [percentileVal, setPercentileVal] = useState(98.5);

  const handleScoreChange = (val: number) => {
    setScoreInput(val);
    // Rough estimate formula
    const calcPercentile = Math.min(100, Math.max(80, 80 + (val / 300) * 20));
    setPercentileVal(parseFloat(calcPercentile.toFixed(2)));
  };

  // Rank range calculator based on percentile
  const getRankRange = (pct: number) => {
    const candidates = stream === 'JEE' ? 1200000 : 2000000;
    const rank = Math.round((1 - pct / 100) * candidates);
    const low = Math.max(1, Math.round(rank * 0.9));
    const high = Math.round(rank * 1.1);
    return `AIR ${low.toLocaleString()} – ${high.toLocaleString()}`;
  };

  // Weightage tables data
  const weightageJEE = [
    { topic: 'Electrostatics', chapter: 'Physics Ch 1-2', avgQ: 3, pct: 10, priority: 'High' },
    { topic: 'Definite Integration', chapter: 'Maths Ch 7', avgQ: 2, pct: 8, priority: 'High' },
    { topic: 'Chemical Kinetics', chapter: 'Chemistry Ch 4', avgQ: 2, pct: 6, priority: 'Medium' },
    { topic: 'Matrices & Determinants', chapter: 'Maths Ch 3', avgQ: 2, pct: 6, priority: 'Medium' },
    { topic: 'Thermodynamics', chapter: 'Physics Ch 11', avgQ: 1, pct: 4, priority: 'Low' }
  ];

  const weightageNEET = [
    { topic: 'Genetics & Evolution', chapter: 'Biology Ch 9', avgQ: 12, pct: 15, priority: 'High' },
    { topic: 'Electrostatics', chapter: 'Physics Ch 1-2', avgQ: 4, pct: 8, priority: 'High' },
    { topic: 'Organic Mechanisms', chapter: 'Chemistry Ch 4', avgQ: 6, pct: 10, priority: 'High' },
    { topic: 'Human Physiology', chapter: 'Biology Ch 15', avgQ: 8, pct: 12, priority: 'Medium' }
  ];

  const weightageList = stream === 'JEE' ? weightageJEE : weightageNEET;

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      {/* Stream switcher banner */}
      <div className="bg-white border border-slate-100 p-5 rounded-3xl flex justify-between items-center shadow-xs">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-800">Entrance Hub Settings</h3>
          <p className="font-sans text-xs text-slate-400">Configure content for engineering vs medical exam mocks.</p>
        </div>

        {/* JEE/NEET toggler */}
        <div className="flex bg-slate-100 p-1 rounded-full select-none">
          <button
            onClick={() => setStream('JEE')}
            className={`py-1.5 px-4 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
              stream === 'JEE' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            JEE Stream
          </button>
          <button
            onClick={() => setStream('NEET')}
            className={`py-1.5 px-4 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
              stream === 'NEET' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            NEET Stream
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-full select-none max-w-xl w-full">
        {([
          { key: 'overview', label: 'Readiness' },
          { key: 'weightage', label: 'Topic Weightage' },
          { key: 'pattern', label: 'Mock Pattern' },
          { key: 'predictor', label: 'Rank Predictor' }
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.key ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Tab content */}
      <div className="w-full">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-12 gap-6 animate-fade-up">
            {/* Readiness circular gauge */}
            <div className="col-span-12 lg:col-span-4 bento-card border border-purple-100 bg-white p-6 text-center flex flex-col items-center gap-4">
              <span className="font-display font-bold text-xs text-slate-700">Overall Syllabus Readiness</span>
              
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="72" cy="72" r="32" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                  <circle cx="72" cy="72" r="32" fill="transparent" stroke="#8b5cf6" strokeWidth="8" strokeDasharray="201" strokeDashoffset="44" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center font-display font-black text-2xl text-slate-800">
                  78%
                </div>
              </div>
              
              <span className="text-[10px] text-slate-400">Estimated based on 15 test scores</span>
            </div>

            {/* Subject readiness progress bars */}
            <div className="col-span-12 lg:col-span-8 bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
              <span className="font-display font-bold text-sm text-slate-800">Readiness by Subject</span>
              
              <div className="flex flex-col gap-4">
                {[
                  { name: 'Physics', val: 75, color: 'bg-purple-600' },
                  { name: 'Chemistry', val: 62, color: 'bg-indigo-600' },
                  { name: stream === 'JEE' ? 'Mathematics' : 'Biology', val: stream === 'JEE' ? 84 : 91, color: stream === 'JEE' ? 'bg-slate-700' : 'bg-emerald-600' }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                      <span>{item.name}</span>
                      <span>{item.val}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className={`progress-fill ${item.color}`} style={{ width: `${item.val}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TOPIC WEIGHTAGE TAB */}
        {activeTab === 'weightage' && (
          <div className="bento-card border border-slate-100 bg-white p-5 text-left animate-fade-up">
            <span className="font-display font-bold text-sm text-slate-800 mb-3 block">Sorted weightage table ({stream})</span>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold">
                    <th className="py-2.5 pb-3">Topic</th>
                    <th className="py-2.5 pb-3">Chapter</th>
                    <th className="py-2.5 pb-3">Avg Questions</th>
                    <th className="py-2.5 pb-3">Weightage %</th>
                    <th className="py-2.5 pb-3">Priority</th>
                  </tr>
                </thead>
                <tbody className="font-medium text-slate-600">
                  {weightageList.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-3 font-bold text-slate-800">{item.topic}</td>
                      <td className="py-3">{item.chapter}</td>
                      <td className="py-3">{item.avgQ} Qs</td>
                      <td className="py-3">{item.pct}%</td>
                      <td className="py-3">
                        <span className={`badge ${
                          item.priority === 'High' ? 'pill-rose' : item.priority === 'Medium' ? 'pill-amber' : 'pill-slate'
                        } text-[9px] font-bold`}>
                          {item.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MOCK PATTERN TAB */}
        {activeTab === 'pattern' && (
          <div className="bento-card border border-slate-100 bg-white p-5 text-left max-w-xl mx-auto animate-fade-up">
            <span className="font-display font-bold text-sm text-slate-800 mb-3 block">{stream} Official Exam Pattern</span>
            
            <div className="flex flex-col gap-3.5 text-xs font-semibold text-slate-600 leading-normal">
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                <span>Physics section</span>
                <span>30 Questions · 100 Marks</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                <span>Chemistry section</span>
                <span>30 Questions · 100 Marks</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                <span>{stream === 'JEE' ? 'Mathematics section' : 'Biology section'}</span>
                <span>{stream === 'JEE' ? '30 Questions · 100 Marks' : '90 Questions · 360 Marks'}</span>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex justify-between">
                <span>Marking Scheme</span>
                <span className="font-bold">+4 Correct / -1 Incorrect</span>
              </div>
            </div>
          </div>
        )}

        {/* RANK PREDICTOR TAB */}
        {activeTab === 'predictor' && (
          <div className="grid grid-cols-12 gap-6 animate-fade-up">
            {/* Input score predictor slider */}
            <div className="col-span-12 lg:col-span-6 bento-card border border-purple-100 bg-white p-6 flex flex-col gap-5 text-left">
              <div>
                <span className="font-display font-bold text-xs text-slate-700 block">Evaluate Expected Score</span>
                <p className="font-sans text-[10px] text-slate-400 mt-0.5">Drag slider to estimate percentile rank</p>
              </div>

              <div className="flex flex-col gap-3 my-2 select-none">
                <div className="flex justify-between items-baseline font-display font-black">
                  <span className="text-3xl text-purple-600">{scoreInput} / 300</span>
                  <span className="text-xs text-slate-400 font-bold">Estimated Percentile: {percentileVal}%</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="300"
                  step="5"
                  value={scoreInput}
                  onChange={(e) => handleScoreChange(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              {/* AIR Rank estimation */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Estimated AIR Range</span>
                <span className="text-purple-600 font-display font-black text-sm">{getRankRange(percentileVal)}</span>
              </div>
            </div>

            {/* Cutoffs table */}
            <div className="col-span-12 lg:col-span-6 bento-card border border-slate-100 bg-white p-5 text-left">
              <span className="font-display font-bold text-xs text-slate-700 block mb-3 font-sans">Previous Years Cutoffs</span>
              
              <div className="overflow-x-auto text-[10px] font-semibold text-slate-600">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400">
                      <th className="py-1.5">Year</th>
                      <th className="py-1.5">General Cutoff</th>
                      <th className="py-1.5">OBC Cutoff</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-50">
                      <td className="py-2 font-bold text-slate-800">2024</td>
                      <td className="py-2">93.2 %ile</td>
                      <td className="py-2">79.5 %ile</td>
                    </tr>
                    <tr className="border-b border-slate-50">
                      <td className="py-2 font-bold text-slate-800">2023</td>
                      <td className="py-2">90.7 %ile</td>
                      <td className="py-2">73.6 %ile</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
