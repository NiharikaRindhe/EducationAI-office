import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { getTeachingScope } from './teacher.service.js';
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

  // Summarize who it's published to, grouped by section, with each
  // section's window — this is what the teacher's detail view shows.
  const { data: assignments } = await supabaseAdmin
    .from('exam_assignments')
    .select('class_section_id, starts_at, ends_at, class_sections(class_num, section_label)')
    .eq('exam_id', examId);

  const bySection = new Map<
    string,
    { sectionId: string | null; label: string; startsAt: string | null; endsAt: string | null; studentCount: number }
  >();
  for (const a of assignments ?? []) {
    const cs = Array.isArray(a.class_sections) ? a.class_sections[0] : a.class_sections;
    const key = a.class_section_id ?? 'individual';
    const existing = bySection.get(key);
    if (existing) {
      existing.studentCount += 1;
    } else {
      bySection.set(key, {
        sectionId: a.class_section_id,
        label: cs ? `${cs.class_num}-${cs.section_label}` : 'Individually assigned',
        startsAt: a.starts_at,
        endsAt: a.ends_at,
        studentCount: 1,
      });
    }
  }

  const questions = (data.questions as { order_index: number }[] | null) ?? [];
  questions.sort((a, b) => a.order_index - b.order_index);

  return { ...data, questions, assignedSections: [...bySection.values()] };
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

interface AssignmentRow {
  exam_id: string;
  student_id: string;
  class_section_id?: string;
  starts_at?: string | null;
  ends_at?: string | null;
}

async function studentsInSection(schoolId: string, classNum: number, sectionLabel: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, student_profiles!inner(class_num, section)')
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .eq('student_profiles.class_num', classNum)
    .eq('student_profiles.section', sectionLabel);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to resolve students for assignment', error.message);
  return (data ?? []).map((r) => r.id);
}

async function resolveAssignments(
  teacherId: string,
  schoolId: string,
  exam: { id: string; class_num: number },
  assignTo: PublishExamInput['assignTo'],
): Promise<AssignmentRow[]> {
  if (assignTo.mode === 'students') {
    return assignTo.studentIds.map((studentId) => ({ exam_id: exam.id, student_id: studentId }));
  }

  if (assignTo.mode === 'class') {
    const ids = await studentsInSection(schoolId, assignTo.classNum, assignTo.section);
    return ids.map((studentId) => ({ exam_id: exam.id, student_id: studentId }));
  }

  if (assignTo.mode === 'sections') {
    // Same scoping rule as tasks: only sections this teacher teaches, and
    // they must be sections OF THE EXAM'S CLASS (a Class 7 paper cannot be
    // published to 8-C).
    const scope = await getTeachingScope(teacherId, schoolId);
    const allowed = new Map(scope.sections.map((s) => [s.classSectionId, s]));

    const rows: AssignmentRow[] = [];
    for (const target of assignTo.sections) {
      const section = allowed.get(target.sectionId);
      if (!section) throw new ApiError('FORBIDDEN', 'You can only publish exams to sections you teach');
      if (section.classNum !== exam.class_num) {
        throw new ApiError(
          'VALIDATION_ERROR',
          `This is a Class ${exam.class_num} exam — section ${section.classNum}-${section.section} is a different class`,
        );
      }
      if (target.startsAt && target.endsAt && new Date(target.startsAt) >= new Date(target.endsAt)) {
        throw new ApiError('VALIDATION_ERROR', `Section ${section.classNum}-${section.section}: window closes before it opens`);
      }
      const ids = await studentsInSection(schoolId, section.classNum, section.section);
      for (const studentId of ids) {
        rows.push({
          exam_id: exam.id,
          student_id: studentId,
          class_section_id: target.sectionId,
          starts_at: target.startsAt ?? null,
          ends_at: target.endsAt ?? null,
        });
      }
    }
    return rows;
  }

  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, student_profiles!inner(batch_id)')
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .eq('student_profiles.batch_id', assignTo.batchId);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to resolve students for assignment', error.message);
  return (data ?? []).map((r) => ({ exam_id: exam.id, student_id: r.id }));
}

export async function publishExam(teacherId: string, schoolId: string, examId: string, input: PublishExamInput) {
  const exam = await requireDraftExamOwnedByTeacher(teacherId, examId);

  const { count: questionCount } = await supabaseAdmin
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('exam_id', exam.id);
  if (!questionCount) throw new ApiError('VALIDATION_ERROR', 'Cannot publish an exam with no questions');

  const assignments = await resolveAssignments(teacherId, schoolId, exam, input.assignTo);
  if (assignments.length === 0) throw new ApiError('VALIDATION_ERROR', 'No students matched the assignment target');

  const { error: settingsError } = await supabaseAdmin.from('proctoring_settings').upsert({
    exam_id: exam.id,
    randomize_questions: input.randomizeQuestions,
    shuffle_options: input.shuffleOptions,
    auto_submit_on_switch: input.autoSubmitOnSwitch,
    switch_limit: input.switchLimit,
  });
  if (settingsError) throw new ApiError('INTERNAL_ERROR', 'Failed to save proctoring settings', settingsError.message);

  const { error: assignError } = await supabaseAdmin.from('exam_assignments').insert(assignments);
  if (assignError) throw new ApiError('INTERNAL_ERROR', 'Failed to assign exam', assignError.message);

  const { data: published, error: publishError } = await supabaseAdmin
    .from('exams')
    .update({ status: 'published' })
    .eq('id', exam.id)
    .select()
    .single();
  if (publishError) throw new ApiError('INTERNAL_ERROR', 'Failed to publish exam', publishError.message);

  return { exam: published, assignedCount: assignments.length };
}

/** "Set B": a fresh draft with the same meta + copied questions, no
 *  assignments. Teachers use it when morning sections leak questions to
 *  afternoon sections — edit a few questions, publish to the other section. */
export async function duplicateExam(teacherId: string, schoolId: string, examId: string) {
  const { data: source, error } = await supabaseAdmin
    .from('exams')
    .select('*, questions(*)')
    .eq('id', examId)
    .eq('created_by', teacherId)
    .single();
  if (error || !source) throw new ApiError('NOT_FOUND', 'Exam not found or not yours');

  const { data: copy, error: copyError } = await supabaseAdmin
    .from('exams')
    .insert({
      school_id: schoolId,
      created_by: teacherId,
      title: `${source.title} (Set B)`,
      subject: source.subject,
      class_num: source.class_num,
      duration_min: source.duration_min,
    })
    .select()
    .single();
  if (copyError || !copy) throw new ApiError('INTERNAL_ERROR', 'Failed to duplicate exam', copyError?.message);

  const questions = (source.questions as Record<string, unknown>[] | null) ?? [];
  if (questions.length > 0) {
    const rows = questions.map((q) => ({
      exam_id: copy.id,
      bank_id: q.bank_id ?? null,
      type: q.type,
      text: q.text,
      options: q.options,
      correct_answer: q.correct_answer,
      marks: q.marks,
      rubric: q.rubric,
      ai_scoring: q.ai_scoring,
      order_index: q.order_index,
    }));
    const { error: questionsError } = await supabaseAdmin.from('questions').insert(rows);
    if (questionsError) {
      await supabaseAdmin.from('exams').delete().eq('id', copy.id); // don't leave a half-copied draft behind
      throw new ApiError('INTERNAL_ERROR', 'Failed to copy questions', questionsError.message);
    }
  }

  return copy;
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
