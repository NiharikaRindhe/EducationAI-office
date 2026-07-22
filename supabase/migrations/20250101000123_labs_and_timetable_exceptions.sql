-- ═════════════════════════════════════════════════════════════
--  LABS — a school's physical computer labs are the scarce resource
--  the whole lab timetable is built around. Every timetable slot now
--  optionally names the lab it runs in, with a third DB-level
--  conflict rule alongside the existing section/teacher ones: a lab
--  can't host two sections in the same period.
--
--  TIMETABLE EXCEPTIONS — the weekly grid in timetable_slots is the
--  recurring plan. A specific occurrence of a slot (e.g. "Tuesday
--  14 July") can be cancelled or rescheduled without touching the
--  recurring plan — e.g. lab PCs are down, so today's period 3 for
--  7-B moves to period 5 in Lab 2. Teachers, students and the
--  school admin all read the same merged (plan + exceptions) view.
-- ═════════════════════════════════════════════════════════════

create table labs (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references schools(id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 60),
  seat_capacity  int not null default 30 check (seat_capacity > 0),
  location       text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  unique (school_id, name)
);

create index on labs (school_id);

alter table timetable_slots add column lab_id uuid references labs(id) on delete set null;

create unique index timetable_slots_lab_period_uq
  on timetable_slots (lab_id, academic_year, day_of_week, period_no)
  where lab_id is not null;

create table timetable_exceptions (
  id                 uuid primary key default gen_random_uuid(),
  school_id          uuid not null references schools(id) on delete cascade,
  timetable_slot_id  uuid not null references timetable_slots(id) on delete cascade,
  exception_date     date not null,
  status             text not null check (status in ('cancelled', 'rescheduled')),
  reason             text,
  new_date           date,
  new_period_no      int check (new_period_no between 1 and 12),
  new_lab_id         uuid references labs(id) on delete set null,
  created_by         uuid references user_profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  unique (timetable_slot_id, exception_date)
);

create index on timetable_exceptions (school_id, exception_date);

-- ─── RLS: labs ───────────────────────────────────────────────
alter table labs enable row level security;

create policy labs_super_admin_all on labs
  for all using (jwt_role() = 'super_admin');

create policy labs_school_admin_all on labs
  for all using (jwt_role() = 'school_admin' and school_id = jwt_school_id());

create policy labs_school_read on labs
  for select using (
    jwt_role() in ('teacher', 'lab_incharge', 'student') and school_id = jwt_school_id()
  );

-- ─── RLS: timetable_exceptions ───────────────────────────────
-- Coarse school-scoped write access at the DB layer (matching the
-- existing timetable_slots convention) — "a teacher may only touch
-- their own slot" is enforced in the service layer, same as
-- assertTeacherInSchool() does for timetable_slots today.
alter table timetable_exceptions enable row level security;

create policy timetable_exceptions_super_admin_all on timetable_exceptions
  for all using (jwt_role() = 'super_admin');

create policy timetable_exceptions_school_admin_all on timetable_exceptions
  for all using (jwt_role() = 'school_admin' and school_id = jwt_school_id());

create policy timetable_exceptions_teacher_write on timetable_exceptions
  for all using (jwt_role() = 'teacher' and school_id = jwt_school_id());

create policy timetable_exceptions_read on timetable_exceptions
  for select using (
    jwt_role() in ('teacher', 'lab_incharge', 'student') and school_id = jwt_school_id()
  );

-- ─── Grants ──────────────────────────────────────────────────
grant all privileges on labs, timetable_exceptions to postgres, service_role;
grant select, insert, update, delete on labs, timetable_exceptions to authenticated;
