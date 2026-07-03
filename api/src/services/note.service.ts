import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import type { CreateNoteInput, UpdateNoteInput } from '../schemas/note.schema.js';

export async function createNote(studentId: string, schoolId: string, input: CreateNoteInput) {
  const { data, error } = await supabaseAdmin
    .from('notes')
    .insert({
      student_id: studentId,
      school_id: schoolId,
      title: input.title,
      content: input.content ?? null,
      subject: input.subject ?? null,
      tags: input.tags,
      is_board_tagged: input.isBoardTagged,
    })
    .select()
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to create note', error.message);
  return data;
}

export async function listNotes(studentId: string, filters: { subject?: string } = {}) {
  let query = supabaseAdmin.from('notes').select('*').eq('student_id', studentId);
  if (filters.subject) query = query.eq('subject', filters.subject);

  const { data, error } = await query.order('updated_at', { ascending: false });
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list notes', error.message);
  return data;
}

export async function updateNote(studentId: string, noteId: string, input: UpdateNoteInput) {
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.content !== undefined) patch.content = input.content;
  if (input.subject !== undefined) patch.subject = input.subject;
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.isBoardTagged !== undefined) patch.is_board_tagged = input.isBoardTagged;

  const { data, error } = await supabaseAdmin
    .from('notes')
    .update(patch)
    .eq('id', noteId)
    .eq('student_id', studentId)
    .select()
    .single();

  if (error || !data) throw new ApiError('NOT_FOUND', 'Note not found');
  return data;
}

export async function deleteNote(studentId: string, noteId: string) {
  const { error } = await supabaseAdmin.from('notes').delete().eq('id', noteId).eq('student_id', studentId);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to delete note', error.message);
}
