import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, Star } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { SUBJECT_ORDER, activitiesForClass, activityByGameId, normalizePracticeSubject, type ChapterActivity } from '../../data/activities';
import { PracticeEngine } from './PracticeEngine';

interface GameProgress {
  gameId: string;
  stars: number;
  locked: boolean;
}

interface AttemptResponse {
  attempt: { stars: number; best_score: number };
  xpGained: number;
}

export const Batch2Activities: React.FC = () => {
  const { currentClass } = useApp();
  const { refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [progress, setProgress] = useState<Map<string, GameProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [active, setActive] = useState<ChapterActivity | null>(null);
  /* A failed save used to be masked with a fabricated local star/XP grant —
     the student believed it was recorded when it never reached the server.
     Track it honestly instead, with a one-tap retry of the same result. */
  const [saveError, setSaveError] = useState<{ gameId: string; stars: number; score: number } | null>(null);

  const catalog = useMemo(() => activitiesForClass(currentClass), [currentClass]);
  const subjects = useMemo(() => {
    const present = new Set(catalog.map((a) => a.subject));
    return SUBJECT_ORDER.filter((s) => present.has(s));
  }, [catalog]);

  useEffect(() => {
    const fromUrl = searchParams.get('subject');
    if (fromUrl) {
      const mapped = normalizePracticeSubject(fromUrl);
      if (subjects.includes(mapped as (typeof SUBJECT_ORDER)[number])) {
        setSubject(mapped);
        return;
      }
    }
    if (!subject && subjects[0]) setSubject(subjects[0]);
  }, [searchParams, subject, subjects]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<{ games: GameProgress[] }>('/student/games')
      .then((res) => {
        if (cancelled) return;
        setProgress(new Map((res.games ?? []).map((g) => [g.gameId, g])));
      })
      .catch(() => {
        if (!cancelled) setProgress(new Map());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentClass]);

  useEffect(() => {
    const gameId = searchParams.get('game');
    if (!gameId) return;
    const found = activityByGameId(gameId);
    if (found && found.classNum === currentClass) {
      setActive(found);
      setSubject(found.subject);
    }
  }, [searchParams, currentClass]);

  const focusChapter = Number(searchParams.get('chapter') ?? '');

  useEffect(() => {
    if (!focusChapter || active) return;
    const el = document.getElementById(`practice-ch-${focusChapter}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focusChapter, subject, loading, active]);

  const chapters = useMemo(() => {
    const rows = catalog.filter((a) => a.subject === subject);
    const byChapter = new Map<number, ChapterActivity[]>();
    for (const a of rows) {
      const list = byChapter.get(a.chapterNum) ?? [];
      list.push(a);
      byChapter.set(a.chapterNum, list);
    }
    return [...byChapter.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([chapterNum, activities]) => ({
        chapterNum,
        title: activities[0].chapterTitle,
        activities,
      }));
  }, [catalog, subject]);

  const submit = useCallback(
    async (gameId: string, stars: number, score: number) => {
      try {
        const res = await api.post<AttemptResponse>(`/student/games/${gameId}/attempts`, { stars, score });
        setProgress((prev) => {
          const next = new Map(prev);
          const old = next.get(gameId);
          next.set(gameId, {
            gameId,
            stars: Math.max(old?.stars ?? 0, res.attempt.stars),
            locked: false,
          });
          return next;
        });
        setSaveError(null);
        if (res.xpGained > 0) void refreshUser();
      } catch (err) {
        /* The attempt never reached the server — no stars, no XP. Faking a
           local success here would tell the student their progress was
           saved when it wasn't, so surface the failure instead. */
        console.error('Failed to save activity attempt:', err);
        setSaveError({ gameId, stars, score });
      }
    },
    [refreshUser],
  );

  const saveErrorToast = saveError && (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-bold bg-rose-500 anim-fade-up">
      <AlertTriangle size={14} className="shrink-0" />
      <span>Couldn't save your progress. Try again?</span>
      <button
        type="button"
        onClick={() => void submit(saveError.gameId, saveError.stars, saveError.score)}
        className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 font-black text-xs"
      >
        Retry
      </button>
    </div>
  );

  if (active) {
    return (
      <>
        {saveErrorToast}
        <PracticeEngine
          activity={active}
          onFinish={submit}
          onClose={() => {
            setActive(null);
            setSearchParams({});
          }}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      {saveErrorToast}
      <div>
        <h2 className="font-display font-extrabold text-xl text-slate-800">Activities</h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          Class {currentClass} · every subject, chapters in textbook order
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {subjects.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setSubject(s);
              setSearchParams({ subject: s });
            }}
            className={`py-2 px-4 rounded-full text-xs font-bold transition-all ${
              subject === s ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-xs font-bold">Loading your chapters…</span>
        </div>
      ) : chapters.length === 0 ? (
        <p className="text-xs text-slate-400">No practice activities for this subject yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {chapters.map((ch) => (
            <div
              key={ch.chapterNum}
              id={`practice-ch-${ch.chapterNum}`}
              className={`bg-white rounded-2xl shadow-xs p-4 border ${
                focusChapter === ch.chapterNum ? 'border-sky-300 ring-2 ring-sky-100' : 'border-slate-100'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="shrink-0 w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center font-display font-black text-[11px] text-sky-600">
                  {ch.chapterNum}
                </span>
                <span className="font-display font-bold text-sm text-slate-800">{ch.title}</span>
              </div>
              <div className="flex flex-col gap-2">
                {ch.activities.map((a) => {
                  const stars = progress.get(a.gameId)?.stars ?? 0;
                  return (
                    <button
                      key={a.gameId}
                      type="button"
                      onClick={() => {
                        setActive(a);
                        setSearchParams({ game: a.gameId });
                      }}
                      className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-left hover:border-sky-200 hover:bg-sky-50/40"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{a.icon}</span>
                        <span className="min-w-0">
                          <span className="block font-display font-bold text-xs text-slate-800 truncate">{a.name}</span>
                          <span className="block text-[10px] text-slate-400 truncate">
                            {a.questions.length} questions · {a.description}
                          </span>
                        </span>
                      </span>
                      <span className="flex gap-0.5 shrink-0">
                        {[1, 2, 3].map((s) => (
                          <Star key={s} size={12} className={s <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
