-- ═════════════════════════════════════════════════════════════
--  P0 SECURITY — remove direct-write RLS grants from end users
--
--  THE BUG
--  `user_profiles_school_admin_school` was `FOR ALL` scoped only
--  by school_id. Nothing constrained the `role` column, and a
--  `FOR ALL` policy with no WITH CHECK reuses its USING clause —
--  which reads jwt_role() (the CALLER's role from their token),
--  not the row's. So a School Admin could:
--
--      PATCH /rest/v1/user_profiles?id=eq.<self>
--      { "role": "super_admin" }
--
--  ...straight against PostgREST on :54321 with their own token,
--  and receive a super_admin JWT on their next login. Full
--  platform compromise from a customer account.
--
--  `live_sessions_school_scope` was worse in one respect: it was
--  `FOR ALL` with NO role check at all, so any student could
--  forge a live session, or end their teacher's mid-lesson.
--
--  THE FIX
--  Every write in this system already goes through the Node API
--  using the service-role key, which bypasses RLS entirely.
--  `supabaseForToken()` — the only RLS-bound client — is defined
--  and never used. So no legitimate write path depends on these
--  policies; they are attack surface only.
--
--  Non-super-admin policies therefore become SELECT-only. Reads
--  keep exactly the same scoping predicates as before, so no
--  legitimate query changes behaviour.
--
--  NOTE: this is the contained P0 fix, not the full RLS rewrite.
--  Column-level constraints, WITH CHECK clauses on the remaining
--  policies, and a tenant-isolation test suite are Phase 1.
-- ═════════════════════════════════════════════════════════════

-- ─── user_profiles — the privilege-escalation path ───────────
drop policy if exists user_profiles_school_admin_school on user_profiles;
create policy user_profiles_school_admin_read on user_profiles
  for select using (jwt_role() = 'school_admin' and school_id = jwt_school_id());

-- ─── live_sessions — no role check at all previously ─────────
drop policy if exists live_sessions_school_scope on live_sessions;
create policy live_sessions_school_read on live_sessions
  for select using (school_id = jwt_school_id());

-- ─── Profile tables (no role column, but same write exposure) ─
drop policy if exists student_profiles_school_admin_school on student_profiles;
create policy student_profiles_school_admin_read on student_profiles
  for select using (
    jwt_role() = 'school_admin'
    and user_id in (select id from user_profiles where school_id = jwt_school_id())
  );

drop policy if exists teacher_profiles_school_admin_school on teacher_profiles;
create policy teacher_profiles_school_admin_read on teacher_profiles
  for select using (
    jwt_role() = 'school_admin'
    and user_id in (select id from user_profiles where school_id = jwt_school_id())
  );

-- ─── School-admin operational tables ─────────────────────────
drop policy if exists class_features_school_admin_all on class_features;
create policy class_features_school_admin_read on class_features
  for select using (jwt_role() = 'school_admin' and school_id = jwt_school_id());

drop policy if exists class_sections_school_admin_all on class_sections;
create policy class_sections_school_admin_read on class_sections
  for select using (jwt_role() = 'school_admin' and school_id = jwt_school_id());

drop policy if exists labs_school_admin_all on labs;
create policy labs_school_admin_read on labs
  for select using (jwt_role() = 'school_admin' and school_id = jwt_school_id());

drop policy if exists teaching_assignments_school_admin_all on teaching_assignments;
create policy teaching_assignments_school_admin_read on teaching_assignments
  for select using (jwt_role() = 'school_admin' and school_id = jwt_school_id());

drop policy if exists timetable_slots_school_admin_all on timetable_slots;
create policy timetable_slots_school_admin_read on timetable_slots
  for select using (jwt_role() = 'school_admin' and school_id = jwt_school_id());

drop policy if exists timetable_exceptions_school_admin_all on timetable_exceptions;
create policy timetable_exceptions_school_admin_read on timetable_exceptions
  for select using (jwt_role() = 'school_admin' and school_id = jwt_school_id());

drop policy if exists timetable_exceptions_teacher_write on timetable_exceptions;
create policy timetable_exceptions_teacher_read on timetable_exceptions
  for select using (jwt_role() = 'teacher' and school_id = jwt_school_id());

drop policy if exists support_tickets_school_admin_all on support_tickets;
create policy support_tickets_school_admin_read on support_tickets
  for select using (jwt_role() = 'school_admin' and school_id = jwt_school_id());

-- ─── Teacher-owned exam tables ───────────────────────────────
-- A teacher writing questions/assignments/scores goes through the
-- API, which validates scope. Direct PostgREST writes bypass that
-- validation entirely, which is exactly the exam-integrity hole.
drop policy if exists questions_teacher_manage_own_exam on questions;
create policy questions_teacher_read_own_exam on questions
  for select using (exam_id in (select id from exams where created_by = auth.uid()));

drop policy if exists exam_assignments_teacher_own_exam on exam_assignments;
create policy exam_assignments_teacher_read_own_exam on exam_assignments
  for select using (exam_id in (select id from exams where created_by = auth.uid()));

drop policy if exists exam_answers_teacher_review on exam_answers;
create policy exam_answers_teacher_read on exam_answers
  for select using (
    exam_submission_id in (
      select es.id from exam_submissions es
      join exams e on e.id = es.exam_id
      where e.created_by = auth.uid()
    )
  );

drop policy if exists proctoring_settings_teacher_own_exam on proctoring_settings;
create policy proctoring_settings_teacher_read_own_exam on proctoring_settings
  for select using (exam_id in (select id from exams where created_by = auth.uid()));

drop policy if exists question_bank_school_scope on question_bank;
create policy question_bank_school_read on question_bank
  for select using (scope = 'school' and school_id = jwt_school_id());

-- ─── Student-owned tables ────────────────────────────────────
drop policy if exists chat_sessions_student_own on chat_sessions;
create policy chat_sessions_student_read on chat_sessions
  for select using (student_id = auth.uid());

drop policy if exists chat_messages_student_own on chat_messages;
create policy chat_messages_student_read on chat_messages
  for select using (session_id in (select id from chat_sessions where student_id = auth.uid()));

drop policy if exists notes_student_own on notes;
create policy notes_student_read on notes
  for select using (student_id = auth.uid());

drop policy if exists english_attempts_student_own on english_assessment_attempts;
create policy english_attempts_student_read on english_assessment_attempts
  for select using (student_id = auth.uid());

drop policy if exists session_participants_own on session_participants;
create policy session_participants_read on session_participants
  for select using (
    student_id = auth.uid()
    or session_id in (select id from live_sessions where teacher_id = auth.uid())
  );
