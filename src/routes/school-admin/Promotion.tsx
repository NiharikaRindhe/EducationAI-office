import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2, AlertTriangle, ChevronRight, CheckCircle, Download, Search,
  ArrowLeft, GraduationCap, RotateCcw, UserPlus, Split,
  CalendarRange,
} from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';

/**
 * Academic-year rollover.
 *
 * This page previously read `preview.summary[]` and `execResult.promoted`
 * while the API returned `byClass{}` and `promotedCount` — shapes that never
 * matched, so it threw `Cannot read properties of undefined (reading 'map')`
 * on mount and the whole feature was unreachable. Rebuilt against the real
 * contract, plus the two things a real school year needs that were missing
 * entirely: holding a student back, and admitting the new Class 1 intake that
 * replaces the cohort which just moved up.
 */

type PromotionAction = 'promote' | 'pass_out' | 'convert_credentials';

interface PreviewRow {
  classNum: number;
  studentsCount: number;
  action: PromotionAction;
  nextClassNum: number | null;
}

interface RosterStudent {
  id: string;
  fullName: string;
  classNum: number;
  section: string;
  rollNumber: string | null;
}

interface SectionMoveRow {
  fromClass: number;
  fromSection: string;
  studentCount: number;
  toClass: number;
  availableSections: string[];
  /** The class above has no section of this name — needs an explicit answer. */
  needsDecision: boolean;
}

interface PreviewResponse {
  currentYear: string;
  nextYear: string;
  academicYearStartMonth: number;
  summary: PreviewRow[];
  roster: RosterStudent[];
  sectionPlan: SectionMoveRow[];
  sectionDecisionsNeeded: number;
  eligibleCount: number;
  class4Count: number;
  class10Count: number;
  alreadyRun: boolean;
  alreadyRunAt: string | null;
}

interface Credential {
  fullName: string;
  username: string;
  password: string;
  classNum: number;
  section: string;
}

interface ExecuteResponse {
  message: string;
  oldYear: string;
  newYear: string;
  promotedCount: number;
  passedOutCount: number;
  heldBackCount: number;
  sectionsCreated: number;
  assignmentsCarried: number;
  timetableCarried: number;
  announcementsClosed: number;
  class4To5Credentials: Credential[];
}

const ACTION_STYLE: Record<PromotionAction, string> = {
  promote: 'bg-indigo-50 text-indigo-700',
  pass_out: 'bg-rose-50 text-rose-700',
  convert_credentials: 'bg-amber-50 text-amber-700',
};

const ACTION_LABEL: Record<PromotionAction, string> = {
  promote: 'Promote',
  pass_out: 'Pass out',
  convert_credentials: 'Promote + new logins',
};

/** Identifies one section move, e.g. Class 2 section C. */
const moveKey = (fromClass: number, fromSection: string) => `${fromClass}|${fromSection}`;

type StepKey = 'review' | 'sections' | 'holdbacks' | 'confirm';
const ROSTER_PAGE_SIZE = 25;
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const STEP_DESCRIPTION: Record<StepKey, string> = {
  review: 'Check automatic class moves',
  sections: 'Choose destination sections',
  holdbacks: 'Manage students in bulk',
  confirm: 'Verify and run once',
};

export const SchoolAdminPromotion: React.FC = () => {
  const [stepIdx, setStepIdx] = useState(0);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [execResult, setExecResult] = useState<ExecuteResponse | null>(null);
  const [holdBack, setHoldBack] = useState<Set<string>>(new Set());
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [holdSearch, setHoldSearch] = useState('');
  const [holdClass, setHoldClass] = useState('all');
  const [holdSection, setHoldSection] = useState('all');
  const [holdPage, setHoldPage] = useState(1);
  /** moveKey -> destination section label. */
  const [sectionChoices, setSectionChoices] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [savingSessionMonth, setSavingSessionMonth] = useState(false);
  const [sessionStartMonth, setSessionStartMonth] = useState(4);
  const [errorMsg, setErrorMsg] = useState('');

  const isSessionStartMonth = new Date().getMonth() + 1 === sessionStartMonth;

  useEffect(() => {
    api.get<PreviewResponse>('/school-admin/promotion/preview')
      .then((res) => {
        setPreview(res);
        setSessionStartMonth(res.academicYearStartMonth);
        // Default every unresolved move to keeping its own label, which means
        // "create that section in the class above". It's the answer that
        // preserves the school's existing grouping, and it's always valid —
        // so the step can be walked past without touching anything.
        const defaults: Record<string, string> = {};
        for (const row of res.sectionPlan ?? []) {
          if (row.needsDecision) defaults[moveKey(row.fromClass, row.fromSection)] = row.fromSection;
        }
        setSectionChoices(defaults);
      })
      .catch((err) => setErrorMsg(err instanceof ApiClientError ? err.message : 'Failed to load rollover preview'))
      .finally(() => setLoading(false));
  }, []);

  const pendingMoves = useMemo(
    () => (preview?.sectionPlan ?? []).filter((r) => r.needsDecision),
    [preview],
  );

  // The Sections step exists only when the roster actually forces a choice.
  // A school whose sections line up all the way to Class 10 never sees it.
  const steps = useMemo(() => {
    const list: { key: StepKey; label: string }[] = [{ key: 'review', label: 'Review' }];
    if (pendingMoves.length > 0) list.push({ key: 'sections', label: 'Sections' });
    list.push({ key: 'holdbacks', label: 'Student outcomes' });
    list.push({ key: 'confirm', label: 'Confirm' });
    return list;
  }, [pendingMoves]);

  const step = steps[Math.min(stepIdx, steps.length - 1)]?.key ?? 'review';
  const goNext = () => setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  const goBack = () => setStepIdx((i) => Math.max(i - 1, 0));

  const setStudentOutcome = (id: string, repeat: boolean) =>
    setHoldBack((prev) => {
      const next = new Set(prev);
      if (repeat) next.add(id); else next.delete(id);
      return next;
    });

  const toggleStudentSelection = (id: string) =>
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const classOptions = useMemo(
    () => [...new Set((preview?.roster ?? []).map((student) => student.classNum))].sort((a, b) => a - b),
    [preview],
  );

  const sectionOptions = useMemo(() => {
    const roster = preview?.roster ?? [];
    return [...new Set(roster
      .filter((student) => holdClass === 'all' || student.classNum === Number(holdClass))
      .map((student) => student.section))].sort();
  }, [preview, holdClass]);

  const filteredRoster = useMemo(() => {
    const rows = preview?.roster ?? [];
    const q = holdSearch.trim().toLowerCase();
    return rows
      .filter((student) => holdClass === 'all' || student.classNum === Number(holdClass))
      .filter((student) => holdSection === 'all' || student.section === holdSection)
      .filter((student) => !q ||
        student.fullName.toLowerCase().includes(q) ||
        (student.rollNumber ?? '').toLowerCase().includes(q) ||
        `${student.classNum}-${student.section}`.toLowerCase().includes(q))
      .sort((a, b) => a.classNum - b.classNum || a.section.localeCompare(b.section) || a.fullName.localeCompare(b.fullName));
  }, [preview, holdSearch, holdClass, holdSection]);

  const rosterPageCount = Math.max(1, Math.ceil(filteredRoster.length / ROSTER_PAGE_SIZE));
  const activeRosterPage = Math.min(holdPage, rosterPageCount);
  const visibleRoster = filteredRoster.slice(
    (activeRosterPage - 1) * ROSTER_PAGE_SIZE,
    activeRosterPage * ROSTER_PAGE_SIZE,
  );
  const allVisibleSelected = visibleRoster.length > 0 && visibleRoster.every((student) => selectedStudents.has(student.id));

  const setVisibleSelection = (selected: boolean) =>
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      for (const student of visibleRoster) {
        if (selected) next.add(student.id); else next.delete(student.id);
      }
      return next;
    });

  const selectAllFiltered = () => setSelectedStudents((prev) => {
    const next = new Set(prev);
    for (const student of filteredRoster) next.add(student.id);
    return next;
  });

  const applyBulkOutcome = (repeat: boolean) => setHoldBack((prev) => {
    const next = new Set(prev);
    for (const id of selectedStudents) {
      if (repeat) next.add(id); else next.delete(id);
    }
    return next;
  });

  const movingUpCount = (preview?.roster ?? []).filter((student) => student.classNum < 10 && !holdBack.has(student.id)).length;
  const passingOutCount = (preview?.roster ?? []).filter((student) => student.classNum === 10 && !holdBack.has(student.id)).length;

  const handleExecute = async () => {
    setExecuting(true);
    setErrorMsg('');
    try {
      const res = await api.post<ExecuteResponse>('/school-admin/promotion/execute', {
        holdBackIds: [...holdBack],
        sectionMap: pendingMoves.map((row) => ({
          fromClass: row.fromClass,
          fromSection: row.fromSection,
          toSection: sectionChoices[moveKey(row.fromClass, row.fromSection)] ?? row.fromSection,
        })),
      });
      setExecResult(res);
    } catch (err) {
      setErrorMsg(err instanceof ApiClientError ? err.message : 'Rollover failed');
    } finally {
      setExecuting(false);
    }
  };

  const saveSessionStartMonth = async () => {
    setSavingSessionMonth(true);
    setErrorMsg('');
    try {
      await api.put<{ academicYearStartMonth: number; currentYear: string; nextYear: string }>(
        '/school-admin/promotion/settings',
        { academicYearStartMonth: sessionStartMonth },
      );
      const refreshed = await api.get<PreviewResponse>('/school-admin/promotion/preview');
      setPreview(refreshed);
      setSessionStartMonth(refreshed.academicYearStartMonth);
      const defaults: Record<string, string> = {};
      for (const row of refreshed.sectionPlan ?? []) {
        if (row.needsDecision) defaults[moveKey(row.fromClass, row.fromSection)] = row.fromSection;
      }
      setSectionChoices(defaults);
    } catch (err) {
      setErrorMsg(err instanceof ApiClientError ? err.message : 'Could not save the session start month');
    } finally {
      setSavingSessionMonth(false);
    }
  };

  const downloadGraduates = async () => {
    try {
      const blob = await api.download('/school-admin/promotion/graduates.csv');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'class-10-graduates.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErrorMsg('Could not download the graduate list.');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-rose-400" size={32} /></div>;
  }

  // ── Completed ──────────────────────────────────────────────
  if (execResult) {
    return (
      <div className="flex flex-col gap-6 font-sans text-left max-w-4xl mx-auto anim-fade-up">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { background: white !important; color: black !important; }
            .no-print { display: none !important; }
            .print-card { border: none !important; box-shadow: none !important; padding: 0 !important; }
          }
        ` }} />

        <div className="bento-card border border-emerald-100 bg-emerald-50/20 p-6 flex flex-col items-center gap-4 text-center no-print">
          <CheckCircle className="text-emerald-500" size={44} />
          <div>
            <h2 className="font-display font-black text-xl text-slate-800">Rollover complete</h2>
            <p className="text-xs text-slate-500 mt-1">
              {execResult.oldYear} → <span className="font-bold">{execResult.newYear}</span>
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 bg-white border border-slate-100 p-4 px-6 rounded-2xl text-xs w-full max-w-md">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Promoted</span>
              <span className="text-lg font-black text-slate-800">{execResult.promotedCount}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Held back</span>
              <span className="text-lg font-black text-slate-800">{execResult.heldBackCount}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Passed out</span>
              <span className="text-lg font-black text-slate-800">{execResult.passedOutCount}</span>
            </div>
          </div>

          {/* What survived the rollover. Staffing used to be wiped silently —
              stating it plainly is the difference between a school trusting
              the new year's timetable and rebuilding it from scratch. */}
          <div className="w-full max-w-md text-left text-[12px] text-slate-600 bg-white border border-slate-100 rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Carried into {execResult.newYear}</span>
            <span>{execResult.assignmentsCarried} subject assignment{execResult.assignmentsCarried === 1 ? '' : 's'} and their class teachers</span>
            <span>{execResult.timetableCarried} timetable slot{execResult.timetableCarried === 1 ? '' : 's'}, ready to edit</span>
            {execResult.sectionsCreated > 0 && (
              <span>{execResult.sectionsCreated} new section{execResult.sectionsCreated === 1 ? '' : 's'} created</span>
            )}
            {execResult.announcementsClosed > 0 && (
              <span className="text-slate-400">
                {execResult.announcementsClosed} announcement{execResult.announcementsClosed === 1 ? '' : 's'} closed — they were addressed to last year's classes
              </span>
            )}
          </div>
        </div>

        {/* The new Class 1 cohort — the other half of the loop. Last year's
            Class 1 has moved up, so the class is empty until this is done. */}
        <div className="bento-card border border-indigo-100 bg-indigo-50/20 p-6 flex flex-col gap-3 no-print">
          <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
            <UserPlus size={16} className="text-indigo-500" /> Next: admit the new Class 1 intake
          </h3>
          <p className="text-[12px] text-slate-600 leading-relaxed">
            Every Class 1 student moved up to Class 2, so Class 1 is now empty for {execResult.newYear}.
            Add the incoming batch to fill it — import a CSV for the whole intake, or add students one at a time.
          </p>
          <Link
            to="/school-admin/students"
            className="w-fit rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-indigo-700"
          >
            Go to Students →
          </Link>
        </div>

        {execResult.passedOutCount > 0 && (
          <div className="bento-card border border-slate-100 bg-white p-6 flex flex-col gap-3 no-print">
            <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
              <GraduationCap size={16} className="text-rose-500" /> Class 10 leavers
            </h3>
            <p className="text-[12px] text-slate-500">
              {execResult.passedOutCount} account{execResult.passedOutCount === 1 ? ' was' : 's were'} deactivated.
              Their enrolment history is kept, but download a copy for your records.
            </p>
            <button
              onClick={() => void downloadGraduates()}
              className="w-fit inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
            >
              <Download size={14} /> Download graduate list (CSV)
            </button>
          </div>
        )}

        {execResult.class4To5Credentials.length > 0 && (
          <div className="print-card bento-card border border-slate-100 bg-white p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center no-print">
              <div>
                <h3 className="font-display font-bold text-sm text-slate-800">Class 5 login slips</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  These students moved from PIN login to a password. Print now — the passwords are not recoverable later.
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer text-xs font-bold"
              >
                Print slips
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {execResult.class4To5Credentials.map((cred) => (
                <div key={cred.username} className="border border-slate-200 bg-slate-50 p-4 rounded-2xl flex flex-col gap-1 text-xs">
                  <span className="font-black text-slate-800 block truncate">{cred.fullName}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-1 block">Username</span>
                  <span className="font-mono text-[10px] text-slate-600 select-all bg-white p-1.5 rounded-lg border border-slate-100 block truncate">{cred.username}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-1 block">Password</span>
                  <span className="font-mono text-[10px] text-slate-600 select-all bg-white p-1.5 rounded-lg border border-slate-100 block truncate">{cred.password}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Wizard ─────────────────────────────────────────────────
  return (
    <div className="flex w-full flex-col gap-4 font-sans text-left anim-fade-up">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <CalendarRange size={20} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Academic Year Rollover</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Dry run</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {preview
                  ? `${preview.currentYear} → ${preview.nextYear}. Review the complete flow before applying changes.`
                  : 'Preparing the rollover preview…'}
              </p>
            </div>
          </div>

          <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <label className="block">
              <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-400">New session starts in</span>
              <select
                value={sessionStartMonth}
                onChange={(event) => setSessionStartMonth(Number(event.target.value))}
                className="min-w-36 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 outline-none focus:border-rose-300"
              >
                {MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
              </select>
            </label>
            <button
              type="button"
              onClick={() => void saveSessionStartMonth()}
              disabled={savingSessionMonth || sessionStartMonth === preview?.academicYearStartMonth}
              className="rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-bold text-white hover:bg-slate-800 disabled:cursor-default disabled:opacity-40 cursor-pointer"
            >
              {savingSessionMonth ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {preview && (
          <dl className="grid grid-cols-4 divide-x divide-slate-200 border-t border-slate-100 bg-slate-50/70">
            {[
              { label: 'Students', value: preview.eligibleCount, detail: 'active roster', color: 'text-slate-900' },
              { label: 'Moving up', value: preview.eligibleCount - preview.class10Count, detail: 'Classes 1–9', color: 'text-indigo-600' },
              { label: 'Leaving', value: preview.class10Count, detail: 'Class 10', color: 'text-rose-600' },
              { label: 'Section decisions', value: preview.sectionDecisionsNeeded, detail: preview.sectionDecisionsNeeded ? 'need input' : 'all aligned', color: preview.sectionDecisionsNeeded > 0 ? 'text-amber-600' : 'text-emerald-600' },
            ].map((metric) => (
              <div key={metric.label} className="flex items-baseline justify-center gap-2 px-3 py-3">
                <dt className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{metric.label}</dt>
                <dd className={`text-sm font-bold tabular-nums ${metric.color}`}>{metric.value}</dd>
                <span className="text-[10px] text-slate-400">{metric.detail}</span>
              </div>
            ))}
          </dl>
        )}
      </section>

      {errorMsg && (
        <div className="flex gap-2.5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800">
          <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {preview?.alreadyRun && (
        <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
          <span>
            <span className="font-bold">Already rolled over.</span> {preview.currentYear} has been promoted for this
            school{preview.alreadyRunAt ? ` on ${new Date(preview.alreadyRunAt).toLocaleDateString()}` : ''}. Running it
            again is blocked — each academic year can only be rolled over once.
          </span>
        </div>
      )}

      {!isSessionStartMonth && !preview?.alreadyRun && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <AlertTriangle className="shrink-0 text-amber-600" size={16} />
          <p><span className="font-bold">Outside your configured rollover period.</span> This school’s new session starts in {MONTHS[sessionStartMonth - 1]}. Running now updates the roster immediately.</p>
        </div>
      )}

      {/* Step indicator */}
      <nav
        aria-label="Rollover progress"
        className={`grid gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm ${steps.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}
      >
        {steps.map((s, i) => (
          <div
            key={s.key}
            aria-current={i === stepIdx ? 'step' : undefined}
            className={`flex min-w-0 items-center gap-3 rounded-lg px-3 py-3 transition-colors ${
              i === stepIdx
                ? 'bg-slate-900 text-white shadow-sm'
                : i < stepIdx
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-400'
            }`}
          >
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${i === stepIdx ? 'bg-white/15' : i < stepIdx ? 'bg-emerald-100' : 'bg-slate-100'}`}>
              {i < stepIdx ? '✓' : i + 1}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[11px] font-bold">{s.label}</span>
              <span className={`mt-0.5 block truncate text-[9px] font-medium ${i === stepIdx ? 'text-slate-300' : i < stepIdx ? 'text-emerald-600' : 'text-slate-400'}`}>{STEP_DESCRIPTION[s.key]}</span>
            </span>
          </div>
        ))}
      </nav>

      {/* STEP — per-class plan */}
      {step === 'review' && preview && (
        <div className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white pb-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-800">Review class changes</h3>
              <p className="mt-0.5 text-[11px] text-slate-400">Nothing is changed until the final confirmation.</p>
            </div>
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-indigo-600">Step 1 of {steps.length}</span>
          </div>

          {preview.summary.length === 0 ? (
            <p className="px-5 py-4 text-xs text-slate-400">No active students to roll over.</p>
          ) : (
            <div className="overflow-x-auto text-xs">
              <table className="w-full table-fixed border-collapse text-left">
                <thead className="bg-slate-50">
                  <tr className="border-y border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3">Current class</th>
                    <th className="px-5 py-3">Students</th>
                    <th className="px-5 py-3">Next session</th>
                    <th className="px-5 py-3">Default action</th>
                  </tr>
                </thead>
                <tbody className="font-semibold">
                  {preview.summary.map((row) => (
                    <tr key={row.classNum} className="border-b border-slate-50">
                      <td className="px-5 py-3">Class {row.classNum}</td>
                      <td className="px-5 py-3 text-slate-500">{row.studentsCount}</td>
                      <td className="px-5 py-3 text-slate-500">
                        {row.nextClassNum ? `Class ${row.nextClassNum}` : <span className="text-rose-600">Leaves school</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-lg font-bold text-[9px] uppercase ${ACTION_STYLE[row.action]}`}>
                          {ACTION_LABEL[row.action]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mx-5 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-500">
            Class 1 will be empty afterwards — you'll be prompted to admit the new intake once this finishes.
            {preview.class4Count > 0 && ` ${preview.class4Count} Class 4 student${preview.class4Count === 1 ? '' : 's'} will switch from PIN to password login and need printed slips.`}
            {' '}Class teachers, subject assignments and the timetable carry over to {preview.nextYear}.
          </p>

          <button
            onClick={goNext}
            disabled={preview.alreadyRun || preview.eligibleCount === 0}
            className="ml-5 w-fit rounded-lg bg-slate-900 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            Next: {steps[1]?.label.toLowerCase() ?? 'continue'} →
          </button>
        </div>
      )}

      {/* STEP — sections that have nowhere to go.
          Only rendered when the roster forces a choice: a section whose label
          exists in the class above needs no input and is not shown. */}
      {step === 'sections' && preview && (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <span className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
              <Split size={15} className="text-indigo-500" /> Where do these sections go?
            </span>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              {pendingMoves.length === 1 ? 'One section has' : `${pendingMoves.length} sections have`} no matching
              section in the class above. Sections whose names already line up move across on their own and aren't
              listed here.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {pendingMoves.map((row) => {
              const key = moveKey(row.fromClass, row.fromSection);
              const choice = sectionChoices[key] ?? row.fromSection;
              const creating = choice === row.fromSection;
              return (
                <div
                  key={key}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3 text-[13px]"
                >
                  <span className="font-bold text-slate-700 shrink-0">
                    Class {row.fromClass}-{row.fromSection}
                  </span>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {row.studentCount} student{row.studentCount === 1 ? '' : 's'}
                  </span>
                  <ChevronRight size={13} className="text-slate-300 shrink-0" />
                  <select
                    value={choice}
                    onChange={(e) => setSectionChoices((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] font-semibold text-slate-700 outline-none focus:border-slate-400 cursor-pointer"
                  >
                    <option value={row.fromSection}>
                      Create Class {row.toClass}-{row.fromSection}
                    </option>
                    {row.availableSections.map((label) => (
                      <option key={label} value={label}>
                        Move into Class {row.toClass}-{label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-slate-400">
                    {creating
                      ? `Class ${row.toClass}-${row.fromSection} will be created`
                      : `joins the existing Class ${row.toClass}-${choice}`}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goBack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <button
              onClick={goNext}
              className="rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-slate-800 cursor-pointer"
            >
              Next: student outcomes →
            </button>
          </div>
        </div>
      )}

      {/* STEP — hold-backs */}
      {step === 'holdbacks' && preview && (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <span className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
              <RotateCcw size={15} className="text-amber-500" /> Manage student outcomes
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Everyone advances by default. Filter or select multiple students, then update them together. Students marked to repeat remain in their current class; Class 4 repeaters keep PIN login.
            </p>
          </div>

          <div className="grid grid-cols-[minmax(260px,1fr)_160px_160px] gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={holdSearch}
                onChange={(e) => { setHoldSearch(e.target.value); setHoldPage(1); }}
                placeholder="Search name, roll number or class…"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-[13px] outline-none focus:border-slate-400"
              />
            </div>
            <select
              value={holdClass}
              onChange={(e) => { setHoldClass(e.target.value); setHoldSection('all'); setHoldPage(1); }}
              aria-label="Filter students by class"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-600 outline-none focus:border-slate-400"
            >
              <option value="all">All classes</option>
              {classOptions.map((classNum) => <option key={classNum} value={classNum}>Class {classNum}</option>)}
            </select>
            <select
              value={holdSection}
              onChange={(e) => { setHoldSection(e.target.value); setHoldPage(1); }}
              aria-label="Filter students by section"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-600 outline-none focus:border-slate-400"
            >
              <option value="all">All sections</option>
              {sectionOptions.map((section) => <option key={section} value={section}>Section {section}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span><strong className="text-slate-800">{selectedStudents.size}</strong> selected</span>
              <span><strong className="text-amber-700">{holdBack.size}</strong> repeating</span>
              <button type="button" onClick={() => void selectAllFiltered()} disabled={filteredRoster.length === 0} className="font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-40 cursor-pointer">
                Select all {filteredRoster.length} filtered
              </button>
              {selectedStudents.size > 0 && (
                <button type="button" onClick={() => setSelectedStudents(new Set())} className="font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">Clear selection</button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => applyBulkOutcome(false)} disabled={selectedStudents.size === 0} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer">
                Move selected up
              </button>
              <button type="button" onClick={() => applyBulkOutcome(true)} disabled={selectedStudents.size === 0} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-40 cursor-pointer">
                Repeat current class
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full table-fixed text-left text-[12px]">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="w-11 px-3 py-2.5">
                    <input type="checkbox" checked={allVisibleSelected} onChange={(e) => setVisibleSelection(e.target.checked)} aria-label="Select all students on this page" className="accent-indigo-600" />
                  </th>
                  <th className="px-3 py-2.5">Student</th>
                  <th className="w-32 px-3 py-2.5">Roll number</th>
                  <th className="w-32 px-3 py-2.5">Current class</th>
                  <th className="w-36 px-3 py-2.5">Next year</th>
                  <th className="w-52 px-3 py-2.5">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRoster.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No students match these filters.</td></tr>
                ) : visibleRoster.map((student) => {
                  const repeats = holdBack.has(student.id);
                  return (
                    <tr key={student.id} className={repeats ? 'bg-amber-50/50' : 'hover:bg-slate-50/70'}>
                      <td className="px-3 py-2.5">
                        <input type="checkbox" checked={selectedStudents.has(student.id)} onChange={() => toggleStudentSelection(student.id)} aria-label={`Select ${student.fullName}`} className="accent-indigo-600" />
                      </td>
                      <td className="truncate px-3 py-2.5 font-semibold text-slate-800" title={student.fullName}>{student.fullName}</td>
                      <td className="px-3 py-2.5 text-slate-500">{student.rollNumber || '—'}</td>
                      <td className="px-3 py-2.5 text-slate-600">Class {student.classNum}-{student.section}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-700">{repeats ? `Class ${student.classNum}` : student.classNum === 10 ? 'Leaves school' : `Class ${student.classNum + 1}`}</td>
                      <td className="px-3 py-2">
                        <select
                          value={repeats ? 'repeat' : 'advance'}
                          onChange={(e) => setStudentOutcome(student.id, e.target.value === 'repeat')}
                          aria-label={`Rollover decision for ${student.fullName}`}
                          className={`w-full rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold outline-none ${repeats ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-700'}`}
                        >
                          <option value="advance">{student.classNum === 10 ? 'Pass out' : 'Move up'}</option>
                          <option value="repeat">Repeat current class</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Showing {filteredRoster.length === 0 ? 0 : (activeRosterPage - 1) * ROSTER_PAGE_SIZE + 1}–{Math.min(activeRosterPage * ROSTER_PAGE_SIZE, filteredRoster.length)} of {filteredRoster.length}</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setHoldPage((page) => Math.max(1, page - 1))} disabled={activeRosterPage === 1} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer">Previous</button>
              <span className="font-medium text-slate-600">Page {activeRosterPage} of {rosterPageCount}</span>
              <button type="button" onClick={() => setHoldPage((page) => Math.min(rosterPageCount, page + 1))} disabled={activeRosterPage === rosterPageCount} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer">Next</button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goBack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <button
              onClick={goNext}
              className="rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-slate-800 cursor-pointer"
            >
              {holdBack.size > 0 ? `Next with ${holdBack.size} held back →` : 'Next — nobody held back →'}
            </button>
          </div>
        </div>
      )}

      {/* STEP — confirm */}
      {step === 'confirm' && preview && (
        <div className="flex flex-col gap-4 rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
          <span className="font-display font-bold text-sm text-slate-800">Confirm rollover</span>

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-[13px] text-slate-700 flex flex-col gap-1.5">
            <div><span className="font-semibold">{movingUpCount}</span> students move up one class</div>
            {holdBack.size > 0 && <div><span className="font-semibold">{holdBack.size}</span> repeat their current class</div>}
            <div><span className="font-semibold">{passingOutCount}</span> Class 10 students pass out and are deactivated</div>
            {pendingMoves.map((row) => {
              const choice = sectionChoices[moveKey(row.fromClass, row.fromSection)] ?? row.fromSection;
              return (
                <div key={moveKey(row.fromClass, row.fromSection)}>
                  <span className="font-semibold">Class {row.fromClass}-{row.fromSection}</span>
                  {' → '}
                  <span className="font-semibold">Class {row.toClass}-{choice}</span>
                  <span className="text-slate-500">
                    {choice === row.fromSection ? ' (new section)' : ` (${row.studentCount} joining an existing section)`}
                  </span>
                </div>
              );
            })}
            <div className="text-slate-500 pt-1 border-t border-slate-200 mt-1">
              Academic year becomes <span className="font-semibold">{preview.nextYear}</span>
            </div>
          </div>

          <p className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
            This cannot be undone from the app, and can only be run once for {preview.currentYear}.
            Standing announcements are closed, since they were written for the outgoing classes.
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={goBack}
              disabled={executing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <button
              onClick={() => void handleExecute()}
              disabled={executing || preview.alreadyRun}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
            >
              {executing && <Loader2 size={14} className="animate-spin" />}
              {executing ? 'Rolling over…' : 'Run rollover'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
