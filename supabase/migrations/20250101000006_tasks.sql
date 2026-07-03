-- ─────────────────────────────────────────────────────────────
--  TASKS — teacher-assigned, template-based (Reading/Practice/PYQ/Custom).
-- ─────────────────────────────────────────────────────────────
create table tasks (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id),
  created_by    uuid not null references teacher_profiles(user_id),
  title         text not null,
  subject       text not null,
  task_type     text not null default 'custom' check (task_type in ('quiz', 'reading', 'practice', 'pyq', 'custom')),
  instructions  text,
  xp_reward     int not null default 10,
  due_date      date,
  batch_id      int check (batch_id between 1 and 3),
  created_at    timestamptz not null default now()
);

create index on tasks (school_id, batch_id);
create index on tasks (created_by);

create table task_assignments (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references tasks(id) on delete cascade,
  student_id    uuid not null references student_profiles(user_id),
  status        text not null default 'not_started'
                  check (status in ('not_started', 'in_progress', 'in_review', 'completed')),
  xp_awarded    int not null default 0,
  completed_at  timestamptz,
  unique (task_id, student_id)
);

create index on task_assignments (student_id, status);
create index on task_assignments (task_id);
