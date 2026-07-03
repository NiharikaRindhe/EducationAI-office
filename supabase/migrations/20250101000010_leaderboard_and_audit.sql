-- ─────────────────────────────────────────────────────────────
--  LEADERBOARD — School Admin / teacher chooses which board displays:
--  XP-based or exam-average-based. Class-scoped, not school-wide.
-- ─────────────────────────────────────────────────────────────
create table leaderboard_snapshots (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references schools(id),
  batch_id        int not null check (batch_id between 1 and 3),
  class_num       int,
  section         text,
  student_id      uuid not null references student_profiles(user_id),
  xp_score        int not null default 0,
  exam_avg        numeric(5, 2),
  score_basis     text not null default 'xp' check (score_basis in ('xp', 'exam_avg')),
  rank            int,
  rank_change     int not null default 0,
  period          text not null check (period in ('weekly', 'monthly', 'all_time')),
  computed_at     timestamptz not null default now()
);

create index on leaderboard_snapshots (school_id, batch_id, period, rank);

-- ─────────────────────────────────────────────────────────────
--  AUDIT LOG — every consequential override/action, for accountability.
--  Score overrides, password/PIN resets, result publishing, etc.
-- ─────────────────────────────────────────────────────────────
create table audit_logs (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid,
  actor_id      uuid not null,
  action        text not null,   -- 'score_override' | 'password_reset' | 'result_publish' | ...
  entity        text not null,
  entity_id     uuid,
  metadata      jsonb,
  created_at    timestamptz not null default now()
);

create index on audit_logs (school_id, created_at desc);
create index on audit_logs (actor_id, created_at desc);
