import { describe, it, expect, beforeAll } from 'vitest';
import { login, api, rest, isDenied, type Actor } from './helpers.js';

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
 * Requires the local stack running (docker + api on :4000) and the seeded
 * demo school. Run: npm run test:security
 */

let superAdmin: Actor;
let schoolAdmin: Actor;
let teacher: Actor;
let student: Actor;

beforeAll(async () => {
  superAdmin = await login('admin@eduai.local', 'SmokeTest123!');
  schoolAdmin = await login('e2e-admin@eduai.local', 'Test-Admin-1');
  teacher = await login('mr.rao.5d2a15@sps.delhi.01.eduai.local', 'SmokeTest123!');
  student = await login('yash.badgujar.3f2176@sps.delhi.01.eduai.local', 'reXHdrWD');
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

  it('student CANNOT award themselves XP', async () => {
    const res = await rest(student, `/student_profiles?user_id=eq.${student.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ xp: 999999 }),
    });
    expect(await isDenied(res)).toBe(true);
  });
});

describe('exam integrity — direct write bypass', () => {
  it('student CANNOT start a submission for an unassigned exam', async () => {
    // Bug: exam_submissions_student_start allowed INSERT whenever
    // student_id = auth.uid(), proving nothing about assignment.
    const anyExam = await rest(student, '/exams?select=id&limit=1');
    const exams = (await anyExam.json()) as { id: string }[];
    if (exams.length === 0) return; // nothing to target in this dataset

    const res = await rest(student, '/exam_submissions', {
      method: 'POST',
      body: JSON.stringify({ exam_id: exams[0]!.id, student_id: student.id }),
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
        title: 'regression probe',
        class_num: 9,
        subject: 'Science',
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
        class_num: 9,
        section: 'A',
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
      body: JSON.stringify({ title: 'ZZ regression probe', subject: 'English', classNum: 2, durationMin: 10 }),
    });
    if (!draft.ok) return;
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

    // A student the teacher does not teach.
    const res = await api(teacher, `/teacher/exams/${exam.id}/publish`, {
      method: 'POST',
      body: JSON.stringify({
        assignTo: { mode: 'students', studentIds: [student.id] },
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
    // the AI tutor without paying for it.
    const before = await api(schoolAdmin, '/school-admin/features');
    const rows = (await before.json()) as { classNum: number; aiChatEntitled: boolean }[];
    const unentitled = rows.find((r) => !r.aiChatEntitled);
    if (!unentitled) return; // this school is fully entitled — nothing to prove here

    const res = await api(schoolAdmin, '/school-admin/features', {
      method: 'POST',
      body: JSON.stringify({
        classNum: unentitled.classNum,
        aiChatEnabled: true,
        leaderboardEnabled: true,
      }),
    });
    expect(res.status).toBe(403);
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
