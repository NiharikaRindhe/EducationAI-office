import React from 'react';
import { BadgeGrid } from '../../components/shared/BadgeGrid';
import { StreakCalendar } from '../../components/shared/StreakCalendar';
import { ChallengeList } from '../../components/shared/ChallengeList';
import { ProfileCard } from '../../components/shared/ProfileCard';
import { PyqBrowser } from '../../components/shared/PyqBrowser';
import { LeaderboardView } from '../../components/shared/LeaderboardView';
import { NotesView } from '../../components/shared/NotesView';

/* ----------------------------------------------------
   1. BATCH 2 STUDY NOTES — real notes, backed by /student/notes
   ---------------------------------------------------- */
export const Batch2Notes: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      <div>
        <h2 className="font-display font-extrabold text-xl text-slate-800">My Study Notes</h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5">Create, edit, and filter your class revision notes.</p>
      </div>
      <NotesView accent="indigo" />
    </div>
  );
};

/* ----------------------------------------------------
   2. BATCH 2 PAST YEAR QUESTIONS (PYQ) HUB
   ---------------------------------------------------- */
export const Batch2Pyq: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      <div>
        <h2 className="font-display font-extrabold text-xl text-slate-800">PYQ Hub</h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5">Browse past board exam questions by subject for practice.</p>
      </div>
      <PyqBrowser accent="indigo" />
    </div>
  );
};

/* ----------------------------------------------------
   3. BATCH 2 LEADERBOARD — real school+batch rankings
   ---------------------------------------------------- */
export const Batch2Leaderboard: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      <div>
        <h2 className="font-display font-extrabold text-xl text-slate-800">Leaderboards</h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5">See where you stand in your class this week.</p>
      </div>
      <LeaderboardView accent="indigo" />
    </div>
  );
};

/* ----------------------------------------------------
   4. BATCH 2 DAILY CHALLENGES
   ---------------------------------------------------- */
export const Batch2DailyChallenges: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      <div>
        <h2 className="font-display font-extrabold text-xl text-slate-800">Daily Challenges</h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5">Complete goals in the lab today to earn extra XP rewards.</p>
      </div>
      <ChallengeList accent="indigo" />
    </div>
  );
};

/* ----------------------------------------------------
   5. BATCH 2 STREAK TRACKER
   ---------------------------------------------------- */
export const Batch2Streak: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      <div>
        <h2 className="font-display font-extrabold text-xl text-slate-800">My Attendance Streak</h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5">Keep coming to the lab to grow your check-in fire!</p>
      </div>
      <StreakCalendar accent="indigo" variant="calendar" />
    </div>
  );
};

/* ----------------------------------------------------
   6. BATCH 2 ACADEMIC BADGES
   ---------------------------------------------------- */
export const Batch2Badges: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      <div>
        <h2 className="font-display font-extrabold text-xl text-slate-800">My Medals &amp; Badges</h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5">Collect medals as you hit study milestones and task completions.</p>
      </div>
      <BadgeGrid accent="indigo" />
    </div>
  );
};

/* ----------------------------------------------------
   7. BATCH 2 PROFILE SETTINGS
   ---------------------------------------------------- */
export const Batch2Profile: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      <div>
        <h2 className="font-display font-extrabold text-xl text-slate-800">My Student Profile</h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5">Customize your avatar and view your stats summary.</p>
      </div>
      <ProfileCard accent="indigo" />
    </div>
  );
};
