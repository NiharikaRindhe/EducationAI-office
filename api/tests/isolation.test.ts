import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { login, rest, isDenied, type Actor } from './helpers.js';
import { provisionFixtures, teardownFixtures, type Fixtures } from './fixtures.js';

/**
 * TENANT AND STUDENT ISOLATION
 *
 * Complements security.test.ts. That suite proves specific vulnerabilities
 * stay closed; this one proves the read matrix the audit asked for:
 *
 *   School A cannot read School B
 *   Student A1 cannot read Student A2
 *   Teacher cannot read a section they do not teach
 *
 * Crucially these run against rows this suite creates itself. The earlier
 * version of the English-attempts check passed only because the table was
 * empty — an empty result set is indistinguishable from a working policy, so
 * it proved nothing. Every assertion below runs against a row that exists and
 * that some OTHER actor can legitimately see, which is what makes a denial
 * meaningful.
 */

let f: Fixtures;
let a1: Actor;
let a2: Actor;
let b1: Actor;
let teacher: Actor;

beforeAll(async () => {
  f = await provisionFixtures();
  a1 = await login(f.studentA1.email, f.studentA1.password);
  a2 = await login(f.studentA2.email, f.studentA2.password);
  b1 = await login(f.studentB1.email, f.studentB1.password);
  teacher = await login(f.teacherA.email, f.teacherA.password);
});

afterAll(async () => {
  if (f) await teardownFixtures(f);
});

/** Ids visible to `actor` at `path`, as a Set. */
async function visibleIds(actor: Actor, path: string): Promise<Set<string>> {
  const res = await rest(actor, path);
  const rows = (await res.json()) as { id: string }[];
  return new Set(Array.isArray(rows) ? rows.map((r) => r.id) : []);
}

describe('fixture sanity — the rows we assert on really exist', () => {
  // Without this, every "cannot see" test below could pass against an empty
  // table and tell us nothing. This is the control.
  it('each student can see their OWN english attempt', async () => {
    expect(await visibleIds(a1, '/english_assessment_attempts?select=id')).toContain(f.attemptIdA1);
    expect(await visibleIds(a2, '/english_assessment_attempts?select=id')).toContain(f.attemptIdA2);
    expect(await visibleIds(b1, '/english_assessment_attempts?select=id')).toContain(f.attemptIdB1);
  });

  it('each student can see their OWN chat session', async () => {
    expect(await visibleIds(a1, '/chat_sessions?select=id')).toContain(f.chatIdA1);
    expect(await visibleIds(b1, '/chat_sessions?select=id')).toContain(f.chatIdB1);
  });
});

describe('student A cannot reach student B', () => {
  it("A1 cannot read A2's english attempt (same school, same class)", async () => {
    const visible = await visibleIds(a1, '/english_assessment_attempts?select=id');
    expect(visible.has(f.attemptIdA2)).toBe(false);
  });

  it("A1 cannot read A2's chat session", async () => {
    const visible = await visibleIds(a1, '/chat_sessions?select=id');
    expect(visible.has(f.chatIdA2)).toBe(false);
  });

  it("A1 cannot fetch A2's attempt even when naming its id directly", async () => {
    const res = await rest(a1, `/english_assessment_attempts?select=id&id=eq.${f.attemptIdA2}`);
    const rows = (await res.json()) as unknown[];
    expect(Array.isArray(rows) ? rows : []).toHaveLength(0);
  });

  it("A1 cannot read A2's student profile row", async () => {
    const res = await rest(a1, `/student_profiles?select=user_id,xp&user_id=eq.${f.studentA2.id}`);
    const rows = (await res.json()) as unknown[];
    expect(Array.isArray(rows) ? rows : []).toHaveLength(0);
  });
});

describe('school A cannot reach school B', () => {
  it('a School A student sees no School B attempts', async () => {
    const visible = await visibleIds(a1, '/english_assessment_attempts?select=id');
    expect(visible.has(f.attemptIdB1)).toBe(false);
  });

  it('a School A teacher sees no School B chat sessions', async () => {
    const visible = await visibleIds(teacher, '/chat_sessions?select=id');
    expect(visible.has(f.chatIdB1)).toBe(false);
  });

  it('a School A teacher cannot enumerate School B students', async () => {
    const res = await rest(teacher, `/user_profiles?select=id&school_id=eq.${f.schoolBId}`);
    const rows = (await res.json()) as unknown[];
    expect(Array.isArray(rows) ? rows : []).toHaveLength(0);
  });

  it('a School A teacher cannot read the School B school row', async () => {
    const res = await rest(teacher, `/schools?select=id,name&id=eq.${f.schoolBId}`);
    const rows = (await res.json()) as unknown[];
    expect(Array.isArray(rows) ? rows : []).toHaveLength(0);
  });

  it('a School A teacher cannot WRITE into School B', async () => {
    const res = await rest(teacher, '/class_sections', {
      method: 'POST',
      body: JSON.stringify({ school_id: f.schoolBId, class_num: 9, section_label: 'Z' }),
    });
    expect(await isDenied(res)).toBe(true);
  });
});

describe('teacher is limited to sections they actually teach', () => {
  // The teacher is assigned to 6A (student A1) and NOT 6B (student A2). Both
  // students are in the same school, so a school-scoped policy would let both
  // through — that was the original bug.
  it("teacher CAN read the taught student's english attempt", async () => {
    const visible = await visibleIds(teacher, '/english_assessment_attempts?select=id');
    expect(visible.has(f.attemptIdA1)).toBe(true);
  });

  it("teacher CANNOT read the untaught student's english attempt", async () => {
    const visible = await visibleIds(teacher, '/english_assessment_attempts?select=id');
    expect(visible.has(f.attemptIdA2)).toBe(false);
  });

  it("teacher CAN read the taught student's chat session", async () => {
    const visible = await visibleIds(teacher, '/chat_sessions?select=id');
    expect(visible.has(f.chatIdA1)).toBe(true);
  });

  it("teacher CANNOT read the untaught student's chat session", async () => {
    const visible = await visibleIds(teacher, '/chat_sessions?select=id');
    expect(visible.has(f.chatIdA2)).toBe(false);
  });
});

describe('anonymous users cannot enumerate anything', () => {
  const anon: Actor = { token: '', id: '', role: 'anon', schoolId: null };

  it.each([
    ['schools', '/schools?select=id,name'],
    ['user profiles', '/user_profiles?select=id,full_name'],
    ['student profiles', '/student_profiles?select=user_id'],
    ['english attempts', '/english_assessment_attempts?select=id'],
    ['chat sessions', '/chat_sessions?select=id'],
  ])('anonymous read of %s returns nothing', async (_name, path) => {
    const res = await rest(anon, path);
    const body = await res.text();
    let rows: unknown[] = [];
    try {
      const parsed = JSON.parse(body);
      rows = Array.isArray(parsed) ? parsed : [];
    } catch {
      rows = [];
    }
    expect(rows).toHaveLength(0);
  });
});
