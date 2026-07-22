-- ═════════════════════════════════════════════════════════════
--  TIMETABLE — weekly recurring period grid per section, built by
--  the School Admin. Teachers and students read their own slice.
--
--  day_of_week: 1=Monday .. 6=Saturday (Indian school week).
--  Conflict prevention is enforced at the DB layer with two
--  partial unique indexes (NULLs — free periods with no teacher —
--  never collide, by Postgres unique-index semantics):
--    - a section can't have two subjects in the same period
--    - a teacher can't be booked into two sections in the same period
-- ═════════════════════════════════════════════════════════════

create table timetable_slots (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null references schools(id) on delete cascade,
  academic_year     text not null default current_academic_year(),
  class_section_id  uuid not null references class_sections(id) on delete cascade,
  day_of_week       int not null check (day_of_week between 1 and 6),
  period_no         int not null check (period_no between 1 and 12),
  starts_at         time not null,
  ends_at           time not null check (ends_at > starts_at),
  subject           text not null,
  teacher_id        uuid references teacher_profiles(user_id) on delete set null,
  created_at        timestamptz not null default now()
);

create unique index timetable_slots_section_period_uq
  on timetable_slots (class_section_id, academic_year, day_of_week, period_no);

create unique index timetable_slots_teacher_period_uq
  on timetable_slots (teacher_id, academic_year, day_of_week, period_no)
  where teacher_id is not null;

create index on timetable_slots (school_id, academic_year);

-- ─── RLS ─────────────────────────────────────────────────────
alter table timetable_slots enable row level security;

create policy timetable_slots_super_admin_all on timetable_slots
  for all using (jwt_role() = 'super_admin');

create policy timetable_slots_school_admin_all on timetable_slots
  for all using (jwt_role() = 'school_admin' and school_id = jwt_school_id());

create policy timetable_slots_school_read on timetable_slots
  for select using (
    jwt_role() in ('teacher', 'lab_incharge', 'student') and school_id = jwt_school_id()
  );

-- ─── Grants ──────────────────────────────────────────────────
grant all privileges on timetable_slots to postgres, service_role;
grant select, insert, update, delete on timetable_slots to authenticated;
