-- Move "has left the school" onto user_profiles so it means the same thing for
-- every role.
--
-- 20250101000170 put exited_at/exit_reason on student_profiles. Teachers and
-- lab incharges need exactly the same treatment and for exactly the same
-- reason — tasks, exams, live_sessions and announcements all reference
-- teacher_profiles with NO ACTION, so a teacher who ever set an exam cannot be
-- deleted either — and lab incharges have no profile table of their own to
-- carry the columns. Keeping one pair of columns on user_profiles avoids three
-- parallel implementations of the same idea.
--
-- Note there is deliberately no `exited_by` FK: user_profiles already has one
-- FK from each *_profiles table, and a second one makes PostgREST unable to
-- resolve the embeds used by the login query (PGRST201). Who performed the
-- exit lives in audit_logs.

alter table public.user_profiles
  add column if not exists exited_at   timestamptz,
  add column if not exists exit_reason text;

comment on column public.user_profiles.exited_at is
  'When this person left the school. NULL means currently with the school. Set instead of deleting so their history survives.';

create index if not exists user_profiles_present_idx
  on public.user_profiles (school_id, role)
  where exited_at is null;

-- Carry over anything already recorded by the student-only migration, then
-- retire those columns. No students are exited at the time of writing, so this
-- is a no-op in practice and safe to run either way.
update public.user_profiles up
   set exited_at   = sp.exited_at,
       exit_reason = sp.exit_reason
  from public.student_profiles sp
 where sp.user_id = up.id
   and sp.exited_at is not null;

drop index if exists public.student_profiles_active_idx;

-- The view must go first: it selects the columns being dropped. Dropped rather
-- than replaced in any case, because the column list changes shape.
drop view if exists public.student_directory;

alter table public.student_profiles
  drop column if exists exited_at,
  drop column if exists exit_reason;

create view public.student_directory as
  select
    up.id,
    up.school_id,
    sc.name as school_name,
    sc.code as school_code,
    up.full_name,
    up.is_active,
    up.has_logged_in_ever,
    up.last_seen_at,
    sp.class_num,
    sp.section,
    sp.batch_id,
    sp.roll_number,
    sp.avatar,
    sp.xp,
    sp.level,
    sp.streak,
    sp.longest_streak,
    sp.class_num * 1000 + ascii(upper("left"(sp.section, 1))) as class_sort,
    up.exited_at,
    up.exit_reason,
    (up.exited_at is not null) as has_left
  from user_profiles up
    join student_profiles sp on sp.user_id = up.id
    join schools sc on sc.id = up.school_id
  where up.role = 'student';
