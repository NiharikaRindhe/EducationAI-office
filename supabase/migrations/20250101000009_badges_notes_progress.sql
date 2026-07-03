-- ─────────────────────────────────────────────────────────────
--  BADGES
-- ─────────────────────────────────────────────────────────────
create table badges (
  id              uuid primary key default gen_random_uuid(),
  name            text not null unique,
  description     text,
  icon            text,
  batch_id        int check (batch_id between 1 and 3),  -- null = all batches
  criteria_type   text not null check (criteria_type in
                    ('streak', 'xp', 'exam_score', 'tasks_done', 'english_accuracy', 'english_fluency')),
  criteria_value  int not null,
  created_at      timestamptz not null default now()
);

create table student_badges (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references student_profiles(user_id),
  badge_id        uuid not null references badges(id),
  earned_at       timestamptz not null default now(),
  unique (student_id, badge_id)
);

create index on student_badges (student_id);

-- ─────────────────────────────────────────────────────────────
--  NOTES — student's own in-lab notes (Batch 2-3 only in the UI,
--  but not hard-restricted at the DB layer).
-- ─────────────────────────────────────────────────────────────
create table notes (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references student_profiles(user_id),
  school_id       uuid not null references schools(id),
  title           text not null,
  content         text,
  subject         text,
  tags            text[] not null default '{}',
  is_board_tagged boolean not null default false,  -- Batch 3: tagged for board prep
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger notes_set_updated_at
  before update on notes
  for each row execute function set_updated_at();

create index on notes (student_id, subject);

-- ─────────────────────────────────────────────────────────────
--  SUBJECT PROGRESS
-- ─────────────────────────────────────────────────────────────
create table subject_progress (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references student_profiles(user_id),
  subject           text not null,
  class_num         int not null,
  chapters_done     int not null default 0,
  total_chapters    int not null default 0,
  last_chapter      text,
  last_updated      timestamptz not null default now(),
  unique (student_id, subject, class_num)
);

-- ─────────────────────────────────────────────────────────────
--  STREAK LOGS — one row per student per day they were active.
--  Drives the streak counter and the nightly streak-reset job.
-- ─────────────────────────────────────────────────────────────
create table streak_logs (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references student_profiles(user_id),
  logged_date   date not null,
  xp_earned     int not null default 0,
  unique (student_id, logged_date)
);

create index on streak_logs (student_id, logged_date desc);
