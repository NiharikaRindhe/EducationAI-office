-- ═════════════════════════════════════════════════════════════
--  STUDENT ENROLLMENTS — the academic-year history
--
--  `student_profiles.class_num` is current state only. Every rollover
--  overwrote it, so the platform could answer "what class is Riya in?"
--  but never "what class was Riya in last year?", and a Class 10 leaver
--  lost their record entirely the moment they were deactivated.
--
--  One row per student per academic year, carrying the class/section
--  they sat in and how that year ended for them. This is what makes
--  hold-backs (repeating a year) expressible at all: without it, a
--  repeated year is indistinguishable from never having been promoted.
-- ═════════════════════════════════════════════════════════════

create table student_enrollments (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references student_profiles(user_id) on delete cascade,
  school_id      uuid not null references schools(id) on delete cascade,
  academic_year  text not null,
  class_num      int  not null check (class_num between 1 and 10),
  section        text not null,
  -- 'enrolled'  = the year currently in progress
  -- 'promoted'  = finished, moved up a class
  -- 'held_back' = finished, repeating the same class next year
  -- 'graduated' = finished Class 10 and left the platform
  outcome        text not null default 'enrolled'
                   check (outcome in ('enrolled', 'promoted', 'held_back', 'graduated')),
  created_at     timestamptz not null default now(),

  -- A student sits in exactly one class per academic year. This is also
  -- what makes the rollover's enrollment writes safely re-runnable.
  unique (student_id, academic_year)
);

create index on student_enrollments (school_id, academic_year);
create index on student_enrollments (student_id, academic_year desc);

alter table student_enrollments enable row level security;

-- Coarse school scope, matching class_sections / promotion_runs. The API
-- uses the service-role key and re-applies its own scoping; this is the
-- defence-in-depth layer.
create policy student_enrollments_school_read on student_enrollments
  for select
  using (
    school_id = (select school_id from user_profiles where id = auth.uid())
    or jwt_role() = 'super_admin'
  );

-- Students may read their own history.
create policy student_enrollments_own_read on student_enrollments
  for select
  using (student_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
--  Backfill: every active student is 'enrolled' in the current year
--  at whatever class they're sitting in now. Without this the first
--  rollover would have no year to close out.
-- ─────────────────────────────────────────────────────────────
insert into student_enrollments (student_id, school_id, academic_year, class_num, section, outcome)
select sp.user_id, up.school_id, current_academic_year(), sp.class_num, sp.section, 'enrolled'
  from student_profiles sp
  join user_profiles up on up.id = sp.user_id
 where up.role = 'student'
   and up.is_active = true
   and up.school_id is not null
on conflict (student_id, academic_year) do nothing;
