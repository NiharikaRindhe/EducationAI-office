-- ═════════════════════════════════════════════════════════════
--  P0 SECURITY — cross-student read on English assessments
--
--  `english_attempts_teacher_read` is named for teachers but never
--  checks the caller's role:
--
--      using (student_id in (
--        select id from user_profiles
--        where school_id = jwt_school_id()))
--
--  Any authenticated user whose JWT carries the school's id
--  satisfies that — including a STUDENT. So every child in a
--  school could read every other child's assessment attempts and
--  scores by querying PostgREST directly.
--
--  Every other per-student read policy in the schema pairs the
--  school predicate with an explicit jwt_role() check; this one
--  was simply missed.
--
--  NOTE: this restores the intended teacher-only boundary. It does
--  NOT yet narrow teachers to the sections they personally teach —
--  a teacher can still read any student in their own school. That
--  refinement needs a teaching_assignments join and is tracked
--  separately; this migration fixes the defect where a student
--  could read peers.
-- ═════════════════════════════════════════════════════════════

drop policy if exists english_attempts_teacher_read on english_assessment_attempts;

create policy english_attempts_teacher_read on english_assessment_attempts
  for select using (
    jwt_role() = 'teacher'
    and student_id in (select id from user_profiles where school_id = jwt_school_id())
  );

-- School Admins legitimately need this for their own school's reports;
-- previously they were relying on the same over-broad policy.
create policy english_attempts_school_admin_read on english_assessment_attempts
  for select using (
    jwt_role() = 'school_admin'
    and student_id in (select id from user_profiles where school_id = jwt_school_id())
  );
