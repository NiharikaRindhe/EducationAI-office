import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Check } from 'lucide-react';
import { Card, EmptyState, PageHeader, Pic, ProgressBar, Skeleton, T } from './ui';

/**
 * My Work — the Class 1–4 face of task assignments.
 *
 * The route used to render the shared `<TaskList accent="amber" />`: a row of
 * four analytics tiles (Completed / In Progress / Pending / XP Earned), a
 * "Task Progress" meter, then rows tagged with status pills reading
 * "Not Started", "In Review" and "+40 XP". Every one of those is a term a
 * seven-year-old has no way to interpret, and the tiles are a dashboard for
 * whoever is measuring the child rather than a screen for the child.
 *
 * Same data, same endpoint, same tap-to-advance behaviour — but one job per
 * card, a picture on each, and words a child can read. "In Review" becomes
 * "Teacher is checking", which is what it actually means to them.
 */

type Status = 'not_started' | 'in_progress' | 'in_review' | 'completed';

interface TaskAssignment {
  id: string;
  status: Status;
  xp_awarded: number;
  completed_at: string | null;
  tasks: {
    id: string;
    title: string;
    subject: string;
    task_type: string;
    instructions: string | null;
    xp_reward: number;
    due_date: string | null;
  };
}

/** What each state means to a child, not to the database. */
const SAY: Record<Status, { label: string; tint: string; ink: string }> = {
  not_started: { label: 'To do', tint: '#FFF3D6', ink: '#96690A' },
  in_progress: { label: 'Doing it', tint: '#DCF0FF', ink: '#0E6FA8' },
  in_review: { label: 'Teacher is checking', tint: '#EDE3FF', ink: '#6B34C4' },
  completed: { label: 'Done!', tint: '#DCF7E3', ink: '#1B7F41' },
};

const SUBJECT_PIC = (subject: string): string => {
  const s = subject.toLowerCase();
  if (s.includes('math')) return '🔢';
  if (s.includes('english')) return '📖';
  if (s.includes('hindi')) return '📗';
  if (s.includes('science') || s.includes('evs')) return '🌱';
  if (s.includes('art') || s.includes('draw')) return '🎨';
  return '📚';
};

export const Batch1Tasks: React.FC = () => {
  const [assignments, setAssignments] = useState<TaskAssignment[] | null>(null);
  // Which card is mid-update, so a double tap cannot fire two status changes.
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setAssignments(await api.get<TaskAssignment[]>('/student/tasks'));
  }, []);

  useEffect(() => { void load(); }, [load]);

  const doneCount = assignments?.filter((a) => a.status === 'completed').length ?? 0;

  const advance = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    try {
      await api.patch(`/student/tasks/${id}/status`, {});
      await load();
    } finally {
      setBusyId(null);
    }
  };

  if (!assignments) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader emoji="✅" artKey="nav-tasks" title="My Work" hint="Jobs your teacher gave you" />
        <Skeleton height={96} /><Skeleton height={96} /><Skeleton height={96} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 anim-fade-up">
      {/* Progress rides in the header rather than in a card of its own: a
          full-width panel wrapped around a single progress bar stretched that
          bar across the whole screen and said very little for the space. */}
      <PageHeader
        emoji="✅"
        artKey="nav-tasks"
        title="My Work"
        hint="Jobs your teacher gave you"
        right={assignments.length > 0 ? (
          <div className="hidden sm:flex items-center gap-3 bg-white px-5 py-3 shrink-0"
               style={{ borderRadius: T.radius.md, boxShadow: T.shadow.card, minWidth: 240 }}>
            <Pic emoji={doneCount === assignments.length ? '🏆' : '📋'} size={32} />
            <div className="flex-1">
              <p className="font-display font-black text-sm mb-1.5" style={{ color: T.ink.strong }}>
                {doneCount === assignments.length
                  ? 'All done!'
                  : `${doneCount} of ${assignments.length} done`}
              </p>
              <ProgressBar value={doneCount} max={assignments.length} />
            </div>
          </div>
        ) : undefined}
      />

      {assignments.length === 0 ? (
        <EmptyState
          emoji="🎈"
          title="Nothing to do!"
          body="Your teacher has not given you any work right now."
          action={{ label: 'Go and play', to: '/batch1/games' }}
        />
      ) : (
        <>
          {/* Narrow screens have no room in the header, so the same summary
              appears as a card there instead. */}
          <Card className="flex sm:hidden items-center gap-4">
            <Pic emoji={doneCount === assignments.length ? '🏆' : '📋'} size={40} />
            <div className="flex-1 min-w-0">
              <p className="font-display font-black text-base mb-2" style={{ color: T.ink.strong }}>
                {doneCount === assignments.length
                  ? 'You finished everything!'
                  : `${doneCount} of ${assignments.length} done`}
              </p>
              <ProgressBar value={doneCount} max={assignments.length} />
            </div>
          </Card>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {assignments.map((a) => {
              const say = SAY[a.status];
              const isDone = a.status === 'completed';
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => void advance(a.id)}
                  disabled={busyId !== null}
                  aria-label={`${a.tasks.title} — ${say.label}. Tap to change.`}
                  className="w-full text-left bg-white flex items-center gap-4 p-4 sm:p-5
                             transition-transform duration-100 active:translate-y-[3px] cursor-pointer
                             disabled:opacity-60 disabled:pointer-events-none"
                  style={{
                    minHeight: 92,
                    borderRadius: T.radius.md,
                    boxShadow: T.shadow.card,
                    border: `2px solid ${isDone ? '#B6E9C6' : 'transparent'}`,
                  }}
                >
                  <span
                    className="flex items-center justify-center shrink-0"
                    style={{ width: 56, height: 56, borderRadius: T.radius.sm, background: T.surface.sunk }}
                  >
                    <Pic emoji={SUBJECT_PIC(a.tasks.subject)} size={34} />
                  </span>

                  <span className="flex-1 min-w-0">
                    <span className="block font-display font-black text-base sm:text-lg leading-snug"
                          style={{ color: T.ink.strong, textDecoration: isDone ? 'line-through' : 'none' }}>
                      {a.tasks.title}
                    </span>
                    <span
                      className="inline-block mt-1.5 px-3 py-1 font-black text-xs"
                      style={{ borderRadius: 999, background: say.tint, color: say.ink }}
                    >
                      {say.label}
                    </span>
                  </span>

                  {/* A big tick box — the affordance that says "tap me when done". */}
                  <span
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 48, height: 48, borderRadius: T.radius.sm,
                      background: isDone ? '#3FBF6A' : '#FFFFFF',
                      border: `2px solid ${isDone ? '#3FBF6A' : T.surface.line}`,
                      color: '#FFFFFF',
                    }}
                  >
                    <Check size={26} strokeWidth={3} style={{ opacity: isDone ? 1 : 0.22, color: isDone ? '#fff' : T.ink.faint }} />
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
