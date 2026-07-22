import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Loader2, AlertCircle, ArrowLeft, Users, GraduationCap, Radio, Bot,
  KeyRound, UserPlus, Copy, Check, X, Save, Power,
} from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

interface SchoolProfile {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  board: string;
  plan: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  created_at: string;
}

interface AdminRow {
  id: string;
  fullName: string;
  role: string;
  isActive: boolean;
  hasLoggedInEver: boolean;
  lastSeenAt: string | null;
  createdAt: string;
}

interface Detail {
  school: SchoolProfile;
  stats: {
    studentCount: number;
    teacherCount: number;
    staffCount: number;
    neverLoggedInStudents: number;
    activeNow: number;
    loginsLast30d: number;
    aiCallsLast30d: number;
  };
  enrollmentByClass: Record<number, number>;
  admins: AdminRow[];
}

interface Credential {
  fullName: string;
  email: string;
  password: string;
}

const inputCls =
  'w-full px-3 py-2 text-[13px] text-slate-800 bg-white border border-slate-300 rounded-lg outline-none transition-colors focus:border-slate-500 focus:ring-2 focus:ring-slate-100 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500';
const labelCls = 'block text-[12px] font-medium text-slate-600 mb-1';

export const SuperAdminSchoolDetail: React.FC = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'profile' | 'admins' | 'usage'>('profile');

  // Profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Admin management
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [credential, setCredential] = useState<Credential | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    try {
      setDetail(await api.get<Detail>(`/super-admin/schools/${schoolId}`));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load school');
    }
  }, [schoolId]);

  useEffect(() => { void load(); }, [load]);

  const startEditing = () => {
    if (!detail) return;
    const s = detail.school;
    setForm({
      name: s.name, board: s.board, plan: s.plan,
      address: s.address ?? '', city: s.city ?? '', state: s.state ?? '', pincode: s.pincode ?? '',
      contactName: s.contact_name ?? '', contactEmail: s.contact_email ?? '', contactPhone: s.contact_phone ?? '',
    });
    setIsEditing(true);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    setIsSaving(true);
    setError('');
    try {
      await api.patch(`/super-admin/schools/${schoolId}`, {
        name: form.name,
        board: form.board,
        plan: form.plan,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        pincode: form.pincode || null,
        contactName: form.contactName || null,
        contactEmail: form.contactEmail || null,
        contactPhone: form.contactPhone || null,
      });
      setIsEditing(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!detail || !schoolId) return;
    setIsToggling(true);
    try {
      await api.patch(`/super-admin/schools/${schoolId}/active`, { isActive: !detail.school.is_active });
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to update status');
    } finally {
      setIsToggling(false);
    }
  };

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    setIsAddingAdmin(true);
    setError('');
    try {
      const cred = await api.post<Credential>(`/super-admin/schools/${schoolId}/admins`, {
        fullName: adminName,
        email: adminEmail,
      });
      setCredential(cred);
      setAdminName('');
      setAdminEmail('');
      setShowAddAdmin(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to add admin');
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const resetPassword = async (admin: AdminRow) => {
    if (!schoolId) return;
    setResettingId(admin.id);
    setError('');
    try {
      const cred = await api.post<Credential>(`/super-admin/schools/${schoolId}/admins/${admin.id}/reset-password`);
      setCredential(cred);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to reset password');
    } finally {
      setResettingId(null);
    }
  };

  const copyCredential = () => {
    if (!credential) return;
    void navigator.clipboard.writeText(`EduAI School Admin\nName: ${credential.fullName}\nEmail: ${credential.email}\nPassword: ${credential.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error && !detail) {
    return (
      <div className="flex flex-col gap-4">
        <Link to="/super-admin/schools" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-800 w-fit">
          <ArrowLeft size={15} /> All schools
        </Link>
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      </div>
    );
  }

  if (!detail) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400" /></div>;

  const { school, stats, admins } = detail;
  const maxEnrollment = Math.max(1, ...Object.values(detail.enrollmentByClass));

  const statTiles = [
    { label: 'Students', value: stats.studentCount, sub: `${stats.neverLoggedInStudents} never logged in`, icon: Users },
    { label: 'Teachers', value: stats.teacherCount, sub: `${stats.staffCount} admin staff`, icon: GraduationCap },
    { label: 'Logins (30 days)', value: stats.loginsLast30d, sub: `${stats.activeNow} active right now`, icon: Radio },
    { label: 'AI Calls (30 days)', value: stats.aiCallsLast30d, sub: 'tutor, grading, vision', icon: Bot },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/super-admin/schools" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 hover:text-slate-700 mb-2">
            <ArrowLeft size={13} /> All schools
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-900">{school.name}</h1>
            <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${school.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${school.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              {school.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-[13px] text-slate-400 mt-0.5">
            <span className="font-mono">{school.code}</span> · {school.board} · <span className="capitalize">{school.plan} plan</span> · onboarded {new Date(school.created_at).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => void toggleActive()}
          disabled={isToggling}
          className={`inline-flex items-center gap-2 text-[13px] font-semibold px-4 py-2 rounded-lg border transition-colors cursor-pointer disabled:opacity-50 ${
            school.is_active
              ? 'text-slate-600 border-slate-200 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50'
              : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          {isToggling ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
          {school.is_active ? 'Deactivate school' : 'Activate school'}
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* One-time credential banner */}
      {credential && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3.5 flex items-center justify-between gap-4">
          <div className="text-[13px] text-emerald-900">
            <span className="font-semibold block mb-0.5">Credentials for {credential.fullName} — shown only once.</span>
            <span className="font-mono">{credential.email}</span>
            <span className="mx-2 text-emerald-400">·</span>
            <span className="font-mono font-semibold">{credential.password}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={copyCredential} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg cursor-pointer">
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={() => setCredential(null)} className="text-emerald-500 hover:text-emerald-700 p-1.5 cursor-pointer"><X size={15} /></button>
          </div>
        </div>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statTiles.map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl shadow-sm px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-slate-500">{s.label}</span>
              <s.icon size={16} className="text-slate-400" />
            </div>
            <span className="block text-2xl font-semibold text-slate-900 mt-1.5 tabular-nums">{s.value.toLocaleString()}</span>
            <span className="block text-[12px] text-slate-400 mt-0.5">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6">
        {([
          { id: 'profile', label: 'Profile' },
          { id: 'admins', label: `Admin accounts (${admins.length})` },
          { id: 'usage', label: 'Enrollment' },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-3 -mb-px text-[13px] font-semibold transition-colors cursor-pointer border-b-2 ${
              tab === t.id ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-[14px] font-semibold text-slate-800">School profile</h2>
            {!isEditing && (
              <button onClick={startEditing} className="text-[13px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">Edit</button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={saveProfile} className="p-5 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>School name</label>
                  <input required value={form.name ?? ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Board</label>
                  <select value={form.board} onChange={(e) => setForm((f) => ({ ...f, board: e.target.value }))} className={inputCls}>
                    {['CBSE', 'ICSE', 'State', 'IB'].map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Plan</label>
                  <select value={form.plan} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))} className={inputCls}>
                    <option value="starter">Starter</option>
                    <option value="school">School</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Street address</label>
                  <input value={form.address ?? ''} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>City</label>
                  <input value={form.city ?? ''} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>State</label>
                    <input value={form.state ?? ''} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Pincode</label>
                    <input value={form.pincode ?? ''} onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))} maxLength={6} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Contact person</label>
                  <input value={form.contactName ?? ''} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Contact email</label>
                    <input type="email" value={form.contactEmail ?? ''} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Contact phone</label>
                    <input value={form.contactPhone ?? ''} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} className={inputCls} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="text-[13px] font-semibold text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save changes
                </button>
              </div>
            </form>
          ) : (
            <dl className="p-5 grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
              {[
                ['School code', school.code, true],
                ['Board', school.board],
                ['Plan', school.plan],
                ['Address', school.address],
                ['City', school.city],
                ['State', school.state],
                ['Pincode', school.pincode],
                ['Contact person', school.contact_name],
                ['Contact email', school.contact_email],
                ['Contact phone', school.contact_phone],
              ].map(([label, value, mono]) => (
                <div key={label as string}>
                  <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</dt>
                  <dd className={`text-[13px] text-slate-800 mt-1 ${mono ? 'font-mono' : ''} ${!value ? 'text-slate-300' : ''} capitalize`}>{(value as string) || 'Not set'}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      {/* Admins tab */}
      {tab === 'admins' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-[14px] font-semibold text-slate-800">Admin &amp; staff accounts</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">School admins and lab in-charges for this school</p>
            </div>
            <button
              onClick={() => setShowAddAdmin((v) => !v)}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <UserPlus size={14} /> Add school admin
            </button>
          </div>

          {showAddAdmin && (
            <form onSubmit={addAdmin} className="px-5 py-4 bg-slate-50 border-b border-slate-100 grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <div>
                <label className={labelCls}>Full name</label>
                <input required value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Mr. Verma" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Login email</label>
                <input required type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin2@school.edu" className={inputCls} />
              </div>
              <button type="submit" disabled={isAddingAdmin} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
                {isAddingAdmin && <Loader2 size={13} className="animate-spin" />} Create
              </button>
            </form>
          )}

          {admins.length === 0 ? (
            <p className="text-[13px] text-slate-400 text-center py-12">No admin accounts yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  {['Name', 'Role', 'Status', 'Last seen', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-[13px] font-semibold text-slate-800">{a.fullName}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-600 capitalize whitespace-nowrap">{a.role.replace('_', ' ')}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${a.isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${a.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {a.isActive ? (a.hasLoggedInEver ? 'Active' : 'Never logged in') : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-500 whitespace-nowrap">
                      {a.lastSeenAt ? new Date(a.lastSeenAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => void resetPassword(a)}
                        disabled={resettingId === a.id}
                        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {resettingId === a.id ? <Loader2 size={12} className="animate-spin" /> : <KeyRound size={12} />} Reset password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Enrollment tab */}
      {tab === 'usage' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <h2 className="text-[14px] font-semibold text-slate-800 mb-4">Enrollment by class</h2>
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((cls) => {
              const count = detail.enrollmentByClass[cls] ?? 0;
              return (
                <div key={cls} className="flex items-center gap-3">
                  <span className="text-[12px] font-medium text-slate-500 w-16 shrink-0">Class {cls}</span>
                  <div className="flex-1 h-5 bg-slate-50 rounded overflow-hidden">
                    <div className="h-full bg-slate-700 rounded transition-all duration-700" style={{ width: `${(count / maxEnrollment) * 100}%` }} />
                  </div>
                  <span className="text-[12px] font-medium text-slate-600 w-10 text-right shrink-0 tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
