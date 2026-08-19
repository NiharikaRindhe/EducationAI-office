import type { GeneratedQuestion, Citation } from './examGenerator';

/**
 * Turns a set of generated questions into something a teacher can take out of
 * the browser.
 *
 * Two formats, because they answer different needs:
 *   - the question paper is what gets printed and handed to a class, so it
 *     carries marks, an answer key on its own page, and no AI branding;
 *   - the CSV is for re-importing or editing in a spreadsheet.
 *
 * Both are produced client-side from the drafts already on screen. There is
 * deliberately no server round-trip: the teacher may not have saved these to
 * the question bank yet, and downloading must not force them to.
 */

const TYPE_LABELS: Record<string, string> = {
  mcq: 'Multiple choice',
  true_false: 'True or false',
  short_answer: 'Short answer',
  long_answer: 'Long answer',
  fill_blank: 'Fill in the blank',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface PaperMeta {
  classNum: number;
  subject: string;
  citation?: Citation | null;
  schoolName?: string;
}

/**
 * Opens a print-ready question paper in a new window.
 *
 * Print-to-PDF rather than a generated PDF file: it needs no dependency, the
 * teacher gets the browser's own preview, and "Save as PDF" is one click from
 * there. The answer key is forced onto its own sheet so a paper handed out
 * face-up does not carry the answers on the back.
 */
export function printQuestionPaper(questions: GeneratedQuestion[], meta: PaperMeta): void {
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks ?? 0), 0);

  const questionBlocks = questions
    .map((q) => {
      const options = (q.options ?? [])
        .map((o, oi) => {
          const label = String.fromCharCode(97 + oi);
          const text = typeof o === 'string' ? o : (o as { text?: string }).text ?? '';
          return `<li><span class="opt">(${label})</span> ${escapeHtml(text)}</li>`;
        })
        .join('');

      // Blank ruled space for anything the student has to write out; an MCQ
      // needs none, a long answer needs most of the page.
      const writingSpace =
        q.type === 'long_answer' ? 'space-lg' : q.type === 'short_answer' ? 'space-sm' : '';

      return `
        <li class="q">
          <div class="q-head">
            <span class="q-text">${escapeHtml(q.text)}</span>
            <span class="q-marks">[${q.marks}]</span>
          </div>
          ${options ? `<ol class="opts">${options}</ol>` : ''}
          ${writingSpace ? `<div class="${writingSpace}"></div>` : ''}
        </li>`;
    })
    .join('');

  const answerRows = questions
    .map((q, i) => {
      const answer = q.correctAnswer ?? q.rubric ?? '—';
      return `<tr><td class="n">${i + 1}</td><td>${escapeHtml(answer)}</td></tr>`;
    })
    .join('');

  const source = meta.citation
    ? `Set from ${escapeHtml(meta.citation.bookTitle)}${
        meta.citation.chapterNum !== null ? `, chapter ${meta.citation.chapterNum}` : ''
      }`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Class ${meta.classNum} ${escapeHtml(meta.subject)} — question paper</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #111; margin: 0; font-size: 12pt; line-height: 1.5; }
  header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 6px; }
  h1 { font-size: 15pt; margin: 0 0 4px; letter-spacing: .5px; }
  .sub { font-size: 10.5pt; color: #333; }
  .meta { display: flex; justify-content: space-between; font-size: 10.5pt; margin: 10px 0 16px; }
  .rule { font-size: 10pt; color: #444; border: 1px solid #bbb; padding: 8px 10px; margin-bottom: 16px; }
  ol.qs { padding-left: 20px; margin: 0; }
  li.q { margin-bottom: 14px; page-break-inside: avoid; }
  .q-head { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
  .q-text { flex: 1; }
  .q-marks { font-size: 10pt; color: #444; white-space: nowrap; }
  ol.opts { list-style: none; padding-left: 12px; margin: 6px 0 0; }
  ol.opts li { margin: 2px 0; font-size: 11.5pt; }
  .opt { color: #444; margin-right: 4px; }
  .space-sm { height: 46px; border-bottom: 1px dotted #bbb; margin-top: 8px; }
  .space-lg { height: 130px; border-bottom: 1px dotted #bbb; margin-top: 8px; }
  /* The key must never share a sheet with the questions. */
  .key { page-break-before: always; }
  .key h2 { font-size: 13pt; border-bottom: 1px solid #111; padding-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 11pt; }
  td { border-bottom: 1px solid #ddd; padding: 6px 4px; vertical-align: top; }
  td.n { width: 34px; font-weight: bold; }
  footer { margin-top: 18px; font-size: 9pt; color: #666; text-align: center; }
</style>
</head>
<body>
  <header>
    <h1>${meta.schoolName ? escapeHtml(meta.schoolName) : 'Question Paper'}</h1>
    <div class="sub">Class ${meta.classNum} &middot; ${escapeHtml(meta.subject)}</div>
  </header>

  <div class="meta">
    <span>Name: ______________________________</span>
    <span>Date: ____________</span>
    <span>Maximum marks: <strong>${totalMarks}</strong></span>
  </div>

  <div class="rule">
    Answer all ${questions.length} question${questions.length === 1 ? '' : 's'}.
    Marks for each question are shown in brackets.
  </div>

  <ol class="qs">${questionBlocks}</ol>

  <section class="key">
    <h2>Answer key &mdash; Class ${meta.classNum} ${escapeHtml(meta.subject)}</h2>
    <table><tbody>${answerRows}</tbody></table>
    ${source ? `<footer>${source}</footer>` : ''}
  </section>

  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return; // popup blocked — the caller surfaces this
  win.document.write(html);
  win.document.close();
}

/** CSV of the same questions, for editing in a spreadsheet or re-importing. */
export function downloadQuestionsCsv(questions: GeneratedQuestion[], meta: PaperMeta): void {
  const cell = (v: unknown) => {
    const s = v === undefined || v === null ? '' : String(v);
    // Always quote: question text routinely contains commas, and a leading
    // = or + would otherwise be read as a formula by Excel.
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };

  const header = [
    'class', 'subject', 'type', 'difficulty', 'marks',
    'question', 'options', 'correct_answer', 'rubric', 'source_pages',
  ];

  const rows = questions.map((q) =>
    [
      meta.classNum,
      meta.subject,
      TYPE_LABELS[q.type] ?? q.type,
      q.difficulty,
      q.marks,
      q.text,
      (q.options ?? [])
        .map((o) => (typeof o === 'string' ? o : (o as { text?: string }).text ?? ''))
        .join(' | '),
      q.correctAnswer ?? '',
      q.rubric ?? '',
      (q.sourcePages ?? []).join(' '),
    ].map(cell).join(','),
  );

  // BOM so Excel opens UTF-8 correctly — without it, accented text is mangled.
  // Written as a code point rather than a literal, which lints as stray
  // whitespace and is invisible to anyone reading the file.
  const BOM = String.fromCharCode(0xfeff);
  const csv = BOM + [header.map(cell).join(','), ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `class-${meta.classNum}-${meta.subject.toLowerCase().replace(/\s+/g, '-')}-questions.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
