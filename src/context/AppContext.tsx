import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

/**
 * Thin student-identity bridge over AuthContext.
 *
 * Everything here is derived from the authenticated user's real profile —
 * there is no client-side mock state. XP and streak are server-owned.
 *
 * `incrementXP` is a session-local display bump for activities that don't
 * have a server-side XP award yet (story quizzes, Pomodoro). It is never
 * reconciled — it simply disappears on the next login. Server-backed
 * awards (games, tasks, exams) must NOT call it; they should call
 * `refreshUser()` from AuthContext instead, so the authoritative profile
 * value updates and nothing double-counts.
 */
interface AppState {
  studentName: string;
  studentAvatar: string;
  studentXP: number;
  studentStreak: number;
  currentClass: number;
  batchId: number;
  incrementXP: (amount: number) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

// The pre-production mock layer persisted fake state under these keys on
// every machine that ever opened the app (shared lab PCs included).
// Clear them once so stale mock values can never resurface.
const LEGACY_MOCK_KEYS = [
  'eduai_role', 'eduai_student_name', 'eduai_student_avatar',
  'eduai_student_xp', 'eduai_student_streak', 'eduai_student_class',
  'eduai_tasks', 'eduai_study_plan', 'eduai_exams', 'batch4_stream',
];
for (const key of LEGACY_MOCK_KEYS) localStorage.removeItem(key);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const sp = user?.role === 'student' ? user.student_profiles : null;

  // Session-local display bonus for activities without a server XP award.
  const [xpBonus, setXpBonus] = useState(0);

  const incrementXP = useCallback((amount: number) => {
    setXpBonus((prev) => prev + amount);
  }, []);

  const value: AppState = {
    studentName: user?.full_name ?? '',
    studentAvatar: sp?.avatar ?? '🙂',
    studentXP: (sp?.xp ?? 0) + xpBonus,
    studentStreak: sp?.streak ?? 0,
    currentClass: sp?.class_num ?? 1,
    batchId: sp?.batch_id ?? 1,
    incrementXP,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
