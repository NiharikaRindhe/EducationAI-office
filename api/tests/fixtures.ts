import 'dotenv/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Hermetic fixtures for the isolation suite.
 *
 * The security suite originally leaned on whatever happened to be seeded in
 * the developer's database. That made two tests inconclusive rather than
 * passing — `english_assessment_attempts` was empty, so "a student sees no
 * foreign rows" was true only because there were no rows at all. It also meant
 * the suite could not run on a clean database in CI.
 *
 * This module builds everything those tests need with the service role, then
 * tears it down. Two schools, a teacher who teaches one section but not the
 * other, and real rows in the tables whose policies we are asserting on.
 *
 * Everything is prefixed ZZ-ISO so it sorts to the bottom of any admin list and
 * is unmistakably test data if a teardown is ever interrupted.
 */

const PREFIX = 'ZZ-ISO';
const PASSWORD = 'ZzIsolation-Test-1';

export function admin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY must be set to run the isolation suite');
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export interface FixtureUser {
  id: string;
  email: string;
  password: string;
}

export interface Fixtures {
  schoolAId: string;
  schoolBId: string;
  /** School Admin of School A. */
  schoolAdminA: FixtureUser;
  /** Platform Super Admin — no school. */
  superAdmin: FixtureUser;
  /** Student in School A, section 6A — the teacher below DOES teach them. */
  studentA1: FixtureUser;
  /** Student in School A, section 6B — same school, NOT taught by the teacher. */
  studentA2: FixtureUser;
  /** Student in School B — different tenant entirely. */
  studentB1: FixtureUser;
  /** Teacher in School A, assigned to 6A only. */
  teacherA: FixtureUser;
  /** English assessment attempt ids, so tests can assert on specific rows. */
  attemptIdA1: string;
  attemptIdA2: string;
  attemptIdB1: string;
  /** Chat session ids for the same three students. */
  chatIdA1: string;
  chatIdA2: string;
  chatIdB1: string;
}

/** Unique-per-run suffix so a leaked fixture never collides with the next run. */
const RUN = Math.random().toString(36).slice(2, 8);

async function createUser(
  sb: SupabaseClient,
  opts: {
    schoolId: string | null;
    role: 'student' | 'teacher' | 'school_admin' | 'super_admin';
    name: string;
    tag: string;
  },
): Promise<FixtureUser> {
  const email = `${PREFIX}.${opts.tag}.${RUN}@zz-iso.local`.toLowerCase();
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`fixture auth user failed (${opts.tag}): ${error?.message}`);

  const { error: profileError } = await sb.from('user_profiles').insert({
    id: data.user.id,
    school_id: opts.schoolId,
    role: opts.role,
    full_name: opts.name,
  });
  if (profileError) {
    await sb.auth.admin.deleteUser(data.user.id);
    throw new Error(`fixture profile failed (${opts.tag}): ${profileError.message}`);
  }

  return { id: data.user.id, email, password: PASSWORD };
}

async function createSchool(sb: SupabaseClient, label: string): Promise<string> {
  const { data, error } = await sb
    .from('schools')
    .insert({
      name: `${PREFIX} ${label} ${RUN}`,
      code: `${PREFIX}-${label}-${RUN}`.toUpperCase(),
      plan: 'enterprise',
      board: 'CBSE',
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(`fixture school failed (${label}): ${error?.message}`);
  return data.id as string;
}

export async function provisionFixtures(): Promise<Fixtures> {
  const sb = admin();

  const schoolAId = await createSchool(sb, 'A');
  const schoolBId = await createSchool(sb, 'B');

  // Two sections in School A. The teacher gets 6A only, so 6B is the negative
  // case: same school, same year, but outside their teaching scope.
  const { data: sections, error: sectionError } = await sb
    .from('class_sections')
    .insert([
      { school_id: schoolAId, class_num: 6, section_label: 'A' },
      { school_id: schoolAId, class_num: 6, section_label: 'B' },
    ])
    .select('id, section_label');
  if (sectionError || !sections) throw new Error(`fixture sections failed: ${sectionError?.message}`);
  const section6A = sections.find((s) => s.section_label === 'A')!;

  const teacherA = await createUser(sb, { schoolId: schoolAId, role: 'teacher', name: `${PREFIX} Teacher A`, tag: 'teacher.a' });
  await sb.from('teacher_profiles').insert({ user_id: teacherA.id, classes_taught: [6], specialization: 'English' });
  await sb.from('teaching_assignments').insert({
    school_id: schoolAId,
    teacher_id: teacherA.id,
    class_section_id: section6A.id,
    subject: 'English',
  });

  const studentA1 = await createUser(sb, { schoolId: schoolAId, role: 'student', name: `${PREFIX} Student A1`, tag: 'student.a1' });
  const studentA2 = await createUser(sb, { schoolId: schoolAId, role: 'student', name: `${PREFIX} Student A2`, tag: 'student.a2' });
  const studentB1 = await createUser(sb, { schoolId: schoolBId, role: 'student', name: `${PREFIX} Student B1`, tag: 'student.b1' });

  const schoolAdminA = await createUser(sb, { schoolId: schoolAId, role: 'school_admin', name: `${PREFIX} School Admin A`, tag: 'admin.a' });
  const superAdmin = await createUser(sb, { schoolId: null, role: 'super_admin', name: `${PREFIX} Super Admin`, tag: 'super' });

  // School A is entitled to STARTER only. This matters: with no entitlement
  // rows at all a school is grandfathered into everything, which would make the
  // "cannot grant yourself a feature you did not buy" test silently skip. An
  // explicit limited package is what gives that assertion something to bite on.
  const { data: starterFeatures, error: pkgError } = await sb
    .from('package_features')
    .select('feature_key')
    .eq('package_key', 'starter');
  if (pkgError || !starterFeatures) throw new Error(`fixture package read failed: ${pkgError?.message}`);

  const { error: entError } = await sb.from('school_entitlements').insert(
    starterFeatures.map((p) => ({ school_id: schoolAId, feature_key: p.feature_key, enabled: true })),
  );
  if (entError) throw new Error(`fixture entitlements failed: ${entError.message}`);
  await sb.from('schools').update({ plan: 'starter' }).eq('id', schoolAId);

  const { error: spError } = await sb.from('student_profiles').insert([
    { user_id: studentA1.id, class_num: 6, section: 'A' },
    { user_id: studentA2.id, class_num: 6, section: 'B' },
    { user_id: studentB1.id, class_num: 6, section: 'A' },
  ]);
  if (spError) throw new Error(`fixture student profiles failed: ${spError.message}`);

  // English assessment attempts — the rows that made the original test vacuous.
  const { data: item, error: itemError } = await sb
    .from('english_assessment_items')
    .insert({ class_num: 6, type: 'sentence_read', content: `${PREFIX} the quick brown fox`, difficulty: 'easy' })
    .select('id')
    .single();
  if (itemError || !item) throw new Error(`fixture english item failed: ${itemError?.message}`);

  const { data: attempts, error: attemptError } = await sb
    .from('english_assessment_attempts')
    .insert([
      { student_id: studentA1.id, item_id: item.id, class_num: 6, transcript: `${PREFIX} a1`, accuracy_score: 8, fluency_score: 7, result: 'correct' },
      { student_id: studentA2.id, item_id: item.id, class_num: 6, transcript: `${PREFIX} a2`, accuracy_score: 6, fluency_score: 6, result: 'close' },
      { student_id: studentB1.id, item_id: item.id, class_num: 6, transcript: `${PREFIX} b1`, accuracy_score: 9, fluency_score: 9, result: 'correct' },
    ])
    .select('id, student_id');
  if (attemptError || !attempts) throw new Error(`fixture english attempts failed: ${attemptError.message}`);
  const attemptOf = (studentId: string) => attempts.find((a) => a.student_id === studentId)!.id as string;

  // Chat sessions — the teacher-narrowing assertion needs a session the teacher
  // may read and one they may not.
  const { data: chats, error: chatError } = await sb
    .from('chat_sessions')
    .insert([
      { student_id: studentA1.id, subject: 'English', title: `${PREFIX} a1 session` },
      { student_id: studentA2.id, subject: 'English', title: `${PREFIX} a2 session` },
      { student_id: studentB1.id, subject: 'English', title: `${PREFIX} b1 session` },
    ])
    .select('id, student_id');
  if (chatError || !chats) throw new Error(`fixture chat sessions failed: ${chatError.message}`);
  const chatOf = (studentId: string) => chats.find((c) => c.student_id === studentId)!.id as string;

  return {
    schoolAId,
    schoolBId,
    schoolAdminA,
    superAdmin,
    studentA1,
    studentA2,
    studentB1,
    teacherA,
    attemptIdA1: attemptOf(studentA1.id),
    attemptIdA2: attemptOf(studentA2.id),
    attemptIdB1: attemptOf(studentB1.id),
    chatIdA1: chatOf(studentA1.id),
    chatIdA2: chatOf(studentA2.id),
    chatIdB1: chatOf(studentB1.id),
  };
}

/**
 * Remove everything provisioned above.
 *
 * Deleting the two schools cascades to sections and teaching assignments, and
 * deleting the auth users cascades to their profiles — but english attempts and
 * chat sessions reference students without ON DELETE CASCADE, so they are
 * cleared first. Each step is independent: one failure must not strand the rest.
 */
export async function teardownFixtures(f: Fixtures): Promise<void> {
  const sb = admin();
  const studentIds = [f.studentA1.id, f.studentA2.id, f.studentB1.id];

  await sb.from('english_assessment_attempts').delete().in('student_id', studentIds);
  await sb.from('chat_messages').delete().in('session_id', [f.chatIdA1, f.chatIdA2, f.chatIdB1]);
  await sb.from('chat_sessions').delete().in('student_id', studentIds);
  await sb.from('english_assessment_items').delete().like('content', `${PREFIX}%`);

  for (const id of [...studentIds, f.teacherA.id, f.schoolAdminA.id, f.superAdmin.id]) {
    await sb.auth.admin.deleteUser(id).catch(() => {});
  }
  // Cascades to sections, teaching assignments, entitlements and class features.
  await sb.from('schools').delete().in('id', [f.schoolAId, f.schoolBId]);
}
