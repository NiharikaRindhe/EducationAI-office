-- ═════════════════════════════════════════════════════════════
--  P0 SECURITY (part 2) — complete the write lockdown
--
--  Migration ...159 converted `FOR ALL` policies to SELECT-only,
--  but it filtered on cmd='ALL' and therefore MISSED every policy
--  declared explicitly as INSERT / UPDATE / DELETE. Eighteen of
--  them were still live.
--
--  The most damaging was `exam_answers_student_autosave`: its
--  WITH CHECK only proves the submission belongs to the caller.
--  It does not check the deadline, and it does not check that the
--  question belongs to that exam — the two guards added to
--  saveAnswer() in the same batch of fixes. A student could
--  therefore POST straight to PostgREST and bypass both:
--
--      POST /rest/v1/exam_answers
--      { exam_submission_id: <own>, question_id: <any>, ... }
--
--  ...writing answers after time expired, against questions from
--  exams they were never assigned. Application-layer exam
--  integrity is worthless while that door is open.
--
--  `exam_submissions_student_start` was similar: INSERT allowed
--  whenever student_id = auth.uid(), with nothing proving the
--  exam was ever assigned to that student.
--
--  APPROACH
--  Adopt option 1 from the audit — a single consistent model:
--  ALL writes go through the Node API (service role). Two layers,
--  so a future permissive policy cannot silently reopen this:
--
--    1. Drop every remaining end-user write policy.
--    2. REVOKE insert/update/delete from `authenticated` outright,
--       so a policy alone can never re-grant write access.
--
--  SELECT policies are untouched; reads keep working exactly as
--  before. service_role bypasses RLS and is unaffected.
-- ═════════════════════════════════════════════════════════════

-- ─── Exam integrity (the bypass path) ────────────────────────
drop policy if exists exam_answers_student_autosave      on exam_answers;
drop policy if exists exam_answers_student_update        on exam_answers;
drop policy if exists exam_submissions_student_start     on exam_submissions;
drop policy if exists exam_submissions_student_submit    on exam_submissions;
drop policy if exists exam_submissions_teacher_review    on exam_submissions;
drop policy if exists proctoring_events_student_insert   on proctoring_events;

-- ─── Teacher-owned content ───────────────────────────────────
drop policy if exists exams_teacher_write                on exams;
drop policy if exists exams_teacher_manage_own           on exams;
drop policy if exists exams_teacher_delete_own           on exams;
drop policy if exists tasks_teacher_write                on tasks;
drop policy if exists tasks_teacher_manage_own           on tasks;
drop policy if exists tasks_teacher_delete_own           on tasks;
drop policy if exists task_assignments_teacher_insert    on task_assignments;
drop policy if exists announcements_teacher_write        on announcements;
drop policy if exists announcements_teacher_manage_own   on announcements;
drop policy if exists announcements_teacher_delete_own   on announcements;

-- ─── Student self-writes ─────────────────────────────────────
drop policy if exists task_assignments_student_update_status on task_assignments;
drop policy if exists streak_logs_student_insert             on streak_logs;

-- ─── Structural backstop ─────────────────────────────────────
-- Policies are per-table and easy to forget on a new table; a
-- missing GRANT fails closed for every table at once. This is the
-- line that makes "all writes go through the API" actually true.
do $$
declare t record;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('revoke insert, update, delete on public.%I from authenticated', t.tablename);
  end loop;
end $$;

-- Future tables inherit the same posture rather than silently
-- granting writes to every logged-in student.
alter default privileges in schema public
  revoke insert, update, delete on tables from authenticated;
