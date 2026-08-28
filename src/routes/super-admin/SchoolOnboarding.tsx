import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2, AlertCircle, ArrowLeft, ArrowRight, Building2, MapPin, Phone,
  UserPlus, Copy, Check, ShieldCheck, Mail, Printer,
} from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

/**
 * Full-page school onboarding.
 *
 * Replaces the single cramped modal that asked for identity, address,
 * contact and admin account all at once. Onboarding a school is a sales
 * moment, not a CRUD form: the generated admin password is shown exactly
 * once, so the final step is a deliberate handoff screen rather than a
 * toast that can be dismissed by accident.
 */

const inputCls =
  'w-full px-3.5 py-2.5 text-[13px] text-slate-800 bg-white border border-slate-300 rounded-lg outline-none transition-colors focus:border-slate-500 focus:ring-2 focus:ring-slate-100 placeholder:text-slate-400';
const labelCls = 'block text-[12px] font-medium text-slate-600 mb-1.5';

type StepId = 'school' | 'admin' | 'review';

const STEPS: { id: StepId; label: string }[] = [
  { id: 'school', label: 'School details' },
  { id: 'admin', label: 'Administrator' },
  { id: 'review', label: 'Review' },
];

/*
 * EduAI sells one plan with every feature included, so there is no package to
 * choose during onboarding and none to send: the server grants the full feature
 * catalogue on create. An individual feature can be suspended for one school
 * afterwards from that school's Features tab.
 */

const EMPTY_FORM = {
  name: '', code: '', board: 'CBSE',
  address: '', city: '', state: '', pincode: '',
  contactName: '', contactEmail: '', contactPhone: '',
  createAdmin: true, adminFullName: '', adminEmail: '',
};

interface AdminCredential {
  fullName: string;
  email: string;
  password: string;
}

interface CreatedSchool {
  id: string;
  name: string;
  code: string;
  adminCredential: AdminCredential | null;
  adminEmailDelivery: 'queued' | 'not_configured' | null;
}

export const SuperAdminSchoolOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedSchool | null>(null);
  const [copied, setCopied] = useState(false);

  const step = STEPS[stepIdx]!.id;

  const set = (field: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({
        ...prev,
        [field]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value,
      }));

  // School codes are used for student PIN login and must be A-Z 0-9 hyphen —
  // normalise as the user types rather than rejecting at submit.
  const setCode = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({
      ...prev,
      code: e.target.value.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, ''),
    }));

  /** Per-step gating, so a missing required field is caught before the
   *  Super Admin has walked through three more screens. */
  const stepError = useMemo((): string | null => {
    if (step === 'school') {
      if (!form.name.trim()) return 'School name is required.';
      if (!form.code.trim()) return 'School code is required.';
      if (form.code.trim().length < 3) return 'School code must be at least 3 characters.';
      if (form.pincode && !/^\d{6}$/.test(form.pincode)) return 'Pincode must be exactly 6 digits.';
    }
    if (step === 'admin' && form.createAdmin) {
      if (!form.adminFullName.trim()) return 'Administrator name is required.';
      if (!form.adminEmail.trim()) return 'Administrator email is required.';
      if (!/^\S+@\S+\.\S+$/.test(form.adminEmail)) return 'Enter a valid email address.';
    }
    if (form.contactEmail && !/^\S+@\S+\.\S+$/.test(form.contactEmail)) {
      return 'Primary contact email is not a valid address.';
    }
    return null;
  }, [step, form]);

  const friendlyError = (err: unknown): string => {
    if (err instanceof ApiClientError) {
      const details = err.details as { fieldErrors?: Record<string, string[]> } | undefined;
      const fieldErrors = details?.fieldErrors;
      if (fieldErrors) {
        const first = Object.entries(fieldErrors).find(([, msgs]) => msgs.length > 0);
        if (first) {
          const [field, msgs] = first;
          const label = field.replace(/([A-Z])/g, ' $1').toLowerCase();
          return `${label.charAt(0).toUpperCase()}${label.slice(1)}: ${msgs[0]}`;
        }
      }
      return err.message;
    }
    return 'Failed to create school';
  };

  const next = () => {
    if (stepError) { setError(stepError); return; }
    setError('');
    setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const back = () => { setError(''); setStepIdx((i) => Math.max(i - 1, 0)); };

  const submit = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const result = await api.post<CreatedSchool>('/super-admin/schools', {
        name: form.name,
        code: form.code.toUpperCase(),
        board: form.board,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        pincode: form.pincode || undefined,
        contactName: form.contactName || undefined,
        contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone || undefined,
        ...(form.createAdmin && form.adminEmail
          ? { admin: { fullName: form.adminFullName, email: form.adminEmail } }
          : {}),
      });
      setCreated(result);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCredential = () => {
    if (!created?.adminCredential) return;
    const c = created.adminCredential;
    void navigator.clipboard.writeText(
      `EduAI — School Administrator Access\n\nSchool: ${created.name} (${created.code})\nName: ${c.fullName}\nEmail: ${c.email}\nPassword: ${c.password}\n\nSign in at: ${window.location.origin}/#/login`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // ─── Success / credential handoff ──────────────────────────
  if (created) {
    const cred = created.adminCredential;
    return (
      <div className="flex flex-col gap-6 max-w-[760px]">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-5 flex items-start gap-3">
            <div className="w-9 h-9 shrink-0 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Check size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-emerald-900">{created.name} is onboarded</h2>
              <p className="text-[12px] text-emerald-700 mt-0.5">
                Code <span className="font-mono font-semibold">{created.code}</span> · full platform provisioned
              </p>
            </div>
          </div>

          {cred ? (
            <div className="px-6 py-5 flex flex-col gap-4">
              <div className="flex items-start gap-2 text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2.5">
                <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                <span>
                  This password is shown <strong>once</strong> and is not recoverable — it is not stored in readable
                  form. Copy or print it now.{' '}
                  {created.adminEmailDelivery === 'queued'
                    ? 'The welcome email has been queued; delivery status is recorded in the audit log.'
                    : 'Email delivery is not configured, so share these credentials securely.'}
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                {([
                  ['Administrator', cred.fullName],
                  ['Email', cred.email],
                  ['Password', cred.password],
                ] as const).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between px-4 py-3">
                    <span className="text-[12px] font-medium text-slate-500">{k}</span>
                    <span className={`text-[13px] text-slate-800 ${k !== 'Administrator' ? 'font-mono font-semibold' : 'font-semibold'}`}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={copyCredential}
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-white bg-slate-900 px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy credentials'}
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-600 border border-slate-200 px-4 py-2.5 rounded-lg hover:border-slate-400 transition-colors cursor-pointer"
                >
                  <Printer size={14} /> Print slip
                </button>
              </div>
            </div>
          ) : (
            <div className="px-6 py-5 text-[13px] text-slate-500 flex items-center gap-2">
              <Mail size={14} className="text-slate-400" />
              No administrator account was created. Add one from the school&apos;s page when ready.
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/super-admin/schools/${created.id}`)}
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-white bg-indigo-600 px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Open school <ArrowRight size={14} />
          </button>
          <button
            onClick={() => { setCreated(null); setForm(EMPTY_FORM); setStepIdx(0); }}
            className="text-[13px] font-semibold text-slate-600 border border-slate-200 px-4 py-2.5 rounded-lg hover:border-slate-400 transition-colors cursor-pointer"
          >
            Onboard another school
          </button>
          <Link
            to="/super-admin/schools"
            className="text-[13px] font-semibold text-slate-500 px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            All schools
          </Link>
        </div>
      </div>
    );
  }

  // ─── Wizard ────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 max-w-[860px]">
      <div>
        <Link
          to="/super-admin/schools"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft size={13} /> All schools
        </Link>
        <h1 className="text-[19px] font-bold text-slate-800 mt-2">Onboard a school</h1>
        <p className="text-[13px] text-slate-400 mt-0.5">
          Set up the school, choose what it has bought, and hand its administrator their access.
        </p>
      </div>

      {/* Step rail */}
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const state = i < stepIdx ? 'done' : i === stepIdx ? 'current' : 'todo';
          return (
            <React.Fragment key={s.id}>
              <button
                onClick={() => { if (i < stepIdx) { setError(''); setStepIdx(i); } }}
                disabled={i > stepIdx}
                className={`flex items-center gap-2 shrink-0 ${i < stepIdx ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span
                  className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center transition-colors ${
                    state === 'done'
                      ? 'bg-emerald-600 text-white'
                      : state === 'current'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {state === 'done' ? <Check size={12} /> : i + 1}
                </span>
                <span className={`text-[12px] font-semibold ${state === 'todo' ? 'text-slate-400' : 'text-slate-700'}`}>
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span className={`h-px flex-1 mx-3 ${i < stepIdx ? 'bg-emerald-300' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        {/* STEP 1 — school details */}
        {step === 'school' && (
          <div className="px-6 py-5 flex flex-col gap-6">
            <fieldset>
              <legend className="flex items-center gap-2 text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                <Building2 size={13} /> School information
              </legend>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>School name <span className="text-rose-500">*</span></label>
                  <input value={form.name} onChange={set('name')} placeholder="Springfield Public School" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>School code <span className="text-rose-500">*</span></label>
                  <input value={form.code} onChange={setCode} placeholder="SPS-DELHI-01" className={`${inputCls} font-mono`} />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Uppercase letters, numbers and hyphens. Students in Classes 1–4 type this to sign in, so keep it short.
                  </p>
                </div>
                <div>
                  <label className={labelCls}>Board</label>
                  <select value={form.board} onChange={set('board')} className={inputCls}>
                    {['CBSE', 'ICSE', 'State', 'IB'].map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend className="flex items-center gap-2 text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                <MapPin size={13} /> Location
              </legend>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3">
                  <label className={labelCls}>Street address</label>
                  <input value={form.address} onChange={set('address')} placeholder="12, MG Road, Sector 4" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>City</label>
                  <input value={form.city} onChange={set('city')} placeholder="New Delhi" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <input value={form.state} onChange={set('state')} placeholder="Delhi" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Pincode</label>
                  <input value={form.pincode} onChange={set('pincode')} placeholder="110001" maxLength={6} className={inputCls} />
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend className="flex items-center gap-2 text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                <Phone size={13} /> Primary contact
              </legend>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Contact person</label>
                  <input value={form.contactName} onChange={set('contactName')} placeholder="Mrs. Sharma (Principal)" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input value={form.contactEmail} onChange={set('contactEmail')} placeholder="principal@school.edu.in" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input value={form.contactPhone} onChange={set('contactPhone')} placeholder="+91 98765 43210" className={inputCls} />
                </div>
              </div>
            </fieldset>
          </div>
        )}

        {/* STEP 2 — administrator */}
        {step === 'admin' && (
          <div className="px-6 py-5 flex flex-col gap-5">
            <div>
              <h2 className="text-[14px] font-bold text-slate-800">Who runs this school on EduAI?</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">
                The School Admin imports teachers and students, builds the timetable, and manages promotions.
              </p>
            </div>

            <label className="flex items-start gap-3 border border-slate-200 rounded-lg px-4 py-3.5 cursor-pointer hover:border-slate-300 transition-colors">
              <input
                type="checkbox"
                checked={form.createAdmin}
                onChange={set('createAdmin')}
                className="mt-0.5 w-4 h-4 accent-slate-900 cursor-pointer"
              />
              <span>
                <span className="block text-[13px] font-semibold text-slate-800">
                  Create the administrator account now
                </span>
                <span className="block text-[12px] text-slate-400 mt-0.5">
                  Generates a password and emails a welcome message. Leave unticked to add one later.
                </span>
              </span>
            </label>

            {form.createAdmin && (
              <fieldset className="grid grid-cols-2 gap-4">
                <legend className="flex items-center gap-2 text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  <UserPlus size={13} /> Administrator
                </legend>
                <div>
                  <label className={labelCls}>Full name <span className="text-rose-500">*</span></label>
                  <input value={form.adminFullName} onChange={set('adminFullName')} placeholder="Anita Sharma" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email <span className="text-rose-500">*</span></label>
                  <input value={form.adminEmail} onChange={set('adminEmail')} placeholder="anita.sharma@school.edu.in" className={inputCls} />
                  <p className="text-[11px] text-slate-400 mt-1.5">This becomes their sign-in username.</p>
                </div>
              </fieldset>
            )}
          </div>
        )}

        {/* STEP 4 — review */}
        {step === 'review' && (
          <div className="px-6 py-5 flex flex-col gap-5">
            <div>
              <h2 className="text-[14px] font-bold text-slate-800">Review before creating</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">
                The school code cannot be changed afterwards — students sign in with it.
              </p>
            </div>

            {([
              ['School', [
                ['Name', form.name],
                ['Code', form.code],
                ['Board', form.board],
                ['Address', [form.address, form.city, form.state, form.pincode].filter(Boolean).join(', ') || '—'],
              ]],
              ['Contact', [
                ['Person', form.contactName || '—'],
                ['Email', form.contactEmail || '—'],
                ['Phone', form.contactPhone || '—'],
              ]],
              ['Features', [
                ['Included', 'The full platform — every feature'],
              ]],
              ['Administrator', form.createAdmin
                ? [['Name', form.adminFullName], ['Email', form.adminEmail]]
                : [['Account', 'Not created now']]],
            ] as const).map(([section, rows]) => (
              <div key={section} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  {section}
                </div>
                <div className="divide-y divide-slate-100">
                  {rows.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-[12px] text-slate-500">{k}</span>
                      <span className={`text-[13px] font-medium text-slate-800 ${k === 'Code' ? 'font-mono' : ''}`}>
                        {v || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer nav */}
        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between">
          <button
            onClick={back}
            disabled={stepIdx === 0}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-0 disabled:pointer-events-none"
          >
            <ArrowLeft size={14} /> Back
          </button>

          {step === 'review' ? (
            <button
              onClick={() => void submit()}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-white bg-slate-900 px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Create school
            </button>
          ) : (
            <button
              onClick={next}
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-white bg-slate-900 px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Continue <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
