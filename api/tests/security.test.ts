import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { login, api, rest, isDenied, type Actor } from './helpers.js';
import { provisionFixtures, teardownFixtures, admin, type Fixtures } from './fixtures.js';

/**
 * SECURITY REGRESSION SUITE
 *
 * Every test here corresponds to a vulnerability that was REAL in this
 * codebase and was demonstrated working before being fixed. They are not
 * hypothetical hardening checks — each one is a door that was open.
 *
 * If any of these fail, a previously-fixed hole has been reopened. They
 * should be a merge gate.
 *
 * The suite provisions its own schools, roles and data (see fixtures.ts) so it
 * runs against a database built from migrations alone. It previously logged in
 * as whatever accounts happened to exist on a developer machine, which meant it
 * could not run in CI and quietly skipped assertions when the seed data did not
 * line up.
 *
 * Requires the stack running (Supabase + api on :4000). Run: npm run test:security
 */

let f: Fixtures;
let superAdmin: Actor;
let schoolAdmin: Actor;
let teacher: Actor;
let student: Actor;
/** A student in School A that `teacher` does NOT teach. */
let untaughtStudent: Actor;

beforeAll(async () => {
  f = await provisionFixtures();
  superAdmin = await login(f.superAdmin.email, f.superAdmin.password);
  schoolAdmin = await login(f.schoolAdminA.email, f.schoolAdminA.password);
  teacher = await login(f.teacherA.email, f.teacherA.password);
  student = await login(f.studentA1.email, f.studentA1.password);
  untaughtStudent = await login(f.studentA2.email, f.studentA2.password);
});

afterAll(async () => {
  if (f) await teardownFixtures(f);
});

describe('privilege escalation', () => {
  it('school admin CANNOT promote themselves to super_admin', async () => {
    // The original bug: user_profiles had a FOR ALL policy scoped only by
    // school_id, so this exact request returned the updated row with
    // role='super_admin' and the caller got a super-admin JWT on next login.
    const res = await rest(schoolAdmin, `/user_profiles?id=eq.${schoolAdmin.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ role: 'super_admin' }),
    });
    expect(await isDenied(res)).toBe(true);

    // And the row must genuinely still say school_admin.
    const check = await api(schoolAdmin, '/auth/me');
    expect(((await check.json()) as { role: string }).role).toBe('school_admin');
  });

  it('school admin CANNOT move themselves into another school', async () => {
    const res = await rest(schoolAdmin, `/user_profiles?id=eq.${schoolAdmin.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ school_id: f.schoolBId }),
    });
    expect(await isDenied(res)).toBe(true);
  });

  it('student CANNOT award themselves XP', async () => {
    const res = await rest(student, `/student_profiles?user_id=eq.${student.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ xp: 999999 }),
    });
    expect(await isDenied(res)).toBe(true);
  });

  it('student CANNOT promote themselves to teacher', async () => {
    const res = await rest(student, `/user_profiles?id=eq.${student.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ role: 'teacher' }),
    });
    expect(await isDenied(res)).toBe(true);

    const check = await api(student, '/auth/me');
    expect(((await check.json()) as { role: string }).role).toBe('student');
  });
});

describe('exam integrity — direct write bypass', () => {
  it('student CANNOT start a submission for an unassigned exam', async () => {
    // Bug: exam_submissions_student_start allowed INSERT whenever
    // student_id = auth.uid(), proving nothing about assignment.
    const res = await rest(student, '/exam_submissions', {
      method: 'POST',
      body: JSON.stringify({
        exam_id: '00000000-0000-0000-0000-000000000000',
        student_id: student.id,
      }),
    });
    expect(await isDenied(res)).toBe(true);
  });

  it('student CANNOT write an answer directly, bypassing deadline + ownership', async () => {
    // This is the one that made the application-layer deadline and
    // question-ownership checks worthless.
    const res = await rest(student, '/exam_answers', {
      method: 'POST',
      body: JSON.stringify({
        exam_submission_id: '00000000-0000-0000-0000-000000000000',
        question_id: '00000000-0000-0000-0000-000000000000',
      }),
    });
    expect(await isDenied(res)).toBe(true);
  });

  it('teacher CANNOT create an exam directly, skipping API validation', async () => {
    const res = await rest(teacher, '/exams', {
      method: 'POST',
      body: JSON.stringify({
        title: 'ZZ regression probe',
        class_num: 6,
        subject: 'English',
        school_id: teacher.schoolId,
      }),
    });
    expect(await isDenied(res)).toBe(true);
  });

  it('student CANNOT forge a live session', async () => {
    // live_sessions_school_scope was FOR ALL with NO role check, so a student
    // could start fake sessions or end their teacher's class mid-lesson.
    const res = await rest(student, '/live_sessions', {
      method: 'POST',
      body: JSON.stringify({
        school_id: student.schoolId,
        teacher_id: teacher.id,
        class_num: 6,
        section: 'A',
      }),
    });
    expect(await isDenied(res)).toBe(true);
  });

  it('student CANNOT fabricate a task completion', async () => {
    const res = await rest(student, '/task_assignments', {
      method: 'POST',
      body: JSON.stringify({
        task_id: '00000000-0000-0000-0000-000000000000',
        student_id: student.id,
        status: 'completed',
      }),
    });
    expect(await isDenied(res)).toBe(true);
  });
});

describe('cross-tenant and cross-student scoping', () => {
  it('teacher CANNOT assign an exam to students outside their sections', async () => {
    // resolveAssignments() mode:'students' passed client ids straight through.
    const draft = await api(teacher, '/teacher/exams', {
      method: 'POST',
      body: JSON.stringify({ title: 'ZZ regression probe', subject: 'English', classNum: 6, durationMin: 10 }),
    });
    expect(draft.ok).toBe(true);
    const exam = (await draft.json()) as { id: string };

    await api(teacher, `/teacher/exams/${exam.id}/questions`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'mcq',
        text: 'probe',
        options: [{ id: 'a', text: 'x', isCorrect: true }],
        marks: 1,
        aiScoring: false,
      }),
    });

    // A student in the same school and class the teacher does NOT teach.
    const res = await api(teacher, `/teacher/exams/${exam.id}/publish`, {
      method: 'POST',
      body: JSON.stringify({
        assignTo: { mode: 'students', studentIds: [untaughtStudent.id] },
        randomizeQuestions: true,
        shuffleOptions: true,
        autoSubmitOnSwitch: true,
        switchLimit: 3,
      }),
    });
    expect(res.status).toBe(403);

    // Clean up the probe draft.
    await api(teacher, `/teacher/exams/${exam.id}`, { method: 'DELETE' }).catch(() => {});
  });

  it("student CANNOT read another student's AI tutor chats", async () => {
    const res = await rest(student, '/chat_sessions?select=student_id');
    const rows = (await res.json()) as { student_id: string }[];
    const foreign = Array.isArray(rows) ? rows.filter((r) => r.student_id !== student.id) : [];
    expect(foreign).toHaveLength(0);
  });

  it("student CANNOT read other students' English assessment attempts", async () => {
    const res = await rest(student, '/english_assessment_attempts?select=student_id');
    const rows = (await res.json()) as { student_id: string }[];
    const foreign = Array.isArray(rows) ? rows.filter((r) => r.student_id !== student.id) : [];
    expect(foreign).toHaveLength(0);
  });
});

describe('entitlements', () => {
  it('school admin CANNOT grant their school a feature they did not buy', async () => {
    // class_features was School-Admin-writable, so a school could switch on
    // the AI tutor without paying for it. The fixture school is on Starter,
    // which does not include ai_tutor — so this must be refused.
    const before = await api(schoolAdmin, '/school-admin/features');
    const rows = (await before.json()) as { classNum: number; aiChatEntitled: boolean }[];
    const unentitled = rows.find((r) => !r.aiChatEntitled);
    // The fixture school is deliberately on a limited package, so there MUST be
    // an unentitled class here. If there is not, the fixture is wrong and this
    // test would otherwise pass by skipping.
    expect(unentitled, 'fixture school should not be entitled to ai_tutor').toBeDefined();

    const res = await api(schoolAdmin, '/school-admin/features', {
      method: 'POST',
      body: JSON.stringify({
        classNum: unentitled!.classNum,
        aiChatEnabled: true,
        leaderboardEnabled: true,
      }),
    });
    expect(res.status).toBe(403);
  });

  it('school admin CANNOT grant entitlements directly in the database', async () => {
    const res = await rest(schoolAdmin, '/school_entitlements', {
      method: 'POST',
      body: JSON.stringify({ school_id: f.schoolAId, feature_key: 'ai_tutor', enabled: true }),
    });
    expect(await isDenied(res)).toBe(true);
  });

  it('a student on a Starter school cannot reach an AI tutor route', async () => {
    const res = await api(student, '/student/chat/sessions');
    expect([402, 403]).toContain(res.status);
  });
});

describe('session revocation', () => {
  // This existed and did nothing. revokeUserSessions() called
  // auth.admin.signOut(userId), but that method takes a JWT — every call
  // failed with "invalid JWT" and the helper logged it and carried on.
  // Credential resets still appeared to work because GoTrue drops sessions
  // itself on a password change; deactivation and school suspension, which
  // change no password, revoked nothing at all. Nothing detected it for weeks.
  it('revoking a user kills their refresh token', async () => {
    const sb = admin();
    const url = process.env.SUPABASE_URL!;
    const anon = process.env.SUPABASE_ANON_KEY!;

    const pub = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: signIn, error: signInError } = await pub.auth.signInWithPassword({
      email: f.studentA2.email,
      password: f.studentA2.password,
    });
    expect(signInError).toBeNull();
    const refreshToken = signIn.session!.refresh_token;

    // Control: the token works before revocation. Without this the assertion
    // below could pass against a token that was never valid.
    const before = await pub.auth.refreshSession({ refresh_token: refreshToken });
    expect(before.error, 'refresh should work before revocation').toBeNull();
    const rotated = before.data.session!.refresh_token;

    const { error: rpcError } = await sb.rpc('revoke_user_sessions', { p_user_id: f.studentA2.id });
    expect(rpcError).toBeNull();

    const after = await pub.auth.refreshSession({ refresh_token: rotated });
    expect(after.error, 'refresh MUST be rejected after revocation').not.toBeNull();
  });
});

describe('super admin is not gated by customer packages', () => {
  it('super admin reaches the platform overview', async () => {
    const res = await api(superAdmin, '/super-admin/overview');
    expect(res.status).toBe(200);
  });
});

describe('legitimate access still works (no over-blocking)', () => {
  const cases: [string, () => Actor, string][] = [
    ['student exams', () => student, '/student/exams'],
    ['student tasks', () => student, '/student/tasks'],
    ['teacher dashboard', () => teacher, '/teacher/dashboard'],
    ['teacher exams', () => teacher, '/teacher/exams'],
    ['school admin students', () => schoolAdmin, '/school-admin/students'],
  ];

  it.each(cases)('%s returns 200', async (_name, actor, path) => {
    const res = await api(actor(), path);
    expect(res.status).toBe(200);
  });
});
