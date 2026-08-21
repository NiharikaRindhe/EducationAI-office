-- student_badges_teacher_read, subject_progress_teacher_read, and
-- game_attempts_teacher_read only ever checked school_id, never the
-- requesting user's role — despite their names, any authenticated
-- same-school user (including another student) could read every
-- classmate's badges, subject progress, and game attempts directly via
-- PostgREST. Students already have their own separate "_own_read"
-- policies (student_badges_own_read, subject_progress_student_own_read,
-- game_attempts_student_own_read), which are unaffected by this change —
-- Postgres RLS combines multiple permissive policies for the same
-- command with OR, so tightening these teacher policies to actually
-- require jwt_role() = 'teacher' only removes the accidental
-- any-same-school-user access, not a student's own-row access.
-- School Admin's aggregate reporting already goes through the Node API's
-- service-role key, which bypasses RLS entirely, so it needs no policy here.

drop policy if exists student_badges_teacher_read on student_badges;
drop policy if exists subject_progress_teacher_read on subject_progress;
drop policy if exists game_attempts_teacher_read on game_attempts;

create policy student_badges_teacher_read on student_badges
  for select using (
    jwt_role() = 'teacher'
    and student_id in (
      select user_id from student_profiles
      where user_id in (select id from user_profiles where school_id = jwt_school_id())
    )
  );

create policy subject_progress_teacher_read on subject_progress
  for select using (
    jwt_role() = 'teacher'
    and student_id in (select id from user_profiles where school_id = jwt_school_id())
  );

create policy game_attempts_teacher_read on game_attempts
  for select using (
    jwt_role() = 'teacher'
    and student_id in (select id from user_profiles where school_id = jwt_school_id())
  );
