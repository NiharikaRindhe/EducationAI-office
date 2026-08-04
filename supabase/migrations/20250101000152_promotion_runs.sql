-- ═════════════════════════════════════════════════════════════
--  PROMOTION RUNS — idempotency + atomicity for academic rollover
--
--  The academic-year rollover was previously a loop of unrelated
--  writes in Node with no record that it had ever happened. Two
--  concrete ways that corrupted a school's roster:
--
--  1. NOT IDEMPOTENT. Nothing recorded a completed promotion, so
--     running it twice (a double-clicked button, a retried request)
--     incremented every student twice — Class 3 silently became
--     Class 5. Unrecoverable without a backup, because the original
--     class was never stored anywhere.
--
--  2. NOT ATOMIC. Class 4 students move from PIN login to password
--     login. The old code cleared `pin_hash` in one statement and
--     incremented `class_num` in a later one; a failure in between
--     left a Class 4 child with no PIN and still in Class 4 — and
--     Classes 1-4 log in *by PIN*, so that child was locked out of
--     the platform entirely with no self-serve recovery.
--
--  This migration fixes both. `promotion_runs` records every attempt,
--  and the partial unique index makes a second run for the same
--  school-year impossible to even start. `promote_school()` performs
--  every roster mutation inside a single function body, so it is one
--  transaction: it either all lands or none of it does.
-- ═════════════════════════════════════════════════════════════

create table promotion_runs (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null references schools(id) on delete cascade,
  from_year         text not null,
  to_year           text not null,
  status            text not null default 'running'
                      check (status in ('running', 'completed', 'failed')),
  promoted_count    int  not null default 0,
  passed_out_count  int  not null default 0,
  error_message     text,
  started_by        uuid references user_profiles(id) on delete set null,
  started_at        timestamptz not null default now(),
  completed_at      timestamptz
);

-- The idempotency guard. A school may have at most one in-flight or
-- completed promotion per academic year; 'failed' is excluded so a run
-- that rolled back cleanly can be retried.
create unique index promotion_runs_school_year_uq
  on promotion_runs (school_id, from_year)
  where status in ('running', 'completed');

create index on promotion_runs (school_id, started_at desc);

alter table promotion_runs enable row level security;

-- Coarse school scope, matching the convention used by class_sections
-- and timetable_slots. The API uses the service-role key and re-applies
-- its own scoping; this policy is the defence-in-depth layer.
create policy promotion_runs_school_read on promotion_runs
  for select
  using (
    school_id = (select school_id from user_profiles where id = auth.uid())
    or jwt_role() = 'super_admin'
  );

-- ─────────────────────────────────────────────────────────────
--  promote_school(school, from_year, to_year, run_id)
--
--  Every roster mutation for the rollover, in ONE transaction.
--  Ordering note: Class 4 → 5 sets class_num and clears pin_hash in
--  the SAME statement, so the "no PIN but still Class 4" lockout
--  state cannot exist even transiently.
--
--  Passwords for the Class 4 cohort are set by the API *before*
--  calling this, because GoTrue lives outside this transaction. That
--  ordering is deliberate and safe: a Class 4 student still logs in
--  by PIN, so an account that gets a password but never gets promoted
--  (because this function rolled back) is completely unaffected.
-- ─────────────────────────────────────────────────────────────
create or replace function promote_school(
  p_school_id uuid,
  p_from_year text,
  p_to_year   text,
  p_run_id    uuid
)
returns table (promoted_count int, passed_out_count int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_passed_out int := 0;
  v_promoted   int := 0;
begin
  -- 1. Class 10 leaves the platform.
  with deactivated as (
    update user_profiles up
       set is_active = false
      from student_profiles sp
     where sp.user_id = up.id
       and up.school_id = p_school_id
       and up.role = 'student'
       and up.is_active = true
       and sp.class_num = 10
    returning up.id
  )
  select count(*) into v_passed_out from deactivated;

  -- 2. Every continuing class (1-9) moves up exactly one, in a SINGLE
  --    statement built from a snapshot of the starting classes.
  --
  --    This has to be one statement. Splitting it — "Class 4 → 5" followed by
  --    "increment 1-9" — reintroduces the double-promotion bug in a new form:
  --    the second statement sees the first statement's committed effect, so
  --    the Class 4 cohort (now Class 5, still within 1-9) gets incremented a
  --    second time to Class 6. Ordering them the other way is just as broken:
  --    Class 3 becomes Class 4 and then wrongly has its PIN cleared. The
  --    snapshot CTE fixes the starting class for every student up front, so
  --    each student is promoted exactly once no matter their class.
  --
  --    The Class 4 → 5 PIN clear rides along in the same UPDATE, so the
  --    "PIN cleared but still Class 4" lockout window never exists.
  with cohort as (
    select sp.user_id, sp.class_num as old_class
      from student_profiles sp
      join user_profiles up on up.id = sp.user_id
     where up.school_id = p_school_id
       and up.role = 'student'
       and up.is_active = true
       and sp.class_num between 1 and 9
  ),
  promoted as (
    update student_profiles sp
       set class_num = c.old_class + 1,
           pin_hash  = case when c.old_class = 4 then null else sp.pin_hash end
      from cohort c
     where sp.user_id = c.user_id
    returning sp.user_id
  )
  select count(*) into v_promoted from promoted;

  -- 4. Carry the section structure into the new academic year.
  insert into class_sections (school_id, academic_year, class_num, section_label, is_active)
  select p_school_id, p_to_year, cs.class_num, cs.section_label, true
    from class_sections cs
   where cs.school_id = p_school_id
     and cs.academic_year = p_from_year
  on conflict (school_id, academic_year, class_num, section_label) do nothing;

  -- 5. Close out the run in the same transaction as the work it describes.
  update promotion_runs
     set status           = 'completed',
         promoted_count   = v_promoted,
         passed_out_count = v_passed_out,
         completed_at     = now()
   where id = p_run_id;

  return query select v_promoted, v_passed_out;
end;
$$;

revoke all on function promote_school(uuid, text, text, uuid) from public, anon, authenticated;
