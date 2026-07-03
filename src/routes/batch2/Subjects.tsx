import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Search, ChevronDown, ChevronUp, Check, Play, BookOpen, MessageSquare } from 'lucide-react';

interface Chapter {
  name: string;
  status: 'Completed' | 'In Progress' | 'Not Started';
  score?: number;
}

interface Unit {
  title: string;
  chapters: Chapter[];
}

export const Batch2Subjects: React.FC = () => {
  const { exams } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'Maths' | 'Science' | 'English'>('Maths');
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({
    'Unit 1: Number Systems': true,
    'Unit 2: Algebra': true
  });

  const toggleUnit = (title: string) => {
    setExpandedUnits(prev => ({ ...prev, [title]: !prev[title] }));
  };

  // Mock curriculum data
  const syllabusData: Record<'Maths' | 'Science' | 'English', Unit[]> = {
    Maths: [
      {
        title: 'Unit 1: Number Systems',
        chapters: [
          { name: 'Chapter 1: Integers & Properties', status: 'Completed', score: 90 },
          { name: 'Chapter 2: Fractions & Decimals', status: 'Completed', score: 85 },
          { name: 'Chapter 3: Rational Numbers', status: 'In Progress' }
        ]
      },
      {
        title: 'Unit 2: Algebra',
        chapters: [
          { name: 'Chapter 4: Simple Linear Equations', status: 'In Progress' },
          { name: 'Chapter 5: Algebraic Expressions', status: 'Not Started' },
          { name: 'Chapter 6: Exponents and Powers', status: 'Not Started' }
        ]
      }
    ],
    Science: [
      {
        title: 'Unit 1: Food & Nutrition',
        chapters: [
          { name: 'Chapter 1: Nutrition in Plants', status: 'Completed', score: 95 },
          { name: 'Chapter 2: Nutrition in Animals', status: 'Completed', score: 80 }
        ]
      },
      {
        title: 'Unit 2: Materials',
        chapters: [
          { name: 'Chapter 3: Fibre to Fabric', status: 'In Progress' },
          { name: 'Chapter 4: Acids, Bases and Salts', status: 'Not Started' }
        ]
      }
    ],
    English: [
      {
        title: 'Unit 1: Prose Reading',
        chapters: [
          { name: 'Chapter 1: Three Questions', status: 'Completed', score: 100 },
          { name: 'Chapter 2: A Gift of Chappals', status: 'Completed', score: 90 },
          { name: 'Chapter 3: Gopal and the Hilsa Fish', status: 'In Progress' }
        ]
      }
    ]
  };

  const currentUnits = syllabusData[activeTab];

  // Filters chapters based on query
  const getFilteredUnits = () => {
    if (!searchQuery) return currentUnits;
    
    return currentUnits.map(unit => {
      const filteredChapters = unit.chapters.filter(ch => 
        ch.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return { ...unit, chapters: filteredChapters };
    }).filter(unit => unit.chapters.length > 0);
  };

  const filteredUnits = getFilteredUnits();

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      {/* Top Navbar & search row */}
      <div className="bg-white border border-slate-100 p-5 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs">
        {/* Subject tabs */}
        <div className="flex gap-2">
          {(['Maths', 'Science', 'English'] as const).map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveTab(sub)}
              className={`py-2 px-5 rounded-full font-sans text-xs font-bold transition-all cursor-pointer ${
                activeTab === sub 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-xl font-sans text-xs outline-none"
            placeholder="Search chapters..."
          />
        </div>
      </div>

      {/* Accordions unit list */}
      <div className="flex flex-col gap-4">
        {filteredUnits.length > 0 ? (
          filteredUnits.map((unit, uIdx) => {
            const isExpanded = expandedUnits[unit.title] !== false;
            return (
              <div key={uIdx} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
                {/* Accordion header */}
                <button
                  onClick={() => toggleUnit(unit.title)}
                  className="w-full py-4 px-5 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between font-display font-bold text-sm text-slate-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-indigo-600" />
                    <span>{unit.title}</span>
                  </div>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* Chapter list */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-100 flex flex-col gap-3 font-sans text-xs">
                    {unit.chapters.map((ch, cIdx) => (
                      <div 
                        key={cIdx}
                        className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          {/* Status dot */}
                          <div className={`w-2.5 h-2.5 rounded-full ${
                            ch.status === 'Completed' ? 'bg-emerald-500' : ch.status === 'In Progress' ? 'bg-amber-500' : 'bg-slate-300'
                          }`}></div>
                          
                          <div>
                            <span className="font-sans font-bold text-xs text-slate-700 block">{ch.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                              Status: {ch.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {ch.status === 'Completed' && ch.score && (
                            <span className="badge pill-green text-[9px] font-bold">
                              Score: {ch.score}%
                            </span>
                          )}

                          <Link 
                            to="/batch2/exams"
                            className="py-1.5 px-4 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-sans font-bold text-[10px] rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Play size={8} className="fill-slate-600" />
                            Practice
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white border border-slate-100 rounded-3xl flex flex-col items-center gap-2">
            <span className="text-3xl select-none">🔬</span>
            <span className="font-sans font-bold text-xs text-slate-500">No chapters found</span>
            <span className="text-[10px] text-slate-400">Try checking another query or subject tab.</span>
          </div>
        )}
      </div>

      {/* AI Doubt Tutor CTA banner */}
      <div className="bg-gradient-to-r from-indigo-950 to-indigo-900 rounded-3xl p-6 text-white flex flex-col md:flex-row justify-between items-center gap-4 mt-4 select-none">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-2xl shadow-lg select-none">
            💬
          </div>
          <div>
            <h4 className="font-display font-bold text-sm">Have a doubt in these chapters?</h4>
            <p className="font-sans text-[11px] text-indigo-200 leading-normal">
              Ask our AI Doubt Solver to get instant step-by-step NCERT explanations.
            </p>
          </div>
        </div>
        <Link 
          to="/batch2/chat"
          className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs shadow-md transition-all shrink-0 flex items-center gap-1.5"
        >
          Ask AI doubt tutor
          <MessageSquare size={14} />
        </Link>
      </div>

    </div>
  );
};
