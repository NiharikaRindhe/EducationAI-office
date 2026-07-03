import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronDown, Check, Star, ArrowRight, BookOpen, Clock } from 'lucide-react';

export const Batch3BoardPrep: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'papers' | 'writing' | 'topics'>('papers');
  
  // Accordion for answer tips
  const [openTipIdx, setOpenTipIdx] = useState<number | null>(null);

  const toggleTip = (idx: number) => {
    setOpenTipIdx(prev => (prev === idx ? null : idx));
  };

  const tipsData = [
    { q: '1. Use bullet points for 3-mark & 5-mark answers', a: 'Examiners scan key points. Writing point-wise answers with sub-headings makes it much easier to award marks than large paragraphs.' },
    { q: '2. Underline key terms and formulas', a: 'Highlight final numeric answers, units, or chemical reactions. Use a pencil or ruler to make key formulas pop out.' },
    { q: '3. Include neat labeled ray/circuit diagrams', a: 'For physics questions, draw neat arrows showing light directions. Always label focal length (f) and centers (C).' },
    { q: '4. Draw neat tables for comparison questions', a: 'If comparing living vs non-living or concave vs convex, draw a clear tabular distinction. Avoid messy split text.' },
    { q: '5. Do not skip steps in numerical calculations', a: 'CBSE awards step-wise marking. Even if your final answer is wrong, you will get 80% marks for correct step formulas!' }
  ];

  const topicsFrequency = [
    { name: 'Balancing Chemical equations', freq: 5, category: 'Science Ch 1' },
    { name: 'Trigonometric Identities verification', freq: 5, category: 'Maths Ch 8' },
    { name: 'Ohm’s law and Resistance calculations', freq: 4, category: 'Science Ch 12' },
    { name: 'Satyagraha movement timeline', freq: 4, category: 'Social Sci Ch 3' },
    { name: 'Refractive index problems', freq: 3, category: 'Science Ch 10' }
  ];

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      {/* Top Countdown Banner */}
      <div className="bg-gradient-to-r from-sky-400 to-cyan-500 rounded-3xl p-5 text-white flex justify-between items-center shadow-md select-none">
        <div>
          <h3 className="font-display font-extrabold text-lg">CBSE Board exam countdown</h3>
          <p className="font-sans text-[11px] text-sky-100 font-medium mt-0.5">Target: March 15, 2027 · CBSE Pattern Syllabus</p>
        </div>
        <div className="bg-white/20 p-2.5 px-4 rounded-xl font-display font-black text-sm">
          273 Days Left
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex bg-slate-100 p-1.5 rounded-full select-none max-w-md w-full">
        {([
          { key: 'papers', label: 'Past Papers' },
          { key: 'writing', label: 'Answer Writing' },
          { key: 'topics', label: 'Important Topics' }
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.key 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Tab content */}
      <div className="w-full">
        {activeTab === 'papers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-up">
            {[
              { year: 2024, subject: 'Mathematics', attempted: true, score: 92 },
              { year: 2023, subject: 'Science', attempted: false },
              { year: 2023, subject: 'Mathematics', attempted: true, score: 85 },
              { year: 2022, subject: 'Social Science', attempted: false }
            ].map((p, idx) => (
              <div key={idx} className="bento-card border border-sky-100 bg-white p-6 flex flex-col justify-between gap-5 card-interactive text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="badge pill-sky text-[9px] font-black">{p.subject}</span>
                    <h4 className="font-display font-bold text-sm text-slate-800 mt-2">
                      {p.year} CBSE Board Paper
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold font-display">{p.year} Exam</span>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-2 text-[11px] font-bold">
                  {p.attempted ? (
                    <span className="badge pill-green text-[9px] font-bold">Score: {p.score}%</span>
                  ) : (
                    <span className="text-slate-400">Not Attempted</span>
                  )}
                  <button className="py-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer">
                    Attempt Paper
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'writing' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-up">
            {/* Left Col: Tips accordions */}
            <div className="md:col-span-7 flex flex-col gap-3">
              <span className="font-display font-bold text-xs text-slate-700 mb-1 block">5 Answer Writing Tips</span>
              {tipsData.map((tip, idx) => {
                const isOpen = openTipIdx === idx;
                return (
                  <div key={idx} className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
                    <button
                      onClick={() => toggleTip(idx)}
                      className="w-full flex items-center justify-between p-4 text-left font-display font-bold text-xs text-slate-700 cursor-pointer"
                    >
                      <span>{tip.q}</span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 font-sans text-xs text-slate-500 leading-relaxed border-t border-slate-50/50 pt-2.5">
                        {tip.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Col: mock practice questions */}
            <div className="md:col-span-5 flex flex-col gap-4">
              <div className="bento-card border border-sky-100 bg-white p-5 flex flex-col gap-4 text-left">
                <span className="font-display font-bold text-xs text-slate-700">Practice Question Word Limits</span>
                
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col gap-3 font-sans text-xs text-slate-600">
                  <div>
                    <span className="font-bold text-slate-800">Q1. Draw the ray diagram for concave mirror when object is at C.</span>
                    <p className="text-[10px] text-slate-400 mt-1">Suggested limit: Ray diagram + 50 words</p>
                  </div>
                  <div className="w-full h-[1px] bg-slate-200/50"></div>
                  <div>
                    <span className="font-bold text-slate-800">Q2. List three differences between acids and bases.</span>
                    <p className="text-[10px] text-slate-400 mt-1">Suggested limit: Tabular view + 80 words</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'topics' && (
          <div className="bento-card border border-sky-100 bg-white p-5 flex flex-col gap-4 text-left max-w-2xl mx-auto animate-fade-up">
            <div>
              <span className="font-display font-bold text-xs text-slate-700 block font-sans">CBSE Topic Frequencies</span>
              <p className="font-sans text-[10px] text-slate-400 mt-0.5">Chapters with highest repetitions in past 5 years</p>
            </div>

            <div className="flex flex-col gap-3 font-sans text-xs">
              {topicsFrequency.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="font-bold text-slate-700 block">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{item.category}</span>
                  </div>
                  
                  {/* Freq visual bar */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, bIdx) => (
                      <div 
                        key={bIdx}
                        className={`w-2.5 h-2.5 rounded-xs ${
                          bIdx < item.freq ? 'bg-red-500 animate-pulse' : 'bg-slate-200'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
