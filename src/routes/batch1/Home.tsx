import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { getClassTheme } from './theme';
import { LiveClassCard } from './LiveClassCard';
import { ActionTile, Pic, T, type TileMeter } from './ui';

/**
 * Batch 1 Home — five doors.
 *
 * What was wrong before, and what each fix is for:
 *
 *  • Class 1–2 saw the tiles with every text label stripped out, on the theory
 *    that a pre-reader cannot use words. In practice that left five coloured
 *    rectangles distinguished only by a star, a tick and a trophy — symbols
 *    whose meaning ("quizzes", "tasks", "trophies") is adult convention, not
 *    something a child can work out. Labels and the one-line subtitle now
 *    always render, for every class. A picture with its word underneath is
 *    how a six-year-old learns the word; the picture alone teaches nothing
 *    and the subtitle is not a harder read than the label next to it.
 *
 *  • "My Journey" is no longer its own door. It is not deleted — the page,
 *    its chapter map and its unlock logic are untouched — it now lives one
 *    tap inside Games ("See my map"), which is where a child actually reaches
 *    for it: while choosing what to play, not from the front hall.
 *
 *  • Every tile's progress bar used to be either invented or simply absent.
 *    Each meter below reads real numbers from the same endpoint that tile's
 *    own page already calls — stars earned out of every game's 3, tasks
 *    finished, quizzes taken, badges won. Stories has no persistent
 *    completion tracking anywhere in the app (its "read" state lives only in
 *    that page's component state), so its tile gets an honest caption
 *    instead of a bar that would reset itself the moment the page reloads.
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
  subtitle: string;
  href: string;
  accent: string;
  /** Which count, if any, rides on this tile as a badge. */
  badge?: 'tasks' | 'exams';
  /** Which live-computed progress meter, if any, this tile shows. */
  meterKey?: 'games' | 'tasks' | 'exams' | 'badges';
}

const DOORS: Door[] = [
  { emoji: '🎮', artKey: 'nav-games', label: 'Games', subtitle: 'Play and have fun', href: '/batch1/games', accent: '#3FA84B', meterKey: 'games' },
  { emoji: '📖', artKey: 'nav-stories', label: 'Stories', subtitle: 'Read and enjoy', href: '/batch1/stories', accent: '#3B7DDE' },
  { emoji: '⭐', artKey: 'nav-quizzes', label: 'Quiz Time', subtitle: 'Test what you know', href: '/batch1/exams', accent: '#E0900A', badge: 'exams', meterKey: 'exams' },
  { emoji: '✅', artKey: 'nav-tasks', label: 'My Work', subtitle: 'See your homework', href: '/batch1/tasks', accent: '#DE4F8B', badge: 'tasks', meterKey: 'tasks' },
  { emoji: '🏆', artKey: 'nav-trophies', label: 'My Trophies', subtitle: 'Badges you earned', href: '/batch1/my-stuff', accent: '#7C4FE0', meterKey: 'badges' },
];

/** Stories has no completion tracking anywhere the app persists, so its tile
 *  says something true — how many stories are here — instead of a bar that
 *  would always read empty on a fresh load. Matches `storiesData.length` in
 *  Stories.tsx; update together if a story is added or removed. */
const STORIES_CAPTION = '4 stories waiting';

interface GameListItem { stars: number }
interface TaskAssignment { status: 'not_started' | 'in_progress' | 'in_review' | 'completed' }
interface ExamListItem { state: 'upcoming' | 'open' | 'submitted' | 'closed' }
interface BadgeEntry { earned: boolean }

interface Counts { tasks: number; exams: number }
type Meters = Partial<Record<'games' | 'tasks' | 'exams' | 'badges', TileMeter>>;

export const Batch1Home: React.FC = () => {
  const { currentClass } = useApp();
  const [counts, setCounts] = useState<Counts>({ tasks: 0, exams: 0 });
  const [meters, setMeters] = useState<Meters>({});
  const theme = getClassTheme(currentClass);

  useEffect(() => {
    let cancelled = false;

    // Every source settles on its own — one endpoint being slow or down must
    // never blank the doors a child can still use, so a rejection just leaves
    // that one tile's badge/meter at its empty state.
    void Promise.allSettled([
      api.get<{ games: GameListItem[] }>('/student/games'),
      api.get<TaskAssignment[]>('/student/tasks'),
      api.get<ExamListItem[]>('/student/exams'),
      api.get<BadgeEntry[]>('/student/badges'),
    ]).then(([g, t, e, b]) => {
      if (cancelled) return;

      const tasks = t.status === 'fulfilled' ? t.value : [];
      const exams = e.status === 'fulfilled' ? e.value : [];

      setCounts({
        tasks: tasks.filter((a) => a.status !== 'completed').length,
        exams: exams.filter((x) => x.state === 'open').length,
      });

      const next: Meters = {};

      if (g.status === 'fulfilled' && g.value.games.length > 0) {
        const games = g.value.games;
        next.games = { value: games.reduce((sum, x) => sum + x.stars, 0), max: games.length * 3 };
      }
      if (tasks.length > 0) {
        next.tasks = { value: tasks.filter((a) => a.status === 'completed').length, max: tasks.length };
      }
      if (exams.length > 0) {
        next.exams = { value: exams.filter((x) => x.state === 'submitted').length, max: exams.length };
      }
      if (b.status === 'fulfilled' && b.value.length > 0) {
        next.badges = { value: b.value.filter((x) => x.earned).length, max: b.value.length };
      }
      setMeters(next);
    });

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex flex-col gap-5 anim-fade-up flex-1">
      <LiveClassCard />

      {/* One row of five on a lab monitor, folding to 3+2 then 2x3 as the
          screen narrows. Portrait tiles: a 3-column grid stretched across a
          full-width page produced 520px-wide letterboxes.

          `content-center` matters on the fixed 1680x1050 screens these labs
          run: the row would otherwise pin to the top and leave a 300px band of
          empty sky between the doors and the hill. Centring splits that space
          above and below so the screen reads as composed rather than unfinished. */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        {DOORS.map((d) => (
          <ActionTile
            key={d.href}
            to={d.href}
            emoji={d.emoji}
            artKey={d.artKey}
            label={d.label}
            subtitle={d.subtitle}
            accent={d.accent}
            badge={d.badge ? counts[d.badge] : undefined}
            meter={d.meterKey ? meters[d.meterKey] : undefined}
            caption={d.label === 'Stories' ? STORIES_CAPTION : undefined}
          />
        ))}
      </div>

      {/* Encouragement strip — from the mockup. Deliberately not a data
          readout (no invented "you're doing great, 73%!" number): just a
          warm, constant line, the way the reference shows it. */}
      <div
        className="self-center mt-1 flex items-center gap-2.5 bg-white px-5 py-3"
        style={{ borderRadius: 999, boxShadow: T.shadow.card }}
      >
        <Pic emoji="🌟" size={22} />
        <span className="font-display font-black text-sm" style={{ color: T.ink.strong }}>
          Little steps every day, big progress always!
        </span>
        <Heart size={16} className="fill-current" style={{ color: theme.accent }} />
      </div>
    </div>
  );
};
