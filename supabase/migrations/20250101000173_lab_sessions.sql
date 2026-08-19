-- Live sessions held in a lab: a join code, the lab itself, and a period clock.
--
-- What existed already was a session bound to a class-section, which students
-- discovered automatically because they were in that section. That works for a
-- normal classroom period and is deliberately kept — no code is needed when the
-- roster already says who belongs.
--
-- A lab period is different in three ways, and each one is a column here:
--
--  * The lab is a scarce, bookable room. A session held in one should say so,
--    so the timetable and the session agree on where a class actually is.
--
--  * Students arrive from more than one section — a combined practical, a
--    catch-up group — so section membership stops being enough to decide who
--    may join. That is what join_code is for.
--
--  * A lab period is bounded by the timetable, not by the teacher remembering
--    to press stop. ends_at_expected drives the countdown and makes a session
--    left running overnight visibly wrong rather than silently wrong.

alter table public.live_sessions
  add column if not exists lab_id            uuid references public.labs(id) on delete set null,
  add column if not exists join_code         text,
  add column if not exists ends_at_expected  timestamptz;

comment on column public.live_sessions.join_code is
  'Short code students type to join a lab session they are not rostered into. NULL for an ordinary class session, where section membership is the gate.';
comment on column public.live_sessions.ends_at_expected is
  'When the period is scheduled to end, copied from the timetable slot. Drives the countdown; does not end the session by itself.';

-- A code only has to be unique among sessions currently running: yesterday's
-- code being reissued today is fine, and a partial index keeps the constraint
-- cheap as the session history grows.
create unique index if not exists live_sessions_active_join_code_uq
  on public.live_sessions (join_code)
  where is_active and join_code is not null;

-- Attendance is read off session_participants, which already records join and
-- leave times. The one thing missing was a way to mark someone present who
-- could not get their device working — common enough in a lab that without it
-- the register is quietly wrong.
alter table public.session_participants
  add column if not exists marked_by_teacher boolean not null default false;

comment on column public.session_participants.marked_by_teacher is
  'True when the teacher added this student to the register by hand rather than the student joining. Kept distinct so a register can still show who actually connected.';

-- The teacher's attendance view: every student on the roster for the session's
-- section, with whether and when they joined. A left join, so absentees appear
-- as rows rather than as gaps the caller has to work out.
create or replace function public.lab_session_attendance(p_session_id uuid)
returns table (
  student_id        uuid,
  full_name         text,
  roll_number       text,
  class_num         integer,
  section           text,
  joined_at         timestamptz,
  left_at           timestamptz,
  marked_by_teacher boolean,
  attended          boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    up.id as student_id,
    up.full_name,
    sp_prof.roll_number,
    sp_prof.class_num,
    sp_prof.section,
    part.joined_at,
    part.left_at,
    coalesce(part.marked_by_teacher, false) as marked_by_teacher,
    (part.student_id is not null) as attended
  from live_sessions ls
    join student_profiles sp_prof
      on sp_prof.class_num = ls.class_num
     and upper(sp_prof.section) = upper(ls.section)
    join user_profiles up
      on up.id = sp_prof.user_id
     and up.school_id = ls.school_id
     and up.exited_at is null
    left join session_participants part
      on part.session_id = ls.id
     and part.student_id = up.id
  where ls.id = p_session_id
  order by sp_prof.roll_number nulls last, up.full_name;
$$;

revoke all on function public.lab_session_attendance(uuid) from public, anon, authenticated;
grant execute on function public.lab_session_attendance(uuid) to service_role;
