import bcrypt from 'bcryptjs';
import { supabaseAdmin, supabaseAnon } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { generatePassword } from '../lib/credentials.js';
import { logger } from '../lib/logger.js';
import type { LoginInput, PinLoginInput, PinRosterQuery } from '../schemas/auth.schema.js';
import type { Role } from '../types/index.js';

/** Fire-and-forget — powers the School/Super Admin "active logins" panels.
 *  Never allowed to fail a login just because the log write hiccuped. */
function recordLoginEvent(userId: string, schoolId: string | null, role: Role, method: 'password' | 'pin'): void {
  const now = new Date().toISOString();
  void supabaseAdmin
    .from('login_events')
    .insert({ user_id: userId, school_id: schoolId, role, method })
    .then(({ error }) => {
      if (error) logger.warn({ error }, 'Failed to record login event');
    });
  void supabaseAdmin
    .from('user_profiles')
    .update({ last_seen_at: now })
    .eq('id', userId)
    .then(({ error }) => {
      if (error) logger.warn({ error }, 'Failed to update last_seen_at on login');
    });
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | undefined;
  userId: string;
  role: Role;
  schoolId: string | null;
  fullName: string;
  redirectPath: string;
}

/** Where each role lands after a successful login. Students route by batch, derived from class_num. */
function redirectPathFor(role: Role, batchId: number | null): string {
  switch (role) {
    case 'student':
      if (!batchId) throw new ApiError('INTERNAL_ERROR', 'Student has no batch_id — profile is incomplete');
      return `/batch${batchId}/home`;
    case 'teacher':
      return '/teacher/dashboard';
    case 'school_admin':
      return '/school-admin/dashboard';
    case 'lab_incharge':
      return '/lab-incharge/dashboard';
    case 'super_admin':
      return '/super-admin/dashboard';
  }
}

export async function login({ email, password }: LoginInput): Promise<LoginResult> {
  const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (authError || !authData.session || !authData.user) {
    throw new ApiError('UNAUTHORIZED', 'Invalid email or password');
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('role, school_id, full_name, is_active, has_logged_in_ever, student_profiles(batch_id)')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) throw new ApiError('UNAUTHORIZED', 'No profile for this account');
  if (!profile.is_active) throw new ApiError('FORBIDDEN', 'This account has been deactivated');

  if (!profile.has_logged_in_ever) {
    await supabaseAdmin
      .from('user_profiles')
      .update({ has_logged_in_ever: true, first_login_at: new Date().toISOString() })
      .eq('id', authData.user.id);
  }

  const batchId = Array.isArray(profile.student_profiles)
    ? (profile.student_profiles[0]?.batch_id ?? null)
    : ((profile.student_profiles as { batch_id: number } | null)?.batch_id ?? null);

  recordLoginEvent(authData.user.id, profile.school_id as string | null, profile.role as Role, 'password');

  return {
    accessToken: authData.session.access_token,
    refreshToken: authData.session.refresh_token,
    expiresAt: authData.session.expires_at,
    userId: authData.user.id,
    role: profile.role as Role,
    schoolId: profile.school_id as string | null,
    fullName: profile.full_name as string,
    redirectPath: redirectPathFor(profile.role as Role, batchId),
  };
}

// ─────────────────────────────────────────────────────────────
//  BATCH 1 — name-pick + PIN login. Only surfaces students (and only
//  succeeds) while a live session is running for their class/section:
//  outside class time there is nothing to log into.
// ─────────────────────────────────────────────────────────────
async function requireActiveSessionFor(schoolId: string, classNum: number, section: string) {
  const { data } = await supabaseAdmin
    .from('live_sessions')
    .select('id')
    .eq('school_id', schoolId)
    .eq('class_num', classNum)
    .eq('section', section)
    .eq('is_active', true)
    .maybeSingle();

  if (!data) throw new ApiError('FORBIDDEN', 'No class is live right now — ask your teacher to start the session');
}

async function resolveSchoolId(schoolCode: string): Promise<string> {
  const { data, error } = await supabaseAdmin.from('schools').select('id').eq('code', schoolCode).single();
  if (error || !data) throw new ApiError('SCHOOL_INVALID', 'Unknown school code');
  return data.id as string;
}

export async function getPinRoster({ schoolCode, classNum, section }: PinRosterQuery) {
  const schoolId = await resolveSchoolId(schoolCode);
  await requireActiveSessionFor(schoolId, classNum, section);

  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, student_profiles!inner(class_num, section, avatar)')
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .eq('student_profiles.class_num', classNum)
    .eq('student_profiles.section', section);

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load class roster', error.message);

  return (data ?? []).map((row) => {
    const sp = Array.isArray(row.student_profiles) ? row.student_profiles[0] : row.student_profiles;
    return { id: row.id, fullName: row.full_name, avatar: sp?.avatar ?? '🦁' };
  });
}

export async function pinLogin({ schoolCode, studentId, pin }: PinLoginInput): Promise<LoginResult> {
  const schoolId = await resolveSchoolId(schoolCode);

  const { data: profile, error } = await supabaseAdmin
    .from('user_profiles')
    .select('full_name, is_active, has_logged_in_ever, student_profiles!inner(class_num, section, pin_hash, batch_id)')
    .eq('id', studentId)
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .single();

  if (error || !profile) throw new ApiError('UNAUTHORIZED', 'Student not found');
  if (!profile.is_active) throw new ApiError('FORBIDDEN', 'This account has been deactivated');

  const sp = Array.isArray(profile.student_profiles) ? profile.student_profiles[0] : profile.student_profiles;
  if (!sp?.pin_hash) throw new ApiError('UNAUTHORIZED', 'This student has no PIN set');

  await requireActiveSessionFor(schoolId, sp.class_num, sp.section);

  const pinMatches = await bcrypt.compare(pin, sp.pin_hash);
  if (!pinMatches) throw new ApiError('UNAUTHORIZED', 'Incorrect PIN');

  const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(studentId);
  if (authUserError || !authUser.user?.email) throw new ApiError('INTERNAL_ERROR', 'Could not load auth account');

  // This GoTrue instance signs sessions with asymmetric ES256 keys, not the
  // legacy shared HS256 secret — a hand-minted JWT doesn't verify against
  // GoTrue's own /user endpoint no matter how the claims are shaped. Getting
  // a *real* session is simpler anyway: rotate the student's password (never
  // shown to anyone — Batch 1 credentials only ever expose the PIN) and sign
  // in with it. That's a first-class GoTrue session: it runs through
  // custom_access_token_hook like any other login, and is refreshable.
  const freshPassword = generatePassword(20);
  const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(studentId, {
    password: freshPassword,
  });
  if (resetError) throw new ApiError('INTERNAL_ERROR', 'Failed to establish session', resetError.message);

  const { data: authData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
    email: authUser.user.email,
    password: freshPassword,
  });
  if (signInError || !authData.session) {
    throw new ApiError('INTERNAL_ERROR', 'Failed to establish session', signInError?.message);
  }

  if (!profile.has_logged_in_ever) {
    await supabaseAdmin
      .from('user_profiles')
      .update({ has_logged_in_ever: true, first_login_at: new Date().toISOString() })
      .eq('id', studentId);
  }

  recordLoginEvent(studentId, schoolId, 'student', 'pin');

  return {
    accessToken: authData.session.access_token,
    refreshToken: authData.session.refresh_token,
    expiresAt: authData.session.expires_at,
    userId: studentId,
    role: 'student',
    schoolId,
    fullName: profile.full_name as string,
    redirectPath: redirectPathFor('student', sp.batch_id),
  };
}
