-- ─────────────────────────────────────────────────────────────
--  SCHOOLS
-- ─────────────────────────────────────────────────────────────
create table schools (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  code          text not null unique,
  plan          text not null default 'starter' check (plan in ('starter', 'school', 'enterprise')),
  city          text,
  state         text,
  board         text not null default 'CBSE' check (board in ('CBSE', 'ICSE', 'State', 'IB')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
--  USER PROFILES (extends auth.users)
--  Roles: student, teacher, school_admin, lab_incharge, super_admin.
--  No 'parent' role in MVP — school lab only, no parent portal.
-- ─────────────────────────────────────────────────────────────
create table user_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  school_id     uuid references schools(id),
  role          text not null check (role in ('student', 'teacher', 'school_admin', 'lab_incharge', 'super_admin')),
  full_name     text not null,
  phone         text,
  is_active     boolean not null default true,
  has_logged_in_ever boolean not null default false,
  first_login_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Every role except super_admin must belong to a school.
  constraint school_required_unless_super_admin
    check (role = 'super_admin' or school_id is not null)
);

create trigger user_profiles_set_updated_at
  before update on user_profiles
  for each row execute function set_updated_at();

create index on user_profiles (school_id);
create index on user_profiles using gin (full_name gin_trgm_ops);

-- ─────────────────────────────────────────────────────────────
--  STUDENT PROFILES
--  Classes 1-10 only (Batch 4 / Class 11-12 removed in v2).
--  batch_id: 1-4 -> 1, 5-8 -> 2, 9-10 -> 3.
--  pin_hash supports Batch 1 name-pick + PIN login (session-gated).
-- ─────────────────────────────────────────────────────────────
create table student_profiles (
  user_id         uuid primary key references user_profiles(id) on delete cascade,
  class_num       int not null check (class_num between 1 and 10),
  section         text not null default 'A',
  batch_id        int generated always as (
                    case
                      when class_num between 1 and 4  then 1
                      when class_num between 5 and 8  then 2
                      when class_num between 9 and 10 then 3
                    end
                  ) stored,
  roll_number     text,
  avatar          text not null default '🦁',
  xp              int not null default 0,
  level           int generated always as (xp / 1000) stored,
  streak          int not null default 0,
  longest_streak  int not null default 0,
  pin_hash        text  -- Batch 1 only: bcrypt hash of a 4-digit PIN
);

create index on student_profiles (class_num, section);
create index on student_profiles (batch_id);

-- ─────────────────────────────────────────────────────────────
--  TEACHER PROFILES
--  school_admin, lab_incharge, super_admin need no extra table —
--  user_profiles alone covers them in the MVP.
-- ─────────────────────────────────────────────────────────────
create table teacher_profiles (
  user_id           uuid primary key references user_profiles(id) on delete cascade,
  employee_id       text,
  specialization    text,
  classes_taught    int[] not null default '{}',
  designation       text not null default 'Teacher'
);
