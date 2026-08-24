import React, { useState } from 'react';
import { KeyRound, Loader2, CheckCircle2, AlertCircle, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiClientError } from '../../lib/api';
import { SchoolBrandingCard } from './SchoolBrandingCard';

const ROLE_LABELS: Record<string, string> = {
  teacher: 'Teacher',
  school_admin: 'School Admin',
  super_admin: 'Super Admin',
  lab_incharge: 'Lab In-charge',
  student: 'Student',
};

const inputCls =
  'w-full px-3 py-2.5 text-[13px] text-slate-800 bg-white border border-slate-300 rounded-lg outline-none transition-colors focus:border-slate-500 focus:ring-2 focus:ring-slate-100 placeholder:text-slate-400';
const labelCls = 'block text-[12px] font-medium text-slate-600 mb-1';

/**
 * The "Profile & Settings" destination the TopBar's account dropdown links
 * to (items #37/#38, later #75 — one page reused across every real-auth
 * portal rather than a per-portal reimplementation). Identity is read-only
 * here on purpose: name/email/role changes go through the admin who
 * provisioned the account, same as every credential in this system.
 */
export const AccountSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!user) return null;

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('New password and confirmation do not match.'); return; }

    setIsSaving(true);
    try {
      await api.patch('/auth/password', { currentPassword, newPassword });
      setDone(true);
      // Every other session (this tab included, past its current access
      // token's lifetime) was just revoked server-side — send the user back
      // through login with the new password rather than leave them on a
      // page that will start failing requests unpredictably.
      setTimeout(() => logout(), 1800);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-xl">
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <h2 className="font-display font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
          <UserIcon size={18} className="text-slate-400" /> Profile
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Name</dt>
            <dd className="text-[13px] text-slate-800 mt-1">{user.full_name}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Role</dt>
            <dd className="text-[13px] text-slate-800 mt-1">{ROLE_LABELS[user.role] ?? user.role}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Login email</dt>
            <dd className="text-[13px] text-slate-800 mt-1 font-mono">{user.email ?? '—'}</dd>
          </div>
          {user.school && (
            <div>
              <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">School</dt>
              <dd className="text-[13px] text-slate-800 mt-1">{user.school.name}</dd>
            </div>
          )}
        </dl>
        <p className="text-[12px] text-slate-400 mt-4">
          Name, email and school are managed by whoever set up your account. Contact them if any of this needs to change.
        </p>
      </div>

      {/* School Admin only — folded in from the old standalone Branding page (item #67). */}
      {user.role === 'school_admin' && <SchoolBrandingCard />}

      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <h2 className="font-display font-bold text-lg text-slate-800 mb-1 flex items-center gap-2">
          <KeyRound size={18} className="text-slate-400" /> Change password
        </h2>
        <p className="text-[12px] text-slate-400 mb-4">You'll be signed out everywhere else once this is saved, including this tab.</p>

        {done ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">
            <CheckCircle2 size={15} className="shrink-0" /> Password changed — signing you out now.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12.5px] text-rose-700">
                <AlertCircle size={14} className="shrink-0" /> {error}
              </div>
            )}
            <div>
              <label className={labelCls}>Current password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isSaving}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>New password</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSaving}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Confirm new password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSaving}
                className={inputCls}
              />
              {mismatch && <p className="text-[11.5px] text-rose-600 mt-1">Doesn't match yet.</p>}
            </div>
            <button
              type="submit"
              disabled={isSaving || !currentPassword || newPassword.length < 8 || mismatch}
              className="self-start inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-5 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 mt-1"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />} Change password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
