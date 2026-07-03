import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import type { AddQuestionInput, CreateExamInput, PublishExamInput } from '../schemas/exam.schema.js';

export async function createExam(teacherId: string, schoolId: string, input: CreateExamInput) {
  const { data, error } = await supabaseAdmin
    .from('exams')
    .insert({
      school_id: schoolId,
      created_by: teacherId,
      title: input.title,
      subject: input.subject,
      class_num: input.classNum,
      duration_min: input.durationMin,
      starts_at: input.startsAt ?? null,
      ends_at: input.endsAt ?? null,
    })
    .select()
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to create exam', error.message);
  return data;
}

async function requireDraftExamOwnedByTeacher(teacherId: string, examId: string) {
  const { data, error } = await supabaseAdmin.from('exams').select('*').eq('id', examId).eq('created_by', teacherId).single();
  if (error || !data) throw new ApiError('NOT_FOUND', 'Exam not found or not yours');
  if (data.status !== 'draft') throw new ApiError('EXAM_CLOSED', 'Exam is no longer a draft — cannot edit questions');
  return data;
}

export async function addQuestion(teacherId: string, examId: string, input: AddQuestionInput) {
  const exam = await requireDraftExamOwnedByTeacher(teacherId, examId);

  const { count } = await supabaseAdmin
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('exam_id', exam.id);

  const { data, error } = await supabaseAdmin
    .from('questions')
    .insert({
      exam_id: exam.id,
      type: input.type,
      text: input.text,
      options: input.options ?? null,
      correct_answer: input.correctAnswer ?? null,
      marks: input.marks,
      rubric: input.rubric ?? null,
      ai_scoring: input.aiScoring,
      order_index: count ?? 0,
    })
    .select()
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to add question', error.message);
  return data;
}

// Copies from question_bank into this exam's own `questions` rows so a
// later bank edit never retroactively changes a paper that's already live.
export async function addQuestionsFromBank(teacherId: string, examId: string, bankIds: string[]) {
  const exam = await requireDraftExamOwnedByTeacher(teacherId, examId);

  const { data: bankQuestions, error: bankError } = await supabaseAdmin
    .from('question_bank')
    .select('*')
    .in('id', bankIds);
  if (bankError) throw new ApiError('INTERNAL_ERROR', 'Failed to load bank questions', bankError.message);

  const { count } = await supabaseAdmin
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('exam_id', exam.id);

  const rows = (bankQuestions ?? []).map((bq, i) => ({
    exam_id: exam.id,
    bank_id: bq.id,
    type: bq.type,
    text: bq.text,
    options: bq.options,
    correct_answer: bq.correct_answer,
    marks: bq.marks,
    rubric: bq.rubric,
    ai_scoring: true,
    order_index: (count ?? 0) + i,
  }));

  const { data, error } = await supabaseAdmin.from('questions').insert(rows).select();
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to copy questions from bank', error.message);
  return data;
}

export async function removeQuestion(teacherId: string, examId: string, questionId: string) {
  await requireDraftExamOwnedByTeacher(teacherId, examId);
  const { error } = await supabaseAdmin.from('questions').delete().eq('id', questionId).eq('exam_id', examId);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to remove question', error.message);
}

export async function getExamDetail(teacherId: string, examId: string) {
  const { data, error } = await supabaseAdmin
    .from('exams')
    .select('*, questions(*)')
    .eq('id', examId)
    .eq('created_by', teacherId)
    .single();
  if (error || !data) throw new ApiError('NOT_FOUND', 'Exam not found or not yours');
  return data;
}

export async function listExamsForTeacher(teacherId: string) {
  const { data, error } = await supabaseAdmin
    .from('exams')
    .select('id, title, subject, class_num, duration_min, total_marks, status, created_at')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list exams', error.message);
  return data;
}

async function resolveStudentIds(schoolId: string, assignTo: PublishExamInput['assignTo']): Promise<string[]> {
  if (assignTo.mode === 'students') return assignTo.studentIds;

  let query = supabaseAdmin
    .from('user_profiles')
    .select('id, student_profiles!inner(class_num, section, batch_id)')
    .eq('school_id', schoolId)
    .eq('role', 'student');

  if (assignTo.mode === 'class') {
    query = query.eq('student_profiles.class_num', assignTo.classNum).eq('student_profiles.section', assignTo.section);
  } else {
    query = query.eq('student_profiles.batch_id', assignTo.batchId);
  }

  const { data, error } = await query;
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to resolve students for assignment', error.message);
  return (data ?? []).map((r) => r.id);
}

export async function publishExam(teacherId: string, schoolId: string, examId: string, input: PublishExamInput) {
  const exam = await requireDraftExamOwnedByTeacher(teacherId, examId);

  const { count: questionCount } = await supabaseAdmin
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('exam_id', exam.id);
  if (!questionCount) throw new ApiError('VALIDATION_ERROR', 'Cannot publish an exam with no questions');

  const studentIds = await resolveStudentIds(schoolId, input.assignTo);
  if (studentIds.length === 0) throw new ApiError('VALIDATION_ERROR', 'No students matched the assignment target');

  const { error: settingsError } = await supabaseAdmin.from('proctoring_settings').upsert({
    exam_id: exam.id,
    randomize_questions: input.randomizeQuestions,
    shuffle_options: input.shuffleOptions,
    auto_submit_on_switch: input.autoSubmitOnSwitch,
    switch_limit: input.switchLimit,
  });
  if (settingsError) throw new ApiError('INTERNAL_ERROR', 'Failed to save proctoring settings', settingsError.message);

  const assignments = studentIds.map((studentId) => ({ exam_id: exam.id, student_id: studentId }));
  const { error: assignError } = await supabaseAdmin.from('exam_assignments').insert(assignments);
  if (assignError) throw new ApiError('INTERNAL_ERROR', 'Failed to assign exam', assignError.message);

  const { data: published, error: publishError } = await supabaseAdmin
    .from('exams')
    .update({ status: 'published' })
    .eq('id', exam.id)
    .select()
    .single();
  if (publishError) throw new ApiError('INTERNAL_ERROR', 'Failed to publish exam', publishError.message);

  return { exam: published, assignedCount: studentIds.length };
}

export async function closeExam(teacherId: string, examId: string) {
  const { data, error } = await supabaseAdmin
    .from('exams')
    .update({ status: 'closed' })
    .eq('id', examId)
    .eq('created_by', teacherId)
    .select()
    .single();
  if (error || !data) throw new ApiError('NOT_FOUND', 'Exam not found or not yours');
  return data;
}
