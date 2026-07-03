-- ─────────────────────────────────────────────────────────────
--  LIVE SESSIONS — the core in-lab classroom flow.
--  Teacher starts a session for a class/section; students join;
--  teacher controls pace; session is logged when it ends.
-- ─────────────────────────────────────────────────────────────
create table live_sessions (
  id            uuid primary key default gen_random_uuid(),
  teacher_id    uuid not null references teacher_profiles(user_id),
  school_id     uuid not null references schools(id),
  class_num     int not null check (class_num between 1 and 10),
  section       text not null,
  subject       text,
  games_enabled boolean not null default false,  -- Batch 1: teacher unlocks games per session
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  is_active     boolean not null default true
);

create index on live_sessions (school_id, class_num, section) where is_active;
create index on live_sessions (teacher_id, started_at desc);

create table session_participants (
  session_id    uuid not null references live_sessions(id) on delete cascade,
  student_id    uuid not null references student_profiles(user_id),
  joined_at     timestamptz not null default now(),
  left_at       timestamptz,
  raised_hand   boolean not null default false,  -- "I'm stuck" indicator for teacher
  primary key (session_id, student_id)
);

-- ─────────────────────────────────────────────────────────────
--  ANNOUNCEMENTS — teacher posts to a class, shows in student dashboard.
-- ─────────────────────────────────────────────────────────────
create table announcements (
  id            uuid primary key default gen_random_uuid(),
  teacher_id    uuid not null references teacher_profiles(user_id),
  school_id     uuid not null references schools(id),
  class_num     int,
  section       text,
  title         text not null,
  body          text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz
);

create index on announcements (school_id, class_num, section) where is_active;
