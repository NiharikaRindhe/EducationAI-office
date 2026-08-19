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

  // A lab session gets a join code and a scheduled end; an ordinary classroom
  // session gets neither, because section membership already decides who may
  // join and the teacher ends it when the lesson ends.
  let labId: string | null = null;
  let joinCode: string | null = null;
  let endsAtExpected: string | null = null;

  if (input.labId) {
    const { data: lab } = await supabaseAdmin
      .from('labs')
      .select('id')
      .eq('id', input.labId)
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .maybeSingle();
    if (!lab) throw new ApiError('NOT_FOUND', 'That lab does not exist in this school');
    labId = lab.id as string;
    joinCode = await allocateJoinCode();
    endsAtExpected = input.endsAtExpected ?? (await scheduledEndForNow(schoolId, input.classNum, input.section));
  }

  const { data, error } = await supabaseAdmin
    .from('live_sessions')
    .insert({
      teacher_id: teacherId,
      school_id: schoolId,
      class_num: input.classNum,
      section: input.section,
      subject: input.subject ?? null,
      lab_id: labId,
      join_code: joinCode,
      ends_at_expected: endsAtExpected,
    })
    .select()
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to start session', error.message);
  return data;
}

/**
 * A short code a student can read off a board and type without ambiguity.
 *
 * I, O, 0 and 1 are excluded — in a lab, across a room, on a projector, those
 * are the characters that get mistyped. Six characters from a 32-symbol
 * alphabet is ~10^9 combinations, and only codes for *currently running*
 * sessions have to be distinct, so collisions are vanishingly rare; the retry
 * loop exists for correctness rather than because it is expected to run.
 */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

async function allocateJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    let code = '';
    for (let i = 0; i < 6; i += 1) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    const { data: clash } = await supabaseAdmin
      .from('live_sessions')
      .select('id')
      .eq('join_code', code)
      .eq('is_active', true)
      .maybeSingle();
    if (!clash) return code;
  }
  throw new ApiError('INTERNAL_ERROR', 'Could not allocate a join code — try again');
}

/**
 * The end time of the timetable period this section is in right now.
 *
 * Best-effort: a lab session started off-timetable (a catch-up, a club) simply
 * has no scheduled end and shows a stopwatch instead of a countdown.
 */
async function scheduledEndForNow(
  schoolId: string,
  classNum: number,
  section: string,
): Promise<string | null> {
  const now = new Date();
  // Postgres day_of_week here is 1=Mon..6=Sat; JS getDay() is 0=Sun..6=Sat.
  const jsDay = now.getDay();
  if (jsDay === 0) return null; // Sunday — no periods
  const dayOfWeek = jsDay;

  const { data: section_ } = await supabaseAdmin
    .from('class_sections')
    .select('id')
    .eq('school_id', schoolId)
    .eq('class_num', classNum)
    .ilike('section_label', section)
    .maybeSingle();
  if (!section_) return null;

  const hhmm = now.toTimeString().slice(0, 8);
  const { data: slot } = await supabaseAdmin
    .from('timetable_slots')
    .select('ends_at')
    .eq('class_section_id', section_.id)
    .eq('day_of_week', dayOfWeek)
    .lte('starts_at', hhmm)
    .gte('ends_at', hhmm)
    .maybeSingle();
  if (!slot) return null;

  const [h, m] = String(slot.ends_at).split(':');
  const end = new Date(now);
  end.setHours(Number(h), Number(m), 0, 0);
  return end.toISOString();
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

/**
 * Join a lab session by typing its code.
 *
 * The code is the authorisation, but not on its own — the session still has to
 * belong to the student's own school. Without that check a code guessed or
 * passed between schools would let an outsider into a live register.
 */
export async function joinSessionByCode(studentId: string, schoolId: string, rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,8}$/.test(code)) {
    throw new ApiError('VALIDATION_ERROR', 'That does not look like a session code');
  }

  const { data: session } = await supabaseAdmin
    .from('live_sessions')
    .select('id, school_id, class_num, section, subject, lab_id, ends_at_expected, labs(name)')
    .eq('join_code', code)
    .eq('is_active', true)
    .maybeSingle();

  // Deliberately the same message for "no such code" and "another school's
  // code": a student probing codes should not learn which ones exist.
  if (!session || session.school_id !== schoolId) {
    throw new ApiError('NOT_FOUND', 'No live session is using that code');
  }

  const { error } = await supabaseAdmin
    .from('session_participants')
    .upsert(
      { session_id: session.id, student_id: studentId, left_at: null },
      { onConflict: 'session_id,student_id' },
    );
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to join session', error.message);

  await logStreakActivity(studentId, 0);
  return session;
}

/**
 * The attendance register for a session: everyone on the roster, present or
 * not. Absentees are rows with attended=false rather than missing entries, so
 * the teacher marks a register rather than reconciling two lists.
 */
export async function getAttendance(teacherId: string, sessionId: string) {
  const { data: session } = await supabaseAdmin
    .from('live_sessions')
    .select('id, teacher_id, class_num, section, subject, started_at, ends_at_expected, labs(name)')
    .eq('id', sessionId)
    .maybeSingle();
  if (!session || session.teacher_id !== teacherId) {
    throw new ApiError('NOT_FOUND', 'Session not found or not yours');
  }

  const { data, error } = await supabaseAdmin.rpc('lab_session_attendance', { p_session_id: sessionId });
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load attendance', error.message);

  const rows = data ?? [];
  return {
    session,
    present: rows.filter((r: { attended: boolean }) => r.attended).length,
    total: rows.length,
    rows,
  };
}

/**
 * Mark a student present who could not join themselves — a broken machine, a
 * forgotten password. Flagged as teacher-marked so the register still
 * distinguishes "was here" from "connected".
 */
export async function markAttendance(
  teacherId: string,
  sessionId: string,
  studentId: string,
  present: boolean,
) {
  const { data: session } = await supabaseAdmin
    .from('live_sessions')
    .select('id, teacher_id')
    .eq('id', sessionId)
    .maybeSingle();
  if (!session || session.teacher_id !== teacherId) {
    throw new ApiError('NOT_FOUND', 'Session not found or not yours');
  }

  if (!present) {
    const { error } = await supabaseAdmin
      .from('session_participants')
      .delete()
      .eq('session_id', sessionId)
      .eq('student_id', studentId);
    if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to update attendance', error.message);
    return { studentId, present: false };
  }

  const { error } = await supabaseAdmin
    .from('session_participants')
    .upsert(
      { session_id: sessionId, student_id: studentId, marked_by_teacher: true, left_at: null },
      { onConflict: 'session_id,student_id' },
    );
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to update attendance', error.message);
  return { studentId, present: true };
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
