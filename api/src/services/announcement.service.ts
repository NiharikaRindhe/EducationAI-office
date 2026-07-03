import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import type { CreateAnnouncementInput } from '../schemas/announcement.schema.js';

export async function createAnnouncement(teacherId: string, schoolId: string, input: CreateAnnouncementInput) {
  const { data, error } = await supabaseAdmin
    .from('announcements')
    .insert({
      teacher_id: teacherId,
      school_id: schoolId,
      class_num: input.classNum ?? null,
      section: input.section ?? null,
      title: input.title,
      body: input.body ?? null,
      expires_at: input.expiresAt ?? null,
    })
    .select()
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to create announcement', error.message);
  return data;
}

export async function deleteAnnouncement(teacherId: string, announcementId: string) {
  const { error } = await supabaseAdmin
    .from('announcements')
    .update({ is_active: false })
    .eq('id', announcementId)
    .eq('teacher_id', teacherId);

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to remove announcement', error.message);
}

export async function listForStudent(schoolId: string, classNum: number, section: string) {
  // Chaining multiple .or() calls doesn't reliably AND separate OR-groups
  // together in PostgREST's query grammar, so the "class_num is null OR
  // matches" / "section is null OR matches" / "not expired" conditions are
  // combined in-memory instead — this table is small and per-school, so
  // there's no real cost to filtering after the fetch.
  // announcements.teacher_id FKs to teacher_profiles(user_id), not directly
  // to user_profiles — same nesting rule as session_participants above.
  const { data, error } = await supabaseAdmin
    .from('announcements')
    .select('id, title, body, class_num, section, created_at, expires_at, teacher_profiles(user_profiles(full_name))')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load announcements', error.message);

  const now = Date.now();
  return (data ?? []).filter(
    (a) =>
      (a.class_num === null || a.class_num === classNum) &&
      (a.section === null || a.section === section) &&
      (a.expires_at === null || new Date(a.expires_at).getTime() > now),
  );
}
