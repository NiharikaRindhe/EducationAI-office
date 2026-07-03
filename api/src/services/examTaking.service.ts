import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { seededShuffle } from '../lib/seededShuffle.js';
import { gradeSubmission } from './grading.service.js';
import type { SaveAnswerInput } from '../schemas/exam.schema.js';

async function getOrCreateSubmission(studentId: string, examId: string) {
  const { data: assignment } = await supabaseAdmin
    .from('exam_assignments')
    .select('id')
    .eq('exam_id', examId)
    .eq('student_id', studentId)
    .maybeSingle();
  if (!assignment) throw new ApiError('FORBIDDEN', 'This exam was not assigned to you');

  const { data: exam } = await supabaseAdmin.from('exams').select('status').eq('id', examId).single();
  if (!exam || exam.status !== 'published') throw new ApiError('EXAM_CLOSED', 'This exam is not currently open');

  const { data: existing } = await supabaseAdmin
    .from('exam_submissions')
    .select('*')
    .eq('exam_id', examId)
    .eq('student_id', studentId)
    .maybeSingle();
  if (existing) {
    if (existing.submitted_at) throw new ApiError('EXAM_ALREADY_SUBMITTED', 'You have already submitted this exam');
    return existing;
  }

  const { data: created, error } = await supabaseAdmin
    .from('exam_submissions')
    .insert({ exam_id: examId, student_id: studentId, question_seed: `${examId}-${studentId}` })
    .select()
    .single();
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to start exam', error.message);
  return created;
}

/** The paper the student actually sees: randomized per-student, answers/correctness stripped out, resumable on reload. */
export async function getExamPaper(studentId: string, examId: string) {
  const submission = await getOrCreateSubmission(studentId, examId);

  const { data: exam } = await supabaseAdmin.from('exams').select('*').eq('id', examId).single();
  if (!exam) throw new ApiError('NOT_FOUND', 'Exam not found');

  const { data: settings } = await supabaseAdmin
    .from('proctoring_settings')
    .select('*')
    .eq('exam_id', examId)
    .maybeSingle();

  const { data: questions } = await supabaseAdmin
    .from('questions')
    .select('id, type, text, options, marks, order_index')
    .eq('exam_id', examId)
    .order('order_index');

  const seed = submission.question_seed ?? `${examId}-${studentId}`;
  let orderedQuestions = questions ?? [];
  if (settings?.randomize_questions ?? true) {
    orderedQuestions = seededShuffle(orderedQuestions, seed);
  }

  const sanitized = orderedQuestions.map((q) => {
    let options = q.options as { id: string; text: string; isCorrect?: boolean }[] | null;
    if (options) {
      // Never leak isCorrect to the client mid-exam.
      options = options.map(({ id, text }) => ({ id, text }));
      if (settings?.shuffle_options ?? true) options = seededShuffle(options, seed + q.id);
    }
    return { id: q.id, type: q.type, text: q.text, options, marks: q.marks };
  });

  const { data: existingAnswers } = await supabaseAdmin
    .from('exam_answers')
    .select('question_id, student_answer, selected_option_id')
    .eq('exam_submission_id', submission.id);

  return {
    examSubmissionId: submission.id,
    exam: { id: exam.id, title: exam.title, subject: exam.subject, durationMin: exam.duration_min, totalMarks: exam.total_marks },
    proctoring: {
      autoSubmitOnSwitch: settings?.auto_submit_on_switch ?? true,
      switchLimit: settings?.switch_limit ?? 3,
    },
    questions: sanitized,
    savedAnswers: existingAnswers ?? [],
    startedAt: submission.started_at,
  };
}

export async function saveAnswer(studentId: string, examSubmissionId: string, input: SaveAnswerInput) {
  const { data: submission } = await supabaseAdmin
    .from('exam_submissions')
    .select('id, submitted_at')
    .eq('id', examSubmissionId)
    .eq('student_id', studentId)
    .single();
  if (!submission) throw new ApiError('NOT_FOUND', 'Exam submission not found');
  if (submission.submitted_at) throw new ApiError('EXAM_ALREADY_SUBMITTED', 'Exam already submitted');

  const { data: question } = await supabaseAdmin.from('questions').select('id').eq('id', input.questionId).single();
  if (!question) throw new ApiError('NOT_FOUND', 'Question not found');

  // marks are read via the questions FK at grading time, not duplicated here
  const { error } = await supabaseAdmin.from('exam_answers').upsert(
    {
      exam_submission_id: examSubmissionId,
      question_id: input.questionId,
      student_answer: input.studentAnswer ?? null,
      selected_option_id: input.selectedOptionId ?? null,
    },
    { onConflict: 'exam_submission_id,question_id' },
  );
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to save answer', error.message);
}

export async function logProctorEvent(studentId: string, examSubmissionId: string, eventType: 'tab_switch' | 'fullscreen_exit') {
  const { data: submission } = await supabaseAdmin
    .from('exam_submissions')
    .select('id, exam_id, submitted_at')
    .eq('id', examSubmissionId)
    .eq('student_id', studentId)
    .single();
  if (!submission || submission.submitted_at) return { autoSubmitted: false, switchCount: 0 };

  await supabaseAdmin.from('proctoring_events').insert({ exam_submission_id: examSubmissionId, event_type: eventType });

  const { count } = await supabaseAdmin
    .from('proctoring_events')
    .select('id', { count: 'exact', head: true })
    .eq('exam_submission_id', examSubmissionId)
    .eq('event_type', 'tab_switch');

  const { data: settings } = await supabaseAdmin
    .from('proctoring_settings')
    .select('auto_submit_on_switch, switch_limit')
    .eq('exam_id', submission.exam_id)
    .maybeSingle();

  const switchCount = count ?? 0;
  const shouldAutoSubmit = (settings?.auto_submit_on_switch ?? true) && switchCount >= (settings?.switch_limit ?? 3);

  if (shouldAutoSubmit) {
    await submitExam(studentId, examSubmissionId, true);
  }

  return { autoSubmitted: shouldAutoSubmit, switchCount };
}

export async function submitExam(studentId: string, examSubmissionId: string, autoSubmitted = false) {
  const { data: submission } = await supabaseAdmin
    .from('exam_submissions')
    .select('id, submitted_at')
    .eq('id', examSubmissionId)
    .eq('student_id', studentId)
    .single();
  if (!submission) throw new ApiError('NOT_FOUND', 'Exam submission not found');
  if (submission.submitted_at) return; // idempotent — a double-submit (e.g. proctor auto-submit racing a manual click) is a no-op

  const { error } = await supabaseAdmin
    .from('exam_submissions')
    .update({ submitted_at: new Date().toISOString(), auto_submitted: autoSubmitted })
    .eq('id', examSubmissionId);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to submit exam', error.message);

  await gradeSubmission(examSubmissionId);
}
