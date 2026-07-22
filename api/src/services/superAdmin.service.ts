import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { generatePassword } from '../lib/credentials.js';
import { sendSchoolAdminWelcomeEmail } from '../lib/mailer.js';
import type { CreateSchoolInput } from '../schemas/superAdmin.schema.js';

export async function createSchool(input: CreateSchoolInput) {
  const { data: existing } = await supabaseAdmin
    .from('schools')
    .select('id')
    .eq('code', input.code)
    .maybeSingle();

  if (existing) throw new ApiError('SCHOOL_INVALID', `School code "${input.code}" is already in use`);

  const { data: school, error } = await supabaseAdmin
    .from('schools')
    .insert({
      name: input.name,
      code: input.code,
      board: input.board,
      plan: input.plan,
      address: input.address ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      pincode: input.pincode ?? null,
      contact_name: input.contactName ?? null,
      contact_email: input.contactEmail ?? null,
      contact_phone: input.contactPhone ?? null,
    })
    .select()
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to create school', error.message);

  // Optionally provision the school's admin account in the same step —
  // the generated password is returned exactly once, for the credential slip.
  let adminCredential: { fullName: string; email: string; password: string } | null = null;
  if (input.admin) {
    const password = generatePassword(12);
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: input.admin.email,
      password,
      email_confirm: true,
    });
    if (authError || !authUser.user) {
      // Roll back the school row rather than leaving a school with a half-created admin.
      await supabaseAdmin.from('schools').delete().eq('id', school.id);
      throw new ApiError('VALIDATION_ERROR', `Could not create admin account: ${authError?.message ?? 'unknown error'}`);
    }

    const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
      id: authUser.user.id,
      school_id: school.id,
      role: 'school_admin',
      full_name: input.admin.fullName,
    });
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      await supabaseAdmin.from('schools').delete().eq('id', school.id);
      throw new ApiError('INTERNAL_ERROR', 'Failed to create admin profile', profileError.message);
    }

    adminCredential = { fullName: input.admin.fullName, email: input.admin.email, password };

    // Fire-and-forget: the credential is also shown once in the UI, so a
    // missing/broken SMTP server never blocks school creation.
    sendSchoolAdminWelcomeEmail({
      to: input.admin.email,
      fullName: input.admin.fullName,
      schoolName: school.name as string,
      schoolCode: school.code as string,
      email: input.admin.email,
      password,
    });
  }

  return { ...school, adminCredential };
}

export async function listSchools() {
  const { data, error } = await supabaseAdmin
    .from('schools')
    .select(
      'id, name, code, address, city, state, pincode, board, plan, contact_name, contact_email, contact_phone, is_active, created_at',
    )
    .order('created_at', { ascending: false });

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list schools', error.message);
  return data;
}

export async function getOverview() {
  const [{ data: schools, error: schoolsError }, { data: profiles, error: profilesError }, { data: tickets, error: ticketsError }] =
    await Promise.all([
      supabaseAdmin.from('schools').select('id, name, code, is_active, created_at'),
      supabaseAdmin.from('user_profiles').select('school_id, role, last_seen_at'),
      supabaseAdmin.from('support_tickets').select('school_id, status').in('status', ['open', 'in_progress']),
    ]);

  if (schoolsError) throw new ApiError('INTERNAL_ERROR', 'Failed to load schools', schoolsError.message);
  if (profilesError) throw new ApiError('INTERNAL_ERROR', 'Failed to load users', profilesError.message);
  if (ticketsError) throw new ApiError('INTERNAL_ERROR', 'Failed to load tickets', ticketsError.message);

  const activeSince = Date.now() - 15 * 60_000;
  const countsBySchool = new Map<string, { students: number; teachers: number; staff: number; activeNow: number }>();
  for (const p of profiles ?? []) {
    if (!p.school_id) continue;
    const entry = countsBySchool.get(p.school_id) ?? { students: 0, teachers: 0, staff: 0, activeNow: 0 };
    if (p.role === 'student') entry.students += 1;
    else if (p.role === 'teacher') entry.teachers += 1;
    else entry.staff += 1;
    if (p.last_seen_at && new Date(p.last_seen_at).getTime() > activeSince) entry.activeNow += 1;
    countsBySchool.set(p.school_id, entry);
  }

  const openTicketsBySchool = new Map<string, number>();
  for (const t of tickets ?? []) {
    if (!t.school_id) continue;
    openTicketsBySchool.set(t.school_id, (openTicketsBySchool.get(t.school_id) ?? 0) + 1);
  }

  const schoolRows = (schools ?? []).map((s) => {
    const counts = countsBySchool.get(s.id) ?? { students: 0, teachers: 0, staff: 0, activeNow: 0 };
    return {
      id: s.id,
      name: s.name,
      code: s.code,
      isActive: s.is_active,
      createdAt: s.created_at,
      studentCount: counts.students,
      teacherCount: counts.teachers,
      staffCount: counts.staff,
      activeNow: counts.activeNow,
      openTickets: openTicketsBySchool.get(s.id) ?? 0,
    };
  });

  return {
    totalSchools: schoolRows.length,
    activeSchools: schoolRows.filter((s) => s.isActive).length,
    totalStudents: schoolRows.reduce((sum, s) => sum + s.studentCount, 0),
    totalTeachers: schoolRows.reduce((sum, s) => sum + s.teacherCount, 0),
    totalOpenTickets: (tickets ?? []).length,
    schools: schoolRows,
  };
}

export async function setSchoolActive(schoolId: string, isActive: boolean) {
  const { data, error } = await supabaseAdmin
    .from('schools')
    .update({ is_active: isActive })
    .eq('id', schoolId)
    .select()
    .single();

  if (error) throw new ApiError('NOT_FOUND', 'School not found', error.message);
  return data;
}

// ─────────────────────────────────────────────────────────────
//  SCHOOL DETAIL — the drill-down page: full profile, staff
//  accounts, per-class enrollment, and recent platform usage.
// ─────────────────────────────────────────────────────────────
export async function getSchoolDetail(schoolId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();

  const [schoolRes, profilesRes, loginsRes, aiRes] = await Promise.all([
    supabaseAdmin
      .from('schools')
      .select('id, name, code, address, city, state, pincode, board, plan, contact_name, contact_email, contact_phone, is_active, created_at')
      .eq('id', schoolId)
      .single(),
    supabaseAdmin
      .from('user_profiles')
      .select('id, full_name, role, is_active, has_logged_in_ever, last_seen_at, created_at, student_profiles(class_num, section)')
      .eq('school_id', schoolId),
    supabaseAdmin
      .from('login_events')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .gte('created_at', thirtyDaysAgo),
    supabaseAdmin
      .from('ai_usage_log')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .gte('created_at', thirtyDaysAgo),
  ]);

  if (schoolRes.error || !schoolRes.data) throw new ApiError('NOT_FOUND', 'School not found');
  if (profilesRes.error) throw new ApiError('INTERNAL_ERROR', 'Failed to load school users', profilesRes.error.message);

  const profiles = profilesRes.data ?? [];
  const students = profiles.filter((p) => p.role === 'student');
  const teachers = profiles.filter((p) => p.role === 'teacher');
  const staff = profiles.filter((p) => p.role === 'school_admin' || p.role === 'lab_incharge');

  const enrollmentByClass: Record<number, number> = {};
  for (let c = 1; c <= 10; c++) enrollmentByClass[c] = 0;
  for (const s of students) {
    const sp = Array.isArray(s.student_profiles) ? s.student_profiles[0] : s.student_profiles;
    if (sp && sp.class_num >= 1 && sp.class_num <= 10) {
      enrollmentByClass[sp.class_num] = (enrollmentByClass[sp.class_num] ?? 0) + 1;
    }
  }

  const activeSince = Date.now() - 15 * 60_000;

  return {
    school: schoolRes.data,
    stats: {
      studentCount: students.length,
      teacherCount: teachers.length,
      staffCount: staff.length,
      neverLoggedInStudents: students.filter((s) => !s.has_logged_in_ever).length,
      activeNow: profiles.filter((p) => p.last_seen_at && new Date(p.last_seen_at as string).getTime() > activeSince).length,
      loginsLast30d: loginsRes.count ?? 0,
      aiCallsLast30d: aiRes.count ?? 0,
    },
    enrollmentByClass,
    admins: staff.map((a) => ({
      id: a.id,
      fullName: a.full_name,
      role: a.role,
      isActive: a.is_active,
      hasLoggedInEver: a.has_logged_in_ever,
      lastSeenAt: a.last_seen_at,
      createdAt: a.created_at,
    })),
  };
}

export interface UpdateSchoolInput {
  name?: string;
  board?: string;
  plan?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

export async function updateSchool(schoolId: string, patch: UpdateSchoolInput) {
  const updates: Record<string, unknown> = {};
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.board !== undefined) updates.board = patch.board;
  if (patch.plan !== undefined) updates.plan = patch.plan;
  if (patch.address !== undefined) updates.address = patch.address;
  if (patch.city !== undefined) updates.city = patch.city;
  if (patch.state !== undefined) updates.state = patch.state;
  if (patch.pincode !== undefined) updates.pincode = patch.pincode;
  if (patch.contactName !== undefined) updates.contact_name = patch.contactName;
  if (patch.contactEmail !== undefined) updates.contact_email = patch.contactEmail;
  if (patch.contactPhone !== undefined) updates.contact_phone = patch.contactPhone;

  if (Object.keys(updates).length === 0) throw new ApiError('VALIDATION_ERROR', 'Nothing to update');

  const { data, error } = await supabaseAdmin.from('schools').update(updates).eq('id', schoolId).select().single();
  if (error || !data) throw new ApiError('NOT_FOUND', 'School not found');
  return data;
}

export async function addSchoolAdmin(schoolId: string, input: { fullName: string; email: string }) {
  const { data: school } = await supabaseAdmin.from('schools').select('id, name, code').eq('id', schoolId).maybeSingle();
  if (!school) throw new ApiError('NOT_FOUND', 'School not found');

  const password = generatePassword(12);
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password,
    email_confirm: true,
  });
  if (authError || !authUser.user) {
    throw new ApiError('VALIDATION_ERROR', `Could not create admin account: ${authError?.message ?? 'unknown error'}`);
  }

  const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
    id: authUser.user.id,
    school_id: schoolId,
    role: 'school_admin',
    full_name: input.fullName,
  });
  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    throw new ApiError('INTERNAL_ERROR', 'Failed to create admin profile', profileError.message);
  }

  sendSchoolAdminWelcomeEmail({
    to: input.email,
    fullName: input.fullName,
    schoolName: school.name as string,
    schoolCode: school.code as string,
    email: input.email,
    password,
  });

  return { fullName: input.fullName, email: input.email, password };
}

export async function resetSchoolAdminPassword(schoolId: string, userId: string) {
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .eq('school_id', schoolId)
    .in('role', ['school_admin', 'lab_incharge'])
    .maybeSingle();
  if (!profile) throw new ApiError('NOT_FOUND', 'Admin account not found in this school');

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
  const password = generatePassword(12);
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to reset password', error.message);

  return { fullName: profile.full_name, email: authUser.user?.email ?? '', password };
}

// ─────────────────────────────────────────────────────────────
//  AUDIT LOG — platform-wide viewer with optional school filter.
// ─────────────────────────────────────────────────────────────
export async function listAuditLogs(filters: { schoolId?: string; days: number; limit: number }) {
  const since = new Date(Date.now() - filters.days * 24 * 60 * 60_000).toISOString();

  let query = supabaseAdmin
    .from('audit_logs')
    .select('id, school_id, actor_id, action, entity, entity_id, metadata, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(filters.limit);

  if (filters.schoolId) query = query.eq('school_id', filters.schoolId);

  const { data, error } = await query;
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load audit log', error.message);
  const rows = data ?? [];

  // Neither actor_id nor school_id carries an FK in the original schema, so
  // PostgREST can't embed them — resolve both with batched lookups instead.
  const actorIds = [...new Set(rows.map((r) => r.actor_id))];
  const schoolIds = [...new Set(rows.map((r) => r.school_id).filter((id): id is string => Boolean(id)))];

  const [actorsRes, schoolsRes] = await Promise.all([
    actorIds.length > 0
      ? supabaseAdmin.from('user_profiles').select('id, full_name, role').in('id', actorIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string; role: string }[] }),
    schoolIds.length > 0
      ? supabaseAdmin.from('schools').select('id, name, code').in('id', schoolIds)
      : Promise.resolve({ data: [] as { id: string; name: string; code: string }[] }),
  ]);

  const actorById = new Map((actorsRes.data ?? []).map((a) => [a.id, { full_name: a.full_name, role: a.role }]));
  const schoolById = new Map((schoolsRes.data ?? []).map((s) => [s.id, { name: s.name, code: s.code }]));

  return rows.map((r) => ({
    ...r,
    actor: actorById.get(r.actor_id) ?? null,
    schools: r.school_id ? (schoolById.get(r.school_id) ?? null) : null,
  }));
}
