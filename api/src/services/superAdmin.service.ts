import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { generatePassword } from '../lib/credentials.js';
import { sendSchoolAdminWelcomeEmail } from '../lib/mailer.js';
import { revokeUserSessions, revokeSessionsForUsers } from '../lib/sessions.js';
import { writeAuditLog } from './auditLog.service.js';
import {
  grantAllEntitlements,
  seedEntitlementsFromPackage,
  invalidateEntitlementsCache,
  FEATURE_KEYS,
  type FeatureKey,
} from '../lib/entitlements.js';
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

  // One plan, everything included — a newly registered school gets the full
  // feature set. Rows are still written explicitly rather than leaning on the
  // grandfathering rule, so a later per-school toggle is distinguishable from
  // a seed that never ran.
  try {
    await grantAllEntitlements(school.id as string);
  } catch (seedError) {
    await supabaseAdmin.from('schools').delete().eq('id', school.id);
    throw new ApiError(
      'INTERNAL_ERROR',
      'Failed to provision school features',
      seedError instanceof Error ? seedError.message : String(seedError),
    );
  }

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

export const SCHOOLS_PAGE_SIZE = 25;

/**
 * Schools, paginated and searchable.
 *
 * Returned as an envelope rather than a bare array so the caller can render
 * "showing 25 of 340" without a second count query. `total` is the count for
 * the CURRENT filter, which is what a pager needs.
 */
export async function listSchools(opts: { page?: number; pageSize?: number; search?: string } = {}) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? SCHOOLS_PAGE_SIZE));
  const from = (page - 1) * pageSize;

  let query = supabaseAdmin
    .from('schools')
    .select(
      'id, name, code, address, city, state, pincode, board, plan, logo_path, contact_name, contact_email, contact_phone, is_active, created_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  const search = opts.search?.trim();
  if (search) {
    // Name or code — the two things an operator actually knows when hunting
    // for one school among hundreds. Commas would break out of the or()
    // filter syntax, so they are stripped.
    const safe = search.replace(/[,()]/g, ' ');
    query = query.or(`name.ilike.%${safe}%,code.ilike.%${safe}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list schools', error.message);

  return { rows: data ?? [], total: count ?? 0, page, pageSize };
}

interface SchoolStatsRow {
  school_id: string;
  students: number;
  teachers: number;
  staff: number;
  active_now: number;
  open_tickets: number;
}

/**
 * Platform overview.
 *
 * The per-school counts come from platform_school_stats(), a SQL aggregate.
 * This used to pull EVERY user_profile and every open ticket into Node and
 * count them in a loop — fine against four demo schools, but a hundred schools
 * of five hundred students means fifty thousand rows over the wire on every
 * dashboard load. The response shape is unchanged.
 */
export async function getOverview() {
  const [{ data: schools, error: schoolsError }, { data: stats, error: statsError }] = await Promise.all([
    supabaseAdmin.from('schools').select('id, name, code, is_active, created_at').order('created_at', { ascending: false }),
    supabaseAdmin.rpc('platform_school_stats'),
  ]);

  if (schoolsError) throw new ApiError('INTERNAL_ERROR', 'Failed to load schools', schoolsError.message);
  if (statsError) throw new ApiError('INTERNAL_ERROR', 'Failed to load platform statistics', statsError.message);

  const byId = new Map<string, SchoolStatsRow>(
    ((stats ?? []) as SchoolStatsRow[]).map((r) => [r.school_id, r]),
  );

  const schoolRows = (schools ?? []).map((s) => {
    const c = byId.get(s.id);
    return {
      id: s.id,
      name: s.name,
      code: s.code,
      isActive: s.is_active,
      createdAt: s.created_at,
      studentCount: Number(c?.students ?? 0),
      teacherCount: Number(c?.teachers ?? 0),
      staffCount: Number(c?.staff ?? 0),
      activeNow: Number(c?.active_now ?? 0),
      openTickets: Number(c?.open_tickets ?? 0),
    };
  });

  return {
    totalSchools: schoolRows.length,
    activeSchools: schoolRows.filter((s) => s.isActive).length,
    totalStudents: schoolRows.reduce((sum, s) => sum + s.studentCount, 0),
    totalTeachers: schoolRows.reduce((sum, s) => sum + s.teacherCount, 0),
    totalOpenTickets: schoolRows.reduce((sum, s) => sum + s.openTickets, 0),
    schools: schoolRows,
  };
}

export async function setSchoolActive(schoolId: string, isActive: boolean, actorId: string) {
  const { data, error } = await supabaseAdmin
    .from('schools')
    .update({ is_active: isActive })
    .eq('id', schoolId)
    .select()
    .single();

  if (error) throw new ApiError('NOT_FOUND', 'School not found', error.message);

  // requireAuth already refuses a suspended school on the next request, so
  // access dies within one call either way. Revoking as well stops the
  // refresh loop quietly renewing tokens for a school that has been cut off
  // — e.g. for non-payment — for as long as a tab stays open.
  let affected = 0;
  if (!isActive) {
    const { data: members } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('school_id', schoolId);
    const ids = (members ?? []).map((m) => m.id as string);
    affected = ids.length;
    await revokeSessionsForUsers(ids, 'school_suspended', { actorId, schoolId });
  }

  // Suspending a school cuts off every child, teacher and admin in it at once.
  // It is the single widest-blast-radius action on the platform and must be
  // attributable.
  await writeAuditLog({
    schoolId,
    actorId,
    action: isActive ? 'school.reactivated' : 'school.suspended',
    entity: 'school',
    entityId: schoolId,
    metadata: isActive ? {} : { sessionsRevoked: affected },
  });

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
      .select('id, name, code, address, city, state, pincode, board, plan, logo_path, contact_name, contact_email, contact_phone, is_active, created_at')
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

  // Moving a school onto a named package re-seeds its entitlements to that
  // package's contents — otherwise "upgrade this school to Enterprise" would
  // change a label and grant nothing. 'custom' is the explicit opt-out: it
  // preserves whatever hand-picked set the Super Admin has already built.
  if (patch.plan !== undefined && patch.plan !== 'custom') {
    await seedEntitlementsFromPackage(schoolId, patch.plan);
  }

  return data;
}

/**
 * Every feature in the catalog with this school's current grant state —
 * the shape the Super Admin entitlements panel renders directly.
 */
export async function getSchoolEntitlements(schoolId: string) {
  const [catalogRes, grantedRes, schoolRes] = await Promise.all([
    supabaseAdmin.from('feature_catalog').select('key, label, description, sort_order').order('sort_order'),
    supabaseAdmin.from('school_entitlements').select('feature_key, enabled, updated_at').eq('school_id', schoolId),
    supabaseAdmin.from('schools').select('id, name, plan').eq('id', schoolId).single(),
  ]);

  if (schoolRes.error || !schoolRes.data) throw new ApiError('NOT_FOUND', 'School not found');

  const grantedBy = new Map(
    (grantedRes.data ?? []).map((r) => [r.feature_key as string, r]),
  );

  return {
    school: schoolRes.data,
    // A school with no rows at all is fully entitled (grandfathering), so the
    // panel must show that truthfully rather than a wall of unchecked boxes.
    features: (catalogRes.data ?? []).map((f) => {
      const row = grantedBy.get(f.key as string);
      return {
        key: f.key,
        label: f.label,
        description: f.description,
        enabled: row ? (row.enabled as boolean) : grantedBy.size === 0,
        updatedAt: row?.updated_at ?? null,
      };
    }),
  };
}

/**
 * Replace a school's entitlement set. Writes every catalog key explicitly so
 * a school can never be left with a partial row set that the grandfathering
 * rule would then read as "fully entitled".
 */
export async function setSchoolEntitlements(
  schoolId: string,
  features: Record<string, boolean>,
  updatedBy: string,
) {
  const { data: school } = await supabaseAdmin.from('schools').select('id').eq('id', schoolId).maybeSingle();
  if (!school) throw new ApiError('NOT_FOUND', 'School not found');

  const unknown = Object.keys(features).filter((k) => !FEATURE_KEYS.includes(k as FeatureKey));
  if (unknown.length > 0) {
    throw new ApiError('VALIDATION_ERROR', `Unknown feature key(s): ${unknown.join(', ')}`);
  }

  // Captured before the write so the audit entry can show what actually
  // changed — an entitlement diff is the evidence behind a billing dispute.
  const { data: previous } = await supabaseAdmin
    .from('school_entitlements')
    .select('feature_key, enabled')
    .eq('school_id', schoolId);
  const before = new Map((previous ?? []).map((r) => [r.feature_key as string, r.enabled as boolean]));

  const rows = FEATURE_KEYS.map((key) => ({
    school_id: schoolId,
    feature_key: key,
    enabled: features[key] ?? false,
    updated_by: updatedBy,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabaseAdmin.from('school_entitlements').upsert(rows);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to save entitlements', error.message);

  // Hand-picked sets no longer correspond to a named package.
  await supabaseAdmin.from('schools').update({ plan: 'custom' }).eq('id', schoolId);

  const changes = rows
    .filter((r) => before.get(r.feature_key) !== r.enabled)
    .map((r) => ({ feature: r.feature_key, from: before.get(r.feature_key) ?? null, to: r.enabled }));

  await writeAuditLog({
    schoolId,
    actorId: updatedBy,
    action: 'entitlements.changed',
    entity: 'school',
    entityId: schoolId,
    metadata: { changes, planSetTo: 'custom' },
  });

  invalidateEntitlementsCache();
  return getSchoolEntitlements(schoolId);
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

export async function resetSchoolAdminPassword(schoolId: string, userId: string, actorId: string) {
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

  // The old credential is dead; any session still holding it must be too.
  await revokeUserSessions(userId, 'credential_reset', { actorId, schoolId });
  await writeAuditLog({
    schoolId,
    actorId,
    action: 'credential.reset',
    entity: 'school_admin',
    entityId: userId,
    metadata: { method: 'password', byPlatformOperator: true },
  });

  return { fullName: profile.full_name, email: authUser.user?.email ?? '', password };
}

// ─────────────────────────────────────────────────────────────
//  AUDIT LOG — platform-wide viewer with optional school filter.
// ─────────────────────────────────────────────────────────────
export interface AuditLogFilters {
  schoolId?: string;
  days: number;
  limit: number;
  /** Exact action key, e.g. `credential.reset`. */
  action?: string;
  /** Entity type, e.g. `student` / `school`. */
  entity?: string;
  /** Restrict to one actor — "what did this administrator do?". */
  actorId?: string;
  /** Substring match across action and entity, for when you don't know the key. */
  search?: string;
}

/**
 * The distinct action keys currently present, so the viewer can offer a real
 * dropdown instead of asking an operator to memorise the vocabulary.
 * Derived from the data rather than a hardcoded list, so a new audited action
 * appears in the filter the first time it is recorded.
 */
export async function listAuditActions(days = 90): Promise<string[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60_000).toISOString();
  const { data, error } = await supabaseAdmin
    .from('audit_logs')
    .select('action')
    .gte('created_at', since)
    .limit(5000);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load audit actions', error.message);
  return [...new Set((data ?? []).map((r) => r.action as string))].sort();
}

export async function listAuditLogs(filters: AuditLogFilters) {
  const since = new Date(Date.now() - filters.days * 24 * 60 * 60_000).toISOString();

  let query = supabaseAdmin
    .from('audit_logs')
    .select('id, school_id, actor_id, action, entity, entity_id, metadata, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(filters.limit);

  if (filters.schoolId) query = query.eq('school_id', filters.schoolId);
  if (filters.action) query = query.eq('action', filters.action);
  if (filters.entity) query = query.eq('entity', filters.entity);
  if (filters.actorId) query = query.eq('actor_id', filters.actorId);
  if (filters.search?.trim()) {
    const safe = filters.search.trim().replace(/[,()]/g, ' ');
    query = query.or(`action.ilike.%${safe}%,entity.ilike.%${safe}%`);
  }

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

/**
 * The same query, rendered as CSV for an auditor or a regulator.
 *
 * Runs through listAuditLogs so an export can never disagree with what the
 * screen showed — an audit extract that quietly used different filters than
 * the viewer would be worse than having no export at all.
 *
 * `metadata` is serialised as JSON in a single column. It is deliberately NOT
 * flattened into columns: the shape differs per action, and a spreadsheet that
 * silently drops fields it didn't expect is not an audit record.
 */
export async function exportAuditLogsCsv(filters: AuditLogFilters): Promise<string> {
  const rows = await listAuditLogs(filters);

  const header = [
    'timestamp_utc',
    'action',
    'entity',
    'entity_id',
    'actor_name',
    'actor_role',
    'actor_id',
    'school_name',
    'school_code',
    'metadata_json',
  ];

  /** RFC 4180: quote everything, double any embedded quote. */
  const cell = (v: unknown): string => {
    if (v === null || v === undefined) return '""';
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(
      [
        cell(r.created_at),
        cell(r.action),
        cell(r.entity),
        cell(r.entity_id),
        cell(r.actor?.full_name ?? null),
        cell(r.actor?.role ?? null),
        cell(r.actor_id),
        cell(r.schools?.name ?? null),
        cell(r.schools?.code ?? null),
        cell(r.metadata ?? null),
      ].join(','),
    );
  }
  return lines.join('\r\n');
}
