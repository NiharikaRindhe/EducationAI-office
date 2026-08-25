import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { login, api, type Actor } from './helpers.js';

/**
 * PDF SIMULATOR — ACCESS ISOLATION
 *
 * Asserts the trust boundary simAccess.service.ts's requireReadableBook is
 * meant to guarantee: a student can only reach a sim-ready book that
 * matches their OWN class, and that is either platform-wide or belongs to
 * their OWN school. Every denial must read as 404 (never 403) — the same
 * "never confirm a book with this id exists" reasoning documented on
 * requireJobOwnedBySchool for the RAG ingestion jobs table.
 *
 * Self-contained: builds its own two schools / two students / two books
 * with the service-role client rather than extending the shared
 * fixtures.ts used by isolation.test.ts, so a mistake here cannot affect
 * that suite. Prefixed ZZ-SIM so leaked rows are unmistakable and sort to
 * the bottom of any admin list, matching fixtures.ts's own convention.
 *
 * NOTE: like isolation.test.ts and security.test.ts, this suite drives a
 * real Postgres + GoTrue + PostgREST stack (docker-compose) and the API
 * server on :4000 — it does not run against mocks. It was written to this
 * repo's established fixture/teardown discipline but has not been
 * exercised in this environment (no local Docker daemon available when it
 * was authored). Run `npm run test:security` — or `vitest run
 * tests/simIsolation.test.ts` directly — against the local stack before
 * relying on it.
 */

const PREFIX = 'ZZ-SIM';
const PASSWORD = 'ZzSimIsolation-Test-1';
const RUN = Math.random().toString(36).slice(2, 8);

function admin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY must be set to run this suite');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

interface FixtureUser {
  id: string;
  email: string;
  password: string;
}

interface SimFixtures {
  schoolAId: string;
  schoolBId: string;
  /** Class 9, School A — can read the platform book AND School A's own upload. */
  studentA9: FixtureUser;
  /** Class 7, School A — wrong class for both books. */
  studentA7: FixtureUser;
  /** Class 9, School B — right class, wrong school for the School-A upload. */
  studentB9: FixtureUser;
  platformBookId: string;
  schoolABookId: string;
}

async function createUser(sb: SupabaseClient, schoolId: string, classNum: number, tag: string): Promise<FixtureUser> {
  const email = `${PREFIX}.${tag}.${RUN}@zz-sim.local`.toLowerCase();
  const { data, error } = await sb.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error || !data.user) throw new Error(`fixture auth user failed (${tag}): ${error?.message}`);

  const { error: profileError } = await sb
    .from('user_profiles')
    .insert({ id: data.user.id, school_id: schoolId, role: 'student', full_name: `${PREFIX} ${tag}` });
  if (profileError) {
    await sb.auth.admin.deleteUser(data.user.id);
    throw new Error(`fixture profile failed (${tag}): ${profileError.message}`);
  }

  const { error: spError } = await sb.from('student_profiles').insert({ user_id: data.user.id, class_num: classNum, section: 'A' });
  if (spError) {
    await sb.auth.admin.deleteUser(data.user.id);
    throw new Error(`fixture student_profiles failed (${tag}): ${spError.message}`);
  }

  return { id: data.user.id, email, password: PASSWORD };
}

async function createSchool(sb: SupabaseClient, label: string): Promise<string> {
  const { data, error } = await sb
    .from('schools')
    .insert({ name: `${PREFIX} ${label} ${RUN}`, code: `${PREFIX}-${label}-${RUN}`.toUpperCase(), plan: 'enterprise', board: 'CBSE' })
    .select('id')
    .single();
  if (error || !data) throw new Error(`fixture school failed (${label}): ${error?.message}`);
  return data.id as string;
}

/** A ready-to-read book: an ncert_ingestion_jobs row (status=done, sim_status=ready)
 *  plus one sim_pages row and one sim_annotations row, so annotation reads have
 *  something real to return. schoolId=null makes it a platform-wide book. */
async function createReadyBook(sb: SupabaseClient, opts: { schoolId: string | null; classNum: number; label: string }): Promise<string> {
  const { data: job, error: jobError } = await sb
    .from('ncert_ingestion_jobs')
    .insert({
      class_num: opts.classNum,
      subject: 'Science',
      book_title: `${PREFIX} ${opts.label} ${RUN}`,
      original_filename: `${PREFIX.toLowerCase()}-${opts.label.toLowerCase()}.pdf`,
      status: 'done',
      sim_status: 'ready',
      sim_pages_total: 1,
      sim_pages_done: 1,
      school_id: opts.schoolId,
    })
    .select('id')
    .single();
  if (jobError || !job) throw new Error(`fixture book failed (${opts.label}): ${jobError?.message}`);

  const { error: pageError } = await sb
    .from('sim_pages')
    .insert({ job_id: job.id, page_number: 1, text: `${PREFIX} page text for ${opts.label}`, word_count: 6 });
  if (pageError) throw new Error(`fixture sim_pages failed (${opts.label}): ${pageError.message}`);

  const { error: annError } = await sb.from('sim_annotations').insert({
    job_id: job.id,
    page_number: 1,
    quote: `${PREFIX} quote`,
    spec: {
      version: '2.0', title: `${PREFIX} sim`, domain: 'physics', isSimulatable: true,
      templateId: 'free_fall', params: { h0: 10, g: 9.81 },
    },
    spec_version: '2.0',
  });
  if (annError) throw new Error(`fixture sim_annotations failed (${opts.label}): ${annError.message}`);

  return job.id as string;
}

async function grantSimFeature(sb: SupabaseClient, schoolId: string): Promise<void> {
  const { error } = await sb.from('school_entitlements').insert({ school_id: schoolId, feature_key: 'pdf_simulator', enabled: true });
  if (error) throw new Error(`fixture entitlement failed: ${error.message}`);
}

async function provision(): Promise<SimFixtures> {
  const sb = admin();

  const schoolAId = await createSchool(sb, 'A');
  const schoolBId = await createSchool(sb, 'B');
  await grantSimFeature(sb, schoolAId);
  await grantSimFeature(sb, schoolBId);

  const studentA9 = await createUser(sb, schoolAId, 9, 'student.a9');
  const studentA7 = await createUser(sb, schoolAId, 7, 'student.a7');
  const studentB9 = await createUser(sb, schoolBId, 9, 'student.b9');

  const platformBookId = await createReadyBook(sb, { schoolId: null, classNum: 9, label: 'Platform Book' });
  const schoolABookId = await createReadyBook(sb, { schoolId: schoolAId, classNum: 9, label: 'School A Book' });

  return { schoolAId, schoolBId, studentA9, studentA7, studentB9, platformBookId, schoolABookId };
}

async function teardown(f: SimFixtures): Promise<void> {
  const sb = admin();
  const problems: string[] = [];

  // Cascades: ncert_ingestion_jobs -> sim_pages/sim_annotations (FK on delete cascade).
  const { error: jobsError } = await sb.from('ncert_ingestion_jobs').delete().in('id', [f.platformBookId, f.schoolABookId]);
  if (jobsError) problems.push(`ncert_ingestion_jobs: ${jobsError.message}`);

  for (const id of [f.studentA9.id, f.studentA7.id, f.studentB9.id]) {
    const { error } = await sb.auth.admin.deleteUser(id);
    if (error) problems.push(`deleteUser(${id}): ${error.message}`);
  }

  // Cascades to student_profiles, school_entitlements.
  const { error: schoolError } = await sb.from('schools').delete().in('id', [f.schoolAId, f.schoolBId]);
  if (schoolError) problems.push(`schools: ${schoolError.message}`);

  const { data: survivors } = await sb.from('ncert_ingestion_jobs').select('id').in('id', [f.platformBookId, f.schoolABookId]);
  if (survivors && survivors.length > 0) problems.push(`books still present: ${survivors.map((s) => s.id).join(', ')}`);

  if (problems.length > 0) throw new Error(`Fixture teardown incomplete — test data left behind:\n  ${problems.join('\n  ')}`);
}

let f: SimFixtures;
let a9: Actor;
let a7: Actor;
let b9: Actor;

beforeAll(async () => {
  f = await provision();
  a9 = await login(f.studentA9.email, f.studentA9.password);
  a7 = await login(f.studentA7.email, f.studentA7.password);
  b9 = await login(f.studentB9.email, f.studentB9.password);
});

afterAll(async () => {
  if (f) await teardown(f);
});

describe('sim isolation — fixture sanity (positive control)', () => {
  it('the matching-class, matching-school student CAN read the platform book', async () => {
    const res = await api(a9, `/student/sim/books/${f.platformBookId}/annotations`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBeGreaterThan(0);
  });

  it('the matching-class, owning-school student CAN read their own school\'s book', async () => {
    const res = await api(a9, `/student/sim/books/${f.schoolABookId}/annotations`);
    expect(res.status).toBe(200);
  });
});

describe('sim isolation — cross-class denial', () => {
  it('a Class 7 student gets 404 (not 403) reading a Class 9 platform book\'s annotations', async () => {
    const res = await api(a7, `/student/sim/books/${f.platformBookId}/annotations`);
    expect(res.status).toBe(404);
  });

  it('a Class 7 student gets 404 requesting a signed PDF URL for a Class 9 book', async () => {
    const res = await api(a7, `/student/sim/books/${f.platformBookId}/pdf-url`);
    expect(res.status).toBe(404);
  });
});

describe('sim isolation — cross-school denial', () => {
  it('a same-class student at a different school gets 404 reading the other school\'s own upload', async () => {
    const res = await api(b9, `/student/sim/books/${f.schoolABookId}/annotations`);
    expect(res.status).toBe(404);
  });

  it('a same-class student at a different school gets 404 requesting a signed URL for it', async () => {
    const res = await api(b9, `/student/sim/books/${f.schoolABookId}/pdf-url`);
    expect(res.status).toBe(404);
  });

  it('but the same student CAN still read the platform-wide book (school_id IS NULL)', async () => {
    const res = await api(b9, `/student/sim/books/${f.platformBookId}/annotations`);
    expect(res.status).toBe(200);
  });
});
