import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { getClassTheme } from './theme';
import { LiveClassCard } from './LiveClassCard';
import { ActionTile } from './ui';

/**
 * Batch 1 Home — six doors.
 *
 * What was wrong before, and what each fix is for:
 *
 *  • Class 1–2 saw the tiles with every text label stripped out, on the theory
 *    that a pre-reader cannot use words. In practice that left six coloured
 *    rectangles distinguished only by a star, a tick and a folded map — symbols
 *    whose meaning ("quizzes", "tasks", "syllabus") is adult convention, not
 *    something a child can work out. Labels now always render. A picture with
 *    its word underneath is how a six-year-old learns the word; the picture
 *    alone teaches nothing and is guessed at.
 *
 *  • Three dense adult panels (today's lab periods, pending tasks, open exams)
 *    sat above the tiles and pushed them off the first screen. The one urgent
 *    thing there — your teacher is live — is now its own card, and the counts
 *    became badges on the doors they belong to, so "2" on the Tasks tile says
 *    what "Pending Tasks / Math Calculations / Mathematics" was saying.
 *
 *  • The header (avatar, stars, streak, exit) moved into the layout, so it is
 *    identical here and on every inner page instead of being drawn twice.
 */

interface Door {
  emoji: string;
  artKey: string;
  label: string;
  /** One short phrase, shown from Class 3 up where a child can read it. */
  hint: string;
  href: string;
  from: string;
  to: string;
  shadow: string;
  /** Which count, if any, rides on this tile as a badge. */
  badge?: 'tasks' | 'exams';
}

const DOORS: Door[] = [
  { emoji: '🎮', artKey: 'nav-games', label: 'Games', hint: 'Play and win stars', href: '/batch1/games', from: '#83E33A', to: '#54C000', shadow: '#3F9C00' },
  { emoji: '📖', artKey: 'nav-stories', label: 'Stories', hint: 'Read along with me', href: '/batch1/stories', from: '#4FC3FF', to: '#1CA5F1', shadow: '#0E86CC' },
  { emoji: '🗺️', artKey: 'nav-journey', label: 'My Journey', hint: 'See how far you got', href: '/batch1/syllabus', from: '#3ADCCB', to: '#00BCAA', shadow: '#00988A' },
  { emoji: '✅', artKey: 'nav-tasks', label: 'My Work', hint: 'Jobs from your teacher', href: '/batch1/tasks', from: '#BE85FF', to: '#9A4DF6', shadow: '#7C31D6', badge: 'tasks' },
  { emoji: '⭐', artKey: 'nav-quizzes', label: 'Quiz Time', hint: 'Show what you know', href: '/batch1/exams', from: '#FFD53E', to: '#FFB100', shadow: '#DB9A00', badge: 'exams' },
  { emoji: '🏆', artKey: 'nav-trophies', label: 'My Trophies', hint: 'Badges you have won', href: '/batch1/my-stuff', from: '#FF9BC6', to: '#FF62A5', shadow: '#E2418B' },
];

interface TaskAssignment { status: 'not_started' | 'in_progress' | 'in_review' | 'completed' }
interface ExamListItem { state: 'upcoming' | 'open' | 'submitted' | 'closed' }

export const Batch1Home: React.FC = () => {
  const { currentClass } = useApp();
  const [counts, setCounts] = useState<{ tasks: number; exams: number }>({ tasks: 0, exams: 0 });
  const theme = getClassTheme(currentClass);

  // Class 1–2 get the picture and the word. Class 3–4 also get the hint line,
  // which is a short phrase rather than a sentence.
  const showHints = currentClass >= 3;

  useEffect(() => {
    let cancelled = false;

    // Counts only. A failure here must never blank the doors, so each settles
    // on its own and a rejection just leaves that badge at zero.
    void Promise.allSettled([
      api.get<TaskAssignment[]>('/student/tasks'),
      api.get<ExamListItem[]>('/student/exams'),
    ]).then(([t, e]) => {
      if (cancelled) return;
      setCounts({
        tasks: t.status === 'fulfilled' ? t.value.filter((a) => a.status !== 'completed').length : 0,
        exams: e.status === 'fulfilled' ? e.value.filter((x) => x.state === 'open').length : 0,
      });
    });

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex flex-col gap-5 anim-fade-up flex-1">
      <LiveClassCard mascot={theme.mascot} />

      {/* One row of six on a lab monitor, folding to 3x2 then 2x3 as the screen
          narrows. Portrait tiles: a 3-column grid stretched across a full-width
          page produced 520px-wide letterboxes.

          `content-center` matters on the fixed 1680x1050 screens these labs
          run: the row would otherwise pin to the top and leave a 300px band of
          empty sky between the doors and the hill. Centring splits that space
          above and below so the screen reads as composed rather than unfinished. */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5 flex-1 content-center">
        {DOORS.map((d) => (
          <ActionTile
            key={d.href}
            to={d.href}
            emoji={d.emoji}
            artKey={d.artKey}
            label={d.label}
            subtitle={showHints ? d.hint : undefined}
            from={d.from}
            to_={d.to}
            shadow={d.shadow}
            badge={d.badge ? counts[d.badge] : undefined}
          />
        ))}
      </div>
    </div>
  );
};
