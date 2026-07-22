import React from 'react';
import { useApp } from '../../context/AppContext';
import { BadgeGrid } from '../../components/shared/BadgeGrid';
import { StreakCalendar } from '../../components/shared/StreakCalendar';
import { ProfileCard } from '../../components/shared/ProfileCard';

/**
 * My Stuff — Trophy-shelf view merging Progress + Badges + Streak + Profile.
 *
 * Design (BATCH1_UI_CONTENT_PLAN §2.1):
 * - One page instead of 4 separate routes.
 * - Reuses existing shared components (BadgeGrid, StreakCalendar, ProfileCard).
 * - Playful trophy-room visual with 3 stacked sections.
 * - Pre-reader variant: no text headings, just emojis.
 */
export const Batch1MyStuff: React.FC = () => {
  const { studentName, studentAvatar, studentXP, studentStreak, currentClass } = useApp();
  const isPreReader = currentClass <= 2;

  return (
    <div className="flex flex-col gap-6 select-none anim-fade-up">
      {/* Trophy header */}
      <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 rounded-3xl p-5 sm:p-6
                      flex items-center gap-4 shadow-lg shadow-amber-400/20 border border-amber-300/50">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/90 border-2 border-amber-300
                        flex items-center justify-center text-4xl sm:text-5xl shadow-inner select-none">
          {studentAvatar}
        </div>
        <div className="flex-1">
          <h1 className="font-display font-black text-xl sm:text-2xl text-amber-950">
            {isPreReader ? `🏆 ${studentName}` : `${studentName}'s Trophy Room`}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1.5 bg-white/80 rounded-xl px-3 py-1.5 text-sm font-black text-amber-800 shadow-sm">
              ⭐ {studentXP.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/80 rounded-xl px-3 py-1.5 text-sm font-black text-orange-800 shadow-sm">
              🔥 {studentStreak} {!isPreReader && 'days'}
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: My Badges */}
      <section className="bg-white rounded-3xl border border-amber-100 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🏅</span>
          {!isPreReader && (
            <h2 className="font-display font-black text-lg text-slate-800">My Badges</h2>
          )}
        </div>
        <BadgeGrid accent="amber" variant="medallion" />
      </section>

      {/* Section 2: My Streak */}
      <section className="bg-white rounded-3xl border border-amber-100 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📅</span>
          {!isPreReader && (
            <h2 className="font-display font-black text-lg text-slate-800">My Streak Path</h2>
          )}
        </div>
        <StreakCalendar accent="amber" variant="trail" />
      </section>

      {/* Section 3: My Card */}
      <section className="bg-white rounded-3xl border border-amber-100 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🦊</span>
          {!isPreReader && (
            <h2 className="font-display font-black text-lg text-slate-800">My Student Card</h2>
          )}
        </div>
        <ProfileCard accent="amber" pinMode />
      </section>
    </div>
  );
};
