import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth, type Role } from '../../context/AuthContext';

/**
 * 404.
 *
 * The catch-all route used to redirect every unknown URL to the marketing
 * landing page, which meant a signed-in teacher who mistyped a URL — or
 * followed a stale bookmark — silently landed on a sales page and looked
 * logged out. This says what happened and points each role back at their own
 * portal instead.
 */
export const NotFound: React.FC = () => {
  const { user } = useAuth();

  const homeHref: string = user
    ? (
        {
          student: `/batch${user.student_profiles?.batch_id ?? 1}/home`,
          teacher: '/teacher/dashboard',
          school_admin: '/school-admin/dashboard',
          lab_incharge: '/lab-incharge/dashboard',
          super_admin: '/super-admin/overview',
        } satisfies Record<Role, string>
      )[user.role]
    : '/';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 flex flex-col gap-4 text-center">
        <span className="font-display font-black text-4xl text-slate-300">404</span>
        <h1 className="font-display font-bold text-lg text-slate-800">Page not found</h1>
        <p className="font-sans text-[13px] text-slate-500 leading-relaxed">
          The page you're looking for doesn't exist, or you may not have access to it.
        </p>

        <div className="flex gap-2 justify-center mt-1">
          <Link
            to={homeHref}
            className="rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-slate-800"
          >
            {user ? 'Back to my dashboard' : 'Go to homepage'}
          </Link>
          {!user && (
            <Link
              to="/login"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
