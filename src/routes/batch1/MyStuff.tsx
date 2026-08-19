import React from 'react';
import { useApp } from '../../context/AppContext';
import { BadgeGrid } from '../../components/shared/BadgeGrid';
import { StreakCalendar } from '../../components/shared/StreakCalendar';
import { ProfileCard } from '../../components/shared/ProfileCard';
import { getClassTheme } from './theme';
import { Card, PageHeader, Pic, SectionTitle, T } from './ui';

/**
 * My Trophies — badges, streak and student card.
 *
 * The page was already the right idea; what it lacked was hierarchy. Its own
 * gold gradient banner repeated the stars and streak that the header shows on
 * every screen anyway, and each of the three sections announced itself with a
 * bare emoji and a heading that Class 1–2 never saw, so a pre-reader met three
 * unexplained blocks. Same three sections, now with a title and a plain-English
 * line each — kept for every class, because a child who cannot read the words
 * is sitting beside a teacher who can.
 */
export const Batch1MyStuff: React.FC = () => {
  const { studentName, studentAvatar, currentClass } = useApp();
  const theme = getClassTheme(currentClass);

  return (
    <div className="flex flex-col gap-5 anim-fade-up">
      <PageHeader
        emoji={studentAvatar || theme.mascot}
        title={`${studentName}'s Trophies`}
        hint="Everything you have won so far"
      />

      {/* Two columns on a wide screen. Stacked, these three cards ran the full
          1560px width one under another, and the student card — which is a
          fixed narrow panel — sat marooned in the middle of a very wide box. */}
      <div className="grid gap-5 xl:grid-cols-2 items-start">
        <Card className="flex flex-col gap-4">
          <SectionTitle emoji="🏅" title="My Badges" hint="Win these by finishing games and quizzes" />
          <BadgeGrid accent="amber" variant="medallion" />
        </Card>

        <div className="flex flex-col gap-5">
          <Card className="flex flex-col gap-4">
            <SectionTitle emoji="🔥" title="My Streak" hint="Every day you come and play lights up a step" />
            <StreakCalendar accent="amber" variant="trail" />
          </Card>

          <Card className="flex flex-col gap-4">
            <SectionTitle emoji="🪪" title="My Card" hint="Your name, your class, and how you log in" />
            <ProfileCard accent="amber" pinMode />
          </Card>
        </div>
      </div>

      <Card className="flex items-center justify-center gap-2.5 py-4">
        <Pic emoji={theme.mascot} size={26} />
        <span className="font-display font-black text-sm" style={{ color: T.ink.muted }}>
          Keep playing to win more!
        </span>
      </Card>
    </div>
  );
};
