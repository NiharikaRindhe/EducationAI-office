import { supabaseAdmin, supabaseAnon } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import type { LoginInput } from '../schemas/auth.schema.js';
import type { Role } from '../types/index.js';

interface LoginResult {
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
