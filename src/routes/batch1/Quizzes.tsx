import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Lock, CheckCircle2, Play } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { ExamTaking } from '../../components/shared/ExamCenter';
import { Button, Card, EmptyState, PageHeader, Pic, Skeleton, StarRow, T } from './ui';

/**
 * Quiz Time — the Class 1–4 face of the exam system.
 *
 * The route used to render `<ExamCenter accent="amber" />` unchanged, which is
 * the same screen a Class 10 student sees: exams grouped under "Open Now /
 * Upcoming / Completed / Closed", each card reading "Mathematics · 45 min ·
 * 50 marks", and an empty state that printed one grey adult sentence — "No
 * exams assigned yet — they'll appear here when your teacher publishes one." —
 * on an otherwise blank page. On a normal day, when nothing is assigned, that
 * was the entire screen a six-year-old got.
 *
 * The paper itself is NOT reimplemented here. Tapping Start mounts the shared
 * `ExamTaking`, so the timer, autosave, crash-resume and proctoring are exactly
 * the ones every other batch uses and a teacher's marks come back the same way.
 * Only the list around it is rewritten, in words and sizes that fit the age.
 */

interface ExamListItem {
  id: string;
  title: string;
  subject: string;
  durationMin: number;
  totalMarks: number;
  startsAt: string | null;
  endsAt: string | null;
  state: 'upcoming' | 'open' | 'submitted' | 'closed';
  inProgress: boolean;
  result: { totalScore: number | null; maxScore: number | null; isReviewed: boolean; autoSubmitted: boolean } | null;
}

const SUBJECT_PIC = (subject: string): string => {
  const s = subject.toLowerCase();
  if (s.includes('math')) return '🔢';
  if (s.includes('english')) return '📖';
  if (s.includes('hindi')) return '📗';
  if (s.includes('science') || s.includes('evs')) return '🌱';
  return '📚';
};

/** A day a child can read, e.g. "Mon 25 Aug". Never a timestamp. */
const friendlyDay = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '';

/** Score as stars, so the result reads the same as every game in the portal. */
const starsForScore = (score: number, max: number): number => {
  if (max <= 0) return 0;
  const pct = score / max;
  return pct >= 0.85 ? 3 : pct >= 0.6 ? 2 : pct >= 0.35 ? 1 : 0;
};

export const Batch1Quizzes: React.FC = () => {
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [takingExamId, setTakingExamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setExams(await api.get<ExamListItem[]>('/student/exams'));
      setError('');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not load your quizzes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (takingExamId) {
    return (
      <ExamTaking
        accent="amber"
        examId={takingExamId}
        onExit={() => { setTakingExamId(null); void load(); }}
      />
    );
  }

  const open = exams.filter((e) => e.state === 'open');
  const done = exams.filter((e) => e.state === 'submitted');
  const later = exams.filter((e) => e.state === 'upcoming');

  return (
    <div className="flex flex-col gap-5 anim-fade-up">
      <PageHeader
        emoji="⭐"
        artKey="nav-quizzes"
        title="Quiz Time"
        hint="Little quizzes your teacher sets for you"
      />

      {error && (
        <Card className="flex items-center gap-3">
          <Pic emoji="😕" size={32} />
          <p className="font-bold text-sm" style={{ color: T.ink.strong }}>{error}</p>
          <Button tone="quiet" onClick={() => void load()} className="ml-auto">Try again</Button>
        </Card>
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton height={150} /><Skeleton height={150} />
        </div>
      )}

      {/* The ordinary day: the teacher has not set anything. Say so warmly and
          point at something the child can actually do instead of dead-ending. */}
      {!isLoading && exams.length === 0 && (
        <EmptyState
          emoji="🌈"
          title="No quiz today!"
          body="Your teacher has not sent you a quiz yet. Come back another day."
          action={{ label: 'Go and play', to: '/batch1/games' }}
        />
      )}

      {open.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display font-black text-lg" style={{ color: T.ink.strong }}>Ready for you now</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {open.map((exam) => (
              <div
                key={exam.id}
                className="relative overflow-hidden p-5 flex flex-col gap-4"
                style={{
                  borderRadius: T.radius.md,
                  background: 'linear-gradient(180deg,#FFD53E,#FFB100)',
                  boxShadow: '0 6px 0 #DB9A00, 0 16px 28px rgba(255,177,0,.30)',
                }}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 pointer-events-none"
                  style={{ height: '42%', background: 'linear-gradient(180deg,rgba(255,255,255,.30),rgba(255,255,255,0))' }}
                />
                <div className="relative flex items-center gap-3">
                  <span className="flex items-center justify-center shrink-0"
                        style={{ width: 56, height: 56, borderRadius: T.radius.sm, background: 'rgba(255,255,255,.92)' }}>
                    <Pic emoji={SUBJECT_PIC(exam.subject)} size={34} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display font-black text-lg text-white leading-tight"
                        style={{ textShadow: '0 2px 3px rgba(0,0,0,.18)' }}>
                      {exam.title}
                    </h3>
                    <p className="font-bold text-xs text-white/90">
                      {exam.subject}
                      {exam.endsAt ? ` · finish by ${friendlyDay(exam.endsAt)}` : ''}
                    </p>
                  </div>
                </div>
                <Button
                  tone="quiet"
                  block
                  onClick={() => setTakingExamId(exam.id)}
                  icon={<Play size={20} />}
                >
                  {exam.inProgress ? 'Carry on' : 'Start'}
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display font-black text-lg" style={{ color: T.ink.strong }}>All finished</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {done.map((exam) => {
              const score = exam.result?.totalScore;
              const max = exam.result?.maxScore ?? exam.totalMarks;
              const graded = exam.result?.isReviewed && score !== null && score !== undefined;
              return (
                <Card key={exam.id} className="flex items-center gap-4">
                  <span className="flex items-center justify-center shrink-0"
                        style={{ width: 56, height: 56, borderRadius: T.radius.sm, background: T.surface.sunk }}>
                    <Pic emoji={SUBJECT_PIC(exam.subject)} size={34} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-black text-base truncate" style={{ color: T.ink.strong }}>
                      {exam.title}
                    </h3>
                    {graded ? (
                      <div className="flex items-center gap-2 mt-1">
                        <StarRow earned={starsForScore(score, max)} size={18} />
                        <span className="font-display font-black text-sm" style={{ color: T.ink.muted }}>
                          {score} out of {max}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm font-bold flex items-center gap-1.5 mt-1" style={{ color: T.ink.muted }}>
                        <CheckCircle2 size={15} className="text-emerald-500" />
                        Sent to your teacher
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {later.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display font-black text-lg" style={{ color: T.ink.strong }}>Coming soon</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {later.map((exam) => (
              <Card key={exam.id} className="flex items-center gap-4 opacity-90">
                <span className="flex items-center justify-center shrink-0"
                      style={{ width: 56, height: 56, borderRadius: T.radius.sm, background: T.surface.sunk }}>
                  <Lock size={24} style={{ color: T.ink.faint }} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display font-black text-base truncate" style={{ color: T.ink.strong }}>
                    {exam.title}
                  </h3>
                  <p className="text-sm font-bold" style={{ color: T.ink.muted }}>
                    Opens {friendlyDay(exam.startsAt)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* A quiz whose window shut without being taken is the teacher's business,
          not something to show a child as a failure. Deliberately not listed. */}
      {isLoading && <span className="sr-only"><Loader2 /> Loading</span>}
    </div>
  );
};
