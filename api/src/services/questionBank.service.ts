import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import type { AddQuestionBankInput } from '../schemas/exam.schema.js';

export async function addToBank(teacherId: string, schoolId: string, input: AddQuestionBankInput) {
  const { data, error } = await supabaseAdmin
    .from('question_bank')
    .insert({
      scope: 'school',
      school_id: schoolId,
      class_num: input.classNum,
      subject: input.subject,
      chapter_num: input.chapterNum ?? null,
      type: input.type,
      difficulty: input.difficulty,
      text: input.text,
      options: input.options ?? null,
      correct_answer: input.correctAnswer ?? null,
      rubric: input.rubric ?? null,
      marks: input.marks,
      source: 'teacher',
      created_by: teacherId,
      is_pyq: input.isPyq ?? false,
      pyq_year: input.pyqYear ?? null,
      pyq_source: input.pyqSource ?? null,
    })
    .select()
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to add question to bank', error.message);
  return data;
}

export async function listBank(
  schoolId: string,
  filters: { classNum?: number; subject?: string; type?: string } = {},
) {
  // Global (EduAI-authored) + this school's own contributions.
  let query = supabaseAdmin
    .from('question_bank')
    .select('*')
    .or(`scope.eq.global,school_id.eq.${schoolId}`);

  if (filters.classNum !== undefined) query = query.eq('class_num', filters.classNum);
  if (filters.subject) query = query.eq('subject', filters.subject);
  if (filters.type) query = query.eq('type', filters.type);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list question bank', error.message);
  return data;
}

export async function listPyqsForStudent(
  studentId: string,
  filters: { subject?: string; year?: number; marks?: number } = {},
) {
  const { data: sp, error: spError } = await supabaseAdmin
    .from('student_profiles')
    .select('class_num')
    .eq('user_id', studentId)
    .single();
  if (spError || !sp) throw new ApiError('NOT_FOUND', 'Student profile not found');

  let query = supabaseAdmin
    .from('question_bank')
    .select('*')
    .eq('is_pyq', true)
    .eq('class_num', sp.class_num);

  if (filters.subject) query = query.eq('subject', filters.subject);
  if (filters.year) query = query.eq('pyq_year', filters.year);
  if (filters.marks) query = query.eq('marks', filters.marks);

  const { data, error } = await query.order('pyq_year', { ascending: false }).order('created_at', { ascending: false });
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load PYQs', error.message);
  return data;
}
