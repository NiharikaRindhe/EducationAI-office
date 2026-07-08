import React from 'react';
import { LeaderboardView } from '../../components/shared/LeaderboardView';

// Batch 3 (Class 9-10) didn't have a leaderboard page before — the backend
// (/student/leaderboard) already scores every batch, so this was a gap, not
// a deliberate omission. Sky-themed to match the rest of Batch 3.
export const Batch3Leaderboard: React.FC = () => <LeaderboardView accent="sky" />;
