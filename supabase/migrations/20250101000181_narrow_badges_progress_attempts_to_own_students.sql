-- student_badges/subject_progress/game_attempts teacher-read policies
-- (fixed for the missing role check in 20250101000180) still scoped to
-- "any teacher at the same school," the same whole-school boundary that
-- 20250101000164 already identified and narrowed for the platform's most
-- sensitive per-student data (AI tutor chats, spoken-English assessments):
-- a Class 2 teacher could read every Class 10 student's badges/progress/
-- game history. Reusing that migration's students_taught_by() helper for
-- consistency — a teacher should only see their own students here too.

drop policy if exists student_badges_teacher_read on student_badges;
drop policy if exists subject_progress_teacher_read on subject_progress;
drop policy if exists game_attempts_teacher_read on game_attempts;

create policy student_badges_teacher_read on student_badges
  for select using (
    jwt_role() = 'teacher'
    and student_id in (select student_id from students_taught_by(auth.uid()))
  );

create policy subject_progress_teacher_read on subject_progress
  for select using (
    jwt_role() = 'teacher'
    and student_id in (select student_id from students_taught_by(auth.uid()))
  );

create policy game_attempts_teacher_read on game_attempts
  for select using (
    jwt_role() = 'teacher'
    and student_id in (select student_id from students_taught_by(auth.uid()))
  );

-- School Admins keep school-wide access, matching the same tier the
-- AI-chat/English-assessment policies grant them (school-wide data
-- controller), and matching what the Node API's own reporting endpoints
-- already do via the service-role key.
create policy student_badges_school_admin_read on student_badges
  for select using (
    jwt_role() = 'school_admin'
    and student_id in (select id from user_profiles where school_id = jwt_school_id())
  );

create policy subject_progress_school_admin_read on subject_progress
  for select using (
    jwt_role() = 'school_admin'
    and student_id in (select id from user_profiles where school_id = jwt_school_id())
  );

create policy game_attempts_school_admin_read on game_attempts
  for select using (
    jwt_role() = 'school_admin'
    and student_id in (select id from user_profiles where school_id = jwt_school_id())
  );
