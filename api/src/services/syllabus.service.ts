import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { listGeneratableChapters } from './examGenerator.service.js';

/**
 * The student-facing syllabus for Classes 5-10.
 *
 * Batch 1 (Classes 1-4) has hand-seeded reference chapters in
 * `curriculum_chapters` and reads `GET /student/curriculum`. Classes 5-10 have
 * no such seed — only four Class 9/10 Science rows exist — so the honest
 * source of "what chapters am I studying" for those classes is the books the
 * school has actually uploaded and indexed (`text_chunks`). That is the same
 * derivation a teacher sees when scoping AI generation, so a student's chapter
 * list and their teacher's cannot drift apart.
 *
 * Progress is deliberately sparse. There is no per-chapter completion signal
 * for Classes 5-10 (games, which write `subject_progress`, are Batch 1 only),
 * so this returns only progress that is genuinely measured: real scores from
 * exams the student actually submitted. A chapter with no data reports no
 * status rather than a fabricated one.
 */

export interface SyllabusChapter {
  chapterNum: number;
  title: string | null;
  bookTitle: string;
}

export interface SyllabusSubject {
  subject: string;
  chapters: SyllabusChapter[];
  /** False when the school has uploaded no indexed book for this subject. */
  hasBook: boolean;
  /** Average percentage across submitted, graded exams for this subject. */
  averageScore: number | null;
  examsTaken: number;
}

export interface StudentSyllabus {
  classNum: number;
  subjects: SyllabusSubject[];
}

export async function getStudentSyllabus(studentId: string): Promise<StudentSyllabus> {
  const { data: profile, error: pErr } = await supabaseAdmin
    .from('user_profiles')
    .select('school_id, student_profiles!inner(class_num)')
    .eq('id', studentId)
    .single();
  if (pErr || !profile) throw new ApiError('NOT_FOUND', 'Student profile not found');

  const sp = Array.isArray(profile.student_profiles) ? profile.student_profiles[0] : profile.student_profiles;
  const classNum = sp?.class_num;
  const schoolId = profile.school_id as string;
  if (typeof classNum !== 'number') throw new ApiError('NOT_FOUND', 'Student class not set');

  // Subjects come from the same class_subjects whitelist the chat/exam/task
  // validators use, so a student never sees a subject their class doesn't take.
  const { data: subjectRows, error: sErr } = await supabaseAdmin
    .from('class_subjects')
    .select('subject')
    .eq('class_num', classNum)
    .order('subject');
  if (sErr) throw new ApiError('INTERNAL_ERROR', 'Failed to load subjects', sErr.message);

  const subjects = (subjectRows ?? []).map((r) => r.subject as string);

  const scoreBySubject = await averageScoreBySubject(studentId);

  const results = await Promise.all(
    subjects.map(async (subject): Promise<SyllabusSubject> => {
      const { hasIndexedContent, options } = await listGeneratableChapters(schoolId, classNum, subject);
      const chapters = options
        .filter((o) => o.kind === 'chapter' && o.chapterNum !== null)
        .map((o) => ({
          chapterNum: o.chapterNum as number,
          title: o.chapterTitle,
          bookTitle: o.bookTitle,
        }));

      const perf = scoreBySubject.get(subject);
      return {
        subject,
        chapters,
        // hasIndexedContent, NOT options.length: some real books (a few NCERT
        // PDFs where extraction collapsed every chunk onto one page number —
        // c1-math, c2-math, c9-english, confirmed) have chunks indexed but
        // zero chapter/page-band options to offer. `options.length > 0` used
        // to gate this and reported "book not uploaded" for those subjects
        // even though the book was there and the AI tutor could already
        // answer from it.
        hasBook: hasIndexedContent,
        averageScore: perf ? Math.round(perf.total / perf.count) : null,
        examsTaken: perf?.count ?? 0,
      };
    }),
  );

  return { classNum, subjects: results };
}

/** Real measured performance: submitted exams with a score recorded. */
async function averageScoreBySubject(studentId: string) {
  const { data, error } = await supabaseAdmin
    .from('exam_submissions')
    .select('total_score, max_score, exams!inner(subject)')
    .eq('student_id', studentId)
    .not('submitted_at', 'is', null)
    .not('total_score', 'is', null);

  const map = new Map<string, { total: number; count: number }>();
  if (error || !data) return map;

  for (const row of data) {
    const exam = Array.isArray(row.exams) ? row.exams[0] : row.exams;
    const subject = exam?.subject as string | undefined;
    const max = row.max_score as number | null;
    const score = row.total_score as number | null;
    if (!subject || !max || max <= 0 || score === null) continue;

    const pct = (score / max) * 100;
    const agg = map.get(subject) ?? { total: 0, count: 0 };
    agg.total += pct;
    agg.count += 1;
    map.set(subject, agg);
  }
  return map;
}
