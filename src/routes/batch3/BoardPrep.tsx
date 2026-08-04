import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ArrowRight, BookOpen, Loader2, Inbox } from 'lucide-react';
import { api } from '../../lib/api';

/**
 * Board prep hub for Class 9-10.
 *
 * Everything numeric on this page is derived from the PYQ papers a school has
 * actually uploaded (`question_bank` rows with `is_pyq`), never from a
 * hardcoded table. A board-prep page that invents "this topic appeared 5 times
 * in 5 years" is worse than an empty one: a student revising for boards will
 * act on it. When the school has uploaded nothing, the tabs say so.
 */

interface PyqItem {
  id: string;
  subject: string;
  type: string;
  difficulty: string;
  text: string;
  marks: number;
  chapter_num?: number | null;
  pyq_year?: number | null;
  pyq_source?: string | null;
}

/** CBSE board exams start mid-February. Derive the next occurrence from today
 *  rather than shipping a frozen "273 days left" that is wrong the next day. */
function nextBoardExamDate(from: Date): Date {
  const feb15ThisYear = new Date(from.getFullYear(), 1, 15);
  return from <= feb15ThisYear ? feb15ThisYear : new Date(from.getFullYear() + 1, 1, 15);
}

function daysUntil(target: Date, from: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.max(0, Math.round((b - a) / oneDay));
}

const TIPS = [
  { q: '1. Use bullet points for 3-mark & 5-mark answers', a: 'Examiners scan key points. Writing point-wise answers with sub-headings makes it much easier to award marks than large paragraphs.' },
  { q: '2. Underline key terms and formulas', a: 'Highlight final numeric answers, units, or chemical reactions. Use a pencil or ruler to make key formulas pop out.' },
  { q: '3. Include neat labeled ray/circuit diagrams', a: 'For physics questions, draw neat arrows showing light directions. Always label focal length (f) and centers (C).' },
  { q: '4. Draw neat tables for comparison questions', a: 'If comparing living vs non-living or concave vs convex, draw a clear tabular distinction. Avoid messy split text.' },
  { q: '5. Do not skip steps in numerical calculations', a: 'CBSE awards step-wise marking. Even if your final answer is wrong, you will get marks for the correct step formulas.' },
];

const EmptyState: React.FC<{ title: string; hint: string }> = ({ title, hint }) => (
  <div className="bento-card border border-dashed border-slate-200 bg-white/60 p-10 flex flex-col items-center gap-2 text-center">
    <Inbox size={26} className="text-slate-300" />
    <span className="font-display font-bold text-xs text-slate-500">{title}</span>
    <span className="font-sans text-[11px] text-slate-400 max-w-sm">{hint}</span>
  </div>
);

export const Batch3BoardPrep: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'papers' | 'writing' | 'topics'>('papers');
  const [openTipIdx, setOpenTipIdx] = useState<number | null>(null);
  const [pyqs, setPyqs] = useState<PyqItem[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<PyqItem[]>('/student/pyq')
      .then(setPyqs)
      .catch(() => setError('Could not load past papers. Please try again.'));
  }, []);

  const examDate = useMemo(() => nextBoardExamDate(new Date()), []);
  const daysLeft = useMemo(() => daysUntil(examDate, new Date()), [examDate]);

  /** One card per real uploaded paper: a (source, year, subject) grouping. */
  const papers = useMemo(() => {
    if (!pyqs) return [];
    const groups = new Map<string, { source: string; year: number | null; subject: string; count: number; marks: number }>();
    for (const q of pyqs) {
      const source = q.pyq_source ?? 'CBSE';
      const key = `${source}::${q.pyq_year ?? ''}::${q.subject}`;
      const g = groups.get(key) ?? { source, year: q.pyq_year ?? null, subject: q.subject, count: 0, marks: 0 };
      g.count += 1;
      g.marks += q.marks;
      groups.set(key, g);
    }
    return [...groups.values()].sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.subject.localeCompare(b.subject));
  }, [pyqs]);

  /** Real repeat-frequency: how often each chapter actually shows up across
   *  the uploaded papers. Chapters with no detected number are skipped rather
   *  than bucketed into a misleading "Chapter 0". */
  const topics = useMemo(() => {
    if (!pyqs) return [];
    const counts = new Map<string, { subject: string; chapterNum: number; count: number; years: Set<number> }>();
    for (const q of pyqs) {
      if (q.chapter_num == null) continue;
      const key = `${q.subject}::${q.chapter_num}`;
      const c = counts.get(key) ?? { subject: q.subject, chapterNum: q.chapter_num, count: 0, years: new Set<number>() };
      c.count += 1;
      if (q.pyq_year) c.years.add(q.pyq_year);
      counts.set(key, c);
    }
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 8);
  }, [pyqs]);

  const maxTopicCount = topics[0]?.count ?? 1;
  const isLoading = pyqs === null && !error;

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      {/* Countdown banner — computed, not frozen */}
      <div className="bg-gradient-to-r from-sky-400 to-cyan-500 rounded-3xl p-5 text-white flex justify-between items-center shadow-md select-none">
        <div>
          <h3 className="font-display font-extrabold text-lg">CBSE Board exam countdown</h3>
          <p className="font-sans text-[11px] text-sky-100 font-medium mt-0.5">
            Papers usually begin around {examDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })} · confirm exact dates with your school
          </p>
        </div>
        <div className="bg-white/20 p-2.5 px-4 rounded-xl font-display font-black text-sm whitespace-nowrap">
          ~{daysLeft} Days Left
        </div>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-full select-none max-w-md w-full">
        {([
          { key: 'papers', label: 'Past Papers' },
          { key: 'writing', label: 'Answer Writing' },
          { key: 'topics', label: 'Important Topics' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.key ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bento-card border border-rose-100 bg-rose-50 p-4 text-[12px] font-semibold text-rose-600">{error}</div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
          <Loader2 size={16} className="animate-spin" />
          <span className="font-sans text-xs font-bold">Loading your papers…</span>
        </div>
      )}

      {!isLoading && !error && (
        <div className="w-full">
          {activeTab === 'papers' && (
            papers.length === 0 ? (
              <EmptyState
                title="No past papers uploaded yet"
                hint="Your school hasn't added any previous-year papers for your class. Ask your teacher to upload them — they'll show up here automatically."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-up">
                {papers.map((p) => (
                  <div key={`${p.source}-${p.year}-${p.subject}`} className="bento-card border border-sky-100 bg-white p-6 flex flex-col justify-between gap-5 card-interactive text-left">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="badge pill-sky text-[9px] font-black">{p.subject}</span>
                        <h4 className="font-display font-bold text-sm text-slate-800 mt-2">
                          {p.year ? `${p.year} ` : ''}{p.source} Paper
                        </h4>
                      </div>
                      <BookOpen size={16} className="text-slate-300 shrink-0" />
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-2 text-[11px] font-bold">
                      <span className="text-slate-400">
                        {p.count} question{p.count === 1 ? '' : 's'} · {p.marks} marks
                      </span>
                      <Link
                        to="/batch3/pyq"
                        className="py-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        Practise <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'writing' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-up">
              <div className="md:col-span-7 flex flex-col gap-3">
                <span className="font-display font-bold text-xs text-slate-700 mb-1 block">5 Answer Writing Tips</span>
                {TIPS.map((tip, idx) => {
                  const isOpen = openTipIdx === idx;
                  return (
                    <div key={idx} className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
                      <button
                        onClick={() => setOpenTipIdx((prev) => (prev === idx ? null : idx))}
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

              <div className="md:col-span-5 flex flex-col gap-4">
                <div className="bento-card border border-sky-100 bg-white p-5 flex flex-col gap-4 text-left">
                  <span className="font-display font-bold text-xs text-slate-700">How marks map to length</span>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col gap-3 font-sans text-xs text-slate-600">
                    {[
                      { m: '1 mark', d: 'One line or one term. No explanation needed.' },
                      { m: '3 marks', d: 'Three distinct points, roughly 50–60 words.' },
                      { m: '5 marks', d: 'Five points or a labelled diagram plus explanation, 80–100 words.' },
                    ].map((row) => (
                      <div key={row.m} className="flex flex-col">
                        <span className="font-bold text-slate-800">{row.m}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{row.d}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400">General CBSE guidance — your teacher's instructions always take priority.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'topics' && (
            topics.length === 0 ? (
              <EmptyState
                title="Not enough paper data to rank topics"
                hint="Once your school uploads previous-year papers with chapter numbers, the chapters that repeat most often will be ranked here from those real papers."
              />
            ) : (
              <div className="bento-card border border-sky-100 bg-white p-5 flex flex-col gap-4 text-left max-w-2xl mx-auto animate-fade-up">
                <div>
                  <span className="font-display font-bold text-xs text-slate-700 block">Most-repeated chapters</span>
                  <p className="font-sans text-[10px] text-slate-400 mt-0.5">
                    Counted from {pyqs?.length ?? 0} question{pyqs?.length === 1 ? '' : 's'} in your school's uploaded papers
                  </p>
                </div>

                <div className="flex flex-col gap-3 font-sans text-xs">
                  {topics.map((item) => (
                    <div key={`${item.subject}-${item.chapterNum}`} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4">
                      <div>
                        <span className="font-bold text-slate-700 block">{item.subject} · Chapter {item.chapterNum}</span>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                          {item.count} question{item.count === 1 ? '' : 's'}
                          {item.years.size > 0 && ` across ${item.years.size} year${item.years.size === 1 ? '' : 's'}`}
                        </span>
                      </div>
                      <div className="flex gap-0.5 shrink-0" aria-hidden>
                        {Array.from({ length: 5 }).map((_, bIdx) => (
                          <div
                            key={bIdx}
                            className={`w-2.5 h-2.5 rounded-xs ${
                              bIdx < Math.ceil((item.count / maxTopicCount) * 5) ? 'bg-sky-500' : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
