// api/src/services/simNotes.service.ts
//
// sim_notes CRUD — a student's own highlights/notes while reading.
// Deliberately its own table/service rather than folded into the generic
// notes.service.ts: that table is title/content/tags-shaped with no page
// or highlight concept. Every write is scoped to the caller's own id, and
// the RLS policy (sim_notes_student_own) backs that up even if a bug ever
// let a wrong id through here.

import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { requireReadableBook, type StudentIdentity } from './simAccess.service.js';

export interface SimNote {
  id: string;
  jobId: string;
  pageNumber: number;
  highlight: string;
  note: string;
  color: string;
  starred: boolean;
  createdAt: string;
  updatedAt: string;
}

function toNote(row: Record<string, unknown>): SimNote {
  return {
    id: row.id as string,
    jobId: row.job_id as string,
    pageNumber: row.page_number as number,
    highlight: row.highlight as string,
    note: row.note as string,
    color: row.color as string,
    starred: row.starred as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function listSimNotes(jobId: string, student: StudentIdentity): Promise<SimNote[]> {
  await requireReadableBook(jobId, student);
  const { data, error } = await supabaseAdmin
    .from('sim_notes')
    .select('*')
    .eq('job_id', jobId)
    .eq('student_id', student.id)
    .order('page_number');
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load notes', error.message);
  return (data ?? []).map(toNote);
}

export async function createSimNote(
  student: StudentIdentity,
  input: { jobId: string; pageNumber: number; highlight?: string; note?: string; color?: string },
): Promise<SimNote> {
  await requireReadableBook(input.jobId, student);
  const { data, error } = await supabaseAdmin
    .from('sim_notes')
    .insert({
      job_id: input.jobId,
      student_id: student.id,
      school_id: student.schoolId,
      page_number: input.pageNumber,
      highlight: input.highlight ?? '',
      note: input.note ?? '',
      color: input.color?.trim() || 'yellow',
    })
    .select()
    .single();
  if (error || !data) throw new ApiError('INTERNAL_ERROR', 'Failed to create note', error?.message);
  return toNote(data);
}

export async function updateSimNote(
  noteId: string,
  student: StudentIdentity,
  patch: { note?: string; color?: string; starred?: boolean },
): Promise<SimNote> {
  const updatePayload: Record<string, unknown> = {};
  if (patch.note !== undefined) updatePayload.note = patch.note;
  if (patch.color !== undefined && patch.color.trim()) updatePayload.color = patch.color.trim();
  if (patch.starred !== undefined) updatePayload.starred = patch.starred;
  if (Object.keys(updatePayload).length === 0) {
    throw new ApiError('VALIDATION_ERROR', 'Provide note, color, and/or starred to update');
  }

  const { data, error } = await supabaseAdmin
    .from('sim_notes')
    .update(updatePayload)
    .eq('id', noteId)
    .eq('student_id', student.id) // ownership check IS the query filter — a mismatched id 404s, never leaks
    .select()
    .maybeSingle();
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to update note', error.message);
  if (!data) throw new ApiError('NOT_FOUND', 'Note not found');
  return toNote(data);
}

export async function deleteSimNote(noteId: string, student: StudentIdentity): Promise<void> {
  const { error, count } = await supabaseAdmin
    .from('sim_notes')
    .delete({ count: 'exact' })
    .eq('id', noteId)
    .eq('student_id', student.id);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to delete note', error.message);
  if (!count) throw new ApiError('NOT_FOUND', 'Note not found');
}
