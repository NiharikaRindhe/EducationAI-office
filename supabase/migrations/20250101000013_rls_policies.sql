-- ═════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY — every table, every role.
--  Enabling RLS with no policy silently blocks ALL access, which
--  is safe-by-default but easy to mistake for "it works" until a
--  real query hits it. This file is deliberately exhaustive.
--
--  Roles: student, teacher, school_admin, lab_incharge, super_admin.
--  super_admin also has a Node API path using the service-role key,
--  which bypasses RLS entirely for cross-school admin operations —
--  the policies below cover super_admin querying directly as itself.
-- ═════════════════════════════════════════════════════════════

-- ─── Guard triggers: block score-bearing columns from student writes ───
-- A student can reach these tables' UPDATE policy (to save an in-progress
-- answer or cycle a task status) but must never be able to set their own
-- score, XP, or a teacher's review fields via a direct REST call.

create or replace function guard_exam_answer_student_writes()
returns trigger language plpgsql as $$
begin
  if jwt_role() = 'student' then
    new.is_correct           := old.is_correct;
    new.auto_score            := old.auto_score;
    new.ai_score               := old.ai_score;
    new.ai_covered_points      := old.ai_covered_points;
    new.ai_missing_points      := old.ai_missing_points;
    new.ai_feedback            := old.ai_feedback;
    new.ai_scored_at           := old.ai_scored_at;
    new.final_score            := old.final_score;
    new.teacher_note           := old.teacher_note;
    new.teacher_reviewed_at    := old.teacher_reviewed_at;
    new.teacher_overrode_ai    := old.teacher_overrode_ai;
  end if;
  return new;
end;
$$;

create trigger exam_answers_guard_student_writes
  before update on exam_answers
  for each row execute function guard_exam_answer_student_writes();

create or replace function guard_exam_submission_student_writes()
returns trigger language plpgsql as $$
begin
  if jwt_role() = 'student' then
    new.total_score := old.total_score;
    new.max_score    := old.max_score;
    new.xp_awarded   := old.xp_awarded;
    new.is_reviewed  := old.is_reviewed;
  end if;
  return new;
end;
$$;

create trigger exam_submissions_guard_student_writes
  before update on exam_submissions
  for each row execute function guard_exam_submission_student_writes();

create or replace function guard_task_assignment_student_writes()
returns trigger language plpgsql as $$
begin
  if jwt_role() = 'student' then
    new.xp_awarded := old.xp_awarded;
  end if;
  return new;
end;
$$;

create trigger task_assignments_guard_student_writes
  before update on task_assignments
  for each row execute function guard_task_assignment_student_writes();

-- ─────────────────────────────────────────────────────────────
--  SCHOOLS
-- ─────────────────────────────────────────────────────────────
alter table schools enable row level security;

create policy schools_super_admin_all on schools
  for all using (jwt_role() = 'super_admin');

create policy schools_own_school_read on schools
  for select using (id = jwt_school_id());

-- ─────────────────────────────────────────────────────────────
--  USER PROFILES
-- ─────────────────────────────────────────────────────────────
alter table user_profiles enable row level security;

create policy user_profiles_super_admin_all on user_profiles
  for all using (jwt_role() = 'super_admin');

create policy user_profiles_own_row on user_profiles
  for select using (id = auth.uid());

create policy user_profiles_school_admin_school on user_profiles
  for all using (jwt_role() = 'school_admin' and school_id = jwt_school_id());

create policy user_profiles_lab_incharge_read on user_profiles
  for select using (jwt_role() = 'lab_incharge' and school_id = jwt_school_id());

create policy user_profiles_teacher_school_read on user_profiles
  for select using (jwt_role() = 'teacher' and school_id = jwt_school_id());

-- ─────────────────────────────────────────────────────────────
--  STUDENT PROFILES
--  Students never get a direct UPDATE policy here — XP, streak,
--  level, and PIN are only ever mutated by the Node API using the
--  service-role key, after validating the business rule that earned
--  them. This is deliberate: a student calling PATCH directly on
--  this table must not be able to self-award XP.
-- ─────────────────────────────────────────────────────────────
alter table student_profiles enable row level security;

create policy student_profiles_super_admin_all on student_profiles
  for all using (jwt_role() = 'super_admin');

create policy student_profiles_own_read on student_profiles
  for select using (user_id = auth.uid());

create policy student_profiles_school_admin_school on student_profiles
  for all using (
    jwt_role() = 'school_admin'
    and user_id in (select id from user_profiles where school_id = jwt_school_id())
  );

create policy student_profiles_lab_incharge_read on student_profiles
  for select using (
    jwt_role() = 'lab_incharge'
    and user_id in (select id from user_profiles where school_id = jwt_school_id())
  );

-- Teacher sees only students in classes they actually teach, not the
-- whole school (school-wide visibility is School Admin's job, not theirs).
create policy student_profiles_teacher_classes_taught on student_profiles
  for select using (
    jwt_role() = 'teacher'
    and user_id in (select id from user_profiles where school_id = jwt_school_id())
    and class_num = any (
      select unnest(classes_taught) from teacher_profiles where user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
--  TEACHER PROFILES
-- ─────────────────────────────────────────────────────────────
alter table teacher_profiles enable row level security;

create policy teacher_profiles_super_admin_all on teacher_profiles
  for all using (jwt_role() = 'super_admin');

create policy teacher_profiles_own_row on teacher_profiles
  for select using (user_id = auth.uid());

create policy teacher_profiles_school_admin_school on teacher_profiles
  for all using (
    jwt_role() = 'school_admin'
    and user_id in (select id from user_profiles where school_id = jwt_school_id())
  );

-- ─────────────────────────────────────────────────────────────
--  CLASS SUBJECTS — read-only reference data, same for every school.
-- ─────────────────────────────────────────────────────────────
alter table class_subjects enable row level security;

create policy class_subjects_authenticated_read on class_subjects
  for select using (auth.role() = 'authenticated');

create policy class_subjects_super_admin_write on class_subjects
  for all using (jwt_role() = 'super_admin');

-- ─────────────────────────────────────────────────────────────
--  LIVE SESSIONS + PARTICIPANTS
-- ─────────────────────────────────────────────────────────────
alter table live_sessions enable row level security;
alter table session_participants enable row level security;

create policy live_sessions_school_scope on live_sessions
  for all using (school_id = jwt_school_id());

create policy live_sessions_super_admin_all on live_sessions
  for all using (jwt_role() = 'super_admin');

create policy session_participants_own on session_participants
  for all using (
    student_id = auth.uid()
    or session_id in (select id from live_sessions where teacher_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
--  ANNOUNCEMENTS
-- ─────────────────────────────────────────────────────────────
alter table announcements enable row level security;

create policy announcements_school_scope_read on announcements
  for select using (school_id = jwt_school_id());

create policy announcements_teacher_write on announcements
  for insert with check (jwt_role() = 'teacher' and teacher_id = auth.uid());

create policy announcements_teacher_manage_own on announcements
  for update using (teacher_id = auth.uid());

create policy announcements_teacher_delete_own on announcements
  for delete using (teacher_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
--  TASKS + TASK ASSIGNMENTS
-- ─────────────────────────────────────────────────────────────
alter table tasks enable row level security;
alter table task_assignments enable row level security;

create policy tasks_school_scope_read on tasks
  for select using (school_id = jwt_school_id());

create policy tasks_teacher_write on tasks
  for insert with check (jwt_role() = 'teacher' and created_by = auth.uid());

create policy tasks_teacher_manage_own on tasks
  for update using (created_by = auth.uid());

create policy tasks_teacher_delete_own on tasks
  for delete using (created_by = auth.uid());

create policy task_assignments_student_own on task_assignments
  for select using (student_id = auth.uid());

create policy task_assignments_student_update_status on task_assignments
  for update using (student_id = auth.uid());

create policy task_assignments_teacher_read on task_assignments
  for select using (task_id in (select id from tasks where created_by = auth.uid()));

create policy task_assignments_teacher_insert on task_assignments
  for insert with check (task_id in (select id from tasks where created_by = auth.uid()));

-- ─────────────────────────────────────────────────────────────
--  QUESTION BANK
-- ─────────────────────────────────────────────────────────────
alter table question_bank enable row level security;

create policy question_bank_global_read on question_bank
  for select using (scope = 'global');

create policy question_bank_school_scope on question_bank
  for all using (scope = 'school' and school_id = jwt_school_id());

create policy question_bank_super_admin_all on question_bank
  for all using (jwt_role() = 'super_admin');

-- ─────────────────────────────────────────────────────────────
--  EXAMS + QUESTIONS
-- ─────────────────────────────────────────────────────────────
alter table exams enable row level security;
alter table questions enable row level security;

create policy exams_school_scope_read on exams
  for select using (school_id = jwt_school_id());

create policy exams_teacher_write on exams
  for insert with check (jwt_role() = 'teacher' and created_by = auth.uid());

create policy exams_teacher_manage_own on exams
  for update using (created_by = auth.uid());

create policy exams_teacher_delete_own on exams
  for delete using (created_by = auth.uid());

create policy questions_via_exam_school_scope on questions
  for select using (exam_id in (select id from exams where school_id = jwt_school_id()));

create policy questions_teacher_manage_own_exam on questions
  for all using (exam_id in (select id from exams where created_by = auth.uid()));

-- ─────────────────────────────────────────────────────────────
--  EXAM ASSIGNMENTS, SUBMISSIONS, ANSWERS
-- ─────────────────────────────────────────────────────────────
alter table exam_assignments enable row level security;
alter table exam_submissions enable row level security;
alter table exam_answers enable row level security;

create policy exam_assignments_student_own on exam_assignments
  for select using (student_id = auth.uid());

create policy exam_assignments_teacher_own_exam on exam_assignments
  for all using (exam_id in (select id from exams where created_by = auth.uid()));

create policy exam_submissions_student_own on exam_submissions
  for select using (student_id = auth.uid());

create policy exam_submissions_student_start on exam_submissions
  for insert with check (student_id = auth.uid());

create policy exam_submissions_student_submit on exam_submissions
  for update using (student_id = auth.uid());

create policy exam_submissions_teacher_own_exam on exam_submissions
  for select using (exam_id in (select id from exams where created_by = auth.uid()));

create policy exam_submissions_teacher_review on exam_submissions
  for update using (exam_id in (select id from exams where created_by = auth.uid()));

create policy exam_answers_student_own on exam_answers
  for select using (
    exam_submission_id in (select id from exam_submissions where student_id = auth.uid())
  );

create policy exam_answers_student_autosave on exam_answers
  for insert with check (
    exam_submission_id in (select id from exam_submissions where student_id = auth.uid())
  );

create policy exam_answers_student_update on exam_answers
  for update using (
    exam_submission_id in (select id from exam_submissions where student_id = auth.uid())
  );

create policy exam_answers_teacher_review on exam_answers
  for all using (
    exam_submission_id in (
      select es.id from exam_submissions es
      join exams e on e.id = es.exam_id
      where e.created_by = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
--  PROCTORING
-- ─────────────────────────────────────────────────────────────
alter table proctoring_settings enable row level security;
alter table proctoring_events enable row level security;

create policy proctoring_settings_teacher_own_exam on proctoring_settings
  for all using (exam_id in (select id from exams where created_by = auth.uid()));

create policy proctoring_settings_student_read on proctoring_settings
  for select using (exam_id in (select id from exams where school_id = jwt_school_id()));

create policy proctoring_events_student_insert on proctoring_events
  for insert with check (
    exam_submission_id in (select id from exam_submissions where student_id = auth.uid())
  );

create policy proctoring_events_teacher_read on proctoring_events
  for select using (
    exam_submission_id in (
      select es.id from exam_submissions es
      join exams e on e.id = es.exam_id
      where e.created_by = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
--  BADGES (reference data, read-only) + STUDENT BADGES
-- ─────────────────────────────────────────────────────────────
alter table badges enable row level security;
alter table student_badges enable row level security;

create policy badges_authenticated_read on badges
  for select using (auth.role() = 'authenticated');

create policy badges_super_admin_write on badges
  for all using (jwt_role() = 'super_admin');

create policy student_badges_own_read on student_badges
  for select using (student_id = auth.uid());

create policy student_badges_teacher_read on student_badges
  for select using (
    student_id in (
      select user_id from student_profiles
      where user_id in (select id from user_profiles where school_id = jwt_school_id())
    )
  );

-- ─────────────────────────────────────────────────────────────
--  NOTES
-- ─────────────────────────────────────────────────────────────
alter table notes enable row level security;

create policy notes_student_own on notes
  for all using (student_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
--  SUBJECT PROGRESS + STREAK LOGS
-- ─────────────────────────────────────────────────────────────
alter table subject_progress enable row level security;
alter table streak_logs enable row level security;

create policy subject_progress_student_own_read on subject_progress
  for select using (student_id = auth.uid());

create policy subject_progress_teacher_read on subject_progress
  for select using (
    student_id in (select id from user_profiles where school_id = jwt_school_id())
  );

create policy streak_logs_student_own on streak_logs
  for select using (student_id = auth.uid());

create policy streak_logs_student_insert on streak_logs
  for insert with check (student_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
--  LEADERBOARD — read-only, school-scoped for every role in-school.
-- ─────────────────────────────────────────────────────────────
alter table leaderboard_snapshots enable row level security;

create policy leaderboard_school_scope_read on leaderboard_snapshots
  for select using (school_id = jwt_school_id());

-- ─────────────────────────────────────────────────────────────
--  AUDIT LOGS — super_admin sees all, school_admin sees own school.
--  No student/teacher/lab_incharge access.
-- ─────────────────────────────────────────────────────────────
alter table audit_logs enable row level security;

create policy audit_logs_super_admin_all on audit_logs
  for select using (jwt_role() = 'super_admin');

create policy audit_logs_school_admin_own_school on audit_logs
  for select using (jwt_role() = 'school_admin' and school_id = jwt_school_id());

-- ─────────────────────────────────────────────────────────────
--  RAG: TEXT CHUNKS + BOOK IMAGES — read-only reference content.
-- ─────────────────────────────────────────────────────────────
alter table text_chunks enable row level security;
alter table book_images enable row level security;

create policy text_chunks_authenticated_read on text_chunks
  for select using (auth.role() = 'authenticated');

create policy book_images_authenticated_read on book_images
  for select using (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────
--  CHAT SESSIONS + MESSAGES
-- ─────────────────────────────────────────────────────────────
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;

create policy chat_sessions_student_own on chat_sessions
  for all using (student_id = auth.uid());

create policy chat_sessions_teacher_read on chat_sessions
  for select using (
    student_id in (select id from user_profiles where school_id = jwt_school_id())
    and jwt_role() = 'teacher'
  );

create policy chat_messages_student_own on chat_messages
  for all using (session_id in (select id from chat_sessions where student_id = auth.uid()));

create policy chat_messages_teacher_read on chat_messages
  for select using (
    jwt_role() = 'teacher'
    and session_id in (
      select cs.id from chat_sessions cs
      join user_profiles up on up.id = cs.student_id
      where up.school_id = jwt_school_id()
    )
  );

-- ─────────────────────────────────────────────────────────────
--  ENGLISH ASSESSMENT
-- ─────────────────────────────────────────────────────────────
alter table english_assessment_items enable row level security;
alter table english_assessment_attempts enable row level security;

create policy english_items_authenticated_read on english_assessment_items
  for select using (auth.role() = 'authenticated');

create policy english_attempts_student_own on english_assessment_attempts
  for all using (student_id = auth.uid());

create policy english_attempts_teacher_read on english_assessment_attempts
  for select using (
    student_id in (select id from user_profiles where school_id = jwt_school_id())
  );
