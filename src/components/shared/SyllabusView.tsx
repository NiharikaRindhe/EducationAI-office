import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, BookOpen, MessageSquare, Loader2, Inbox, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import { practicePath } from '../../data/activities';

/**
 * Syllabus browser for Classes 5-10, shared by Batch 2 and Batch 3.
 *
 * Reads `GET /student/syllabus`, which derives chapters from the books the
 * school has actually uploaded and indexed. This replaced two hand-written
 * copies of a hardcoded syllabus (fake chapter names *and* fake per-chapter
 * scores) — a student revising from an invented chapter list is a real
 * academic harm, so when a subject has no uploaded book this now says so
 * plainly instead of inventing one.
 */

type Accent = 'indigo' | 'sky';

const ACCENT = {
  indigo: { active: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10', link: 'text-indigo-600', ring: 'focus:border-indigo-500 focus:ring-indigo-500/10', chip: 'bg-indigo-50 text-indigo-700' },
  sky: { active: 'bg-sky-500 text-white shadow-md', link: 'text-sky-600', ring: 'focus:border-sky-500 focus:ring-sky-500/10', chip: 'bg-sky-50 text-sky-700' },
} as const;

interface SyllabusChapter {
  chapterNum: number;
  title: string | null;
  bookTitle: string;
}

interface SyllabusSubject {
  subject: string;
  chapters: SyllabusChapter[];
  hasBook: boolean;
  averageScore: number | null;
  examsTaken: number;
}

interface StudentSyllabus {
  classNum: number;
  subjects: SyllabusSubject[];
}

export const SyllabusView: React.FC<{ accent: Accent; chatHref: string; practiceHref?: string }> = ({ accent, chatHref, practiceHref }) => {
  const a = ACCENT[accent];
  const [data, setData] = useState<StudentSyllabus | null>(null);
  const [error, setError] = useState('');
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    api
      .get<StudentSyllabus>('/student/syllabus')
      .then((res) => {
        setData(res);
        setActiveSubject((prev) => prev ?? res.subjects[0]?.subject ?? null);
      })
      .catch(() => setError('Could not load your syllabus. Please try again.'));
  }, []);

  const current = useMemo(
    () => data?.subjects.find((s) => s.subject === activeSubject) ?? null,
    [data, activeSubject],
  );

  const filteredChapters = useMemo(() => {
    if (!current) return [];
    if (!searchQuery.trim()) return current.chapters;
    const q = searchQuery.toLowerCase();
    return current.chapters.filter(
      (ch) => (ch.title ?? '').toLowerCase().includes(q) || `chapter ${ch.chapterNum}`.includes(q),
    );
  }, [current, searchQuery]);

  if (error) {
    return (
      <div className="bento-card border border-rose-100 bg-rose-50 p-5 flex items-center gap-2 text-[12px] font-semibold text-rose-600">
        <AlertTriangle size={15} /> {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
        <Loader2 size={16} className="animate-spin" />
        <span className="font-sans text-xs font-bold">Loading your syllabus…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      {/* Subject tabs + search */}
      <div className="bg-white border border-slate-100 p-5 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs">
        <div className="flex gap-2 flex-wrap">
          {data.subjects.map((s) => (
            <button
              key={s.subject}
              onClick={() => { setActiveSubject(s.subject); setSearchQuery(''); }}
              className={`py-2 px-5 rounded-full font-sans text-xs font-bold transition-all cursor-pointer ${
                activeSubject === s.subject ? a.active : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {s.subject}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chapters..."
            className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs outline-none ${a.ring}`}
          />
        </div>
      </div>

      {data.subjects.length === 0 && (
        <EmptyCard
          title="No subjects set up for your class yet"
          hint="Your school admin hasn't configured subjects for this class. Please check with your class teacher."
        />
      )}

      {current && (
        <>
          {/* Real measured performance only — omitted entirely when unmeasured */}
          {current.examsTaken > 0 && (
            <div className="bento-card border border-slate-100 bg-white p-4 flex items-center gap-4">
              <div className={`px-3 py-1.5 rounded-xl font-display font-black text-sm ${a.chip}`}>
                {current.averageScore}%
              </div>
              <span className="font-sans text-[11px] text-slate-500 font-medium">
                Your average across {current.examsTaken} submitted {current.subject} exam
                {current.examsTaken === 1 ? '' : 's'}
              </span>
            </div>
          )}

          {!current.hasBook ? (
            <EmptyCard
              title={`No ${current.subject} book uploaded yet`}
              hint="Your school hasn't uploaded and indexed a textbook for this subject. Once they do, every chapter appears here and the AI tutor can answer from it."
            />
          ) : current.chapters.length === 0 ? (
            <EmptyCard
              title="Chapters not detected in this book"
              hint="The uploaded book is indexed but its chapter structure couldn't be read automatically. You can still ask the AI tutor about any topic in it."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filteredChapters.length === 0 && (
                <p className="font-sans text-xs text-slate-400 px-1">No chapter matches “{searchQuery}”.</p>
              )}
              {filteredChapters.map((ch) => {
                const isOpen = expanded[ch.chapterNum] ?? false;
                return (
                  <div key={ch.chapterNum} className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
                    <button
                      onClick={() => setExpanded((p) => ({ ...p, [ch.chapterNum]: !isOpen }))}
                      className="w-full flex items-center justify-between gap-3 p-4 text-left cursor-pointer"
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-display font-black text-[11px] text-slate-500">
                          {ch.chapterNum}
                        </span>
                        <span className="font-display font-bold text-xs text-slate-700 truncate">
                          {ch.title ?? `Chapter ${ch.chapterNum}`}
                        </span>
                      </span>
                      <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-50 flex flex-col gap-3">
                        <span className="font-sans text-[10px] text-slate-400 flex items-center gap-1.5">
                          <BookOpen size={11} /> From {ch.bookTitle}
                        </span>
                        <div className="flex flex-wrap gap-3">
                          {practiceHref && (
                            <Link
                              to={practicePath(practiceHref, current.subject, ch.chapterNum)}
                              className={`inline-flex items-center gap-1.5 font-sans text-[11px] font-bold ${a.link} hover:underline w-fit`}
                            >
                              Practice this chapter
                            </Link>
                          )}
                          <Link
                            to={chatHref}
                            className={`inline-flex items-center gap-1.5 font-sans text-[11px] font-bold ${a.link} hover:underline w-fit`}
                          >
                            <MessageSquare size={12} /> Ask the AI tutor about this chapter
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const EmptyCard: React.FC<{ title: string; hint: string }> = ({ title, hint }) => (
  <div className="bento-card border border-dashed border-slate-200 bg-white/60 p-10 flex flex-col items-center gap-2 text-center">
    <Inbox size={26} className="text-slate-300" />
    <span className="font-display font-bold text-xs text-slate-500">{title}</span>
    <span className="font-sans text-[11px] text-slate-400 max-w-md">{hint}</span>
  </div>
);
