/**
 * Creates a fixed-credential local test roster: one teacher and one student
 * per class 1-10 under an existing school (classes 1-4 log in by PIN,
 * matching the CLASS 1-4 (PIN) login tab; classes 5-10 by email/password).
 * Companion to seedSuperAdmin.ts / seedSchoolAdmin.ts — together the four
 * scripts give you all the role logins needed to test every portal without
 * random per-run passwords getting in the way.
 *
 * LOCAL DEV ONLY. Credentials below are intentionally fixed and public in
 * this file — never point this script at a staging/production Supabase
 * project.
 *
 * Idempotent: if an account with a given email already exists, it is left
 * untouched (including its password) and the script just reports it —
 * reruns never rotate credentials out from under an in-progress test pass.
 *
 * Usage: npm run seed:test-roster -- --school-code DEMO-2024
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { currentAcademicYear } from '../src/lib/academicYear.js';

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const TEACHER = { email: 'teacher@demo.eduai.local', password: 'Teacher-Test-1', fullName: 'Test Teacher' };

const STUDENTS = [
  { classNum: 1, section: 'A', email: 'student1@demo.eduai.local', pin: '1111', fullName: 'Test Student 1A' },
  { classNum: 2, section: 'A', email: 'student2@demo.eduai.local', pin: '2222', fullName: 'Test Student 2A' },
  { classNum: 3, section: 'A', email: 'student3@demo.eduai.local', pin: '3333', fullName: 'Test Student 3A' },
  { classNum: 4, section: 'A', email: 'student4@demo.eduai.local', pin: '4444', fullName: 'Test Student 4A' },
  {
    classNum: 5,
    section: 'A',
    email: 'student5@demo.eduai.local',
    password: 'Student5-Test-1',
    fullName: 'Test Student 5A',
  },
  {
    classNum: 6,
    section: 'A',
    email: 'student6@demo.eduai.local',
    password: 'Student6-Test-1',
    fullName: 'Test Student 6A',
  },
  {
    classNum: 7,
    section: 'A',
    email: 'student7@demo.eduai.local',
    password: 'Student7-Test-1',
    fullName: 'Test Student 7A',
  },
  {
    classNum: 8,
    section: 'A',
    email: 'student8@demo.eduai.local',
    password: 'Student8-Test-1',
    fullName: 'Test Student 8A',
  },
  {
    classNum: 9,
    section: 'A',
    email: 'student9@demo.eduai.local',
    password: 'Student9-Test-1',
    fullName: 'Test Student 9A',
  },
  {
    classNum: 10,
    section: 'A',
    email: 'student10@demo.eduai.local',
    password: 'Student10-Test-1',
    fullName: 'Test Student 10A',
  },
] as const;

const TEACHING_SUBJECT = 'Mathematics'; // whitelisted for every class 1-10 alike

async function main() {
  const schoolCode = arg('school-code') ?? 'DEMO-2024';

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY not set');

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('id, name')
    .eq('code', schoolCode)
    .single();
  if (schoolError || !school) throw new Error(`School not found for code ${schoolCode} — apply supabase/seed.sql first`);
  const schoolId = school.id as string;

  async function findAuthUserByEmail(email: string) {
    // GoTrue's admin listUsers has no server-side email filter on this
    // supabase-js version; the local roster is tiny so a single page works.
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw new Error(`Failed to list auth users: ${error.message}`);
    return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
  }

  async function ensureSection(classNum: number, sectionLabel: string): Promise<string> {
    const currentYear = currentAcademicYear();

    await supabase.from('class_sections').upsert(
      { school_id: schoolId, academic_year: currentYear, class_num: classNum, section_label: sectionLabel },
      { onConflict: 'school_id,academic_year,class_num,section_label', ignoreDuplicates: true },
    );
    const { data, error } = await supabase
      .from('class_sections')
      .select('id')
      .eq('school_id', schoolId)
      .eq('academic_year', currentYear)
      .eq('class_num', classNum)
      .eq('section_label', sectionLabel)
      .single();
    if (error || !data) throw new Error(`Failed to resolve section ${classNum}-${sectionLabel}: ${error?.message}`);
    return data.id as string;
  }

  // ─── Teacher ───
  let teacherId: string;
  const existingTeacher = await findAuthUserByEmail(TEACHER.email);
  if (existingTeacher) {
    console.log(`Teacher already exists, leaving password untouched: ${TEACHER.email}`);
    teacherId = existingTeacher.id;
  } else {
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: TEACHER.email,
      password: TEACHER.password,
      email_confirm: true,
    });
    if (authError || !authUser.user) throw new Error(`Failed to create teacher auth user: ${authError?.message}`);
    teacherId = authUser.user.id;

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({ id: teacherId, school_id: schoolId, role: 'teacher', full_name: TEACHER.fullName });
    if (profileError) throw new Error(`Failed to create teacher profile: ${profileError.message}`);

    const { error: teacherProfileError } = await supabase
      .from('teacher_profiles')
      .insert({ user_id: teacherId, classes_taught: STUDENTS.map((s) => s.classNum) });
    if (teacherProfileError) throw new Error(`Failed to create teacher_profiles row: ${teacherProfileError.message}`);

    console.log(`Teacher created: ${TEACHER.email} / ${TEACHER.password}`);
  }

  // Teaching assignments — one per student's section, so the teacher sees
  // all three test students in dashboards/rosters/tasks/exams.
  for (const s of STUDENTS) {
    const sectionId = await ensureSection(s.classNum, s.section);
    await supabase
      .from('teaching_assignments')
      .upsert(
        { school_id: schoolId, teacher_id: teacherId, class_section_id: sectionId, subject: TEACHING_SUBJECT },
        { onConflict: 'teacher_id,class_section_id,subject', ignoreDuplicates: true },
      );
  }

  // ─── Students ───
  for (const s of STUDENTS) {
    const existing = await findAuthUserByEmail(s.email);
    if (existing) {
      console.log(`Student already exists, leaving credentials untouched: ${s.email}`);
      continue;
    }

    const isBatch1 = 'pin' in s;
    const authPassword = isBatch1 ? 'unused-batch1-' + s.pin : (s as { password: string }).password;
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: s.email,
      password: authPassword,
      email_confirm: true,
    });
    if (authError || !authUser.user) throw new Error(`Failed to create student auth user (${s.email}): ${authError?.message}`);

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({ id: authUser.user.id, school_id: schoolId, role: 'student', full_name: s.fullName });
    if (profileError) throw new Error(`Failed to create student profile (${s.email}): ${profileError.message}`);

    const pinHash = isBatch1 ? await bcrypt.hash((s as { pin: string }).pin, 10) : null;
    const { error: studentError } = await supabase.from('student_profiles').insert({
      user_id: authUser.user.id,
      class_num: s.classNum,
      section: s.section,
      avatar: '⭐',
      pin_hash: pinHash,
    });
    if (studentError) throw new Error(`Failed to create student_profiles row (${s.email}): ${studentError.message}`);

    console.log(
      isBatch1
        ? `Student created: ${s.email} / PIN ${(s as { pin: string }).pin}`
        : `Student created: ${s.email} / ${(s as { password: string }).password}`,
    );
  }

  console.log('\nDone. Fixed test credentials (unchanged on rerun):');
  console.log(`  Teacher:     ${TEACHER.email} / ${TEACHER.password}`);
  for (const s of STUDENTS) {
    console.log(
      'pin' in s
        ? `  Student ${s.classNum}${s.section}:  ${s.email} / PIN ${s.pin}`
        : `  Student ${s.classNum}${s.section}: ${s.email} / ${(s as { password: string }).password}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
