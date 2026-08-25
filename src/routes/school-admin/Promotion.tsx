import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2, AlertTriangle, ChevronRight, CheckCircle, Download, Search,
  ArrowLeft, GraduationCap, RotateCcw, UserPlus, Split,
  Users, ArrowUpRight, LogOut, SplitSquareHorizontal,
} from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { MetricCard, PortalPageHeader } from '../../components/shared/PortalPageHeader';

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

export const SchoolAdminPromotion: React.FC = () => {
  const [stepIdx, setStepIdx] = useState(0);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [execResult, setExecResult] = useState<ExecuteResponse | null>(null);
  const [holdBack, setHoldBack] = useState<Set<string>>(new Set());
  const [holdSearch, setHoldSearch] = useState('');
  /** moveKey -> destination section label. */
  const [sectionChoices, setSectionChoices] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isApril = new Date().getMonth() === 3; // 0-indexed

  useEffect(() => {
    api.get<PreviewResponse>('/school-admin/promotion/preview')
      .then((res) => {
        setPreview(res);
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
    list.push({ key: 'holdbacks', label: 'Hold-backs' });
    list.push({ key: 'confirm', label: 'Confirm' });
    return list;
  }, [pendingMoves]);

  const step = steps[Math.min(stepIdx, steps.length - 1)]?.key ?? 'review';
  const goNext = () => setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  const goBack = () => setStepIdx((i) => Math.max(i - 1, 0));

  const toggleHold = (id: string) =>
    setHoldBack((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const filteredRoster = useMemo(() => {
    const rows = preview?.roster ?? [];
    const q = holdSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((s) =>
      s.fullName.toLowerCase().includes(q) ||
      (s.rollNumber ?? '').toLowerCase().includes(q) ||
      `${s.classNum}-${s.section}`.toLowerCase().includes(q));
  }, [preview, holdSearch]);

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
    <div className="flex flex-col gap-5 font-sans text-left anim-fade-up">
      <PortalPageHeader
        eyebrow="Academic operations"
        title="Academic Year Rollover"
        description={
          preview
            ? `Moves every class up one level for ${preview.nextYear}. Class 10 passes out; Class 1 empties for the new intake.`
            : 'Loading…'
        }
      >
        {preview && (
          <div className="portal-metrics-grid">
            <MetricCard label="Active roster" value={preview.eligibleCount} hint="students affected" icon={<Users size={18} />} />
            <MetricCard label="Moving up a class" value={preview.eligibleCount - preview.class10Count} hint="Classes 1–9" icon={<ArrowUpRight size={18} />} tone="indigo" />
            <MetricCard label="Class 10 leavers" value={preview.class10Count} hint="pass out this run" icon={<LogOut size={18} />} tone="rose" />
            <MetricCard
              label="Section decisions"
              value={preview.sectionDecisionsNeeded}
              hint={preview.sectionDecisionsNeeded > 0 ? 'need your input' : 'all sections line up'}
              icon={<SplitSquareHorizontal size={18} />}
              tone={preview.sectionDecisionsNeeded > 0 ? 'amber' : 'emerald'}
            />
          </div>
        )}
      </PortalPageHeader>

      <div className="flex flex-col gap-5 max-w-4xl w-full mx-auto">

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl p-4 flex gap-2.5 text-xs font-bold">
          <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {preview?.alreadyRun && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-2.5 text-xs text-amber-800">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
          <span>
            <span className="font-bold">Already rolled over.</span> {preview.currentYear} has been promoted for this
            school{preview.alreadyRunAt ? ` on ${new Date(preview.alreadyRunAt).toLocaleDateString()}` : ''}. Running it
            again is blocked — each academic year can only be rolled over once.
          </span>
        </div>
      )}

      {!isApril && !preview?.alreadyRun && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-800">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
          <div>
            <span className="font-bold">Not April yet</span>
            <p className="mt-0.5">
              The Indian academic year turns over in April. Running this now promotes every current roster immediately.
            </p>
          </div>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-[11px] font-bold flex-wrap">
        {steps.map((s, i) => (
          <React.Fragment key={s.key}>
            <span className={`px-3 py-1.5 rounded-full ${i === stepIdx ? 'bg-slate-900 text-white' : i < stepIdx ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
              {i + 1}. {s.label}
            </span>
            {i < steps.length - 1 && <ChevronRight size={12} className="text-slate-300" />}
          </React.Fragment>
        ))}
      </div>

      {/* STEP — per-class plan */}
      {step === 'review' && preview && (
        <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="font-display font-bold text-sm text-slate-800">What will happen</span>
            <span className="badge pill-rose text-[9px] font-black uppercase">Dry run</span>
          </div>

          {preview.summary.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No active students to roll over.</p>
          ) : (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                    <th className="pb-2">Class</th>
                    <th className="pb-2">Students</th>
                    <th className="pb-2">Becomes</th>
                    <th className="pb-2">Action</th>
                  </tr>
                </thead>
                <tbody className="font-semibold">
                  {preview.summary.map((row) => (
                    <tr key={row.classNum} className="border-b border-slate-50">
                      <td className="py-2.5">Class {row.classNum}</td>
                      <td className="py-2.5 text-slate-500">{row.studentsCount}</td>
                      <td className="py-2.5 text-slate-500">
                        {row.nextClassNum ? `Class ${row.nextClassNum}` : <span className="text-rose-600">Leaves school</span>}
                      </td>
                      <td className="py-2.5">
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

          <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 pt-3">
            Class 1 will be empty afterwards — you'll be prompted to admit the new intake once this finishes.
            {preview.class4Count > 0 && ` ${preview.class4Count} Class 4 student${preview.class4Count === 1 ? '' : 's'} will switch from PIN to password login and need printed slips.`}
            {' '}Class teachers, subject assignments and the timetable carry over to {preview.nextYear}.
          </p>

          <button
            onClick={goNext}
            disabled={preview.alreadyRun || preview.eligibleCount === 0}
            className="w-fit rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next: {steps[1]?.label.toLowerCase() ?? 'continue'} →
          </button>
        </div>
      )}

      {/* STEP — sections that have nowhere to go.
          Only rendered when the roster forces a choice: a section whose label
          exists in the class above needs no input and is not shown. */}
      {step === 'sections' && preview && (
        <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
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
              Next: hold-backs →
            </button>
          </div>
        </div>
      )}

      {/* STEP — hold-backs */}
      {step === 'holdbacks' && preview && (
        <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
          <div>
            <span className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
              <RotateCcw size={15} className="text-amber-500" /> Students repeating the year
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Optional. Anyone ticked here stays in their current class instead of moving up. Class 4 students kept back
              keep their PIN login. Leave empty if everyone advances.
            </p>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={holdSearch}
              onChange={(e) => setHoldSearch(e.target.value)}
              placeholder="Search by name, roll number or class…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-[13px] outline-none focus:border-slate-400"
            />
          </div>

          <div className="max-h-72 overflow-y-auto flex flex-col gap-1 border border-slate-100 rounded-xl p-2">
            {filteredRoster.length === 0 ? (
              <p className="text-[12px] text-slate-400 p-3">No students match.</p>
            ) : filteredRoster.map((s) => (
              <label
                key={s.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-[13px] transition ${
                  holdBack.has(s.id) ? 'bg-amber-50 border border-amber-200' : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <input
                  type="checkbox"
                  checked={holdBack.has(s.id)}
                  onChange={() => toggleHold(s.id)}
                  className="accent-amber-500"
                />
                <span className="font-semibold text-slate-700 flex-1 truncate">{s.fullName}</span>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {s.rollNumber ? `#${s.rollNumber} · ` : ''}Class {s.classNum}-{s.section}
                </span>
              </label>
            ))}
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
        <div className="bento-card border border-rose-100 bg-white p-5 flex flex-col gap-4">
          <span className="font-display font-bold text-sm text-slate-800">Confirm rollover</span>

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-[13px] text-slate-700 flex flex-col gap-1.5">
            <div><span className="font-semibold">{preview.eligibleCount - holdBack.size}</span> students move up one class</div>
            {holdBack.size > 0 && <div><span className="font-semibold">{holdBack.size}</span> repeat their current class</div>}
            <div><span className="font-semibold">{preview.class10Count}</span> Class 10 students pass out and are deactivated</div>
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
    </div>
  );
};
