-- ═════════════════════════════════════════════════════════════
--  P0 PRIVACY — narrow teacher reads to their own students
--
--  Teacher read policies on the most sensitive per-student data —
--  AI tutor conversations and spoken-English assessments — were
--  scoped to the whole SCHOOL:
--
--      jwt_role() = 'teacher'
--      and student_id in (select id from user_profiles
--                         where school_id = jwt_school_id())
--
--  So a Class 2 art teacher could read every Class 10 student's
--  private AI tutor history. Children ask a tutor things they
--  would not say to staff; "any teacher in the building" is the
--  wrong boundary for that.
--
--  Narrowed to students in sections the teacher is actually
--  assigned to teach, plus their own class-teacher sections.
--
--  School Admins keep school-wide access — they are the school's
--  own data controller and already hold the student directory.
-- ═════════════════════════════════════════════════════════════

-- Students the calling teacher is responsible for: anyone enrolled in a
-- section they teach a subject in, or are the class teacher of.
create or replace function students_taught_by(p_teacher_id uuid)
returns table (student_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select up.id
  from user_profiles up
  join student_profiles sp on sp.user_id = up.id
  join class_sections cs
    on cs.school_id = up.school_id
   and cs.class_num = sp.class_num
   and cs.section_label = sp.section
  where up.role = 'student'
    and (
      cs.class_teacher_id = p_teacher_id
      or exists (
        select 1 from teaching_assignments ta
        where ta.class_section_id = cs.id
          and ta.teacher_id = p_teacher_id
      )
    );
$$;

grant execute on function students_taught_by(uuid) to authenticated, service_role;

-- ─── AI tutor conversations ──────────────────────────────────
drop policy if exists chat_sessions_teacher_read on chat_sessions;
create policy chat_sessions_teacher_read on chat_sessions
  for select using (
    jwt_role() = 'teacher'
    and student_id in (select student_id from students_taught_by(auth.uid()))
  );

drop policy if exists chat_messages_teacher_read on chat_messages;
create policy chat_messages_teacher_read on chat_messages
  for select using (
    jwt_role() = 'teacher'
    and session_id in (
      select cs.id from chat_sessions cs
      where cs.student_id in (select student_id from students_taught_by(auth.uid()))
    )
  );

-- School Admins retain school-wide visibility for safeguarding review.
create policy chat_sessions_school_admin_read on chat_sessions
  for select using (
    jwt_role() = 'school_admin'
    and student_id in (select id from user_profiles where school_id = jwt_school_id())
  );

create policy chat_messages_school_admin_read on chat_messages
  for select using (
    jwt_role() = 'school_admin'
    and session_id in (
      select cs.id from chat_sessions cs
      join user_profiles up on up.id = cs.student_id
      where up.school_id = jwt_school_id()
    )
  );

-- ─── Spoken-English assessments ──────────────────────────────
drop policy if exists english_attempts_teacher_read on english_assessment_attempts;
create policy english_attempts_teacher_read on english_assessment_attempts
  for select using (
    jwt_role() = 'teacher'
    and student_id in (select student_id from students_taught_by(auth.uid()))
  );
