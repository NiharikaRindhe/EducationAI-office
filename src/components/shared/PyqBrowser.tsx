import React, { useEffect, useState } from 'react';
import { Loader2, ChevronDown, ChevronUp, Search, BookOpen } from 'lucide-react';
import { api } from '../../lib/api';

type Accent = 'indigo' | 'sky';

const ACCENT = {
  indigo: { pill: 'bg-indigo-600 text-white', soft: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-600', tab: 'bg-indigo-600', btn: 'bg-indigo-600 hover:bg-indigo-700' },
  sky:    { pill: 'bg-sky-500 text-white',    soft: 'bg-sky-50 border-sky-100',       text: 'text-sky-600',   tab: 'bg-sky-500',    btn: 'bg-sky-500 hover:bg-sky-600' },
} as const;

interface PYQItem {
  id: string;
  subject: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  correct_answer?: string;
  rubric?: string;
  marks: number;
  pyq_year?: number;
  pyq_source?: string;
  options?: { id: string; text: string; isCorrect: boolean }[];
}

const DIFF_COLOR: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-rose-100 text-rose-700',
};

const PyqCard: React.FC<{ item: PYQItem; accent: Accent; showRubric: boolean }> = ({ item, accent, showRubric }) => {
  const a = ACCENT[accent];
  const [expanded, setExpanded] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="bento-card border border-slate-100 bg-white p-4 flex flex-col gap-3 transition-all">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${a.pill}`}>{item.subject}</span>
          {item.pyq_year && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              {item.pyq_source ?? 'CBSE'} {item.pyq_year}
            </span>
          )}
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${DIFF_COLOR[item.difficulty] ?? ''}`}>
            {item.difficulty}
          </span>
          <span className="text-[9px] font-bold text-slate-400">{item.marks}M</span>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Question text */}
      <p className="font-sans text-xs text-slate-700 font-semibold leading-relaxed">{item.text}</p>

      {/* MCQ options (expanded) */}
      {expanded && item.type === 'mcq' && item.options && (
        <div className="flex flex-col gap-1.5">
          {item.options.map(opt => (
            <div
              key={opt.id}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all
                ${revealed && opt.isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'bg-slate-50 border-slate-100 text-slate-600'}`}
            >
              {opt.text}
              {revealed && opt.isCorrect && <span className="ml-2 text-[9px] font-black text-emerald-600">✓ CORRECT</span>}
            </div>
          ))}
        </div>
      )}

      {/* Reveal / rubric */}
      {expanded && (
        <div className="flex gap-2 border-t border-slate-100 pt-2">
          {item.type === 'mcq' || item.correct_answer ? (
            <button
              onClick={() => setRevealed(r => !r)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer ${a.btn}`}
            >
              {revealed ? 'Hide Answer' : 'Reveal Answer'}
            </button>
          ) : null}
        </div>
      )}

      {/* Revealed answer for non-MCQ */}
      {expanded && revealed && item.type !== 'mcq' && item.correct_answer && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wide">Answer</span>
          <p className="text-xs text-emerald-800 font-medium">{item.correct_answer}</p>
          {showRubric && item.rubric && (
            <>
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wide mt-1">Examiner's Points</span>
              <p className="text-xs text-emerald-700">{item.rubric}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const SUBJECTS = ['All', 'Mathematics', 'Science', 'English', 'Social Science', 'Hindi'];

export const PyqBrowser: React.FC<{
  accent: Accent;
  showRubric?: boolean; // Batch 3 — show examiner rubric points
}> = ({ accent, showRubric = false }) => {
  const a = ACCENT[accent];
  const [items, setItems] = useState<PYQItem[] | null>(null);
  const [subject, setSubject] = useState('All');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [boardBanner, setBoardBanner] = useState(false);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (subject !== 'All') params.subject = subject;
    setItems(null);
    api.get<PYQItem[]>('/student/pyq', params)
      .then(setItems)
      .catch(() => setItems([]));
  }, [subject]);

  // Board banner: show when filtered to a board-exam year or heavy content
  useEffect(() => {
    setBoardBanner(showRubric && subject !== 'All');
  }, [subject, showRubric]);

  const filtered = (items ?? []).filter(it => {
    if (yearFilter && it.pyq_year?.toString() !== yearFilter) return false;
    if (search && !it.text.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-4 anim-fade-up">
      {boardBanner && (
        <div className={`rounded-2xl border p-4 flex items-center gap-3 ${a.soft}`}>
          <BookOpen size={16} className={a.text} />
          <p className={`text-xs font-bold ${a.text}`}>Board Prep Mode — Questions include examiner rubric points to help you score full marks. 📋</p>
        </div>
      )}

      {/* Subject tabs */}
      <div className="flex gap-1.5 flex-wrap border-b border-slate-100 pb-3">
        {SUBJECTS.map(s => (
          <button
            key={s}
            onClick={() => setSubject(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer
              ${subject === s ? a.pill : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Search + year filter row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-slate-400 font-sans"
          />
        </div>
        {showRubric && (
          <select
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-600 outline-none cursor-pointer"
          >
            <option value="">All Years</option>
            {[2024, 2023, 2022, 2021, 2020].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        )}
      </div>

      {/* Results */}
      {items === null ? (
        <div className="flex justify-center py-12"><Loader2 className={`animate-spin ${a.text}`} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          {items.length === 0 ? 'No PYQ questions found for this subject yet.' : 'No results match your search.'}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] text-slate-400 font-bold">{filtered.length} question{filtered.length !== 1 ? 's' : ''} • tap to expand</p>
          {filtered.map(item => (
            <PyqCard key={item.id} item={item} accent={accent} showRubric={showRubric} />
          ))}
        </div>
      )}
    </div>
  );
};
