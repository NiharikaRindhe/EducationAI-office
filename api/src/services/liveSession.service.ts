import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import type { StartSessionInput } from '../schemas/liveSession.schema.js';

// One active session per class+section at a time — starting a new one for
// the same class/section auto-ends whatever was already running there
// (covers the "teacher forgot to end last period's session" case cleanly).
export async function startSession(teacherId: string, schoolId: string, input: StartSessionInput) {
  await supabaseAdmin
    .from('live_sessions')
    .update({ ended_at: new Date().toISOString(), is_active: false })
    .eq('school_id', schoolId)
    .eq('class_num', input.classNum)
    .eq('section', input.section)
    .eq('is_active', true);

  const { data, error } = await supabaseAdmin
    .from('live_sessions')
    .insert({
      teacher_id: teacherId,
      school_id: schoolId,
      class_num: input.classNum,
      section: input.section,
      subject: input.subject ?? null,
    })
    .select()
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to start session', error.message);
  return data;
}

export async function endSession(teacherId: string, sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from('live_sessions')
    .update({ ended_at: new Date().toISOString(), is_active: false })
    .eq('id', sessionId)
    .eq('teacher_id', teacherId)
    .select()
    .single();

  if (error || !data) throw new ApiError('NOT_FOUND', 'Session not found or not yours to end');
  return data;
}

export async function getActiveSessionForTeacher(teacherId: string) {
  const { data } = await supabaseAdmin
    .from('live_sessions')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('is_active', true)
    .maybeSingle();
  return data;
}

export async function getParticipants(teacherId: string, sessionId: string) {
  const { data: session } = await supabaseAdmin
    .from('live_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('teacher_id', teacherId)
    .maybeSingle();
  if (!session) throw new ApiError('NOT_FOUND', 'Session not found or not yours');

  // session_participants.student_id only has a direct FK to student_profiles
  // (via user_id); reaching full_name requires nesting through that FK to
  // user_profiles rather than aliasing student_id straight to user_profiles,
  // which PostgREST can't resolve since no such direct FK exists.
  const { data, error } = await supabaseAdmin
    .from('session_participants')
    .select('student_id, joined_at, left_at, raised_hand, student_profiles(avatar, user_profiles(full_name))')
    .eq('session_id', sessionId);

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load participants', error.message);
  return data;
}

// ─── Student side ───────────────────────────────────────────────

export async function getActiveSessionForStudent(schoolId: string, classNum: number, section: string) {
  // live_sessions.teacher_id FKs to teacher_profiles(user_id), not directly
  // to user_profiles — same nesting rule as everywhere else in this file.
  const { data } = await supabaseAdmin
    .from('live_sessions')
    .select('id, teacher_id, subject, started_at, teacher_profiles(user_profiles(full_name))')
    .eq('school_id', schoolId)
    .eq('class_num', classNum)
    .eq('section', section)
    .eq('is_active', true)
    .maybeSingle();
  return data;
}

export async function joinSession(studentId: string, sessionId: string) {
  const { data: session } = await supabaseAdmin
    .from('live_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('is_active', true)
    .maybeSingle();
  if (!session) throw new ApiError('NOT_FOUND', 'No active session with that id');

  const { data, error } = await supabaseAdmin
    .from('session_participants')
    .upsert({ session_id: sessionId, student_id: studentId, left_at: null }, { onConflict: 'session_id,student_id' })
    .select()
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to join session', error.message);
  return data;
}

export async function setRaisedHand(studentId: string, sessionId: string, raised: boolean) {
  const { data, error } = await supabaseAdmin
    .from('session_participants')
    .update({ raised_hand: raised })
    .eq('session_id', sessionId)
    .eq('student_id', studentId)
    .select()
    .single();

  if (error || !data) throw new ApiError('NOT_FOUND', 'Not a participant in this session');
  return data;
}
