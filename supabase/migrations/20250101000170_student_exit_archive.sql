-- Archiving a student who has left the school.
--
-- "Delete this student" cannot mean DELETE. Twelve tables reference
-- student_profiles with NO ACTION — exam_submissions, task_assignments,
-- student_badges, notes, game_attempts and the rest — so Postgres rejects the
-- delete outright for any student who has ever done anything. The only rows a
-- hard delete could remove are ones with no history at all.
--
-- That constraint matches what a school actually needs: a leaver's marks are
-- still their transcript, and the audit trail behind a released result has to
-- survive the student moving away. So leaving is recorded, not erased.
--
-- An exited student:
--   * disappears from active rosters and the directory by default,
--   * frees their seat for headcount and section capacity,
--   * cannot sign in (user_profiles.is_active is set false alongside this),
--   * keeps every mark, submission and badge.
--
-- The columns are nullable, so every existing student is "not exited" without
-- a backfill.

-- NOTE: deliberately no `exited_by` foreign key to user_profiles here.
-- student_profiles already has one FK to user_profiles (user_id). A second one
-- makes PostgREST unable to resolve `user_profiles -> student_profiles` embeds
-- (PGRST201, "more than one relationship found"), which breaks the login query
-- and every other embed of student_profiles across the API. Who performed the
-- exit is recorded in audit_logs, which is the authoritative record anyway.
alter table public.student_profiles
  add column if not exists exited_at    timestamptz,
  add column if not exists exit_reason  text;

comment on column public.student_profiles.exited_at is
  'When the student left the school. NULL means currently enrolled. Set instead of deleting the row so academic history survives.';
comment on column public.student_profiles.exit_reason is
  'Free-text note recorded by the school admin at exit (moved city, transferred, completed schooling).';

-- Partial index: every roster query filters on "still here", and that is the
-- overwhelmingly common case, so index the NULLs rather than the whole column.
create index if not exists student_profiles_active_idx
  on public.student_profiles (user_id)
  where exited_at is null;

-- The enrolment record for the year the student left needs a terminal outcome
-- of its own. Without it a leaver looks identical to someone still sitting in
-- the class, and the promotion run would try to move them up a year.
alter table public.student_enrollments
  drop constraint if exists student_enrollments_outcome_check;

alter table public.student_enrollments
  add constraint student_enrollments_outcome_check
  check (outcome in ('enrolled', 'promoted', 'held_back', 'graduated', 'left'));
