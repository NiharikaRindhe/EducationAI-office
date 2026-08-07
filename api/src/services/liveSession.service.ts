import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { logStreakActivity } from './gamification.service.js';
import type { StartSessionInput } from '../schemas/liveSession.schema.js';

// At most one active session per (school, class, section) — regardless of
// which teacher started it — AND at most one active session per teacher —
// regardless of which class. Both need clearing before the insert, and both
// were found live and stale in this school's data independently: a class-3A
// session from a different teacher untouched since July 10, and Mr. Rao's
// own sessions for 2-B/3-B untouched since July 10 and July 27. Either
// collision on its own reproduces the same failure — every .maybeSingle()
// read below (and requireActiveSessionFor in auth.service.ts, which gates
// the PIN roster) throws the instant a second row matches its filter, and
// since these call sites only destructure `{ data }`, that throw is
// swallowed and surfaces as "no session found" — a live class reads as not
// live. A partial unique index (see migration) makes the invariant durable;
// this pre-emptive cleanup is what lets a legitimate new session actually
// take that slot instead of colliding with it.
export async function startSession(teacherId: string, schoolId: string, input: StartSessionInput) {
  await supabaseAdmin
    .from('live_sessions')
    .update({ ended_at: new Date().toISOString(), is_active: false })
    .eq('school_id', schoolId)
    .eq('class_num', input.classNum)
    .eq('section', input.section)
    .eq('is_active', true);

  await supabaseAdmin
    .from('live_sessions')
    .update({ ended_at: new Date().toISOString(), is_active: false })
    .eq('teacher_id', teacherId)
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
  // Defense in depth: startSession() now guarantees at most one active row
  // per teacher, but .maybeSingle() throws (silently, since only `data` was
  // destructured here) the instant that invariant is ever violated again —
  // which is exactly the failure mode that made this page unusable for
  // Mr. Rao's account. .limit(1) degrades to "show the most recent one"
  // instead of breaking outright if it ever recurs.
  const { data } = await supabaseAdmin
    .from('live_sessions')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('is_active', true)
    .order('started_at', { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

/** School-wide view of every currently-live session — the Lab In-charge
 *  overview ("is anything live right now, and where") rather than a single
 *  teacher's own session. */
export async function listActiveSessionsForSchool(schoolId: string) {
  const { data, error } = await supabaseAdmin
    .from('live_sessions')
    .select('id, class_num, section, subject, started_at, teacher_profiles(user_profiles(full_name))')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .order('started_at', { ascending: false });

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list active sessions', error.message);
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
  //
  // .limit(1) rather than .maybeSingle(): the invariant is enforced at write
  // time (startSession above) and by a partial unique index, but a read path
  // that hard-fails the instant it's ever violated is the wrong failure mode
  // for "is my class live" — degrade to the most recent row instead.
  const { data } = await supabaseAdmin
    .from('live_sessions')
    .select('id, teacher_id, subject, started_at, teacher_profiles(user_profiles(full_name))')
    .eq('school_id', schoolId)
    .eq('class_num', classNum)
    .eq('section', section)
    .eq('is_active', true)
    .order('started_at', { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
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

  // Showing up to lab counts toward the streak on its own — a student
  // shouldn't need to also finish a task/exam that period to keep it alive.
  await logStreakActivity(studentId, 0);

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
