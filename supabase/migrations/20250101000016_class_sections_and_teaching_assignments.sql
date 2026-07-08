-- ═════════════════════════════════════════════════════════════
--  CLASS SECTIONS + TEACHING ASSIGNMENTS
--
--  Sections become first-class rows instead of free-text on
--  student_profiles: each school defines which sections exist per
--  class (Class 1 may have A-D while Class 5 has only A-C), per
--  academic year (Indian school year: April-March, e.g. '2026-27').
--
--  teaching_assignments replaces the flat teacher_profiles.
--  classes_taught[] as the source of truth for "who teaches what":
--  one row per teacher x section x subject. The class teacher (one
--  per section, the Indian "class teacher" role) lives on
--  class_sections.class_teacher_id. classes_taught[] is kept and
--  still honoured as a fallback for teachers with no assignments
--  yet, so existing data keeps working during rollout.
-- ═════════════════════════════════════════════════════════════

-- Academic year runs April-March (IST). July 2026 -> '2026-27',
-- February 2027 -> still '2026-27'.
create or replace function current_academic_year()
returns text language plpgsql stable as $$
declare
  d date := (now() at time zone 'Asia/Kolkata')::date;
  start_year int;
begin
  start_year := case when extract(month from d) >= 4
                     then extract(year from d)
                     else extract(year from d) - 1 end;
  return start_year::text || '-' || lpad(((start_year + 1) % 100)::text, 2, '0');
end;
$$;

create table class_sections (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references schools(id) on delete cascade,
  academic_year    text not null default current_academic_year(),
  class_num        int  not null check (class_num between 1 and 10),
  section_label    text not null check (char_length(section_label) between 1 and 4),
  class_teacher_id uuid references teacher_profiles(user_id) on delete set null,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  unique (school_id, academic_year, class_num, section_label)
);

create index on class_sections (school_id, academic_year);
create index on class_sections (class_teacher_id);

create table teaching_assignments (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references schools(id) on delete cascade,
  teacher_id       uuid not null references teacher_profiles(user_id) on delete cascade,
  class_section_id uuid not null references class_sections(id) on delete cascade,
  subject          text not null,
  created_at       timestamptz not null default now(),
  -- subject validity against class_subjects is enforced at the API
  -- layer (same rule as tasks/exams/chat), since class_subjects is
  -- keyed on class_num which lives on the section row, not here.
  unique (teacher_id, class_section_id, subject)
);

create index on teaching_assignments (school_id);
create index on teaching_assignments (teacher_id);
create index on teaching_assignments (class_section_id);

-- ─── Backfill: register every class+section that already has students ───
insert into class_sections (school_id, class_num, section_label)
select distinct up.school_id, sp.class_num, sp.section
from student_profiles sp
join user_profiles up on up.id = sp.user_id
where up.school_id is not null
on conflict do nothing;

-- ─── RLS ─────────────────────────────────────────────────────
alter table class_sections enable row level security;

create policy class_sections_super_admin_all on class_sections
  for all using (jwt_role() = 'super_admin');

create policy class_sections_school_admin_all on class_sections
  for all using (jwt_role() = 'school_admin' and school_id = jwt_school_id());

create policy class_sections_school_read on class_sections
  for select using (school_id = jwt_school_id());

alter table teaching_assignments enable row level security;

create policy teaching_assignments_super_admin_all on teaching_assignments
  for all using (jwt_role() = 'super_admin');

create policy teaching_assignments_school_admin_all on teaching_assignments
  for all using (jwt_role() = 'school_admin' and school_id = jwt_school_id());

create policy teaching_assignments_school_staff_read on teaching_assignments
  for select using (
    jwt_role() in ('teacher', 'lab_incharge') and school_id = jwt_school_id()
  );

-- ─── Grants (default privileges from 000014 should cover these,
--     but explicit grants keep this migration self-sufficient) ───
grant all privileges on class_sections, teaching_assignments to postgres, service_role;
grant select, insert, update, delete on class_sections, teaching_assignments to authenticated;
grant execute on function current_academic_year() to authenticated, service_role;
