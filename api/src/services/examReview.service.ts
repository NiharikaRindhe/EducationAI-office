import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { recomputeSubmissionTotals } from './grading.service.js';
import { writeAuditLog } from './auditLog.service.js';

async function requireExamOwnedByTeacher(teacherId: string, examId: string) {
  const { data, error } = await supabaseAdmin.from('exams').select('*').eq('id', examId).eq('created_by', teacherId).single();
  if (error || !data) throw new ApiError('NOT_FOUND', 'Exam not found or not yours');
  return data;
}

/**
 * Exams this teacher owns that still have subjective answers waiting on them.
 *
 * The teacher dashboard's "Needs Grading" card has always called
 * `GET /teacher/pending-reviews`, but the route was never implemented — the
 * request 404'd, the card's `.catch` set an empty list, and it rendered
 * "All submissions graded ✓". A teacher was being told their grading was done
 * while students' long-answer papers sat ungraded, which is the worst possible
 * direction for that error to fail in.
 *
 * "Pending" means a submitted answer on a subjective question that no teacher
 * has finalised yet (`teacher_reviewed_at is null`). AI pre-scoring doesn't
 * count as reviewed — a teacher still has to sign it off, which is exactly the
 * gate `finalizeAnswerScore` implements.
 */
export async function listPendingReviews(teacherId: string) {
  const { data: exams, error: examErr } = await supabaseAdmin
    .from('exams')
    .select('id, title')
    .eq('created_by', teacherId)
    .in('status', ['published', 'closed']);

  if (examErr) throw new ApiError('INTERNAL_ERROR', 'Failed to load your exams', examErr.message);
  if (!exams || exams.length === 0) return [];

  const examIds = exams.map((e) => e.id as string);

  const { data: rows, error } = await supabaseAdmin
    .from('exam_answers')
    .select(
      'id, exam_submissions!inner(exam_id, submitted_at), questions!inner(type)',
    )
    .in('exam_submissions.exam_id', examIds)
    .not('exam_submissions.submitted_at', 'is', null)
    .in('questions.type', ['short_answer', 'long_answer'])
    .is('teacher_reviewed_at', null);

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load pending reviews', error.message);

  const titleById = new Map(exams.map((e) => [e.id as string, e.title as string]));
  const counts = new Map<string, number>();
  for (const row of rows ?? []) {
    const sub = Array.isArray(row.exam_submissions) ? row.exam_submissions[0] : row.exam_submissions;
    const examId = (sub as { exam_id?: string } | null)?.exam_id;
    if (!examId) continue;
    counts.set(examId, (counts.get(examId) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([exam_id, pending_count]) => ({
      exam_id,
      exam_title: titleById.get(exam_id) ?? 'Exam',
      pending_count,
    }))
    .sort((a, b) => b.pending_count - a.pending_count);
}

export async function listSubmissions(teacherId: string, examId: string) {
  await requireExamOwnedByTeacher(teacherId, examId);

  const { data, error } = await supabaseAdmin
    .from('exam_submissions')
    .select(
      'id, student_id, submitted_at, total_score, max_score, is_reviewed, auto_submitted, student_profiles(user_profiles(full_name))',
    )
    .eq('exam_id', examId)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: true });

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list submissions', error.message);
  return data;
}

export async function getSubmissionDetail(teacherId: string, examId: string, submissionId: string) {
  await requireExamOwnedByTeacher(teacherId, examId);

  const { data: submission, error } = await supabaseAdmin
    .from('exam_submissions')
    .select('*, student_profiles(user_profiles(full_name))')
    .eq('id', submissionId)
    .eq('exam_id', examId)
    .single();
  if (error || !submission) throw new ApiError('NOT_FOUND', 'Submission not found');

  const { data: answers } = await supabaseAdmin
    .from('exam_answers')
    .select('*, questions(text, type, marks, rubric)')
    .eq('exam_submission_id', submissionId);

  return { submission, answers };
}

export async function finalizeAnswerScore(
  teacherId: string,
  examId: string,
  answerId: string,
  finalScore: number,
  teacherNote?: string,
) {
  const exam = await requireExamOwnedByTeacher(teacherId, examId);

  const { data: answer, error: fetchError } = await supabaseAdmin
    .from('exam_answers')
    .select('id, exam_submission_id, ai_score, exam_submissions!inner(exam_id)')
    .eq('id', answerId)
    .single();
  if (fetchError || !answer) throw new ApiError('NOT_FOUND', 'Answer not found');

  const overrodeAi = answer.ai_score !== null && Number(answer.ai_score) !== finalScore;

  const { error } = await supabaseAdmin
    .from('exam_answers')
    .update({
      final_score: finalScore,
      teacher_note: teacherNote ?? null,
      teacher_reviewed_at: new Date().toISOString(),
      teacher_overrode_ai: overrodeAi,
    })
    .eq('id', answerId);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to save score', error.message);

  await writeAuditLog({
    schoolId: exam.school_id,
    actorId: teacherId,
    action: 'score_override',
    entity: 'exam_answer',
    entityId: answerId,
    metadata: { finalScore, overrodeAi },
  });

  await recomputeSubmissionTotals(answer.exam_submission_id);
}

/** Rank order + cut-off for a closed exam. Doesn't require every submission to be reviewed — an ungraded subjective answer just doesn't count toward that student's total yet. */
export async function getMeritList(teacherId: string, examId: string, cutoffPct = 0) {
  await requireExamOwnedByTeacher(teacherId, examId);

  const { data, error } = await supabaseAdmin
    .from('exam_submissions')
    .select('student_id, total_score, max_score, is_reviewed, student_profiles(user_profiles(full_name))')
    .eq('exam_id', examId)
    .not('submitted_at', 'is', null)
    .order('total_score', { ascending: false });

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to build merit list', error.message);

  return (data ?? [])
    .map((row, i) => {
      const sp = Array.isArray(row.student_profiles) ? row.student_profiles[0] : row.student_profiles;
      const up = sp?.user_profiles && (Array.isArray(sp.user_profiles) ? sp.user_profiles[0] : sp.user_profiles);
      const pct = row.max_score ? (Number(row.total_score) / row.max_score) * 100 : 0;
      return {
        rank: i + 1,
        studentId: row.student_id,
        fullName: up?.full_name ?? 'Unknown',
        totalScore: row.total_score,
        maxScore: row.max_score,
        percentage: Math.round(pct * 10) / 10,
        isReviewed: row.is_reviewed,
        passed: pct >= cutoffPct,
      };
    })
    .filter((r) => r.percentage >= cutoffPct || cutoffPct === 0);
}
