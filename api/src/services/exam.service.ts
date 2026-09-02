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

/** Any exam owned by this teacher, whatever its status. */
async function requireExamOwnedByTeacher(teacherId: string, examId: string) {
  const { data, error } = await supabaseAdmin
    .from('exams')
    .select('*')
    .eq('id', examId)
    .eq('created_by', teacherId)
    .single();
  if (error || !data) throw new ApiError('NOT_FOUND', 'Exam not found or not yours');
  return data;
}

/**
 * Edit a draft's metadata (title, subject, duration, window).
 *
 * Draft only. Once an exam is published students have been assigned to it and
 * may already be sitting it — changing the duration or the subject underneath
 * them is not an edit, it is a different exam.
 */
export async function updateDraftExam(
  teacherId: string,
  examId: string,
  patch: { title?: string; subject?: string; durationMin?: number | null; startsAt?: string | null; endsAt?: string | null },
) {
  await requireDraftExamOwnedByTeacher(teacherId, examId);

  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.subject !== undefined) row.subject = patch.subject;
  if (patch.durationMin !== undefined) row.duration_min = patch.durationMin;
  if (patch.startsAt !== undefined) row.starts_at = patch.startsAt;
  if (patch.endsAt !== undefined) row.ends_at = patch.endsAt;
  if (Object.keys(row).length === 0) throw new ApiError('VALIDATION_ERROR', 'No fields to update');

  if (row.starts_at && row.ends_at && String(row.ends_at) <= String(row.starts_at)) {
    throw new ApiError('VALIDATION_ERROR', 'The exam window must end after it starts');
  }

  const { data, error } = await supabaseAdmin.from('exams').update(row).eq('id', examId).select().single();
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to update exam', error.message);
  return data;
}

/**
 * Delete a draft exam and its questions.
 *
 * Draft only, for the same reason: a published exam has assignments,
 * submissions and answers hanging off it, and a teacher tidying their list
 * must not be able to erase work students have already done.
 */
export async function deleteDraftExam(teacherId: string, examId: string) {
  const exam = await requireDraftExamOwnedByTeacher(teacherId, examId);

  // Questions first — they reference the exam without ON DELETE CASCADE.
  const { error: qError } = await supabaseAdmin.from('questions').delete().eq('exam_id', examId);
  if (qError) throw new ApiError('INTERNAL_ERROR', 'Failed to remove exam questions', qError.message);

  const { error } = await supabaseAdmin.from('exams').delete().eq('id', examId);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to delete exam', error.message);

  return { id: examId, title: exam.title as string };
}

/**
 * Release or withhold marks for an exam.
 *
 * Students are shown nothing until this is set. The point is the gap between
 * "the AI finished grading" and "a teacher has looked at it" — without this a
 * child reads a machine-generated mark, and repeats it at home, before anyone
 * has checked the paper.
 */
export async function setResultsReleased(
  teacherId: string,
  examId: string,
  released: boolean,
) {
  const exam = await requireExamOwnedByTeacher(teacherId, examId);
  if (exam.status === 'draft') {
    throw new ApiError('VALIDATION_ERROR', 'This exam has not been published yet, so it has no results to release');
  }

  const { data, error } = await supabaseAdmin
    .from('exams')
    .update({
      results_released_at: released ? new Date().toISOString() : null,
      results_released_by: released ? teacherId : null,
    })
    .eq('id', examId)
    .select('id, title, results_released_at')
    .single();
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to update result visibility', error.message);

  return {
    id: data.id as string,
    title: data.title as string,
    resultsReleased: !!data.results_released_at,
    releasedAt: data.results_released_at as string | null,
  };
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

  // SECURITY: bankIds are client-supplied. Without a scope filter a teacher
  // could name any question_bank row id and copy another SCHOOL's private
  // questions into their own paper. Only EduAI's global bank and this
  // school's own questions are reachable.
  const { data: bankQuestions, error: bankError } = await supabaseAdmin
    .from('question_bank')
    .select('*')
    .in('id', bankIds)
    .or(`scope.eq.global,school_id.eq.${exam.school_id}`);
  if (bankError) throw new ApiError('INTERNAL_ERROR', 'Failed to load bank questions', bankError.message);

  // Silently copying only the permitted subset would hand back a paper with
  // missing questions and no explanation — fail loudly instead.
  if ((bankQuestions ?? []).length !== bankIds.length) {
    throw new ApiError(
      'FORBIDDEN',
      'Some selected questions are not available to your school',
    );
  }

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
  // Also pulls each student's name here so the tracker below doesn't need a
  // second round trip to resolve who's who.
  const { data: assignments } = await supabaseAdmin
    .from('exam_assignments')
    .select('student_id, class_section_id, starts_at, ends_at, class_sections(class_num, section_label), student_profiles(user_profiles(full_name))')
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

  // Per-student attempt tracker: every assigned student against whether they
  // have started, submitted, or not touched the exam yet. `exam_submissions`
  // gets a row the moment a student opens the exam (started_at defaults to
  // now()) and `submitted_at` stays null until they finish, so presence/
  // absence of that row plus submitted_at is enough to tell the three states
  // apart without a separate "attendance" concept.
  const { data: submissions } = await supabaseAdmin
    .from('exam_submissions')
    .select('student_id, submitted_at, total_score, max_score, is_reviewed, auto_submitted')
    .eq('exam_id', examId);
  const submissionByStudent = new Map((submissions ?? []).map((s) => [s.student_id, s]));

  const studentTracker = (assignments ?? [])
    .map((a) => {
      const sp = Array.isArray(a.student_profiles) ? a.student_profiles[0] : a.student_profiles;
      const up = sp ? (Array.isArray(sp.user_profiles) ? sp.user_profiles[0] : sp.user_profiles) : null;
      const cs = Array.isArray(a.class_sections) ? a.class_sections[0] : a.class_sections;
      const sub = submissionByStudent.get(a.student_id);
      return {
        studentId: a.student_id,
        fullName: up?.full_name ?? 'Student',
        sectionLabel: cs ? `${cs.class_num}-${cs.section_label}` : 'Individually assigned',
        status: !sub ? 'not_started' : sub.submitted_at ? 'submitted' : 'in_progress',
        submittedAt: sub?.submitted_at ?? null,
        totalScore: sub?.total_score ?? null,
        maxScore: sub?.max_score ?? null,
        isReviewed: sub?.is_reviewed ?? false,
        autoSubmitted: sub?.auto_submitted ?? false,
      };
    })
    .sort((a, b) => a.sectionLabel.localeCompare(b.sectionLabel) || a.fullName.localeCompare(b.fullName));

  const questions = (data.questions as { order_index: number }[] | null) ?? [];
  questions.sort((a, b) => a.order_index - b.order_index);

  return { ...data, questions, assignedSections: [...bySection.values()], studentTracker };
}

export async function listExamsForTeacher(teacherId: string) {
  const { data, error } = await supabaseAdmin
    .from('exams')
    .select('id, title, subject, class_num, duration_min, total_marks, status, created_at')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list exams', error.message);

  // One assigned-student count per exam, so the list view can show reach
  // (how many students got this exam) without a per-exam round trip. A
  // draft always reads 0 here — assignments only exist after publish.
  const examIds = (data ?? []).map((e) => e.id);
  const studentCounts = new Map<string, number>();
  if (examIds.length > 0) {
    const { data: assignments, error: countError } = await supabaseAdmin
      .from('exam_assignments')
      .select('exam_id')
      .in('exam_id', examIds);
    if (countError) throw new ApiError('INTERNAL_ERROR', 'Failed to count assigned students', countError.message);
    for (const a of assignments ?? []) studentCounts.set(a.exam_id, (studentCounts.get(a.exam_id) ?? 0) + 1);
  }

  return (data ?? []).map((exam) => ({ ...exam, assignedStudentCount: studentCounts.get(exam.id) ?? 0 }));
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
    // SECURITY: these ids come straight from the client. Unvalidated, a
    // crafted request could assign an exam to any student in ANY school —
    // the other two modes below already scope properly, this one did not.
    // Same rule as 'sections': the student must sit in a section this
    // teacher actually teaches, of this exam's class.
    const scope = await getTeachingScope(teacherId, schoolId);
    const sectionsOfExamClass = scope.sections.filter((s) => s.classNum === exam.class_num);

    const allowedIds = new Set<string>();
    for (const s of sectionsOfExamClass) {
      for (const id of await studentsInSection(schoolId, s.classNum, s.section)) {
        allowedIds.add(id);
      }
    }

    const rejected = assignTo.studentIds.filter((id) => !allowedIds.has(id));
    if (rejected.length > 0) {
      throw new ApiError(
        'FORBIDDEN',
        `You can only assign this exam to students you teach in Class ${exam.class_num} (${rejected.length} of ${assignTo.studentIds.length} selected are outside your classes)`,
      );
    }

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

  // Settings, assignments and the status flip commit together or not at all.
  // As three separate writes, a failure part-way through left a DRAFT exam
  // that students were already assigned to, and a retry duplicated every
  // assignment. The RPC is idempotent, so retrying converges.
  const { data: published, error: publishError } = await supabaseAdmin.rpc('publish_exam', {
    p_exam_id: exam.id,
    p_teacher_id: teacherId,
    p_assignments: assignments.map((a) => ({
      student_id: a.student_id,
      class_section_id: a.class_section_id ?? null,
      starts_at: a.starts_at ?? null,
      ends_at: a.ends_at ?? null,
    })),
    p_randomize_questions: input.randomizeQuestions,
    p_shuffle_options: input.shuffleOptions,
    p_auto_submit_on_switch: input.autoSubmitOnSwitch,
    p_switch_limit: input.switchLimit,
  });
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
