import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { BookOpen, Star, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChapterGame {
  gameId: string;
  name: string;
  stars: number;
  bestScore: number | null;
}

interface CurriculumChapter {
  chapterRef: string;
  subject: string;
  chapterNum: number;
  title: string;
  games: ChapterGame[];
  stars: number;
  completed: boolean;
}

export const Batch1Syllabus: React.FC = () => {
  const navigate = useNavigate();
  const { currentClass, studentName } = useApp();
  const [chapters, setChapters] = useState<CurriculumChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState<string>('Mathematics');

  const isPreReader = currentClass <= 2;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api.get<CurriculumChapter[]>('/student/curriculum')
      .then(res => {
        if (!cancelled) {
          setChapters(res);
          // Set active subject to the first subject available if Mathematics isn't there
          if (res.length > 0) {
            const subjects = Array.from(new Set(res.map(c => c.subject)));
            if (!subjects.includes('Mathematics')) {
              setActiveSubject(subjects[0]);
            }
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Filter unique subjects
  const subjects = Array.from(new Set(chapters.map(c => c.subject)));
  const filteredChapters = chapters.filter(c => c.subject === activeSubject);

  const getSubjectColor = (subject: string) => {
    const lower = subject.toLowerCase();
    if (lower.includes('math')) return 'bg-amber-400 border-amber-300 text-white';
    if (lower.includes('english')) return 'bg-sky-400 border-sky-300 text-white';
    return 'bg-emerald-400 border-emerald-300 text-white';
  };

  const getSubjectTabStyle = (subject: string) => {
    const isActive = activeSubject === subject;
    const lower = subject.toLowerCase();
    if (lower.includes('math')) {
      return isActive 
        ? 'bg-amber-400 text-white border-amber-400 shadow-md shadow-amber-400/20' 
        : 'bg-white hover:bg-amber-50 text-amber-700 border-amber-200';
    }
    if (lower.includes('english')) {
      return isActive 
        ? 'bg-sky-400 text-white border-sky-400 shadow-md shadow-sky-400/20' 
        : 'bg-white hover:bg-sky-50 text-sky-700 border-sky-200';
    }
    return isActive 
      ? 'bg-emerald-400 text-white border-emerald-400 shadow-md shadow-emerald-400/20' 
      : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const getSubjectEmoji = (subject: string) => {
    const lower = subject.toLowerCase();
    if (lower.includes('math')) return '📐';
    if (lower.includes('english')) return '📖';
    return '🔬';
  };

  const completedCount = filteredChapters.filter(c => c.completed).length;
  const totalCount = filteredChapters.length;

  return (
    <div className="flex flex-col gap-6 select-none anim-fade-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl tracking-tight text-slate-800 flex items-center gap-2">
            <span>📚</span>
            {isPreReader ? 'My Books' : 'My CBSE Syllabus'}
          </h1>
          {!isPreReader && (
            <p className="text-xs text-slate-400 font-bold mt-1">
              Track your chapters and complete games to collect stars!
            </p>
          )}
        </div>

        {/* Mascot bubble */}
        <div className="flex items-center gap-2.5 bg-amber-50/60 border border-amber-200/40 rounded-2xl px-4 py-2 self-start sm:self-center">
          <span className="text-3xl animate-[bounce_2s_infinite]">🦉</span>
          <p className="text-xs text-amber-800 font-bold">
            {completedCount === totalCount && totalCount > 0
              ? 'Amazing! You finished all chapters! 🏆'
              : `You completed ${completedCount} of ${totalCount} chapters!`}
          </p>
        </div>
      </div>

      {/* Subject Selector Tabs */}
      {subjects.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1 select-none scrollbar-none">
          {subjects.map(subject => (
            <button
              key={subject}
              onClick={() => setActiveSubject(subject)}
              className={`px-5 py-3 rounded-2xl border-2 font-display font-black text-sm tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2 ${getSubjectTabStyle(subject)}`}
              style={{ minHeight: 48 }}
            >
              <span className="text-xl">{getSubjectEmoji(subject)}</span>
              <span>{subject}</span>
            </button>
          ))}
        </div>
      )}

      {/* Chapters list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-amber-400" size={32} />
        </div>
      ) : filteredChapters.length === 0 ? (
        <div className="bento-card border border-slate-100 bg-white p-12 text-center flex flex-col items-center gap-3">
          <span className="text-4xl">📖</span>
          <span className="font-sans font-bold text-xs text-slate-400">No chapters found</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredChapters.map((chapter) => {
            const themeClass = activeSubject.toLowerCase().includes('math') 
              ? 'border-amber-100 bg-amber-50/10' 
              : activeSubject.toLowerCase().includes('english') 
              ? 'border-sky-100 bg-sky-50/10' 
              : 'border-emerald-100 bg-emerald-50/10';

            return (
              <div
                key={chapter.chapterRef}
                className={`bento-card border p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:shadow-md ${themeClass}`}
              >
                {/* Left: Chapter Num & Title */}
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-display font-black text-lg select-none shrink-0 ${getSubjectColor(activeSubject)}`}>
                    {chapter.chapterNum}
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base text-slate-800 leading-snug">
                      {chapter.title}
                    </h3>
                    {chapter.games.length > 0 && !isPreReader && (
                      <p className="text-[10px] font-bold text-slate-400 mt-1">
                        Contains {chapter.games.length} learning {chapter.games.length === 1 ? 'game' : 'games'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Stars Rating & Action */}
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-slate-100/55 pt-3 sm:pt-0">
                  {/* Stars */}
                  {chapter.games.length > 0 ? (
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((n) => (
                        <Star
                          key={n}
                          size={20}
                          className={n <= chapter.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-lg">
                      Read Only
                    </span>
                  )}

                  {/* Play Button */}
                  {chapter.games.length > 0 && (
                    <button
                      onClick={() => navigate(`/batch1/games?chapter=${chapter.chapterRef}`)}
                      className={`h-11 px-4 sm:px-5 rounded-xl font-display font-black text-xs text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 ${getSubjectColor(activeSubject)}`}
                      style={{ minWidth: 80 }}
                    >
                      <span>Play</span>
                      <ArrowRight size={14} strokeWidth={3} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
