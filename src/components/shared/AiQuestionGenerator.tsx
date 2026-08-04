import React from 'react';
import {
  Sparkles, Loader2, AlertCircle, X, CheckCircle2, BookOpen, Trash2, Plus,
  ChevronDown, ChevronUp, TriangleAlert, Save, RotateCcw,
} from 'lucide-react';
import {
  QUESTION_TYPES, MAX_QUESTIONS,
  fetchGeneratableChapters, generateQuestions, saveGeneratedQuestions,
  describeGeneratorError, validateQuestion,
  type GeneratedQuestion, type GeneratableChapter, type MixRow,
  type Citation, type QuestionType, type Difficulty, type GeneratorPortal,
} from '../../lib/examGenerator';

/**
 * AI question generator, grounded in the books the school has uploaded.
 *
 * The whole component is built around the review gate: generated questions
 * land in an editable list, every one shows the page it came from, and nothing
 * reaches the question bank until the teacher presses Save. Questions that
 * still have problems (no correct option marked, missing rubric) are flagged
 * and block saving until fixed, because the failure mode being designed
 * against is a plausible-looking question with a wrong answer key going live
 * to a full class.
 */

interface Props {
  /** Class+subject pairs this teacher may generate for. */
  scope: { classNum: number; subjects: string[] }[];
  /** Receives the new question-bank rows. Create Exam uses the ids to drop the
   *  questions straight into the open paper, so generating no longer means a
   *  detour through the Question Bank page and back. */
  onSaved?: (result: { saved: number; ids: string[] }) => void;
  /** Locks generation to one class+subject (the exam being built) and hides
   *  the pickers, so a teacher can't generate Class 9 Science into a Class 6
   *  Maths paper by leaving a dropdown on its default. */
  lockedTo?: { classNum: number; subject: string };
  /** Overrides the post-save message when the caller does something further
   *  with the questions (e.g. "…and added to this exam"). */
  savedMessage?: (count: number) => string;
  /** Which portal's routes to call. School Admins hit their own prefix; the
   *  server still derives real permissions from the authenticated role. */
  portal?: GeneratorPortal;
}

const labelCls = 'block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1.5';
const fieldCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';

/** Where unsaved drafts are parked so a tab switch or reload doesn't discard
 *  a paid-for generation. Scoped per portal so the teacher and school-admin
 *  generators can't read each other's batch. */
const draftKey = (portal: GeneratorPortal) => `eduai_qgen_draft_${portal}`;

interface StoredDraft {
  classNum: number;
  subject: string;
  drafts: GeneratedQuestion[];
  citation: Citation | null;
  discarded: number;
}

function readStoredDraft(portal: GeneratorPortal): StoredDraft | null {
  try {
    const raw = sessionStorage.getItem(draftKey(portal));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    return Array.isArray(parsed?.drafts) && parsed.drafts.length > 0 ? parsed : null;
  } catch {
    // Corrupt or unreadable storage must never stop the generator loading.
    return null;
  }
}

const DIFFICULTY_OPTIONS: { value: Difficulty | 'mixed'; label: string }[] = [
  { value: 'mixed', label: 'Mixed' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export const AiQuestionGenerator: React.FC<Props> = ({ scope, onSaved, lockedTo, savedMessage, portal = 'teacher' }) => {
  // Read once on mount. A stored batch also restores the class+subject it was
  // generated for, so the restored questions are never shown under the wrong
  // heading — except when `lockedTo` pins them, which always wins.
  const [restored] = React.useState(() => readStoredDraft(portal));

  const firstClass = lockedTo?.classNum ?? restored?.classNum ?? scope[0]?.classNum ?? 1;
  const [classNum, setClassNum] = React.useState(firstClass);
  const [subject, setSubject] = React.useState(
    lockedTo?.subject ?? restored?.subject ?? scope[0]?.subjects[0] ?? '',
  );
  const [pickedChapter, setPickedChapter] = React.useState('');
  // Keyed by class+subject so a response that arrives after the teacher has
  // already switched selection is ignored rather than shown against the wrong
  // subject — and so no effect has to synchronously clear stale state.
  const [loaded, setLoaded] = React.useState<
    { key: string; hasIndexedContent: boolean; options: GeneratableChapter[] } | null
  >(null);
  const [mix, setMix] = React.useState<MixRow[]>([{ type: 'mcq', count: 5, marks: 1 }]);
  const [difficulty, setDifficulty] = React.useState<Difficulty | 'mixed'>('mixed');
  const [instructions, setInstructions] = React.useState('');

  const [generating, setGenerating] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [banner, setBanner] = React.useState('');
  // Drafts survive navigation and reload.
  //
  // Generation costs a real (slow, metered) model call, and reviewing 10
  // questions takes long enough that a teacher will switch tabs, open the
  // textbook, or accidentally hit back. Holding drafts in component state
  // alone meant all of that work vanished silently and the only recovery was
  // to generate — and pay — again. sessionStorage keeps them for the tab.
  const [drafts, setDrafts] = React.useState<GeneratedQuestion[] | null>(() => restored?.drafts ?? null);
  const [citation, setCitation] = React.useState<Citation | null>(() => restored?.citation ?? null);
  const [discarded, setDiscarded] = React.useState(() => restored?.discarded ?? 0);
  const [expanded, setExpanded] = React.useState<Set<number>>(new Set());

  const subjectsForClass = React.useMemo(
    () => scope.find((s) => s.classNum === classNum)?.subjects ?? [],
    [scope, classNum],
  );
  const effectiveSubject = subjectsForClass.includes(subject) ? subject : (subjectsForClass[0] ?? '');

  const scopeKey = `${classNum}::${effectiveSubject}`;

  // Which chapters actually have indexed content for this class+subject.
  React.useEffect(() => {
    if (!effectiveSubject) return;
    let cancelled = false;
    fetchGeneratableChapters(classNum, effectiveSubject, portal)
      .then((res) => { if (!cancelled) setLoaded({ key: scopeKey, hasIndexedContent: res.hasIndexedContent, options: res.options }); })
      .catch(() => { if (!cancelled) setLoaded({ key: scopeKey, hasIndexedContent: false, options: [] }); });
    return () => { cancelled = true; };
  }, [classNum, effectiveSubject, scopeKey, portal]);

  // null = still loading for the current selection.
  const chapters: GeneratableChapter[] | null =
    !effectiveSubject ? [] : loaded?.key === scopeKey ? loaded.options : null;

  // Distinct from `chapters.length === 0`: a book can be fully indexed but
  // still offer zero chapter/page choices (see GeneratableChaptersResult in
  // lib/examGenerator.ts), so this — not `chapters.length` — is what actually
  // means "no book uploaded for this class+subject".
  const hasIndexedContent: boolean | null =
    !effectiveSubject ? false : loaded?.key === scopeKey ? loaded.hasIndexedContent : null;

  // Options are addressed by index, not chapter number, because a page band has
  // no chapter number. A selection made under a different subject falls back to
  // "whole subject" rather than being cleared by an effect.
  const selectedIndex = pickedChapter !== '' && chapters?.[Number(pickedChapter)] ? Number(pickedChapter) : -1;
  const selectedScope = selectedIndex >= 0 ? chapters![selectedIndex] : null;

  const totalQuestions = mix.reduce((sum, m) => sum + m.count, 0);
  const totalMarks = mix.reduce((sum, m) => sum + m.count * m.marks, 0);
  const overCap = totalQuestions > MAX_QUESTIONS;

  const updateMix = (i: number, patch: Partial<MixRow>) =>
    setMix((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const addMixRow = () => {
    const unused = QUESTION_TYPES.find((t) => !mix.some((m) => m.type === t.value));
    setMix((prev) => [...prev, { type: unused?.value ?? 'mcq', count: 3, marks: 2 }]);
  };

  const handleGenerate = async () => {
    if (!effectiveSubject || overCap) return;
    setGenerating(true);
    setError('');
    setBanner('');
    try {
      const res = await generateQuestions({
        classNum,
        subject: effectiveSubject,
        chapterNum: selectedScope?.kind === 'chapter' ? selectedScope.chapterNum ?? undefined : undefined,
        fromPage: selectedScope?.kind === 'pages' ? selectedScope.fromPage ?? undefined : undefined,
        toPage: selectedScope?.kind === 'pages' ? selectedScope.toPage ?? undefined : undefined,
        mix,
        difficulty,
        instructions: instructions.trim() || undefined,
      }, portal);
      setDrafts(res.questions);
      setCitation(res.citation);
      setDiscarded(res.discarded);
      setExpanded(new Set());
    } catch (err) {
      setError(describeGeneratorError(err));
      setDrafts(null);
    } finally {
      setGenerating(false);
    }
  };

  // Mirror the working set into sessionStorage on every edit, so an accidental
  // navigation mid-review loses nothing. Clearing on empty keeps a stale batch
  // from resurfacing after the teacher saves or discards.
  React.useEffect(() => {
    try {
      if (drafts && drafts.length > 0) {
        const payload: StoredDraft = { classNum, subject: effectiveSubject, drafts, citation, discarded };
        sessionStorage.setItem(draftKey(portal), JSON.stringify(payload));
      } else {
        sessionStorage.removeItem(draftKey(portal));
      }
    } catch {
      // Storage full or blocked (private mode). Persistence is a convenience —
      // never let it break the generator itself.
    }
  }, [drafts, citation, discarded, classNum, effectiveSubject, portal]);

  const problems = React.useMemo(
    () => (drafts ?? []).map((q) => validateQuestion(q)),
    [drafts],
  );
  const blockingCount = problems.filter(Boolean).length;

  const handleSave = async () => {
    if (!drafts || drafts.length === 0 || blockingCount > 0) return;
    setSaving(true);
    setError('');
    try {
      const res = await saveGeneratedQuestions({
        classNum,
        subject: effectiveSubject,
        chapterNum: selectedScope?.kind === 'chapter' ? selectedScope.chapterNum ?? undefined : undefined,
        questions: drafts,
        citation: citation ?? undefined,
      }, portal);
      setBanner(
        savedMessage
          ? savedMessage(res.saved)
          : `${res.saved} question${res.saved === 1 ? '' : 's'} saved to your question bank. Add them to an exam from Create Exam.`,
      );
      setDrafts(null);
      setCitation(null);
      onSaved?.(res);
    } catch (err) {
      setError(describeGeneratorError(err));
    } finally {
      setSaving(false);
    }
  };

  const updateDraft = (i: number, patch: Partial<GeneratedQuestion>) =>
    setDrafts((prev) => (prev ? prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)) : prev));

  const removeDraft = (i: number) =>
    setDrafts((prev) => (prev ? prev.filter((_, idx) => idx !== i) : prev));

  const toggleExpanded = (i: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });

  const thinChapter = selectedScope && selectedScope.chunks < 4 ? selectedScope : null;
  // Every option being a page band means the book's chapter structure wasn't
  // detected at ingest — worth saying so, since the teacher would otherwise
  // wonder where the chapter names went.
  const noChapterStructure = Boolean(chapters?.length) && chapters!.every((c) => c.kind === 'pages');
  // The book is indexed but has NEITHER chapters NOR page bands to offer —
  // ingestion collapsed every chunk onto one page number (a known extraction
  // gap in a few real books). Generation still works over the whole subject;
  // this only explains why the chapter picker has nothing but "Whole subject".
  const noStructureAtAll = hasIndexedContent === true && chapters !== null && chapters.length === 0;

  if (scope.length === 0) {
    return (
      <div className="portal-panel p-6 text-center">
        <p className="text-[13px] text-slate-500">
          You aren't mapped to any class yet, so there's nothing to generate from.
          Ask your School Admin to assign you a class and subject.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="portal-panel">
        <div className="flex items-start gap-3 border-b border-slate-100 bg-gradient-to-r from-white via-white to-slate-50/80 px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
            <Sparkles size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-slate-900">Generate questions from the textbook</h2>
            <p className="mt-0.5 text-[12px] leading-5 text-slate-500">
              Questions are written only from the book uploaded for this class — you review and edit every one before it's saved.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12.5px] leading-5 text-rose-700">
              <AlertCircle size={15} className="mt-px shrink-0" />
              <span className="min-w-0 flex-1">{error}</span>
              <button onClick={() => setError('')} className="shrink-0 cursor-pointer text-rose-500 hover:text-rose-700"><X size={14} /></button>
            </div>
          )}
          {banner && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[12.5px] leading-5 text-emerald-800">
              <CheckCircle2 size={15} className="mt-px shrink-0" />
              <span className="min-w-0 flex-1">{banner}</span>
              <button onClick={() => setBanner('')} className="shrink-0 cursor-pointer text-emerald-600 hover:text-emerald-800"><X size={14} /></button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
            {lockedTo ? (
              // Fixed by the exam being built — shown for confirmation, not editable.
              <div className="sm:col-span-7">
                <span className={labelCls}>Generating for</span>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-semibold text-slate-700">
                  Class {lockedTo.classNum} · {lockedTo.subject}
                </div>
              </div>
            ) : (
              <>
                <div className="sm:col-span-3">
                  <label className={labelCls} htmlFor="gen-class">Class</label>
                  <select
                    id="gen-class"
                    value={classNum}
                    onChange={(e) => setClassNum(Number(e.target.value))}
                    disabled={generating}
                    className={`${fieldCls} cursor-pointer`}
                  >
                    {scope.map((s) => <option key={s.classNum} value={s.classNum}>Class {s.classNum}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-4">
                  <label className={labelCls} htmlFor="gen-subject">Subject</label>
                  <select
                    id="gen-subject"
                    value={effectiveSubject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={generating || subjectsForClass.length === 0}
                    className={`${fieldCls} cursor-pointer`}
                  >
                    {subjectsForClass.length === 0 && <option value="">No subjects assigned</option>}
                    {subjectsForClass.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </>
            )}
            <div className="sm:col-span-5">
              <label className={labelCls} htmlFor="gen-chapter">Chapter / part of book</label>
              <select
                id="gen-chapter"
                value={selectedIndex >= 0 ? String(selectedIndex) : ''}
                onChange={(e) => setPickedChapter(e.target.value)}
                disabled={generating || chapters === null || hasIndexedContent === false}
                className={`${fieldCls} cursor-pointer`}
              >
                {chapters === null ? (
                  <option value="">Loading chapters…</option>
                ) : hasIndexedContent === false ? (
                  <option value="">No indexed book for this subject</option>
                ) : (
                  <>
                    <option value="">Whole subject</option>
                    {chapters.map((c, i) => (
                      <option key={`${c.bookTitle}-${c.label}`} value={i}>
                        {c.label} ({c.chunks} sections)
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>

          {hasIndexedContent === false && effectiveSubject && (
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[12px] leading-5 text-amber-800">
              <BookOpen size={14} className="mt-px shrink-0" />
              No indexed book found for Class {classNum} {effectiveSubject}. Ask your School Admin to upload it in
              Content Library — generation needs the real book to work from.
            </p>
          )}

          {noChapterStructure && (
            <p className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[12px] leading-5 text-slate-600">
              <BookOpen size={14} className="mt-px shrink-0 text-slate-400" />
              This book's chapter headings weren't recognised when it was indexed, so it's split by page range
              instead. Pick the pages covering the topic you're testing.
            </p>
          )}

          {noStructureAtAll && (
            <p className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[12px] leading-5 text-slate-600">
              <BookOpen size={14} className="mt-px shrink-0 text-slate-400" />
              This book is indexed, but chapters and page numbers weren't detected for it — generation will draw
              from the whole subject instead of a specific chapter.
            </p>
          )}

          {thinChapter && (
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[12px] leading-5 text-amber-800">
              <TriangleAlert size={14} className="mt-px shrink-0" />
              "{thinChapter.label}" only has {thinChapter.chunks} indexed section{thinChapter.chunks === 1 ? '' : 's'} —
              you may get fewer questions than requested.
            </p>
          )}

          {/* Paper shape */}
          <div>
            <label className={labelCls}>Paper shape</label>
            <div className="flex flex-col gap-2">
              {mix.map((row, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <select
                    value={row.type}
                    onChange={(e) => updateMix(i, { type: e.target.value as QuestionType })}
                    disabled={generating}
                    className={`${fieldCls} w-auto min-w-[150px] cursor-pointer`}
                    aria-label="Question type"
                  >
                    {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number" min={1} max={MAX_QUESTIONS} value={row.count}
                      onChange={(e) => updateMix(i, { count: Math.max(1, Number(e.target.value)) })}
                      disabled={generating}
                      className={`${fieldCls} w-[72px]`}
                      aria-label="How many questions"
                    />
                    <span className="text-[12px] text-slate-500">questions ×</span>
                    <input
                      type="number" min={1} max={20} value={row.marks}
                      onChange={(e) => updateMix(i, { marks: Math.max(1, Number(e.target.value)) })}
                      disabled={generating}
                      className={`${fieldCls} w-[64px]`}
                      aria-label="Marks each"
                    />
                    <span className="text-[12px] text-slate-500">marks</span>
                  </div>
                  {mix.length > 1 && (
                    <button
                      onClick={() => setMix((prev) => prev.filter((_, idx) => idx !== i))}
                      disabled={generating}
                      aria-label="Remove this row"
                      className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {mix.length < QUESTION_TYPES.length && (
                <button
                  onClick={addMixRow}
                  disabled={generating}
                  className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <Plus size={13} /> Add another type
                </button>
              )}
            </div>
            <p className={`mt-2 text-[12px] ${overCap ? 'font-semibold text-rose-600' : 'text-slate-500'}`}>
              {totalQuestions} question{totalQuestions === 1 ? '' : 's'} · {totalMarks} marks total
              {overCap && ` — the limit is ${MAX_QUESTIONS} per generation`}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
            <div className="sm:col-span-3">
              <label className={labelCls} htmlFor="gen-difficulty">Difficulty</label>
              <select
                id="gen-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty | 'mixed')}
                disabled={generating}
                className={`${fieldCls} cursor-pointer`}
              >
                {DIFFICULTY_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-9">
              <label className={labelCls} htmlFor="gen-instructions">Extra instruction (optional)</label>
              <input
                id="gen-instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. focus on word problems, avoid diagrams"
                maxLength={500}
                disabled={generating}
                className={fieldCls}
              />
            </div>
          </div>

          <button
            onClick={() => void handleGenerate()}
            disabled={generating || overCap || !effectiveSubject || hasIndexedContent === false}
            className="inline-flex w-fit cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {generating ? 'Writing questions…' : 'Generate questions'}
          </button>

          {generating && (
            <p className="text-[12px] text-slate-400">
              Reading the chapter and drafting questions — this usually takes 10–40 seconds.
            </p>
          )}
        </div>
      </div>

      {/* ── Review step ──────────────────────────────────────────── */}
      {drafts && (
        <div className="portal-panel">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="min-w-0">
              <h3 className="text-[14px] font-semibold text-slate-900">
                Review {drafts.length} question{drafts.length === 1 ? '' : 's'} before saving
              </h3>
              {citation && (
                <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-slate-500">
                  <BookOpen size={12} className="shrink-0" />
                  From <span className="font-medium">{citation.bookTitle}</span>
                  {citation.chapterNum !== null && ` · chapter ${citation.chapterNum}`}
                  {citation.pages.length === 2 && ` · pages ${citation.pages[0]}–${citation.pages[1]}`}
                  {` · ${citation.excerptsUsed} excerpts used`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setDrafts(null); setCitation(null); }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <X size={13} /> Discard
              </button>
              <button
                onClick={() => void handleGenerate()}
                disabled={generating}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {generating ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Regenerate
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={saving || drafts.length === 0 || blockingCount > 0}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-950 px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Save to question bank
              </button>
            </div>
          </div>

          {(discarded > 0 || blockingCount > 0) && (
            <div className="border-b border-slate-100 bg-amber-50/60 px-5 py-2.5 text-[12px] leading-5 text-amber-800">
              {discarded > 0 && <>The model produced {discarded} unusable question{discarded === 1 ? '' : 's'} that {discarded === 1 ? 'was' : 'were'} dropped automatically. </>}
              {blockingCount > 0 && <>{blockingCount} question{blockingCount === 1 ? ' needs' : 's need'} fixing before you can save — see the flagged rows.</>}
            </div>
          )}

          <ul className="divide-y divide-slate-100">
            {drafts.map((q, i) => {
              const problem = problems[i];
              const isOpen = expanded.has(i);
              const typeMeta = QUESTION_TYPES.find((t) => t.value === q.type);
              return (
                <li key={i} className={problem ? 'bg-rose-50/40' : ''}>
                  <div className="flex items-start gap-3 px-5 py-3">
                    <span className="mt-0.5 w-5 shrink-0 text-[12px] font-semibold tabular-nums text-slate-400">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <textarea
                        value={q.text}
                        onChange={(e) => updateDraft(i, { text: e.target.value })}
                        rows={2}
                        className="w-full resize-y rounded-lg border border-transparent bg-transparent px-2 py-1 text-[13px] leading-5 text-slate-800 outline-none transition hover:border-slate-200 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                      />
                      <div className="mt-1 flex flex-wrap items-center gap-2 px-2">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                          {typeMeta?.short ?? q.type}
                        </span>
                        <span className="text-[11px] capitalize text-slate-400">{q.difficulty}</span>
                        <span className="text-[11px] text-slate-400">{q.marks} mark{q.marks === 1 ? '' : 's'}</span>
                        {q.sourcePages && q.sourcePages.length > 0 && (
                          <span className="text-[11px] text-slate-400">· p. {q.sourcePages.join(', ')}</span>
                        )}
                        {problem && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                            <TriangleAlert size={11} /> {problem}
                          </span>
                        )}
                        <button
                          onClick={() => toggleExpanded(i)}
                          className="ml-auto inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                        >
                          {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {isOpen ? 'Hide answer' : 'Answer & marks'}
                        </button>
                        <button
                          onClick={() => removeDraft(i)}
                          aria-label="Remove this question"
                          className="cursor-pointer rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {isOpen && (
                        <div className="mt-3 flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
                          {q.type === 'mcq' && q.options && (
                            <div className="flex flex-col gap-2">
                              <span className={labelCls}>Options — tick the correct one</span>
                              {q.options.map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`correct-${i}`}
                                    checked={opt.isCorrect}
                                    onChange={() => updateDraft(i, {
                                      options: q.options!.map((o, idx) => ({ ...o, isCorrect: idx === oi })),
                                    })}
                                    className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-emerald-600"
                                  />
                                  <input
                                    value={opt.text}
                                    onChange={(e) => updateDraft(i, {
                                      options: q.options!.map((o, idx) => (idx === oi ? { ...o, text: e.target.value } : o)),
                                    })}
                                    className={fieldCls}
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {q.type === 'true_false' && (
                            <div>
                              <label className={labelCls}>Correct answer</label>
                              <select
                                value={/^true$/i.test(q.correctAnswer ?? '') ? 'True' : 'False'}
                                onChange={(e) => updateDraft(i, { correctAnswer: e.target.value })}
                                className={`${fieldCls} cursor-pointer`}
                              >
                                <option value="True">True</option>
                                <option value="False">False</option>
                              </select>
                            </div>
                          )}

                          {q.type === 'fill_blank' && (
                            <div>
                              <label className={labelCls}>Correct answer for the blank</label>
                              <input
                                value={q.correctAnswer ?? ''}
                                onChange={(e) => updateDraft(i, { correctAnswer: e.target.value })}
                                className={fieldCls}
                              />
                            </div>
                          )}

                          {(q.type === 'short_answer' || q.type === 'long_answer') && (
                            <div>
                              <label className={labelCls}>Marking rubric</label>
                              <textarea
                                value={q.rubric ?? ''}
                                onChange={(e) => updateDraft(i, { rubric: e.target.value })}
                                rows={3}
                                placeholder="What earns full marks?"
                                className={`${fieldCls} resize-y`}
                              />
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={labelCls}>Marks</label>
                              <input
                                type="number" min={1} max={20} value={q.marks}
                                onChange={(e) => updateDraft(i, { marks: Math.max(1, Number(e.target.value)) })}
                                className={fieldCls}
                              />
                            </div>
                            <div>
                              <label className={labelCls}>Difficulty</label>
                              <select
                                value={q.difficulty}
                                onChange={(e) => updateDraft(i, { difficulty: e.target.value as Difficulty })}
                                className={`${fieldCls} cursor-pointer`}
                              >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
