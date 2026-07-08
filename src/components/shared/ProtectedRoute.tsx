import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, type Role } from '../../context/AuthContext';
import { useIdleLogout } from '../../hooks/useIdleLogout';

interface ProtectedRouteProps {
  allow: Role[];
  children: React.ReactNode;
}

// Shared lab PCs, not personal devices — a student walking away mid-period
// must not leave their account open for whoever sits down next. Staff are
// exempt: they're more often on their own device, and a surprise logout
// mid-class or mid-grading would be actively harmful.
const IDLE_TIMEOUT_MS = 10 * 60_000;

/** Gates a route tree by role. Unauthenticated -> /login. Wrong role -> back to their own home, not a dead end. */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allow, children }) => {
  const { user, isLoading } = useAuth();
  useIdleLogout(IDLE_TIMEOUT_MS, user?.role === 'student');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 font-sans text-sm">
        Loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!allow.includes(user.role)) {
    const fallback: Record<Role, string> = {
      student: `/batch${user.student_profiles?.batch_id ?? 1}/home`,
      teacher: '/teacher/dashboard',
      school_admin: '/school-admin/dashboard',
      lab_incharge: '/lab-incharge/dashboard',
      super_admin: '/super-admin/dashboard',
    };
    return <Navigate to={fallback[user.role]} replace />;
  }

  return <>{children}</>;
};
