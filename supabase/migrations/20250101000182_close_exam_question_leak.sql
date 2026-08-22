-- ═════════════════════════════════════════════════════════════
--  P0 EXAM INTEGRITY — questions_via_exam_school_scope let ANY
--  authenticated user in a school (any role, any class, no
--  assignment check) read the `questions` table directly — full
--  question text AND the `correct_answer` column, for EVERY exam
--  in the school regardless of status, including still-being-written
--  'draft' exams and exams for other classes the reader was never
--  assigned. exams_school_scope_read had the matching gap one level
--  up (draft exams, any class, visible school-wide).
--
--  The real student-facing exam flow never needed this: the API's
--  /student/exams/:id/paper endpoint already builds a sanitized paper
--  (correct_answer stripped, see examTaking.service.ts) via the
--  service-role key, which bypasses RLS entirely. So the broad
--  `questions` read policy had no legitimate caller and was pure
--  exposure — a technically inclined student could pull answer keys
--  for any exam in the school, published or not, straight from
--  PostgREST with nothing but their own login. Row-level security
--  also can't hide just the correct_answer column for an in-progress
--  exam even if scoped "correctly," so students get NO direct RLS
--  read access to `questions` at all — only through the sanitizing
--  API path, same as before this migration, just now actually enforced.
-- ═════════════════════════════════════════════════════════════

drop policy if exists questions_via_exam_school_scope on questions;
-- questions_teacher_manage_own_exam / questions_teacher_read_own_exam
-- (ownership via exams.created_by = auth.uid()) already cover the
-- teacher's own exams and are unaffected by this migration.

drop policy if exists exams_school_scope_read on exams;

-- Teachers/School Admins keep school-wide visibility of exam metadata
-- (title/subject/timing/status, no answer keys live on this table) —
-- used for staff-side scheduling/oversight views.
create policy exams_staff_school_read on exams
  for select using (
    jwt_role() in ('teacher', 'school_admin')
    and school_id = jwt_school_id()
  );

-- Students only ever see a published/closed exam they were actually
-- assigned, mirroring exactly what the sanitizing API endpoint already
-- gates on — a draft exam, or one for a different class/section they
-- have no exam_assignments row for, is invisible even via direct query.
create policy exams_student_assigned_read on exams
  for select using (
    jwt_role() = 'student'
    and status <> 'draft'
    and id in (select exam_id from exam_assignments where student_id = auth.uid())
  );

-- Same class of gap, smaller blast radius: proctoring_settings_student_read
-- exposed any exam's proctoring config (switch limits etc.) school-wide with
-- no role/status/assignment check. Not an answer-key leak, but the same
-- fix shape — narrowed to match exams_student_assigned_read exactly.
drop policy if exists proctoring_settings_student_read on proctoring_settings;
create policy proctoring_settings_student_read on proctoring_settings
  for select using (
    jwt_role() = 'student'
    and exam_id in (
      select id from exams
      where status <> 'draft' and id in (select exam_id from exam_assignments where student_id = auth.uid())
    )
  );

-- question_bank_global_read / question_bank_school_read had no role check
-- at all — a student could browse the entire question bank (global AND
-- their school's teacher-authored bank) directly, correct_answer column
-- included, for questions that haven't even been placed in an exam yet.
-- This table is a pure authoring tool (feeds exams via examGenerator /
-- the exam builder); nothing in the student-facing app reads it, and
-- nothing should — students get exam content exclusively through the
-- sanitized questions the API serves at exam time.
drop policy if exists question_bank_global_read on question_bank;
create policy question_bank_global_read on question_bank
  for select using (scope = 'global' and jwt_role() in ('teacher', 'school_admin', 'super_admin'));

drop policy if exists question_bank_school_read on question_bank;
create policy question_bank_school_read on question_bank
  for select using (
    scope = 'school' and school_id = jwt_school_id()
    and jwt_role() in ('teacher', 'school_admin')
  );
